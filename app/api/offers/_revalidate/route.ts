import { NextRequest, NextResponse } from 'next/server';
import { getOffersCached } from '@/lib/offers/service';
import { getConfig } from '@/lib/config';
import Papa from 'papaparse';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Place = Record<string, string> & {
  Name: string;
  Location: string;
  Type: string;
};

// Popular places to warm cache for (top 20)
const POPULAR_PLACES = [
  'hard-rock-cafe',
  'one8-commune-virat-kohli',
  'social',
  'mob-ministry-of-beer',
  'aqua',
  'roast-ccx',
  'la-sabroso-cafe',
  'tan-coffee',
  'people-s-choice-cafe-lgbtq-safe-space',
];

async function getAllPlaces() {
  try {
    const file = path.join(process.cwd(), 'hyderabad_top_100_cafes_restaurants_bars_ranked.csv');
    const csv = await fs.readFile(file, 'utf8');
    const parsed = Papa.parse<Place>(csv, { header: true, skipEmptyLines: true });
    
    return parsed.data.map((row: Place) => ({
      slug: row.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name: row.Name,
      area: row.Location,
    }));
  } catch (error) {
    console.error('Error loading places:', error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    // Admin authentication
    const config = getConfig();
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!config.adminToken || token !== config.adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin token required.' },
        { status: 401 }
      );
    }
    
    const body = await req.json().catch(() => ({}));
    const { places, warmPopular = false } = body;
    
    let placesToProcess: string[] = [];
    
    if (places && Array.isArray(places)) {
      // Specific places provided
      placesToProcess = places;
    } else if (warmPopular) {
      // Warm cache for popular places
      placesToProcess = POPULAR_PLACES;
    } else {
      return NextResponse.json(
        { error: 'Either "places" array or "warmPopular: true" is required' },
        { status: 400 }
      );
    }
    
    console.log(`Starting cache warming for ${placesToProcess.length} places...`);
    
    const results = [];
    const allPlaces = await getAllPlaces();
    
    // Process places in batches of 3 to avoid overloading
    const batchSize = 3;
    for (let i = 0; i < placesToProcess.length; i += batchSize) {
      const batch = placesToProcess.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (slug) => {
        try {
          const placeData = allPlaces.find(p => p.slug === slug);
          const placeIdentity = placeData ? {
            name: placeData.name,
            area: placeData.area,
          } : undefined;
          
          const startTime = Date.now();
          const result = await getOffersCached({ placeSlug: slug, placeIdentity });
          const duration = Date.now() - startTime;
          
          return {
            slug,
            success: true,
            offersCount: result.offers.length,
            duration,
            hasErrors: !!result.providerErrors?.length,
          };
        } catch (error) {
          return {
            slug,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }));
      
      // Small delay between batches
      if (i + batchSize < placesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalDuration = results
      .filter(r => r.success && 'duration' in r)
      .reduce((sum, r) => sum + (r as any).duration, 0);
    
    console.log(`Cache warming completed: ${successCount}/${results.length} successful`);
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
      totalDuration,
      averageDuration: successCount > 0 ? Math.round(totalDuration / successCount) : 0,
      results,
    });
    
  } catch (error) {
    console.error('Cache warming error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Return runtime stats (no auth required for monitoring)
  try {
    const { getRuntimeStats } = await import('@/lib/offers/runtime');
    const { getCacheStats } = await import('@/lib/offers/cache');
    
    const runtimeStats = getRuntimeStats();
    const cacheStats = getCacheStats();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      runtime: runtimeStats,
      cache: cacheStats,
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}