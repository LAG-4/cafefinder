import * as fs from 'fs';
import * as path from 'path';

interface Restaurant {
  rank: number;
  name: string;
  location: string;
  type: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

function generateZomatoUrls(restaurantName: string, location: string): string[] {
  // Clean up the restaurant name for URL
  const cleanName = restaurantName
    .replace(/\([^)]*\)/g, '') // Remove parentheses content
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/'/g, '') // Remove apostrophes
    .replace(/\./g, '') // Remove dots
    .trim();
  
  // Clean up location
  const cleanLocation = location
    .replace(/,.*$/, '') // Take only first location if multiple
    .replace(/\s+(Hills?|City|District|Colony|Enclave)$/i, '') // Remove common location suffixes
    .replace(/The\s+/i, '') // Remove "The"
    .trim();
  
  const slug = slugify(cleanName);
  const locationSlug = slugify(cleanLocation);
  
  // Generate multiple possible URL patterns based on known Zomato structures
  const urls: string[] = [];
  
  // Pattern 1: restaurant-location (most common)
  urls.push(`https://www.zomato.com/hyderabad/${slug}-${locationSlug}`);
  
  // Pattern 2: restaurant name only 
  urls.push(`https://www.zomato.com/hyderabad/${slug}`);
  
  // Pattern 3: with common location variations
  const locationVariations = [
    locationSlug.replace('banjara', 'banjara-hills'),
    locationSlug.replace('hitech', 'hitech-city'),
    locationSlug.replace('jubilee', 'jubilee-hills'),
    locationSlug.replace('madhapur', 'madhapur'),
    locationSlug.replace('gachibowli', 'gachibowli'),
    locationSlug.replace('kondapur', 'kondapur'),
    locationSlug.replace('somajiguda', 'somajiguda'),
    locationSlug.replace('film-nagar', 'film-nagar'),
    locationSlug.replace('sainikpuri', 'sainikpuri'),
    locationSlug.replace('financial', 'financial-district')
  ];
  
  locationVariations.forEach(variation => {
    if (variation !== locationSlug) {
      urls.push(`https://www.zomato.com/hyderabad/${slug}-${variation}`);
    }
  });
  
  // Pattern 4: Common restaurant chain patterns
  if (cleanName.toLowerCase().includes('starbucks')) {
    urls.push(`https://www.zomato.com/hyderabad/starbucks-coffee-${locationSlug}`);
  }
  
  if (cleanName.toLowerCase().includes('hard rock')) {
    urls.push(`https://www.zomato.com/hyderabad/hard-rock-cafe-banjara-hills`);
  }
  
  if (cleanName.toLowerCase().includes('one8')) {
    urls.push(`https://www.zomato.com/hyderabad/one8-commune-hitech-city`);
  }
  
  if (cleanName.toLowerCase().includes('social')) {
    urls.push(`https://www.zomato.com/hyderabad/social-hitech-city`);
    urls.push(`https://www.zomato.com/hyderabad/social-jubilee-hills`);
  }
  
  // Remove duplicates and return
  return [...new Set(urls)];
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function generateMappings() {
  const csvPath = path.join(__dirname, 'hyderabad_top_100_cafes_restaurants_bars_ranked.csv');
  const mappingsPath = path.join(__dirname, 'lib/offers/mapping/mappings.json');
  
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Skip header line
  const dataLines = lines.slice(1);
  
  const restaurants: Restaurant[] = dataLines.map(line => {
    const columns = parseCsvLine(line);
    return {
      rank: parseInt(columns[0]) || 0,
      name: columns[1] || '',
      location: columns[2] || '',
      type: columns[3] || ''
    };
  }).filter(r => r.name && r.location);
  
  console.log(`Loaded ${restaurants.length} restaurants`);
  
  const mappings = restaurants.flatMap(restaurant => {
    const placeSlug = slugify(restaurant.name);
    const possibleUrls = generateZomatoUrls(restaurant.name, restaurant.location);
    
    // Create mapping for the primary URL (first one)
    return {
      placeSlug,
      platform: 'zomato',
      url: possibleUrls[0], // Use primary URL
      alternativeUrls: possibleUrls.slice(1), // Store alternatives for fallback
      lastVerifiedAt: '2025-09-15',
      confidence: 0.7, // Lower confidence since URLs are auto-generated
      restaurantName: restaurant.name,
      location: restaurant.location,
      rank: restaurant.rank
    };
  });
  
  // Write the mappings file
  fs.writeFileSync(mappingsPath, JSON.stringify(mappings, null, 2));
  console.log(`Generated ${mappings.length} mappings and saved to ${mappingsPath}`);
  
  // Print first 10 for verification
  console.log('\nFirst 10 mappings:');
  mappings.slice(0, 10).forEach(mapping => {
    console.log(`${mapping.rank}. ${mapping.restaurantName} -> ${mapping.url}`);
  });
}

generateMappings().catch(console.error);