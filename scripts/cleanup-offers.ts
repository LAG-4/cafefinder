import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

async function cleanupOldOffers() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error('CONVEX_URL not found. Please set it in your environment.');
    process.exit(1);
  }
  
  const convex = new ConvexHttpClient(convexUrl);
  
  try {
    console.log('🧹 Starting COMPREHENSIVE cleanup of offers...\n');
    
    // Show current state
    const allOffers = await convex.query(api.offers.getAllOffers);
    console.log(`📊 Current state: ${allOffers.length} total offers\n`);
    
    // First, do a dry run to see what would be deleted
    console.log('🔍 Analyzing duplicates and old batches...');
    const dryRun = await convex.mutation(api.offers.advancedCleanup, {
      dryRun: true,
      keepOnlyLatestBatch: true,
      removeDuplicates: true
    });
    
    console.log('📊 Advanced Cleanup Preview:');
    console.log(`- Total offers: ${dryRun.totalOffers}`);
    console.log(`- Would delete: ${dryRun.wouldDelete} offers`);
    console.log(`- Would keep: ${dryRun.wouldKeep} offers`);
    console.log(`- Duplicates to remove: ${dryRun.duplicatesRemoved}`);
    console.log(`- Old batches to remove: ${dryRun.oldBatchesRemoved}`);
    
    if (dryRun.breakdown && dryRun.breakdown.length > 0) {
      console.log('\nSample breakdown by place/platform:');
      dryRun.breakdown.forEach((item, i) => {
        console.log(`${i + 1}. ${item.placeAndPlatform}: ${item.totalOffers} offers, ${item.uniqueFetchTimes} different fetch times`);
      });
    }
    
    if (dryRun.wouldDelete === 0) {
      console.log('\n✅ No cleanup needed. Database is already optimized!');
      return;
    }
    
    console.log('\n🗑️  Proceeding with AGGRESSIVE cleanup...');
    console.log('This will:');
    console.log('- Keep ONLY the latest scraping batch per place/platform');
    console.log('- Remove ALL duplicate offers intelligently');
    console.log('- Significantly reduce storage usage\n');
    
    const result = await convex.mutation(api.offers.advancedCleanup, {
      dryRun: false,
      keepOnlyLatestBatch: true,
      removeDuplicates: true
    });
    
    console.log('✅ AGGRESSIVE cleanup completed!');
    console.log(`- Started with: ${result.totalOffers} offers`);
    console.log(`- Deleted: ${result.deleted || 0} offers`);
    console.log(`- Remaining: ${result.remaining || 0} offers`);
    console.log(`- Duplicates removed: ${result.duplicatesRemoved || 0}`);
    console.log(`- Old batches removed: ${result.oldBatchesRemoved || 0}`);
    console.log(`- Storage reduction: ${Math.round(((result.deleted || 0) / result.totalOffers) * 100)}%`);
    
    // Additional basic cleanup for any remaining old/inactive offers
    console.log('\n🧹 Running additional basic cleanup...');
    const basicCleanup = await convex.mutation(api.offers.cleanupOldOffers, {
      olderThanDays: 1, // Very aggressive - anything older than 1 day
      dryRun: false
    });
    
    if ((basicCleanup.deleted || 0) > 0) {
      console.log(`- Additional cleanup: ${basicCleanup.deleted} old/inactive offers removed`);
    }
    
    // Final count
    const finalOffers = await convex.query(api.offers.getAllOffers);
    console.log(`\n🎉 Final result: ${finalOffers.length} clean, unique offers remaining`);
    console.log(`💾 Total storage reduction: ${allOffers.length - finalOffers.length} offers (${Math.round(((allOffers.length - finalOffers.length) / allOffers.length) * 100)}%)`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupOldOffers();