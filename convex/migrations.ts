import { mutation } from "./_generated/server";

// Migration to fill in missing fields for existing offers
export const migrateOffers = mutation({
  args: {},
  handler: async (ctx) => {
    const offers = await ctx.db.query("offers").collect();
    let updatedCount = 0;
    
    for (const offer of offers) {
      const updates: any = {};
      
      // Add lastCheckedAt if missing
      if (!offer.lastCheckedAt) {
        updates.lastCheckedAt = offer.fetchedAt;
      }
      
      // Add sourceUrl if missing
      if (!offer.sourceUrl) {
        updates.sourceUrl = offer.deepLink;
      }
      
      // Only update if there are changes needed
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(offer._id, updates);
        updatedCount++;
      }
    }
    
    return {
      totalOffers: offers.length,
      updatedOffers: updatedCount,
      message: `Updated ${updatedCount} offers out of ${offers.length} total offers`,
    };
  },
});