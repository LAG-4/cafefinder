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
  
  console.log('Starting Zomato offers scraping service...');
  console.log(`CSV path: ${csvPath}`);
  console.log(`Convex URL: ${CONVEX_URL}`);
  
  try {
    // Check if we need to initialize (only run this once)
    const shouldInitialize = process.argv.includes('--init');
    
    if (shouldInitialize) {
      console.log('Initializing scraping data from CSV...');
      await scrapingService.initializeFromCSV(csvPath);
      console.log('Initialization complete!');
    }
    
    // Check if this is a one-time batch run
    const isBatchRun = process.argv.includes('--batch');
    
    if (isBatchRun) {
      console.log('Running one-time batch scraping...');
      await scrapingService.scrapeNextBatch(5);
      console.log('Batch scraping complete!');
      process.exit(0);
    }
    
    // Otherwise run continuous scraping
    console.log('Starting continuous scraping (every 60 minutes)...');
    await scrapingService.runContinuousScraping(60);
    
  } catch (error) {
    console.error('Error in scraping service:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});