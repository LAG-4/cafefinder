import { Platform, ProviderResult, PlaceIdentity } from '../types';

export interface OfferProviderInput {
  url: string;
  place?: PlaceIdentity;
  signal?: AbortSignal;
}

export interface OfferProvider {
  platform: Platform;
  fetchOffers(input: OfferProviderInput): Promise<ProviderResult>;
}

export abstract class BaseOfferProvider implements OfferProvider {
  abstract platform: Platform;
  
  abstract fetchOffers(input: OfferProviderInput): Promise<ProviderResult>;
  
  protected normalizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s%-₹$.,]/g, '') // Keep alphanumeric, spaces, and common price chars
      .trim();
  }
  
  protected extractDiscountPercentage(text: string): number | undefined {
    const match = text.match(/(\d+)%\s*(?:off|discount|save)/i);
    return match ? parseInt(match[1], 10) : undefined;
  }
  
  protected extractMinSpend(text: string): number | undefined {
    // Look for patterns like "Min ₹500", "Above ₹1000", etc.
    const match = text.match(/(?:min|above|minimum).*?₹?\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : undefined;
  }
  
  protected generateOfferId(platform: Platform, placeSlug: string, title: string): string {
    const titleHash = title.slice(0, 30).replace(/\s+/g, '-').toLowerCase();
    return `${platform}:${placeSlug}:${titleHash}`;
  }
  
  protected createUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
  
  protected handleError(error: Error | unknown, context: string): ProviderResult {
    const message = error instanceof Error ? error.message : 'unknown_error';
    console.warn(`${this.platform} provider error in ${context}:`, message);
    return {
      offers: [],
      errors: [`${context}: ${message}`],
    };
  }
}