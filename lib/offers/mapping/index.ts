import { PlacePlatformMapping, PlaceIdentity, Platform } from '../types';
import { fuzzyMatchAllPlatforms } from './fuzzy';
import { readFile } from 'fs/promises';
import { join } from 'path';

let manualMappingsCache: PlacePlatformMapping[] | null = null;

async function loadManualMappings(): Promise<PlacePlatformMapping[]> {
  if (manualMappingsCache) {
    return manualMappingsCache;
  }
  
  try {
    const mappingsPath = join(process.cwd(), 'lib', 'offers', 'mapping', 'mappings.json');
    const data = await readFile(mappingsPath, 'utf-8');
    manualMappingsCache = JSON.parse(data) as PlacePlatformMapping[];
    return manualMappingsCache;
  } catch (error) {
    console.warn('Failed to load manual mappings:', error);
    return [];
  }
}

export async function getMappingsForPlace(
  placeSlug: string,
  placeIdentity?: PlaceIdentity,
  enabledPlatforms: Platform[] = ['zomato', 'swiggy']
): Promise<PlacePlatformMapping[]> {
  const allMappings: PlacePlatformMapping[] = [];
  
  // 1. Load manual mappings first (highest priority)
  const manualMappings = await loadManualMappings();
  const manualForPlace = manualMappings.filter(
    mapping => mapping.placeSlug === placeSlug && enabledPlatforms.includes(mapping.platform)
  );
  allMappings.push(...manualForPlace);
  
  // 2. If we have place identity and not all platforms are covered by manual mappings,
  //    try fuzzy matching for missing platforms
  if (placeIdentity) {
    const coveredPlatforms = new Set(manualForPlace.map(m => m.platform));
    const missingPlatforms = enabledPlatforms.filter(p => !coveredPlatforms.has(p));
    
    if (missingPlatforms.length > 0) {
      const fuzzyMappings = fuzzyMatchAllPlatforms(placeIdentity, missingPlatforms, 0.75);
      allMappings.push(...fuzzyMappings);
    }
  }
  
  // 3. If still no mappings found, generate smart fallback URLs
  if (allMappings.length === 0) {
    const smartMappings = generateSmartMappings(placeSlug, placeIdentity, enabledPlatforms);
    allMappings.push(...smartMappings);
  }
  
  // 4. Remove duplicates (prefer manual over fuzzy over smart)
  const uniqueMappings = new Map<string, PlacePlatformMapping>();
  for (const mapping of allMappings) {
    const key = `${mapping.platform}`;
    const existing = uniqueMappings.get(key);
    if (!existing || mapping.confidence > existing.confidence) {
      uniqueMappings.set(key, mapping);
    }
  }
  
  return Array.from(uniqueMappings.values()).sort((a, b) => b.confidence - a.confidence);
}

export async function getBestUrl(
  placeSlug: string,
  platform: Platform,
  placeIdentity?: PlaceIdentity
): Promise<string | null> {
  const mappings = await getMappingsForPlace(placeSlug, placeIdentity, [platform]);
  const mapping = mappings.find(m => m.platform === platform);
  
  // Only return URL if confidence is high enough
  return mapping && mapping.confidence >= 0.75 ? mapping.url : null;
}

export async function addManualMapping(mapping: PlacePlatformMapping): Promise<void> {
  const mappings = await loadManualMappings();
  
  // Remove any existing mapping for the same place + platform
  const filtered = mappings.filter(
    m => !(m.placeSlug === mapping.placeSlug && m.platform === mapping.platform)
  );
  
  // Add the new mapping
  filtered.push({
    ...mapping,
    lastVerifiedAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
  });
  
  // Update cache
  manualMappingsCache = filtered;
  
  // TODO: In a real implementation, you'd want to persist this back to the JSON file
  // or to a database. For now, it's just in memory.
}

