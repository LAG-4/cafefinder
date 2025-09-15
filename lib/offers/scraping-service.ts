import { ZomatoScraper } from './zomato-scraper';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

export interface PlaceData {
  rank: number;
  name: string;
  zomato?: string;
  location: string;
  type: string;
}

export class OfferScrapingService {
  private convex: ConvexHttpClient;
  private scraper: ZomatoScraper;
  
  constructor(convexUrl: string) {
    this.convex = new ConvexHttpClient(convexUrl);
    this.scraper = new ZomatoScraper();
  }
  
  async initializeFromCSV(csvPath: string) {
    console.log('Initializing scraping data from CSV...');
    
    try {
      const csvData = fs.readFileSync(csvPath, 'utf-8');
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
      });
      
      let initialized = 0;
      
      for (const record of records) {
        const recordData = record as Record<string, string>;
        const name = recordData.Name?.trim();
        const zomatoUrl = recordData.Zomato?.trim();
        
        if (name && zomatoUrl && zomatoUrl.startsWith('https://www.zomato.com/')) {
          const placeSlug = this.generateSlug(name);
          
          // Initialize scraping status for this place
          await this.convex.mutation(api.offers.updateScrapingStatus, {
            placeSlug,
            zomatoUrl,
            lastScrapedAt: new Date(0).toISOString(), // Never scraped
            nextScrapeAt: new Date().toISOString(), // Schedule immediately
            status: 'pending',
            offersFound: 0,
          });
          
          initialized++;
          console.log(`Initialized: ${name} -> ${placeSlug}`);
        }
      }
      
