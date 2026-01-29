import { NextRequest, NextResponse } from 'next/server';
import { OfferScrapingService } from '../../../lib/offers/scraping-service';
import path from 'path';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

export async function POST(request: NextRequest) {
  if (!CONVEX_URL) {
     return NextResponse.json({ error: 'CONVEX_URL environment variable is required' }, { status: 500 });
  }
  const scrapingService = new OfferScrapingService(CONVEX_URL);
  try {
    const { action, placeSlug, batchSize } = await request.json();
    
    switch (action) {
      case 'initialize':
        const csvPath = path.join(process.cwd(), 'hyderabad_top_100_cafes_restaurants_bars_ranked.csv');
        await scrapingService.initializeFromCSV(csvPath);
        return NextResponse.json({ 
          success: true, 
          message: 'Scraping data initialized from CSV' 
        });
        
      case 'scrape-batch':
        await scrapingService.scrapeNextBatch(batchSize || 5);
        return NextResponse.json({ 
          success: true, 
          message: 'Batch scraping completed' 
        });
        
      case 'scrape-place':
        if (!placeSlug) {
          return NextResponse.json(
            { success: false, error: 'placeSlug is required' },
            { status: 400 }
          );
        }
        
        // This would require getting the Zomato URL for the place
        // For now, return not implemented
        return NextResponse.json(
          { success: false, error: 'Single place scraping not yet implemented' },
          { status: 501 }
        );
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Scraping API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Scraping service is running',
    timestamp: new Date().toISOString()
  });
}