export async function removeManualMapping(placeSlug: string, platform: Platform): Promise<void> {
  const mappings = await loadManualMappings();
  const filtered = mappings.filter(
    m => !(m.placeSlug === placeSlug && m.platform === platform)
  );
  
  // Update cache
  manualMappingsCache = filtered;
  
  // TODO: Persist changes
}

export function resetMappingsCache(): void {
  manualMappingsCache = null;
}

export async function getAllMappings(): Promise<PlacePlatformMapping[]> {
  return await loadManualMappings();
}

export async function getMappingStats(): Promise<{
  totalMappings: number;
  byPlatform: Record<Platform, number>;
  uniquePlaces: number;
}> {
  const mappings = await loadManualMappings();
  
  const byPlatform: Record<Platform, number> = {
    zomato: 0,
    swiggy: 0,
    dineout: 0,
    eazydiner: 0,
    magicpin: 0,
    other: 0,
  };
  
  const uniquePlaces = new Set<string>();
  
  for (const mapping of mappings) {
    byPlatform[mapping.platform]++;
    uniquePlaces.add(mapping.placeSlug);
  }
  
  return {
    totalMappings: mappings.length,
    byPlatform,
    uniquePlaces: uniquePlaces.size,
  };
}

// Generate smart URL mappings based on common patterns
function generateSmartMappings(
  placeSlug: string, 
  placeIdentity?: PlaceIdentity,
  enabledPlatforms: Platform[] = ['zomato', 'swiggy']
): PlacePlatformMapping[] {
  const mappings: PlacePlatformMapping[] = [];
  
  for (const platform of enabledPlatforms) {
    if (platform === 'zomato') {
      // Generate multiple possible Zomato URLs
      const possibleUrls = generateZomatoUrls(placeSlug, placeIdentity);
      
      for (const url of possibleUrls) {
        mappings.push({
          placeSlug,
          platform: 'zomato',
          url,
          confidence: 0.5, // Lower confidence for generated URLs
          lastVerifiedAt: new Date().toISOString().split('T')[0]
        });
      }
    }
    
    if (platform === 'swiggy') {
      // Generate Swiggy URLs (they're harder to predict, so we'll try a basic pattern)
      const swiggyUrl = `https://www.swiggy.com/restaurants/${placeSlug}-hyderabad`;
      mappings.push({
        placeSlug,
        platform: 'swiggy',
        url: swiggyUrl,
        confidence: 0.3,
        lastVerifiedAt: new Date().toISOString().split('T')[0]
      });
    }
  }
  
  return mappings;
}

function generateZomatoUrls(placeSlug: string, placeIdentity?: PlaceIdentity): string[] {
  const urls: string[] = [];
  const baseUrl = 'https://www.zomato.com/hyderabad';
  
  // Common area suffixes for Hyderabad
  const commonAreas = [
    'banjara-hills', 'jubilee-hills', 'hitech-city', 'kondapur', 
    'madhapur', 'gachibowli', 'secunderabad', 'begumpet',
    'somajiguda', 'ameerpet', 'kukatpally', 'miyapur'
  ];
  
  // Try the place slug as-is
  urls.push(`${baseUrl}/${placeSlug}`);
  
  // Try with common area suffixes
  for (const area of commonAreas) {
    urls.push(`${baseUrl}/${placeSlug}-${area}`);
  }
  
  // If we have place identity, try to use the area information
  if (placeIdentity?.area) {
    const cleanArea = placeIdentity.area
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    
    urls.push(`${baseUrl}/${placeSlug}-${cleanArea}`);
  }
  
  // Try with different name variations
  if (placeIdentity?.name) {
    const cleanName = placeIdentity.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    
    if (cleanName !== placeSlug) {
      urls.push(`${baseUrl}/${cleanName}`);
      
      // Try with areas
      for (const area of commonAreas.slice(0, 3)) { // Just try top 3 areas
        urls.push(`${baseUrl}/${cleanName}-${area}`);
      }
    }
  }
  
  return urls;
}