import Fuse from 'fuse.js';
import { PlaceIdentity, PlacePlatformMapping, Platform } from '../types';

// Fuzzy search configuration
const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'area', weight: 0.2 },
    { name: 'address', weight: 0.1 },
  ],
  threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
  includeScore: true,
  minMatchCharLength: 3,
};

type PlatformSearchData = {
  name: string;
  area?: string;
  address?: string;
  url: string;
  platform: Platform;
};

// Mock search data for platforms - in a real implementation, this would come from
// platform APIs or be pre-populated from platform search results
const platformSearchData: PlatformSearchData[] = [
  // Zomato search results (mock data)
  { name: 'Hard Rock Cafe', area: 'Banjara Hills', platform: 'zomato', url: 'https://www.zomato.com/hyderabad/hard-rock-cafe-banjara-hills' },
  { name: 'One8 Commune', area: 'Hitech City', platform: 'zomato', url: 'https://www.zomato.com/hyderabad/one8-commune-hitech-city' },
  { name: 'Social', area: 'Hitech City', platform: 'zomato', url: 'https://www.zomato.com/hyderabad/social-hitech-city' },
  { name: 'Ministry of Beer', area: 'Film Nagar', platform: 'zomato', url: 'https://www.zomato.com/hyderabad/ministry-of-beer-film-nagar' },
  { name: 'Aqua', area: 'Somajiguda', platform: 'zomato', url: 'https://www.zomato.com/hyderabad/aqua-the-park-somajiguda' },
  { name: 'Roast CCX', area: 'Banjara Hills', platform: 'zomato', url: 'https://www.zomato.com/hyderabad/roast-ccx-banjara-hills' },
  { name: 'La Sabroso Cafe', area: 'Madhapur', platform: 'zomato', url: 'https://www.zomato.com/hyderabad/la-sabroso-cafe-madhapur' },
  { name: 'TaN Coffee', area: 'Madhapur', platform: 'zomato', url: 'https://www.zomato.com/hyderabad/tan-coffee-madhapur' },
  
  // Swiggy search results (mock data)
  { name: 'Hard Rock Cafe', area: 'Banjara Hills', platform: 'swiggy', url: 'https://www.swiggy.com/restaurants/hard-rock-cafe-banjara-hills-hyderabad' },
  { name: 'One8 Commune', area: 'Hitech City', platform: 'swiggy', url: 'https://www.swiggy.com/restaurants/one8-commune-hitech-city-hyderabad' },
  { name: 'Social', area: 'Hitech City', platform: 'swiggy', url: 'https://www.swiggy.com/restaurants/social-hitech-city-hyderabad' },
  { name: 'Ministry of Beer', area: 'Film Nagar', platform: 'swiggy', url: 'https://www.swiggy.com/restaurants/ministry-of-beer-film-nagar-hyderabad' },
];

function normalizeSearchString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function createSearchText(item: PlaceIdentity | PlatformSearchData): string {
  const parts = [item.name];
  if (item.area) parts.push(item.area);
  if ('address' in item && item.address) parts.push(item.address);
  return normalizeSearchString(parts.join(' '));
}

export function fuzzyMatchPlace(
  place: PlaceIdentity,
  platform: Platform,
  minConfidence: number = 0.6
): PlacePlatformMapping[] {
  // Filter platform data for the specific platform
  const platformData = platformSearchData.filter(item => item.platform === platform);
  
  if (platformData.length === 0) {
    return [];
  }
  
  // Create searchable text for each platform item
  const searchableData = platformData.map(item => ({
    ...item,
    searchText: createSearchText(item),
  }));
  
  // Setup Fuse search
  const fuse = new Fuse(searchableData, {
    ...fuseOptions,
    keys: ['searchText'],
  });
  
  // Search for matches
  const placeSearchText = createSearchText(place);
  const results = fuse.search(placeSearchText);
  
  // Convert to mappings with confidence scores
  const mappings: PlacePlatformMapping[] = results
    .filter(result => result.score !== undefined && (1 - result.score) >= minConfidence)
    .map(result => ({
      placeSlug: place.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      platform: result.item.platform,
      url: result.item.url,
      confidence: Math.round((1 - (result.score || 1)) * 100) / 100, // Convert to 0-1 scale
    }));
  
  return mappings;
}

export function fuzzyMatchAllPlatforms(
  place: PlaceIdentity,
  enabledPlatforms: Platform[] = ['zomato', 'swiggy'],
  minConfidence: number = 0.6
): PlacePlatformMapping[] {
  const allMappings: PlacePlatformMapping[] = [];
  
  for (const platform of enabledPlatforms) {
    const mappings = fuzzyMatchPlace(place, platform, minConfidence);
    allMappings.push(...mappings);
  }
  
  // Sort by confidence descending
  return allMappings.sort((a, b) => b.confidence - a.confidence);
}

// Utility function to add new platform search data (for future use)
export function addPlatformSearchData(data: PlatformSearchData[]): void {
  platformSearchData.push(...data);
}

// Utility function to get all available platforms in search data
export function getAvailablePlatforms(): Platform[] {
  const platforms = new Set(platformSearchData.map(item => item.platform));
  return Array.from(platforms);
}