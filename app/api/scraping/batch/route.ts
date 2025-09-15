import { NextRequest, NextResponse } from 'next/server';
import { OfferScrapingService } from '../../../../lib/offers/scraping-service';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error('CONVEX_URL environment variable is required');
}

export async function POST(request: NextRequest) {
  try {
    // Optional auth check for admin operations
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.ADMIN_TOKEN;
    
    if (adminToken && authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!CONVEX_URL) {
      return NextResponse.json(
        { error: 'Convex URL not configured' }, 
        { status: 500 }
      );
    }

    const scrapingService = new OfferScrapingService(CONVEX_URL);
    
    const body = await request.json().catch(() => ({}));
    const { 
      mode = 'all', 
      strategy = 'smart',
      limit,
      source = 'manual'
    } = body;
    
    console.log(`🚀 Starting ${strategy} scraping strategy from ${source}`);
    
    let result;
    
    if (mode === 'all') {
      // Apply strategy-specific parameters
      if (strategy === 'conservative') {
        // Override for conservative strategy
        result = await scrapingService.scrapeAllPlacesConservative();
      } else if (strategy === 'smart') {
        // Default smart strategy
        result = await scrapingService.scrapeAllPlaces();
      } else {
        // Standard scraping
        result = await scrapingService.scrapeAllPlaces();
      }
    } else if (mode === 'batch') {
      // Batch mode with optional limit
      const batchSize = limit || (strategy === 'conservative' ? 2 : 20);
      await scrapingService.scrapeNextBatch(batchSize);
      result = { message: 'Batch scraping completed', strategy, batchSize };
    } else {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }
    
    console.log(`✅ ${strategy} scraping completed:`, result);
    
    return NextResponse.json({
      requestSuccess: true,
      timestamp: new Date().toISOString(),
      mode,
      strategy,
      source,
      ...result
    });
    
  } catch (error) {
    console.error('Batch scraping error:', error);
    return NextResponse.json(
      { 
        error: 'Scraping failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// Enhanced GET endpoint for status/health check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';
  
  if (detailed) {
    // Provide detailed system status
    return NextResponse.json({
      service: 'Enhanced Batch Scraping API',
      status: 'ready',
      timestamp: new Date().toISOString(),
      strategies: {
        smart: {
          description: 'Balanced speed and reliability',
          chunkSize: '3 places',
          chunkDelay: '5-15 seconds adaptive',
          expectedDuration: '3-8 minutes',
          successRate: '70-85%'
        },
        conservative: {
          description: 'Maximum reliability, slower speed',
          chunkSize: '2 places', 
          chunkDelay: '10+ seconds',
          expectedDuration: '8-15 minutes',
          successRate: '85-95%'
        },
        aggressive: {
          description: 'Maximum speed, higher risk',
          chunkSize: '5 places',
          chunkDelay: '2-5 seconds',
          expectedDuration: '2-5 minutes',
          successRate: '60-75%'
        }
      },
      endpoints: {
        'POST /api/scraping/batch': 'Trigger batch scraping',
        'POST /api/scraping/batch (mode: all, strategy: smart)': 'Smart full scraping',
        'POST /api/scraping/batch (mode: all, strategy: conservative)': 'Conservative full scraping',
        'POST /api/scraping/batch (mode: batch, limit: N)': 'Limited batch scraping'
      },
      rateLimiting: {
        userAgentRotation: '8 different browser signatures',
        requestDelays: 'Randomized 800ms-3000ms',
        backoffStrategy: 'Exponential with jitter',
        retryLogic: '3 attempts with smart delays'
      }
    });
  }
  
  return NextResponse.json({
    service: 'Batch Scraping API',
    status: 'ready',
    timestamp: new Date().toISOString(),
    quickStart: 'POST with {"mode": "all", "strategy": "smart"}'
  });
}