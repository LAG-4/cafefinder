#!/usr/bin/env node

/**
 * Validation script for platform mappings
 * 
 * Usage:
 *   node scripts/validate-mappings.js
 *   node scripts/validate-mappings.js --check-urls
 *   node scripts/validate-mappings.js --verbose
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadMappings() {
  try {
    const mappingsPath = path.join(__dirname, '..', 'lib', 'offers', 'mapping', 'mappings.json');
    const data = await fs.readFile(mappingsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to load mappings:', error.message);
    process.exit(1);
  }
}

async function loadPlaces() {
  try {
    const placesPath = path.join(__dirname, '..', 'hyderabad_top_100_cafes_restaurants_bars_ranked.csv');
    const csv = await fs.readFile(placesPath, 'utf-8');
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const nameIndex = headers.indexOf('Name');
    
    if (nameIndex === -1) {
      throw new Error('Name column not found in CSV');
    }
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const cols = line.split(',');
        const name = cols[nameIndex]?.replace(/"/g, '').trim();
        if (!name) return null;
        
        return {
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error('❌ Failed to load places:', error.message);
    process.exit(1);
  }
}

async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    return {
      url,
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
    };
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

function validateMapping(mapping, index) {
  const errors = [];
  
  if (!mapping.placeSlug || typeof mapping.placeSlug !== 'string') {
    errors.push(`Missing or invalid placeSlug`);
  }
  
  if (!mapping.platform || typeof mapping.platform !== 'string') {
    errors.push(`Missing or invalid platform`);
  } else {
    const validPlatforms = ['zomato', 'swiggy', 'dineout', 'eazydiner', 'magicpin', 'other'];
    if (!validPlatforms.includes(mapping.platform)) {
      errors.push(`Invalid platform: ${mapping.platform}. Must be one of: ${validPlatforms.join(', ')}`);
    }
  }
  
  if (!mapping.url || typeof mapping.url !== 'string') {
    errors.push(`Missing or invalid url`);
  } else {
    try {
      new URL(mapping.url);
    } catch {
      errors.push(`Invalid URL format: ${mapping.url}`);
    }
  }
  
  if (mapping.confidence !== undefined) {
    if (typeof mapping.confidence !== 'number' || mapping.confidence < 0 || mapping.confidence > 1) {
      errors.push(`Invalid confidence: must be a number between 0 and 1`);
    }
  }
  
  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const checkUrls = args.includes('--check-urls');
  const verbose = args.includes('--verbose');
  
  console.log('🔍 Validating platform mappings...\n');
  
  // Load data
  const mappings = await loadMappings();
  const places = await loadPlaces();
  
  console.log(`📊 Loaded ${mappings.length} mappings and ${places.length} places\n`);
  
  // Basic validation
  let errors = 0;
  const platformCounts = {};
  const placesCovered = new Set();
  
  for (const [index, mapping] of mappings.entries()) {
    const mappingErrors = validateMapping(mapping, index);
    
    if (mappingErrors.length > 0) {
      console.log(`❌ Mapping ${index + 1}:`);
      mappingErrors.forEach(error => console.log(`   ${error}`));
      errors += mappingErrors.length;
    } else if (verbose) {
      console.log(`✅ Mapping ${index + 1}: ${mapping.placeSlug} -> ${mapping.platform}`);
    }
    
    // Count platforms
    platformCounts[mapping.platform] = (platformCounts[mapping.platform] || 0) + 1;
    placesCovered.add(mapping.placeSlug);
  }
  
  // Coverage analysis
  const placeSlugs = new Set(places.map(p => p.slug));
  const unmappedPlaces = [...placeSlugs].filter(slug => !placesCovered.has(slug));
  const invalidMappings = [...placesCovered].filter(slug => !placeSlugs.has(slug));
  
  console.log('\n📈 Coverage Analysis:');
  console.log(`   Total places: ${places.length}`);
  console.log(`   Places with mappings: ${placesCovered.size}`);
  console.log(`   Coverage: ${Math.round((placesCovered.size / places.length) * 100)}%`);
  
  if (unmappedPlaces.length > 0) {
    console.log(`\n⚠️  Unmapped places (${unmappedPlaces.length}):`);
    unmappedPlaces.slice(0, 10).forEach(slug => console.log(`   - ${slug}`));
    if (unmappedPlaces.length > 10) {
      console.log(`   ... and ${unmappedPlaces.length - 10} more`);
    }
  }
  
  if (invalidMappings.length > 0) {
    console.log(`\n❌ Invalid place slugs in mappings (${invalidMappings.length}):`);
    invalidMappings.forEach(slug => console.log(`   - ${slug}`));
  }
  
  console.log('\n🏷️  Platform distribution:');
  Object.entries(platformCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} mappings`);
    });
  
  // URL validation
  if (checkUrls) {
    console.log('\n🌐 Checking URLs (this may take a while)...');
    
    const urlChecks = await Promise.allSettled(
      mappings.map(mapping => checkUrl(mapping.url))
    );
    
    let urlErrors = 0;
    for (const [index, result] of urlChecks.entries()) {
      if (result.status === 'fulfilled') {
        const check = result.value;
        if (!check.ok) {
          console.log(`❌ URL ${index + 1}: ${check.url} (Status: ${check.status})`);
          urlErrors++;
        } else if (verbose) {
          console.log(`✅ URL ${index + 1}: ${check.url} (Status: ${check.status})`);
        }
      } else {
        console.log(`❌ URL ${index + 1}: Failed to check - ${result.reason}`);
        urlErrors++;
      }
    }
    
    if (urlErrors === 0) {
      console.log(`✅ All ${mappings.length} URLs are accessible`);
    } else {
      console.log(`❌ ${urlErrors} URLs have issues`);
    }
  }
  
  // Summary
  console.log('\n📋 Summary:');
  console.log(`   Total mappings: ${mappings.length}`);
  console.log(`   Validation errors: ${errors}`);
  if (checkUrls) {
    console.log(`   URL errors: ${urlErrors || 0}`);
  }
  console.log(`   Places covered: ${placesCovered.size}/${places.length} (${Math.round((placesCovered.size / places.length) * 100)}%)`);
  
  if (errors > 0 || invalidMappings.length > 0) {
    console.log('\n❌ Validation failed');
    process.exit(1);
  } else {
    console.log('\n✅ Validation passed');
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});