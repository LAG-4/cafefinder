import axios from 'axios';
import * as cheerio from 'cheerio';
import { Offer, ProviderResult } from '../types';
import { BaseOfferProvider, OfferProviderInput } from './base';

export class ZomatoProvider extends BaseOfferProvider {
  platform = 'zomato' as const;
  
  async fetchOffers(input: OfferProviderInput): Promise<ProviderResult> {
    try {
      const { data } = await axios.get(input.url, {
        timeout: 10000,
        headers: {
          'User-Agent': this.createUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
        },
        signal: input.signal,
      });
      
      const $ = cheerio.load(data);
      const offers: Offer[] = [];
      
      // Extract place slug from URL for generating offer IDs
      const placeSlug = this.extractPlaceSlugFromUrl(input.url);
      
      // Zomato offer selectors (these may need updating based on actual HTML structure)
      const offerSelectors = [
        '.offer-card',
        '.sc-offer-card',
        '[data-testid="offer-card"]',
        '.promo-card',
        '.discount-card',
        '.coupon-card',
        '.offer-banner',
        '.promo-banner',
        '[class*="offer"]',
        '[class*="promo"]',
        '[class*="discount"]',
        '[class*="deal"]',
      ];
      
      for (const selector of offerSelectors) {
        $(selector).each((_, element) => {
          const offer = this.parseZomatoOffer($, element, placeSlug, input.url);
          if (offer) {
            offers.push(offer);
          }
        });
      }
      
      // More aggressive fallback: look for any text that contains offer patterns
      if (offers.length === 0) {
        const allText = $('body').text();
        const offerPatterns = [
          /(\d+)%\s*(?:off|discount|save)/gi,
          /flat\s*(?:rs\.?\s*)?(\d+)\s*off/gi,
          /buy\s+(\d+)\s+get\s+(\d+)\s+free/gi,
          /free\s+delivery/gi,
          /welcome\s+offer/gi,
          /first\s+order\s+(?:discount|offer)/gi,
          /(?:get|save|flat)\s*(?:rs\.?\s*)?(\d+)\s*(?:off|cashback)/gi,
        ];
        
        const foundOffers = new Set<string>();
        
        for (const pattern of offerPatterns) {
          const matches = allText.match(pattern);
          if (matches) {
            matches.forEach(match => {
              if (match.length > 5 && match.length < 100) {
                foundOffers.add(match.trim());
              }
            });
          }
        }
        
        // Convert found patterns to offers
        foundOffers.forEach(offerText => {
          const offer = this.createFallbackOffer(offerText, placeSlug, input.url);
          if (offer) {
            offers.push(offer);
          }
        });
      }
      
      // Even more aggressive: look in specific sections
      if (offers.length === 0) {
        $('*').each((_, element) => {
          const text = $(element).text().trim();
          if (this.looksLikeOffer(text)) {
            const offer = this.createFallbackOffer(text, placeSlug, input.url);
            if (offer) {
              offers.push(offer);
            }
          }
        });
      }
      
      return {
        offers,
      };
      
    } catch (error) {
      console.error('Zomato provider error:', error);
      return {
        offers: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseZomatoOffer($: cheerio.CheerioAPI, element: any, placeSlug: string, sourceUrl: string): Offer | null {
    const $el = $(element);
    
    // Try multiple title selectors
    const titleSelectors = [
      '.offer-title',
      '.sc-offer-title',
      '[data-testid="offer-title"]',
      '.promo-title',
      '.discount-title',
      'h3',
      'h4',
      '.title',
    ];
    
    let title = '';
    for (const selector of titleSelectors) {
      title = $el.find(selector).first().text().trim();
      if (title) break;
    }
    
    // If no title found in child elements, use the element's own text
    if (!title) {
      title = $el.text().trim();
    }
    
    if (!title || title.length < 5) return null;
    
    // Extract description
    const descriptionSelectors = [
      '.offer-description',
      '.sc-offer-description',
      '[data-testid="offer-description"]',
      '.promo-description',
      '.offer-details',
      'p',
    ];
    
    let description = '';
    for (const selector of descriptionSelectors) {
      description = $el.find(selector).first().text().trim();
      if (description && description !== title) break;
    }
    
    // Extract validity
    const validitySelectors = [
      '.offer-validity',
      '.sc-offer-validity',
      '[data-testid="offer-validity"]',
      '.promo-validity',
      '.expiry',
      '.valid-till',
    ];
    
    let validityText = '';
    for (const selector of validitySelectors) {
      validityText = $el.find(selector).first().text().trim();
      if (validityText) break;
    }
    
    // Extract terms and conditions
    const termsText = $el.find('.terms, .conditions, .offer-terms').text().trim();
    const terms = termsText ? [termsText] : undefined;
    
    return {
      id: this.generateOfferId('zomato', placeSlug, title),
      platform: 'zomato',
      title: this.normalizeText(title),
      description: description ? this.normalizeText(description) : undefined,
      validityText: validityText ? this.normalizeText(validityText) : undefined,
      discountPct: this.extractDiscountPercentage(title + ' ' + description),
      minSpend: this.extractMinSpend(title + ' ' + description + ' ' + termsText),
      terms,
      deepLink: sourceUrl,
      fetchedAt: new Date().toISOString(),
    };
  }
  
  private createFallbackOffer(text: string, placeSlug: string, sourceUrl: string): Offer | null {
    const cleanText = this.normalizeText(text);
    if (cleanText.length < 10 || cleanText.length > 150) return null;
    
    // Must contain offer-related keywords
    const offerKeywords = /(?:discount|offer|deal|save|off|promo|coupon|cashback|free)/i;
    if (!offerKeywords.test(cleanText)) return null;
    
    return {
      id: this.generateOfferId('zomato', placeSlug, cleanText),
      platform: 'zomato',
      title: cleanText,
      discountPct: this.extractDiscountPercentage(cleanText),
      minSpend: this.extractMinSpend(cleanText),
      deepLink: sourceUrl,
      fetchedAt: new Date().toISOString(),
    };
  }
  
  private looksLikeOffer(text: string): boolean {
    if (!text || text.length < 10 || text.length > 200) return false;
    
    const offerPattern = /(?:(\d+)%?\s*(?:off|discount|save)|free\s+\w+|buy\s+\d+\s+get\s+\d+|cashback|flat\s+\d+|up\s+to\s+\d+)/i;
    return offerPattern.test(text);
  }
  
  private extractPlaceSlugFromUrl(url: string): string {
    // Extract place identifier from Zomato URL
    // Example: https://www.zomato.com/hyderabad/restaurant-name/info -> restaurant-name
    const match = url.match(/\/([^\/]+)\/(?:info|order|menu)/);
    return match ? match[1] : 'unknown';
  }
}