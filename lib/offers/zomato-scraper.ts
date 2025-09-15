import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ZomatoOffer {
  title: string;
  description?: string;
  validityText?: string;
  effectivePriceText?: string;
  discountPct?: number;
  minSpend?: number;
  terms?: string[];
  offerType?: string;
}

export class ZomatoScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'
  ];

  private requestStats = {
    successCount: 0,
    failureCount: 0,
    lastRequestTime: 0,
    consecutiveFailures: 0
  };

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private getRandomDelay(min: number = 1000, max: number = 3000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getBackoffDelay(): number {
    const baseDelay = 2000;
    const maxDelay = 30000;
    const backoffDelay = Math.min(baseDelay * Math.pow(2, this.requestStats.consecutiveFailures), maxDelay);
    const jitter = Math.random() * 0.3 * backoffDelay;
    return backoffDelay + jitter;
  }

  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.requestStats.lastRequestTime;
    const minDelay = 800;
    
    let requiredDelay = minDelay;
    if (this.requestStats.consecutiveFailures > 0) {
      requiredDelay = this.getBackoffDelay();
    } else {
      requiredDelay = this.getRandomDelay(800, 2000);
    }
    
    if (timeSinceLastRequest < requiredDelay) {
      const delayNeeded = requiredDelay - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${Math.round(delayNeeded)}ms`);
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    this.requestStats.lastRequestTime = Date.now();
  }

  private async makeRequest(url: string, retries: number = 3): Promise<any> {
    await this.respectRateLimit();

    const headers = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': this.getRandomUserAgent(),
      'DNT': '1',
      'Connection': 'keep-alive'
    };

    try {
      const response = await axios.get(url, {
        headers,
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
        withCredentials: false
      });

      if (response.status === 429) {
        this.requestStats.consecutiveFailures++;
        this.requestStats.failureCount++;
        
        if (retries > 0) {
          const backoffDelay = this.getBackoffDelay();
          console.log(`Rate limited (429). Backing off for ${Math.round(backoffDelay)}ms. Retries left: ${retries}`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          return this.makeRequest(url, retries - 1);
        } else {
          throw new Error(`Rate limited after all retries. Status: ${response.status}`);
        }
      }

      if (response.status >= 400) {
        this.requestStats.consecutiveFailures++;
        this.requestStats.failureCount++;
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      this.requestStats.successCount++;
      this.requestStats.consecutiveFailures = 0;
      return response;

    } catch (error) {
      this.requestStats.consecutiveFailures++;
      this.requestStats.failureCount++;
      
      if (retries > 0 && ((error as any).code === 'ECONNRESET' || (error as any).code === 'ETIMEDOUT')) {
        console.log(`Network error (${(error as any).code}). Retrying in ${this.getRandomDelay(2000, 5000)}ms. Retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, this.getRandomDelay(2000, 5000)));
        return this.makeRequest(url, retries - 1);
      }
      
      throw error;
    }
  }
  
  async scrapeOffers(zomatoUrl: string): Promise<ZomatoOffer[]> {
    try {
      console.log(`Scraping offers from: ${zomatoUrl}`);
      
      const response = await this.makeRequest(zomatoUrl);
      const $ = cheerio.load(response.data);
      const offers: ZomatoOffer[] = [];
      
      // Extract offers from various sections
      this.extractBankOffers($, offers);
      this.extractPreBookOffers($, offers);
      this.extractDiningOffers($, offers);
      this.extractExclusiveOffers($, offers);
      this.extractGeneralOffers($, offers);
      
      console.log(`Found ${offers.length} offers`);
      return offers;
      
    } catch (error) {
      console.error(`Error scraping ${zomatoUrl}:`, error);
      throw error;
    }
  }
  
  private extractBankOffers($: cheerio.CheerioAPI, offers: ZomatoOffer[]) {
    // Look for bank offer sections
    const bankOfferSelectors = [
      '[class*="bank"]',
      '[class*="Bank"]',
      '[data-testid*="bank"]',
      'div:contains("BANK OFFER")',
      'div:contains("Bank Offer")',
      'div:contains("Credit Card")',
      'div:contains("Debit Card")',
    ];
    
    bankOfferSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $element = $(element);
        const text = $element.text().trim();
        
        if (this.containsOfferKeywords(text) && text.length > 10 && text.length < 200) {
          const offer = this.parseOfferText(text, 'bank');
          if (offer) {
            offers.push(offer);
          }
        }
      });
    });
  }
  
  private extractPreBookOffers($: cheerio.CheerioAPI, offers: ZomatoOffer[]) {
    // Look for pre-booking offers
    const preBookSelectors = [
      'div:contains("PRE-BOOK")',
      'div:contains("Pre-book")',
      'div:contains("PREBOOK")',
      'div:contains("Advance Booking")',
      '[class*="prebook"]',
      '[class*="advance"]',
    ];
    
    preBookSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $element = $(element);
        const text = $element.text().trim();
        
        if (this.containsOfferKeywords(text) && text.length > 10 && text.length < 200) {
          const offer = this.parseOfferText(text, 'prebook');
          if (offer) {
            offers.push(offer);
          }
        }
      });
    });
  }
  
  private extractDiningOffers($: cheerio.CheerioAPI, offers: ZomatoOffer[]) {
    // Look for general dining offers
    const diningSelectors = [
      'div:contains("Dining Offers")',
      'div:contains("DINING OFFERS")',
      'div:contains("Restaurant Offers")',
      '[class*="dining"]',
      '[class*="offer"]',
      '[data-testid*="offer"]',
    ];
    
    diningSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $element = $(element);
        const text = $element.text().trim();
        
        if (this.containsOfferKeywords(text) && text.length > 10 && text.length < 200) {
          const offer = this.parseOfferText(text, 'dining');
          if (offer) {
            offers.push(offer);
          }
        }
      });
    });
  }
  
  private extractExclusiveOffers($: cheerio.CheerioAPI, offers: ZomatoOffer[]) {
    // Look for exclusive offers
    const exclusiveSelectors = [
      'div:contains("EXCLUSIVE")',
      'div:contains("Exclusive")',
      'div:contains("Special")',
      '[class*="exclusive"]',
      '[class*="special"]',
    ];
    
    exclusiveSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $element = $(element);
        const text = $element.text().trim();
        
        if (this.containsOfferKeywords(text) && text.length > 10 && text.length < 200) {
          const offer = this.parseOfferText(text, 'exclusive');
          if (offer) {
            offers.push(offer);
          }
        }
      });
    });
  }
  
  private extractGeneralOffers($: cheerio.CheerioAPI, offers: ZomatoOffer[]) {
    // Look for any text containing offer keywords
    $('*').each((_, element) => {
      const $element = $(element);
      const text = $element.text().trim();
      
      // Skip if too short, too long, or already processed
      if (text.length < 15 || text.length > 150) return;
      
      // Must contain offer keywords and percentage/discount info
      if (this.containsOfferKeywords(text) && /\d+%|\d+\s*off|discount|save/i.test(text)) {
        const offer = this.parseOfferText(text, 'general');
        if (offer && !this.isDuplicate(offer, offers)) {
          offers.push(offer);
        }
      }
    });
  }
  
  private containsOfferKeywords(text: string): boolean {
    const keywords = [
      'flat', 'off', 'discount', 'save', 'get', 'up to', 'valid', 'card',
      'cashback', 'offer', 'deal', 'promotion', 'special', 'exclusive',
      'bank', 'pre-book', 'advance', 'booking'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }
  
  private parseOfferText(text: string, type: string): ZomatoOffer | null {
    try {
      // Clean up the text
      const cleanText = text
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s%-₹$.,]/g, '')
        .trim();
      
      if (cleanText.length < 10) return null;
      
      const offer: ZomatoOffer = {
        title: cleanText,
        offerType: type,
      };
      
      // Extract discount percentage
      const discountMatch = cleanText.match(/(\d+)%\s*(?:off|discount|save)/i);
      if (discountMatch) {
        offer.discountPct = parseInt(discountMatch[1], 10);
      }
      
      // Extract minimum spend
      const minSpendMatch = cleanText.match(/(?:min|minimum|above).*?₹?\s*(\d+)/i);
      if (minSpendMatch) {
        offer.minSpend = parseInt(minSpendMatch[1], 10);
      }
      
      // Extract validity information
      const validityMatch = cleanText.match(/(valid|till|until|expires?).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+\w+)/i);
      if (validityMatch) {
        offer.validityText = validityMatch[0];
      }
      
      // Extract terms if available
      const termsMatch = cleanText.match(/(?:terms|conditions|t&c|t and c).*$/i);
      if (termsMatch) {
        offer.terms = [termsMatch[0]];
      }
      
      return offer;
      
    } catch (error) {
      console.error('Error parsing offer text:', error);
      return null;
    }
  }
  
  private isDuplicate(newOffer: ZomatoOffer, existingOffers: ZomatoOffer[]): boolean {
    return existingOffers.some(existing => 
      this.normalizeText(existing.title) === this.normalizeText(newOffer.title)
    );
  }
  
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\d]/g, '')
      .trim();
  }
}