      console.log(`Initialized ${initialized} places for scraping`);
      
    } catch (error) {
      console.error('Error initializing from CSV:', error);
      throw error;
    }
  }
  
  async scrapePlaceOffers(placeSlug: string, zomatoUrl: string): Promise<number> {
    console.log(`Scraping offers for ${placeSlug}...`);
    
    try {
      const offers = await this.scraper.scrapeOffers(zomatoUrl);
      const now = new Date().toISOString();
      const nextScrape = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      
      const currentOfferTitles: string[] = [];
      
      for (const offer of offers) {
        await this.convex.mutation(api.offers.upsertOffer, {
          placeSlug,
          platform: 'zomato',
          title: offer.title,
          description: offer.description,
          validityText: offer.validityText,
          effectivePriceText: offer.effectivePriceText,
          discountPct: offer.discountPct,
          minSpend: offer.minSpend,
          terms: offer.terms,
          deepLink: zomatoUrl,
          fetchedAt: now,
          isActive: true,
          lastCheckedAt: now,
          offerType: offer.offerType,
          sourceUrl: zomatoUrl,
        });
        
        currentOfferTitles.push(offer.title);
      }
      
      // Mark any offers not found in this scrape as inactive
      await this.convex.mutation(api.offers.markOffersInactive, {
        placeSlug,
        currentOfferTitles,
        checkedAt: now,
      });
      
      // Update scraping status
      await this.convex.mutation(api.offers.updateScrapingStatus, {
        placeSlug,
        zomatoUrl,
        lastScrapedAt: now,
        nextScrapeAt: nextScrape,
        status: 'success',
        offersFound: offers.length,
      });
      
      console.log(`Successfully scraped ${offers.length} offers for ${placeSlug}`);
      return offers.length;
      
    } catch (error) {
      console.error(`Error scraping ${placeSlug}:`, error);
      
      // Update scraping status with error
      const nextScrape = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours from now on error
      
      await this.convex.mutation(api.offers.updateScrapingStatus, {
        placeSlug,
        zomatoUrl,
        lastScrapedAt: new Date().toISOString(),
        nextScrapeAt: nextScrape,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        offersFound: 0,
      });
      
      throw error;
    }
  }
  
  async scrapeNextBatch(batchSize: number = 20): Promise<void> {
    console.log(`Scraping next batch of ${batchSize} places...`);
    
    try {
      const placesToScrape = await this.convex.query(api.offers.getPlacesNeedingScraping, {
        limit: batchSize,
      });
      
      if (placesToScrape.length === 0) {
        console.log('No places need scraping at this time');
        return;
      }
      
      console.log(`Found ${placesToScrape.length} places to scrape`);
      
      // Process all places in parallel for much faster scraping
      const scrapePromises = placesToScrape.map(async (place: any, index: number) => {
        try {
          // Add small staggered delay to avoid overwhelming the server
          await this.delay(index * 100); // 100ms stagger
          await this.scrapePlaceOffers(place.placeSlug, place.zomatoUrl);
          return { success: true, placeSlug: place.placeSlug };
        } catch (error) {
          console.error(`Failed to scrape ${place.placeSlug}:`, error);
          return { success: false, placeSlug: place.placeSlug, error };
        }
      });
      
      const results = await Promise.all(scrapePromises);
      const successful = results.filter((r: any) => r.success).length;
      console.log(`Batch complete: ${successful}/${results.length} places scraped successfully`);
      
    } catch (error) {
      console.error('Error in scrapeNextBatch:', error);
      throw error;
    }
  }

  // Enhanced method to scrape ALL places with smart distribution
  async scrapeAllPlaces() {
    console.log('Starting intelligent full scraping of all places...');
    
    try {
      const allPlaces = await this.convex.query(api.offers.getAllPlacesForScraping);
      
      if (allPlaces.length === 0) {
        console.log('No places configured for scraping');
        return { success: 0, failed: 0, total: 0 };
      }
      
      console.log(`Found ${allPlaces.length} total places to scrape`);
      
      // Smart distribution strategy
      const chunkSize = 3; // Smaller chunks for better success rate
      const chunkDelay = 5000; // 5 seconds between chunks
      let totalSuccess = 0;
      let totalFailed = 0;
      
      for (let i = 0; i < allPlaces.length; i += chunkSize) {
        const chunk = allPlaces.slice(i, i + chunkSize);
        const chunkNumber = Math.floor(i/chunkSize) + 1;
        const totalChunks = Math.ceil(allPlaces.length/chunkSize);
        
        console.log(`Processing chunk ${chunkNumber}/${totalChunks} (${chunk.length} places)`);
        
        const scrapePromises = chunk.map(async (place: any, index: number) => {
          try {
            // Staggered delay within chunk (1-3 seconds apart)
            const delay = (index + 1) * (1000 + Math.random() * 2000);
            await this.delay(delay);
            
            await this.scrapePlaceOffers(place.placeSlug, place.zomatoUrl);
            return { success: true, placeSlug: place.placeSlug };
          } catch (error) {
            console.error(`Failed to scrape ${place.placeSlug}:`, error);
            return { success: false, placeSlug: place.placeSlug, error };
          }
        });
        
        const results = await Promise.all(scrapePromises);
        const chunkSuccess = results.filter((r: any) => r.success).length;
        const chunkFailed = results.filter((r: any) => !r.success).length;
        
        totalSuccess += chunkSuccess;
        totalFailed += chunkFailed;
        
        console.log(`Chunk ${chunkNumber} complete: ${chunkSuccess}/${chunk.length} successful`);
        
        // Adaptive delay between chunks based on success rate
        if (i + chunkSize < allPlaces.length) {
          const successRate = chunkSuccess / chunk.length;
          let adaptiveDelay = chunkDelay;
          
          if (successRate < 0.5) {
            // Poor success rate, increase delay
            adaptiveDelay = chunkDelay * 2;
            console.log(`Low success rate (${Math.round(successRate * 100)}%), increasing delay to ${adaptiveDelay}ms`);
          } else if (successRate > 0.8) {
            // Good success rate, can be more aggressive
            adaptiveDelay = Math.max(chunkDelay * 0.7, 2000);
            console.log(`Good success rate (${Math.round(successRate * 100)}%), reducing delay to ${adaptiveDelay}ms`);
          }
          
          console.log(`Waiting ${adaptiveDelay}ms before next chunk...`);
          await this.delay(adaptiveDelay);
        }
      }
      
      const overallSuccessRate = (totalSuccess / allPlaces.length * 100).toFixed(1);
      console.log(`Full scraping complete: ${totalSuccess} successful, ${totalFailed} failed, ${allPlaces.length} total (${overallSuccessRate}% success rate)`);
      return { success: totalSuccess, failed: totalFailed, total: allPlaces.length };
      
    } catch (error) {
      console.error('Error in scrapeAllPlaces:', error);
      throw error;
    }
  }

  // Conservative scraping method with maximum reliability
  async scrapeAllPlacesConservative() {
    console.log('Starting CONSERVATIVE scraping - prioritizing success over speed...');
    
    try {
      const allPlaces = await this.convex.query(api.offers.getAllPlacesForScraping);
      
      if (allPlaces.length === 0) {
        console.log('No places configured for scraping');
        return { success: 0, failed: 0, total: 0 };
      }
      
      console.log(`Found ${allPlaces.length} total places to scrape (conservative mode)`);
      
      // Ultra-conservative settings
      const chunkSize = 2; // Only 2 places at a time
      const baseDelay = 10000; // 10 seconds between chunks minimum
      let totalSuccess = 0;
      let totalFailed = 0;
      
      for (let i = 0; i < allPlaces.length; i += chunkSize) {
        const chunk = allPlaces.slice(i, i + chunkSize);
        const chunkNumber = Math.floor(i/chunkSize) + 1;
        const totalChunks = Math.ceil(allPlaces.length/chunkSize);
        
        console.log(`[CONSERVATIVE] Processing chunk ${chunkNumber}/${totalChunks} (${chunk.length} places)`);
        
        // Process places in sequence (not parallel) for maximum safety
        const results = [];
        for (let j = 0; j < chunk.length; j++) {
          const place = chunk[j];
          try {
            // Long delay between each place in the chunk
            if (j > 0) {
              const intraChunkDelay = 3000 + Math.random() * 4000; // 3-7 seconds
              console.log(`Waiting ${Math.round(intraChunkDelay)}ms before next place...`);
              await this.delay(intraChunkDelay);
            }
            
            await this.scrapePlaceOffers(place.placeSlug, place.zomatoUrl);
            results.push({ success: true, placeSlug: place.placeSlug });
          } catch (error) {
            console.error(`Failed to scrape ${place.placeSlug}:`, error);
            results.push({ success: false, placeSlug: place.placeSlug, error });
          }
        }
        
        const chunkSuccess = results.filter((r: any) => r.success).length;
        const chunkFailed = results.filter((r: any) => !r.success).length;
        
        totalSuccess += chunkSuccess;
        totalFailed += chunkFailed;
        
        console.log(`[CONSERVATIVE] Chunk ${chunkNumber} complete: ${chunkSuccess}/${chunk.length} successful`);
        
        // Long delay between chunks
        if (i + chunkSize < allPlaces.length) {
          // Increase delay if we had failures
          const failureRate = chunkFailed / chunk.length;
          let adaptiveDelay = baseDelay;
          
          if (failureRate > 0.5) {
            adaptiveDelay = baseDelay * 2; // 20 seconds if >50% failed
          } else if (failureRate > 0) {
            adaptiveDelay = baseDelay * 1.5; // 15 seconds if any failed
          }
          
          // Add random jitter
          adaptiveDelay += Math.random() * 5000; // +0-5 seconds randomness
          
          console.log(`[CONSERVATIVE] Waiting ${Math.round(adaptiveDelay)}ms before next chunk (failure rate: ${Math.round(failureRate * 100)}%)...`);
          await this.delay(adaptiveDelay);
        }
      }
      
      const overallSuccessRate = (totalSuccess / allPlaces.length * 100).toFixed(1);
      console.log(`[CONSERVATIVE] Full scraping complete: ${totalSuccess} successful, ${totalFailed} failed, ${allPlaces.length} total (${overallSuccessRate}% success rate)`);
      return { 
        success: totalSuccess, 
        failed: totalFailed, 
        total: allPlaces.length,
        strategy: 'conservative',
        successRate: overallSuccessRate + '%'
      };
      
    } catch (error) {
      console.error('Error in conservative scraping:', error);
      throw error;
    }
  }
  
  async runContinuousScraping(intervalMinutes: number = 60) {
    console.log(`Starting continuous scraping every ${intervalMinutes} minutes...`);
    
    const scrapeLoop = async () => {
      try {
        await this.scrapeNextBatch();
      } catch (error) {
        console.error('Error in scraping loop:', error);
      }
    };
    
    // Run immediately
    await scrapeLoop();
    
    // Then run on interval
    setInterval(scrapeLoop, intervalMinutes * 60 * 1000);
  }
  
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}