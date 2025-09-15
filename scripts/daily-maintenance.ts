import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

async function dailyMaintenance() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error('CONVEX_URL not found. Please set it in your environment.');
    process.exit(1);
  }
  
  const convex = new ConvexHttpClient(convexUrl);
  
  try {
    console.log('🛠️  Running daily database maintenance...\n');
    
    // Get current state
    const beforeCount = (await convex.query(api.offers.getAllOffers)).length;
    console.log(`📊 Starting with: ${beforeCount} offers`);
    
    // Run maintenance cleanup (less aggressive than initial cleanup)
    const maintenanceResult = await convex.mutation(api.offers.advancedCleanup, {
      dryRun: false,
      keepOnlyLatestBatch: false, // Don't remove old batches in daily maintenance
      removeDuplicates: true // Still remove duplicates
    });
    
    // Clean up anything older than 3 days (more conservative)
    const oldCleanup = await convex.mutation(api.offers.cleanupOldOffers, {
      olderThanDays: 3,
      dryRun: false
    });
    
    const afterCount = (await convex.query(api.offers.getAllOffers)).length;
    const totalRemoved = beforeCount - afterCount;
    
    console.log('\n✅ Daily maintenance completed!');
    console.log(`- Duplicates removed: ${maintenanceResult.duplicatesRemoved || 0}`);
    console.log(`- Old offers removed: ${oldCleanup.deleted || 0}`);
    console.log(`- Total removed: ${totalRemoved}`);
    console.log(`- Final count: ${afterCount} offers`);
    
    if (totalRemoved > 0) {
      console.log(`💾 Storage saved: ${Math.round((totalRemoved / beforeCount) * 100)}%`);
    } else {
      console.log('✨ Database was already clean!');
    }
    
  } catch (error) {
    console.error('❌ Error during maintenance:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  dailyMaintenance();
}

export { dailyMaintenance };