#!/usr/bin/env node
import { OfferScrapingService } from '../lib/offers/scraping-service';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error('CONVEX_URL environment variable is required');
  process.exit(1);
}

async function main() {
  const scrapingService = new OfferScrapingService(CONVEX_URL!);
  const csvPath = path.join(__dirname, '..', 'hyderabad_top_100_cafes_restaurants_bars_ranked.csv');
  
  console.log('🚀 Fast Zomato offers scraping service...');
  console.log('CSV path:', csvPath);
  console.log('Convex URL:', CONVEX_URL);
  console.log('');

  const args = process.argv.slice(2);
  
  if (args.includes('--init')) {
    console.log('🔄 Initializing scraping data from CSV...');
    await scrapingService.initializeFromCSV(csvPath);
    console.log('✅ Initialization complete!');
    console.log('');
  }

  if (args.includes('--all')) {
    console.log('🎯 Scraping ALL places at once (fast mode)...');
    const result = await scrapingService.scrapeAllPlaces();
    console.log('📊 Final Results:');
    console.log(`   ✅ Successful: ${result.success}`);
    console.log(`   ❌ Failed: ${result.failed}`);
    console.log(`   📍 Total Places: ${result.total}`);
    console.log('');
    console.log('🎉 All done! Check the admin dashboard for results.');
    process.exit(0);
  }

  if (args.includes('--batch')) {
    console.log('🔄 Running optimized batch scraping...');
    await scrapingService.scrapeNextBatch(20);
    console.log('✅ Batch complete!');
    process.exit(0);
  }

  // Default: continuous scraping
  console.log('⏰ Starting continuous scraping (every 60 minutes)...');
  console.log('💡 Tip: Use --all to scrape everything once, or --batch for single batch');
  console.log('🛑 Press Ctrl+C to stop');
  console.log('');
  
  await scrapingService.runContinuousScraping(60);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});