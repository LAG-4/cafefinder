import { describe, it, expect, beforeEach } from 'vitest';
import { rankOffers, filterValidOffers, getOfferScore } from '../../lib/offers/ranking';
import { Offer } from '../../lib/offers/types';

// Mock offers for testing
const createMockOffer = (overrides: Partial<Offer> = {}): Offer => ({
  id: 'test-offer-1',
  platform: 'zomato',
  title: 'Test Offer',
  deepLink: 'https://example.com',
  fetchedAt: new Date().toISOString(),
  ...overrides,
});

describe('Offer Ranking', () => {
  describe('filterValidOffers', () => {
    it('should filter out invalid offers', () => {
      const offers = [
        createMockOffer({ title: 'Valid Offer' }),
        createMockOffer({ title: '' }), // Invalid: empty title
        createMockOffer({ title: 'A' }), // Invalid: too short
        createMockOffer({ platform: undefined as any }), // Invalid: no platform
        createMockOffer({ validityText: 'expired' }), // Invalid: expired
      ];
      
      const validOffers = filterValidOffers(offers);
      expect(validOffers).toHaveLength(1);
      expect(validOffers[0].title).toBe('Valid Offer');
    });
    
    it('should keep offers with valid validity text', () => {
      const offers = [
        createMockOffer({ validityText: 'Valid till 31st Dec' }),
        createMockOffer({ validityText: 'Expires on 25th Jan' }),
        createMockOffer({ validityText: 'Till tomorrow' }),
      ];
      
      const validOffers = filterValidOffers(offers);
      expect(validOffers).toHaveLength(3);
    });
  });
  
  describe('getOfferScore', () => {
    it('should score offers with discount percentage higher', () => {
      const offer1 = createMockOffer({ 
        title: '50% off on orders',
        discountPct: 50,
      });
      
      const offer2 = createMockOffer({ 
        title: '10% off on orders',
        discountPct: 10,
      });
      
      const score1 = getOfferScore(offer1);
      const score2 = getOfferScore(offer2);
      
      expect(score1.score).toBeGreaterThan(score2.score);
      expect(score1.breakdown.discountPct).toBeGreaterThan(score2.breakdown.discountPct);
    });
    
    it('should give higher scores to complete offers', () => {
      const completeOffer = createMockOffer({
        title: 'Great offer with details',
        description: 'Get amazing discounts on your next order',
        validityText: 'Valid till 31st Dec',
        effectivePriceText: 'Save ₹200',
        terms: ['Terms and conditions apply'],
      });
      
      const basicOffer = createMockOffer({
        title: 'Basic offer',
      });
      
      const completeScore = getOfferScore(completeOffer);
      const basicScore = getOfferScore(basicOffer);
      
      expect(completeScore.score).toBeGreaterThan(basicScore.score);
      expect(completeScore.breakdown.completeness).toBeGreaterThan(basicScore.breakdown.completeness);
    });
    
    it('should give higher platform trust scores to established platforms', () => {
      const zomatoOffer = createMockOffer({ platform: 'zomato' });
      const unknownOffer = createMockOffer({ platform: 'other' });
      
      const zomatoScore = getOfferScore(zomatoOffer);
      const unknownScore = getOfferScore(unknownOffer);
      
      expect(zomatoScore.breakdown.platformTrust).toBeGreaterThan(unknownScore.breakdown.platformTrust);
    });
  });
  
  describe('rankOffers', () => {
    it('should sort offers by score in descending order', () => {
      const offers = [
        createMockOffer({ 
          id: 'low-score',
          title: 'Basic offer',
          platform: 'other',
        }),
        createMockOffer({ 
          id: 'high-score',
          title: '50% off amazing deal',
          discountPct: 50,
          platform: 'zomato',
          description: 'Great savings',
          validityText: 'Valid till month end',
        }),
        createMockOffer({ 
          id: 'medium-score',
          title: '20% off good deal',
          discountPct: 20,
          platform: 'swiggy',
        }),
      ];
      
      const rankedOffers = rankOffers(offers);
      
      expect(rankedOffers[0].id).toBe('high-score');
      expect(rankedOffers[1].id).toBe('medium-score');
      expect(rankedOffers[2].id).toBe('low-score');
    });
    
    it('should handle empty array', () => {
      const rankedOffers = rankOffers([]);
      expect(rankedOffers).toEqual([]);
    });
    
    it('should handle single offer', () => {
      const offer = createMockOffer();
      const rankedOffers = rankOffers([offer]);
      expect(rankedOffers).toEqual([offer]);
    });
  });
});