import { Offer, Platform } from './types';

// Platform trust scores (higher = more trustworthy)
const PLATFORM_TRUST_SCORES: Record<Platform, number> = {
  zomato: 0.9,
  swiggy: 0.9,
  dineout: 0.8,
  eazydiner: 0.7,
  magicpin: 0.6,
  other: 0.5,
};

// Scoring weights
const SCORING_WEIGHTS = {
  discountPct: 0.35,      // Percentage discount
  valueAmount: 0.25,      // Fixed amount savings
  platformTrust: 0.20,    // Platform reliability
  freshness: 0.10,        // How recently fetched
  validity: 0.05,         // Has clear validity info
  completeness: 0.05,     // Has description, terms, etc.
};

interface OfferScore {
  offer: Offer;
  score: number;
  breakdown: {
    discountPct: number;
    valueAmount: number;
    platformTrust: number;
    freshness: number;
    validity: number;
    completeness: number;
  };
}

function extractValueAmount(offer: Offer): number {
  // Look for ₹X patterns in title, description, and effectivePriceText
  const searchText = [
    offer.title,
    offer.description || '',
    offer.effectivePriceText || '',
  ].join(' ').toLowerCase();
  
  // Patterns for extracting value amounts
  const patterns = [
    /save\s*₹\s*(\d+)/,
    /₹\s*(\d+)\s*off/,
    /flat\s*₹\s*(\d+)/,
    /upto\s*₹\s*(\d+)/,
    /get\s*₹\s*(\d+)/,
    /cashback\s*₹\s*(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = searchText.match(pattern);
    if (match) {
      const amount = parseInt(match[1], 10);
      if (amount > 0) return amount;
    }
  }
  
  return 0;
}

function calculateDiscountScore(offer: Offer): number {
  if (offer.discountPct && offer.discountPct > 0) {
    // Normalize percentage to 0-1 scale (cap at 70% for scoring)
    return Math.min(offer.discountPct / 70, 1);
  }
  return 0;
}

function calculateValueScore(offer: Offer): number {
  const valueAmount = extractValueAmount(offer);
  if (valueAmount > 0) {
    // Normalize amount to 0-1 scale (cap at ₹500 for scoring)
    return Math.min(valueAmount / 500, 1);
  }
  return 0;
}

function calculatePlatformScore(offer: Offer): number {
  return PLATFORM_TRUST_SCORES[offer.platform] || 0.5;
}

function calculateFreshnessScore(offer: Offer): number {
  try {
    const fetchedTime = new Date(offer.fetchedAt).getTime();
    const now = Date.now();
    const ageHours = (now - fetchedTime) / (1000 * 60 * 60);
    
    // Fresh if < 1 hour, decays over 24 hours
    if (ageHours < 1) return 1;
    if (ageHours > 24) return 0.1;
    
    return Math.max(0.1, 1 - (ageHours / 24));
  } catch {
    return 0.5; // Default if date parsing fails
  }
}

function calculateValidityScore(offer: Offer): number {
  // Higher score if validity information is present and clear
  if (!offer.validityText) return 0.3;
  
  const validityText = offer.validityText.toLowerCase();
  
  // Negative indicators
  if (validityText.includes('expired') || validityText.includes('invalid')) {
    return 0;
  }
  
  // Positive indicators
  if (validityText.includes('valid') || 
      validityText.includes('expires') || 
      validityText.includes('till') ||
      /\d{1,2}[\/\-]\d{1,2}/.test(validityText)) {
    return 1;
  }
  
  return 0.6; // Has validity text but unclear
}

function calculateCompletenessScore(offer: Offer): number {
  let score = 0.2; // Base score for having a title
  
  if (offer.description && offer.description.length > 10) score += 0.3;
  if (offer.validityText) score += 0.2;
  if (offer.effectivePriceText) score += 0.2;
  if (offer.terms && offer.terms.length > 0) score += 0.1;
  
  return Math.min(score, 1);
}

function scoreOffer(offer: Offer): OfferScore {
  const breakdown = {
    discountPct: calculateDiscountScore(offer),
    valueAmount: calculateValueScore(offer),
    platformTrust: calculatePlatformScore(offer),
    freshness: calculateFreshnessScore(offer),
    validity: calculateValidityScore(offer),
    completeness: calculateCompletenessScore(offer),
  };
  
  // Calculate weighted total score
  const score = 
    breakdown.discountPct * SCORING_WEIGHTS.discountPct +
    breakdown.valueAmount * SCORING_WEIGHTS.valueAmount +
    breakdown.platformTrust * SCORING_WEIGHTS.platformTrust +
    breakdown.freshness * SCORING_WEIGHTS.freshness +
    breakdown.validity * SCORING_WEIGHTS.validity +
    breakdown.completeness * SCORING_WEIGHTS.completeness;
  
  return { offer, score, breakdown };
}

export function rankOffers(offers: Offer[]): Offer[] {
  if (offers.length === 0) return [];
  
  // Score all offers
  const scoredOffers = offers.map(scoreOffer);
  
  // Sort by score descending, then by platform trust as tiebreaker
  scoredOffers.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.01) {
      // Very close scores, use platform trust as tiebreaker
      return b.breakdown.platformTrust - a.breakdown.platformTrust;
    }
    return b.score - a.score;
  });
  
  return scoredOffers.map(scored => scored.offer);
}

export function getOfferScore(offer: Offer): OfferScore {
  return scoreOffer(offer);
}

export function filterValidOffers(offers: Offer[]): Offer[] {
  return offers.filter(offer => {
    // Basic validation
    if (!offer.title || offer.title.length < 3) return false;
    if (!offer.platform) return false;
    if (!offer.id) return false;
    
    // Check if offer seems expired based on validity text
    if (offer.validityText) {
      const validityText = offer.validityText.toLowerCase();
      if (validityText.includes('expired') || validityText.includes('invalid')) {
        return false;
      }
    }
    
    return true;
  });
}

export function groupOffersByType(offers: Offer[]): Record<string, Offer[]> {
  const groups: Record<string, Offer[]> = {
    percentage: [],
    flat: [],
    cashback: [],
    freebie: [],
    other: [],
  };
  
  for (const offer of offers) {
    const title = offer.title.toLowerCase();
    const description = (offer.description || '').toLowerCase();
    const text = title + ' ' + description;
    
    if (offer.discountPct || text.includes('%')) {
      groups.percentage.push(offer);
    } else if (text.includes('flat') || text.includes('₹') && text.includes('off')) {
      groups.flat.push(offer);
    } else if (text.includes('cashback')) {
      groups.cashback.push(offer);
    } else if (text.includes('free') || text.includes('complimentary')) {
      groups.freebie.push(offer);
    } else {
      groups.other.push(offer);
    }
  }
  
  return groups;
}

export function getBestOfferByType(offers: Offer[]): {
  bestPercentage?: Offer;
  bestFlat?: Offer;
  bestCashback?: Offer;
  bestFreebie?: Offer;
} {
  const groups = groupOffersByType(offers);
  const rankedGroups = Object.fromEntries(
    Object.entries(groups).map(([type, groupOffers]) => [
      type,
      rankOffers(groupOffers),
    ])
  );
  
  return {
    bestPercentage: rankedGroups.percentage[0],
    bestFlat: rankedGroups.flat[0],
    bestCashback: rankedGroups.cashback[0],
    bestFreebie: rankedGroups.freebie[0],
  };
}