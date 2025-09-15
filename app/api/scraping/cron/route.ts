import { NextRequest, NextResponse } from 'next/server';

// This endpoint can be called by external cron services like cron-job.org or GitHub Actions
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (optional)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call our batch scraping endpoint
    const baseUrl = request.nextUrl.origin;
    const adminToken = process.env.ADMIN_TOKEN;
    
    const scrapeResponse = await fetch(`${baseUrl}/api/scraping/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken && { 'Authorization': `Bearer ${adminToken}` })
      },
      body: JSON.stringify({ mode: 'all' })
    });
    
    const scrapeResult = await scrapeResponse.json();
    
    if (!scrapeResponse.ok) {
      throw new Error(`Scraping failed: ${scrapeResult.error}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled scraping completed successfully',
      timestamp: new Date().toISOString(),
      result: scrapeResult
    });
    
  } catch (error) {
    console.error('Cron scraping error:', error);
    return NextResponse.json(
      { 
        error: 'Cron scraping failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Automated Scraping Cron',
    status: 'ready',
    timestamp: new Date().toISOString(),
    description: 'This endpoint should be called hourly by external cron services',
    setup: {
      'cron-job.org': 'Create a job that POSTs to this URL every hour',
      'GitHub Actions': 'Use workflow with schedule trigger',
      'Vercel Cron': 'Add to vercel.json (Pro plan required)'
    }
  });
}