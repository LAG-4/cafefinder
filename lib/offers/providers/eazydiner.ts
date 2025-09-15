import { ProviderResult } from '../types';
import { BaseOfferProvider, OfferProviderInput } from './base';

export class EazyDinerProvider extends BaseOfferProvider {
  platform = 'eazydiner' as const;
  
  async fetchOffers(input: OfferProviderInput): Promise<ProviderResult> {
    // TODO: Implement EazyDiner scraping logic
    // This is a placeholder for future implementation
    
    return {
      offers: [],
      errors: ['eazydiner_provider_not_implemented'],
      rawMeta: {
        message: 'EazyDiner provider is not yet implemented',
        url: input.url,
      },
    };
  }
}

// Export a singleton instance
export const eazyDinerProvider = new EazyDinerProvider();