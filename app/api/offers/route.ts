import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OfferResponse {
  id: string;
  platform: string;
  title: string;
  description?: string;
  validityText?: string;
  effectivePriceText?: string;
  discountPct?: number;
  minSpend?: number;
  terms?: string[];
  deepLink: string;
  fetchedAt: string;
  isActive: boolean;
  offerType?: string;
  expiresAt?: string;
  lastCheckedAt?: string;
}

interface PlaceWithOffers {
  placeSlug: string;
  offers: OfferResponse[];
  totalOffers: number;
  activeOffers: number;
  lastFetchedAt: string;
}

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error('CONVEX_URL environment variable is required');
}

const convex = new ConvexHttpClient(CONVEX_URL);

export async function GET() {
  try {
    // Get all offers
    const allOffers = await convex.query(api.offers.getAllOffers);
    
    // Group offers by place
    const offersByPlace = allOffers.reduce((acc, offer) => {
      if (!acc[offer.placeSlug]) {
        acc[offer.placeSlug] = {
          placeSlug: offer.placeSlug,
          offers: [],
          lastFetchedAt: offer.fetchedAt,
          activeOffers: 0,
          totalOffers: 0,
        };
      }
      
      acc[offer.placeSlug].offers.push({
        id: offer._id,
        platform: offer.platform,
        title: offer.title,
        description: offer.description,
        validityText: offer.validityText,
        effectivePriceText: offer.effectivePriceText,
        discountPct: offer.discountPct,
        minSpend: offer.minSpend,
        terms: offer.terms,
        deepLink: offer.deepLink,
        fetchedAt: offer.fetchedAt,
        isActive: offer.isActive,
        offerType: offer.offerType,
        expiresAt: offer.expiresAt,
        lastCheckedAt: offer.lastCheckedAt,
      });
      
      // Update stats
      acc[offer.placeSlug].totalOffers++;
      if (offer.isActive) {
        acc[offer.placeSlug].activeOffers++;
      }
      
      // Keep track of the most recent fetch time
      if (offer.fetchedAt > acc[offer.placeSlug].lastFetchedAt) {
        acc[offer.placeSlug].lastFetchedAt = offer.fetchedAt;
      }
      
      return acc;
    }, {} as Record<string, PlaceWithOffers>);

    // Convert to array and sort by last fetched time
    const placesWithOffers = Object.values(offersByPlace).sort((a: PlaceWithOffers, b: PlaceWithOffers) => 
      new Date(b.lastFetchedAt).getTime() - new Date(a.lastFetchedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      totalPlaces: placesWithOffers.length,
      totalOffers: allOffers.length,
      activeOffers: allOffers.filter(offer => offer.isActive).length,
      places: placesWithOffers,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching all offers:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch offers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}