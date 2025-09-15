import { NextRequest, NextResponse } from 'next/server';
import { OfferScrapingService } from '../../../../lib/offers/scraping-service';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

// Public endpoint for GitHub Actions - no authentication required
export async function POST(request: NextRequest) {
  try {
    // Verify this is coming from GitHub Actions
    const userAgent = request.headers.get('user-agent') || '';
    const githubRunId = request.headers.get('x-github-run-id');
    
    if (!userAgent.includes('GitHub-Actions') && !githubRunId) {
      return NextResponse.json({ 
        error: 'This endpoint is only for GitHub Actions',
        hint: 'Use /api/scraping/batch for manual scraping'
      }, { status: 403 });
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
      strategy = 'smart',
      limit = 5  // Limited for public endpoint
    } = body;
    
    console.log(`🤖 GitHub Actions scraping: ${strategy} strategy`);
    
    // Always use batch mode with limits for public endpoint
    const batchSize = Math.min(limit, strategy === 'test' ? 3 : 5);
    const result = await scrapingService.scrapeNextBatch(batchSize);
    
    console.log(`✅ GitHub Actions scraping completed:`, result);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      strategy,
      batchSize,
      source: 'github-actions-public',
      result: {
        message: `Scraped ${batchSize} places`,
        strategy,
        completed: true
      }
    });
    
  } catch (error) {
    console.error('GitHub Actions scraping error:', error);
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

export async function GET() {
  return NextResponse.json({
    service: 'GitHub Actions Public Scraping',
    status: 'ready',
    description: 'Public endpoint for GitHub Actions automation',
    authentication: 'None required (GitHub Actions only)',
    limitations: 'Limited to 5 places per batch for security'
  });
}