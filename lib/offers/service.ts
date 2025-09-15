import { getMappingsForPlace } from './mapping';
import { ZomatoProvider } from './providers/zomato';
import { SwiggyProvider } from './providers/swiggy';
import { DineoutProvider } from './providers/dineout';
import { EazyDinerProvider } from './providers/eazydiner';
import { rankOffers, filterValidOffers } from './ranking';
import { getCache, setCache } from './cache';
import { getConfig } from '../config';
import { 
  waitForRateLimit, 
  incrementActiveRequests, 
  decrementActiveRequests,
  withRetry,
  logger 
} from './runtime';
import { ProviderResult, Offer, OffersResponse, Platform, PlaceIdentity } from './types';

// Import mapping types
type PlacePlatformMapping = {
  placeSlug: string;
  platform: Platform;
  url: string;
  confidence: number;
};

// Provider registry
const providers = {
  zomato: new ZomatoProvider(),
  swiggy: new SwiggyProvider(),
  dineout: new DineoutProvider(),
  eazydiner: new EazyDinerProvider(),
} as const;

async function fetchFromProvider(
  platform: Platform, 
  url: string, 
  placeIdentity?: PlaceIdentity
): Promise<ProviderResult> {
  const provider = providers[platform as keyof typeof providers];
  if (!provider) {
    return {
      offers: [],
      errors: [`Provider not found for platform: ${platform}`],
    };
  }
  
  // Check rate limits and availability
  const canProceed = await waitForRateLimit(platform);
  if (!canProceed) {
    return {
      offers: [],
      errors: [`Rate limited or blocked: ${platform}`],
    };
  }
  
  incrementActiveRequests();
  
  try {
    // Use retry wrapper with exponential backoff
    const result: ProviderResult = await withRetry(
      () => provider.fetchOffers({ url, place: placeIdentity }),
      platform
    );
    
    logger.info({ 
      platform, 
      url: url.slice(0, 50) + '...', 
      offersCount: result.offers.length,
      hasErrors: (result.errors?.length || 0) > 0 
    }, 'Provider fetch completed');
    
    return result;
  } catch (error) {
    logger.error({ 
      platform, 
      error: error instanceof Error ? error.message : String(error) 
    }, 'Provider fetch failed');
    
    return {
      offers: [],
      errors: [`Fetch failed: ${error instanceof Error ? error.message : String(error)}`],
    };
  } finally {
    decrementActiveRequests();
  }
}

async function fetchFromProviderWithFallback(
  platform: Platform,
  mappings: PlacePlatformMapping[],
  placeIdentity?: PlaceIdentity
): Promise<ProviderResult> {
  let lastError = '';
  let allOffers: Offer[] = [];
  
  // Try each mapping for this platform
  for (const mapping of mappings) {
    try {
      const result = await fetchFromProvider(platform, mapping.url, placeIdentity);
      
      if (result.offers && result.offers.length > 0) {
        allOffers = allOffers.concat(result.offers);
      }
      
      if (result.errors && result.errors.length > 0) {
        lastError = result.errors.join('; ');
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  
  return {
    offers: allOffers,
    errors: lastError ? [lastError] : []
  };
}

export async function getOffersCached({ 
  placeSlug, 
  placeIdentity 
}: { 
  placeSlug: string; 
  placeIdentity?: PlaceIdentity;
}): Promise<OffersResponse> {
  const config = getConfig();
  const cacheKey = `offers:v1:${placeSlug}`;
  
  // Try to get from cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    logger.debug({ placeSlug }, 'Returning cached offers');
    return {
      placeSlug,
      lastRefreshedAt: cached.lastRefreshedAt,
      offers: cached.offers,
    };
  }
  
  logger.info({ placeSlug }, 'Fetching fresh offers');
  
  try {
    // Get platform mappings for this place
    const mappings = await getMappingsForPlace(
      placeSlug, 
      placeIdentity, 
      config.providers.enabled
    );
    
    if (mappings.length === 0) {
      logger.warn({ placeSlug }, 'No platform mappings found');
      return {
        placeSlug,
        lastRefreshedAt: new Date().toISOString(),
        offers: [],
        providerErrors: [{ platform: 'all', reason: 'No platform mappings found' }],
      };
    }
    
    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, config.scraping.globalTimeoutMs);
    
    try {
      // Group mappings by platform to try multiple URLs per platform
      const platformGroups = new Map<Platform, PlacePlatformMapping[]>();
      for (const mapping of mappings) {
        if (!platformGroups.has(mapping.platform)) {
          platformGroups.set(mapping.platform, []);
        }
        platformGroups.get(mapping.platform)!.push(mapping);
      }
      
      // Fetch from all platforms, trying multiple URLs per platform
      const tasks = Array.from(platformGroups.entries()).map(([platform, mappings]) => 
        fetchFromProviderWithFallback(platform, mappings, placeIdentity)
      );
      
      const results = await Promise.allSettled(tasks);
      
      // Process results
      const providerErrors: { platform: string; reason: string }[] = [];
      let allOffers: Offer[] = [];
      
      results.forEach((result, index) => {
        const platform = Array.from(platformGroups.keys())[index];
        
        if (result.status === 'fulfilled') {
          const providerResult = result.value;
          allOffers = allOffers.concat(providerResult.offers);
          
          if (providerResult.errors && providerResult.errors.length > 0) {
            providerErrors.push({
              platform,
              reason: providerResult.errors.join('; '),
            });
          }
        } else {
          providerErrors.push({
            platform,
            reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      });
      
      // Filter and rank offers
      const validOffers = filterValidOffers(allOffers);
      const rankedOffers = rankOffers(validOffers);
      
      logger.info({ 
        placeSlug, 
        totalFetched: allOffers.length, 
        validOffers: validOffers.length, 
        mappingsUsed: mappings.length,
        errors: providerErrors.length 
      }, 'Offers aggregation completed');
      
      // Prepare response
      const response: OffersResponse = {
        placeSlug,
        lastRefreshedAt: new Date().toISOString(),
        offers: rankedOffers,
        providerErrors: providerErrors.length > 0 ? providerErrors : undefined,
      };
      
      // Cache the result
      await setCache(cacheKey, response);
      
      return response;
      
    } finally {
      clearTimeout(timeoutId);
    }
    
  } catch (error) {
    logger.error({ 
      placeSlug, 
      error: error instanceof Error ? error.message : String(error) 
    }, 'Offers aggregation failed');
    
    return {
      placeSlug,
      lastRefreshedAt: new Date().toISOString(),
      offers: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function refreshOffersForPlace(placeSlug: string, placeIdentity?: PlaceIdentity): Promise<OffersResponse> {
  // Clear cache first
  const cacheKey = `offers:v1:${placeSlug}`;
  const { deleteCache } = await import('./cache');
  await deleteCache(cacheKey);
  
  // Fetch fresh data
  return getOffersCached({ placeSlug, placeIdentity });
}

export async function getOffersByPlatform(
  placeSlug: string, 
  platform: Platform,
  placeIdentity?: PlaceIdentity
): Promise<Offer[]> {
  const { getBestUrl } = await import('./mapping');
  const url = await getBestUrl(placeSlug, platform, placeIdentity);
  
  if (!url) {
    return [];
  }
  
  const result = await fetchFromProvider(platform, url, placeIdentity);
  return filterValidOffers(result.offers);
}