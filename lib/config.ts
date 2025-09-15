import { z } from 'zod';
import { Platform, OffersConfig } from './offers/types';

const PlatformSchema = z.enum(['zomato', 'swiggy', 'dineout', 'eazydiner', 'magicpin', 'other']);

const ProviderConfigSchema = z.object({
  enabled: z.boolean().default(true),
  rateLimit: z.object({
    requestsPerMinute: z.number().default(6),
    burstLimit: z.number().default(2),
  }).default({
    requestsPerMinute: 6,
    burstLimit: 2,
  }),
  timeout: z.number().default(10000),
  userAgents: z.array(z.string()).default([
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ]),
  cooldownMinutes: z.number().default(30),
});

const OffersConfigSchema = z.object({
  cache: z.object({
    provider: z.enum(['memory', 'redis']).default('memory'),
    ttlMinutes: z.number().default(30),
    redisUrl: z.string().optional(),
  }),
  providers: z.object({
    enabled: z.array(PlatformSchema).default(['zomato', 'swiggy']),
    configs: z.record(PlatformSchema, ProviderConfigSchema).default({
      zomato: ProviderConfigSchema.parse({}),
      swiggy: ProviderConfigSchema.parse({}),
      dineout: ProviderConfigSchema.parse({ enabled: false }),
      eazydiner: ProviderConfigSchema.parse({ enabled: false }),
      magicpin: ProviderConfigSchema.parse({ enabled: false }),
      other: ProviderConfigSchema.parse({ enabled: false }),
    }),
  }),
  scraping: z.object({
    maxParallel: z.number().default(2),
    globalTimeoutMs: z.number().default(20000),
    blockCooldownMinutes: z.number().default(30),
  }),
  adminToken: z.string().optional(),
});

let cachedConfig: OffersConfig | null = null;

export function getConfig(): OffersConfig {
  if (cachedConfig) return cachedConfig;

  const env = {
    OFFERS_CACHE_PROVIDER: process.env.OFFERS_CACHE_PROVIDER,
    OFFERS_TTL_MINUTES: process.env.OFFERS_TTL_MINUTES ? parseInt(process.env.OFFERS_TTL_MINUTES) : undefined,
    PROVIDERS_ENABLED: process.env.PROVIDERS_ENABLED?.split(',').map(p => p.trim()) as Platform[],
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    REDIS_URL: process.env.REDIS_URL,
    SCRAPE_BLOCK_COOLDOWN_MIN: process.env.SCRAPE_BLOCK_COOLDOWN_MIN ? parseInt(process.env.SCRAPE_BLOCK_COOLDOWN_MIN) : undefined,
    SCRAPE_MAX_PARALLEL: process.env.SCRAPE_MAX_PARALLEL ? parseInt(process.env.SCRAPE_MAX_PARALLEL) : undefined,
  };

  try {
    cachedConfig = OffersConfigSchema.parse({
      cache: {
        provider: env.OFFERS_CACHE_PROVIDER,
        ttlMinutes: env.OFFERS_TTL_MINUTES,
        redisUrl: env.REDIS_URL,
      },
      providers: {
        enabled: env.PROVIDERS_ENABLED,
      },
      scraping: {
        maxParallel: env.SCRAPE_MAX_PARALLEL,
        blockCooldownMinutes: env.SCRAPE_BLOCK_COOLDOWN_MIN,
      },
      adminToken: env.ADMIN_TOKEN,
    });

    return cachedConfig;
  } catch (error) {
    console.error('Config validation failed:', error);
    // Return default config on validation error
    cachedConfig = OffersConfigSchema.parse({});
    return cachedConfig;
  }
}

export function resetConfig() {
  cachedConfig = null;
}