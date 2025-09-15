import { NextRequest, NextResponse } from 'next/server';
import { getOffersCached, refreshOffersForPlace } from '@/lib/offers/service';
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
  Images: string;
};

// Helper to get place data by slug
async function getPlaceBySlug(slug: string) {
  try {
    const file = path.join(process.cwd(), 'hyderabad_top_100_cafes_restaurants_bars_ranked.csv');
    const csv = await fs.readFile(file, 'utf8');
    const parsed = Papa.parse<Place>(csv, { header: true, skipEmptyLines: true });
    
    const place = parsed.data.find((row: Place) => {
      const placeSlug = row.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return placeSlug === slug;
    });
    
    return place;
  } catch (error) {
    console.error('Error loading place data:', error);
    return null;
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  const slug = params.slug;
  
  try {
    if (!slug) {
      return NextResponse.json(
        { error: 'Place slug is required' },
        { status: 400 }
      );
    }
    
    // Get place details for better matching
    const placeData = await getPlaceBySlug(slug);
    const placeIdentity = placeData ? {
      name: placeData.Name,
      area: placeData.Location,
      // Could add more fields like address, coordinates if available
    } : undefined;
    
    // Check for force refresh
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    let result;
    if (forceRefresh) {
      // Force refresh (admin-only in production)
      const config = getConfig();
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (config.adminToken && token !== config.adminToken) {
        return NextResponse.json(
          { error: 'Unauthorized. Admin token required for force refresh.' },
          { status: 401 }
        );
      }
      
      result = await refreshOffersForPlace(slug, placeIdentity);
    } else {
      result = await getOffersCached({ placeSlug: slug, placeIdentity });
    }
    
    // Add cache headers
    const cacheMaxAge = forceRefresh ? 0 : 300; // 5 minutes for normal requests
    const headers = {
      'Cache-Control': `public, max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`,
      'Content-Type': 'application/json',
    };
    
    return NextResponse.json(result, { headers });
    
  } catch (error) {
    console.error('Offers API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        placeSlug: slug,
        lastRefreshedAt: new Date().toISOString(),
        offers: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  const slug = params.slug;
  
  try {
    // Admin-only force refresh via POST
    const config = getConfig();
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!config.adminToken || token !== config.adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin token required.' },
        { status: 401 }
      );
    }
    
    // Get place details
    const placeData = await getPlaceBySlug(slug);
    const placeIdentity = placeData ? {
      name: placeData.Name,
      area: placeData.Location,
    } : undefined;
    
    const result = await refreshOffersForPlace(slug, placeIdentity);
    
    return NextResponse.json({
      ...result,
      _meta: {
        forcedRefresh: true,
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('Force refresh error:', error);
    
    return NextResponse.json(
      { error: 'Force refresh failed' },
      { status: 500 }
    );
  }
}