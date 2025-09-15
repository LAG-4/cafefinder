/**
 * Core types for the offers aggregation system
 */

export type Platform = 'zomato' | 'swiggy' | 'dineout' | 'eazydiner' | 'magicpin' | 'other';

export type Offer = {
  id: string;
  platform: Platform;
  title: string;
  description?: string;
  validityText?: string;
  effectivePriceText?: string;
  discountPct?: number;
  minSpend?: number;
  terms?: string[];
  deepLink: string;
  fetchedAt: string;
};

export type PlacePlatformMapping = {
  placeSlug: string;
  platform: Platform;
  url: string;
  lastVerifiedAt?: string;
  confidence: number; // 0..1
};

export type PlaceIdentity = {
  name: string;
  area?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export type ProviderResult = {
  offers: Offer[];
  errors?: string[];
  rawMeta?: Record<string, unknown>;
};

export type OffersResponse = {
  placeSlug: string;
  lastRefreshedAt: string;
  offers: Offer[];
  providerErrors?: { platform: string; reason: string }[];
  error?: string;
};

export type CacheEntry = {
  offers: Offer[];
  refreshedAt: number;
  lastRefreshedAt: string;
};

export type ProviderConfig = {
  enabled: boolean;
  rateLimit: {
    requestsPerMinute: number;
    burstLimit: number;
  };
  timeout: number;
  userAgents: string[];
  cooldownMinutes: number;
};

export type OffersConfig = {
  cache: {
    provider: 'memory' | 'redis';
    ttlMinutes: number;
    redisUrl?: string;
  };
  providers: {
    enabled: Platform[];
    configs: Record<Platform, ProviderConfig>;
  };
  scraping: {
    maxParallel: number;
    globalTimeoutMs: number;
    blockCooldownMinutes: number;
  };
  adminToken?: string;
};