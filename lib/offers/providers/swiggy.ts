import axios from 'axios';
import * as cheerio from 'cheerio';
import { Offer, ProviderResult } from '../types';
import { BaseOfferProvider, OfferProviderInput } from './base';

export class SwiggyProvider extends BaseOfferProvider {
  platform = 'swiggy' as const;
  
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
      
      // Swiggy offer selectors (these may need updating based on actual HTML structure)
      const offerSelectors = [
        '.offer-container',
        '.sc-offer-container',
        '[data-testid="offer-container"]',
        '.promo-container',
        '.discount-container',
        '.coupon-container',
        '.offer-card',
        '.promo-card',
      ];
      
      for (const selector of offerSelectors) {
        $(selector).each((_, element) => {
          const offer = this.parseSwiggyOffer($, element, placeSlug, input.url);
          if (offer) {
            offers.push(offer);
          }
        });
      }
      
      // Fallback: look for any text that looks like offers
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
      console.error('Swiggy provider error:', error);
      return {
        offers: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
  
  private parseSwiggyOffer($: cheerio.CheerioAPI, element: any, placeSlug: string, sourceUrl: string): Offer | null {
    const $el = $(element);
    
    // Try multiple title selectors
    const titleSelectors = [
      '.offer-header',
      '.sc-offer-header',
      '[data-testid="offer-header"]',
      '.promo-header',
      '.discount-header',
      '.offer-title',
      'h3',
      'h4',
      '.title',
      '.heading',
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
      '.offer-subtitle',
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
      '.expires',
    ];
    
    let validityText = '';
    for (const selector of validitySelectors) {
      validityText = $el.find(selector).first().text().trim();
      if (validityText) break;
    }
    
    // Extract effective price (Swiggy-specific)
    const effectivePriceSelectors = [
      '.effective-price',
      '.final-price',
      '.discounted-price',
      '.offer-price',
    ];
    
    let effectivePriceText = '';
    for (const selector of effectivePriceSelectors) {
      effectivePriceText = $el.find(selector).first().text().trim();
      if (effectivePriceText) break;
    }
    
    // Extract terms and conditions
    const termsText = $el.find('.terms, .conditions, .offer-terms, .t-and-c').text().trim();
    const terms = termsText ? [termsText] : undefined;
    
    return {
      id: this.generateOfferId('swiggy', placeSlug, title),
      platform: 'swiggy',
      title: this.normalizeText(title),
      description: description ? this.normalizeText(description) : undefined,
      validityText: validityText ? this.normalizeText(validityText) : undefined,
      effectivePriceText: effectivePriceText ? this.normalizeText(effectivePriceText) : undefined,
      discountPct: this.extractDiscountPercentage(title + ' ' + description + ' ' + effectivePriceText),
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
    const offerKeywords = /(?:discount|offer|deal|save|off|promo|coupon|cashback|free|delivery)/i;
    if (!offerKeywords.test(cleanText)) return null;
    
    return {
      id: this.generateOfferId('swiggy', placeSlug, cleanText),
      platform: 'swiggy',
      title: cleanText,
      discountPct: this.extractDiscountPercentage(cleanText),
      minSpend: this.extractMinSpend(cleanText),
      deepLink: sourceUrl,
      fetchedAt: new Date().toISOString(),
    };
  }
  
  private looksLikeOffer(text: string): boolean {
    if (!text || text.length < 10 || text.length > 200) return false;
    
    const offerPattern = /(?:(\d+)%?\s*(?:off|discount|save)|free\s+\w+|buy\s+\d+\s+get\s+\d+|cashback|flat\s+\d+|up\s+to\s+\d+|free\s+delivery)/i;
    return offerPattern.test(text);
  }
  
  private extractPlaceSlugFromUrl(url: string): string {
    // Extract place identifier from Swiggy URL
    // Example: https://www.swiggy.com/restaurants/restaurant-name-area-hyderabad-123456 -> restaurant-name-area-hyderabad-123456
    const match = url.match(/\/restaurants\/([^\/?\s]+)/);
    return match ? match[1] : 'unknown';
  }
}