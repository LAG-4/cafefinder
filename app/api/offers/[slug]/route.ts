import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

const getConvex = () => {
  if (!CONVEX_URL) {
    throw new Error('CONVEX_URL environment variable is required');
  }
  return new ConvexHttpClient(CONVEX_URL);
};

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

    // Get offers for this place from Convex
    const convex = getConvex();
    const offers = await convex.query(api.offers.getOffersByPlace, {
      placeSlug: slug,
    });

    // Transform offers to match frontend format
    const transformedOffers = offers.map((offer) => ({
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
      offerType: offer.offerType,
      expiresAt: offer.expiresAt,
      lastCheckedAt: offer.lastCheckedAt,
    }));

    // Get scraping status to provide last updated info (optional)
    let scrapingStatus = null;
    try {
      const convex = getConvex();
      scrapingStatus = await convex.query(api.offers.getScrapingStatus, {
        placeSlug: slug,
      });
    } catch (error) {
      console.log('Scraping status not available:', error);
    }

    return NextResponse.json({
      placeSlug: slug,
      lastRefreshedAt: scrapingStatus?.lastScrapedAt || (offers.length > 0 ? offers[0].fetchedAt : new Date().toISOString()),
      offers: transformedOffers,
      scrapingStatus: scrapingStatus ? {
        status: scrapingStatus.status || 'unknown',
        lastScrapedAt: scrapingStatus.lastScrapedAt,
        nextScrapeAt: scrapingStatus.nextScrapeAt,
        offersFound: scrapingStatus.offersFound || 0,
        errorMessage: scrapingStatus.errorMessage,
      } : null,
    });

  } catch (error) {
    console.error('Error fetching offers:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch offers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}