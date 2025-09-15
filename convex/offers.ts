import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query active offers for a specific place
export const getOffersByPlace = query({
  args: { placeSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("offers")
      .withIndex("by_place_active", (q) =>
        q.eq("placeSlug", args.placeSlug).eq("isActive", true)
      )
      .collect();
  },
});

// Get all offers for admin/debugging
export const getAllOffers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("offers").collect();
  },
});

// Add or update an offer
export const upsertOffer = mutation({
  args: {
    placeSlug: v.string(),
    platform: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    validityText: v.optional(v.string()),
    effectivePriceText: v.optional(v.string()),
    discountPct: v.optional(v.number()),
    minSpend: v.optional(v.number()),
    terms: v.optional(v.array(v.string())),
    deepLink: v.string(),
    fetchedAt: v.string(),
    isActive: v.boolean(),
    expiresAt: v.optional(v.string()),
    lastCheckedAt: v.optional(v.string()),
    offerType: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to find existing offer with same title and place
    const existing = await ctx.db
      .query("offers")
      .withIndex("by_place", (q) => q.eq("placeSlug", args.placeSlug))
      .filter((q) => q.eq(q.field("title"), args.title))
      .first();

    if (existing) {
      // Update existing offer
      return await ctx.db.patch(existing._id, {
        ...args,
        lastCheckedAt: args.lastCheckedAt || args.fetchedAt,
      });
    } else {
      // Create new offer
      return await ctx.db.insert("offers", {
        ...args,
        lastCheckedAt: args.lastCheckedAt || args.fetchedAt,
        sourceUrl: args.sourceUrl || args.deepLink,
      });
    }
  },
});

// Replace old offers with new ones for a place (prevents accumulation)
export const replaceOffersForPlace = mutation({
  args: {
    placeSlug: v.string(),
    platform: v.string(),
    offers: v.array(v.object({
      title: v.string(),
      description: v.optional(v.string()),
      validityText: v.optional(v.string()),
      effectivePriceText: v.optional(v.string()),
      discountPct: v.optional(v.number()),
      minSpend: v.optional(v.number()),
      terms: v.optional(v.array(v.string())),
      deepLink: v.string(),
      fetchedAt: v.string(),
      isActive: v.boolean(),
      expiresAt: v.optional(v.string()),
      lastCheckedAt: v.optional(v.string()),
      offerType: v.optional(v.string()),
      sourceUrl: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Delete all existing offers for this place and platform
    const existingOffers = await ctx.db
      .query("offers")
      .withIndex("by_place", (q) => q.eq("placeSlug", args.placeSlug))
      .filter((q) => q.eq(q.field("platform"), args.platform))
      .collect();

    // Delete old offers
    for (const offer of existingOffers) {
      await ctx.db.delete(offer._id);
    }

    // Remove duplicates from new offers before inserting
    const uniqueOffers = removeDuplicatesFromArray(args.offers);

    // Insert new offers
    const insertPromises = uniqueOffers.map(offer => 
      ctx.db.insert("offers", {
        placeSlug: args.placeSlug,
        platform: args.platform,
        ...offer,
        lastCheckedAt: offer.lastCheckedAt || offer.fetchedAt,
        sourceUrl: offer.sourceUrl || offer.deepLink,
      })
    );

    await Promise.all(insertPromises);
    
    const duplicatesRemoved = args.offers.length - uniqueOffers.length;
    if (duplicatesRemoved > 0) {
      console.log(`Removed ${duplicatesRemoved} duplicates for ${args.placeSlug}:${args.platform}`);
    }
    
    return uniqueOffers.length;
  },
});

// Helper function to remove duplicates from offers array
function removeDuplicatesFromArray(offers: any[]): any[] {
  const uniqueOffers: any[] = [];
  
  for (const offer of offers) {
    const isDuplicate = uniqueOffers.some(unique => {
      // Check if titles are similar (allowing for minor variations)
      const titleSimilarity = calculateSimilarity(offer.title.toLowerCase(), unique.title.toLowerCase());
      
      // Check if discount percentages are the same
      const sameDiscount = offer.discountPct === unique.discountPct;
      
      // Check if descriptions are similar (if both exist)
      let descSimilarity = 1;
      if (offer.description && unique.description) {
        descSimilarity = calculateSimilarity(
          offer.description.toLowerCase(), 
          unique.description.toLowerCase()
        );
      }
      
      // Consider duplicate if title is very similar (>80%) or exact discount match with similar title (>60%)
      return titleSimilarity > 0.8 || (sameDiscount && titleSimilarity > 0.6 && descSimilarity > 0.7);
    });
    
    if (!isDuplicate) {
      uniqueOffers.push(offer);
    }
  }
  
  return uniqueOffers;
}

// Mark offers as inactive if they weren't found in latest scrape (legacy function)
export const markOffersInactive = mutation({
  args: {
    placeSlug: v.string(),
    currentOfferTitles: v.array(v.string()),
    checkedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existingOffers = await ctx.db
      .query("offers")
      .withIndex("by_place", (q) => q.eq("placeSlug", args.placeSlug))
      .collect();

    const updates = [];
    for (const offer of existingOffers) {
      if (!args.currentOfferTitles.includes(offer.title) && offer.isActive) {
        updates.push(
          ctx.db.patch(offer._id, {
            isActive: false,
            lastCheckedAt: args.checkedAt,
          })
        );
      }
    }

    await Promise.all(updates);
    return updates.length;
  },
});

// Clean up inactive offers older than specified days
export const cleanupInactiveOffers = mutation({
  args: { 
    olderThanDays: v.optional(v.number()) // Default 7 days if not specified
  },
  handler: async (ctx, args) => {
    const daysAgo = args.olderThanDays || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    const cutoffISO = cutoffDate.toISOString();

    const inactiveOffers = await ctx.db
      .query("offers")
      .withIndex("by_active", (q) => q.eq("isActive", false))
      .filter((q) => q.lt(q.field("fetchedAt"), cutoffISO))
      .collect();

    // Delete old inactive offers
    for (const offer of inactiveOffers) {
      await ctx.db.delete(offer._id);
    }

    return inactiveOffers.length;
  },
});

// Get scraping status for a place
export const getScrapingStatus = query({
  args: { placeSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scrapingStatus")
      .withIndex("by_place", (q) => q.eq("placeSlug", args.placeSlug))
      .first();
  },
});

// Update scraping status
export const updateScrapingStatus = mutation({
  args: {
    placeSlug: v.string(),
    zomatoUrl: v.string(),
    lastScrapedAt: v.string(),
    nextScrapeAt: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    offersFound: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("scrapingStatus")
      .withIndex("by_place", (q) => q.eq("placeSlug", args.placeSlug))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, args);
    } else {
      return await ctx.db.insert("scrapingStatus", args);
    }
  },
});

// Get places that need scraping
export const getPlacesNeedingScraping = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const limit = args.limit || 10;

    return await ctx.db
      .query("scrapingStatus")
      .withIndex("by_next_scrape")
      .filter((q) => q.lte(q.field("nextScrapeAt"), now))
      .take(limit);
  },
});

// Get all places for scraping (for batch operations)
export const getAllPlacesForScraping = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("scrapingStatus").collect();
  },
});

// Clean up old/inactive offers (admin function)
export const cleanupOldOffers = mutation({
  args: { 
    olderThanDays: v.optional(v.number()), // Default 7 days
    dryRun: v.optional(v.boolean()) // Preview what would be deleted
  },
  handler: async (ctx, args) => {
    const daysOld = args.olderThanDays || 7;
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
    
    // Find old offers
    const oldOffers = await ctx.db
      .query("offers")
      .filter((q) => q.lt(q.field("fetchedAt"), cutoffDate))
      .collect();
    
    // Find inactive offers
    const inactiveOffers = await ctx.db
      .query("offers")
      .filter((q) => q.eq(q.field("isActive"), false))
      .collect();
    
    const toDelete = [...oldOffers, ...inactiveOffers];
    const uniqueToDelete = toDelete.filter((offer, index, self) => 
      index === self.findIndex(o => o._id === offer._id)
    );
    
    if (args.dryRun) {
      return {
        wouldDelete: uniqueToDelete.length,
        oldOffers: oldOffers.length,
        inactiveOffers: inactiveOffers.length,
        cutoffDate,
        preview: uniqueToDelete.slice(0, 5).map(o => ({
          id: o._id,
          place: o.placeSlug,
          platform: o.platform,
          title: o.title,
          fetchedAt: o.fetchedAt,
          isActive: o.isActive
        }))
      };
    }
    
    // Delete old/inactive offers
    for (const offer of uniqueToDelete) {
      await ctx.db.delete(offer._id);
    }
    
    return {
      deleted: uniqueToDelete.length,
      oldOffers: oldOffers.length,
      inactiveOffers: inactiveOffers.length,
      cutoffDate
    };
  },
});

// Advanced cleanup: Keep only latest batch and remove duplicates
export const advancedCleanup = mutation({
  args: { 
    dryRun: v.optional(v.boolean()),
    keepOnlyLatestBatch: v.optional(v.boolean()),
    removeDuplicates: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const allOffers = await ctx.db.query("offers").collect();
    
    // Group by place and platform
    const groupedOffers = allOffers.reduce((acc, offer) => {
      const key = `${offer.placeSlug}:${offer.platform}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(offer);
      return acc;
    }, {} as Record<string, typeof allOffers>);
    
    let toDelete: typeof allOffers = [];
    let duplicatesRemoved = 0;
    let oldBatchesRemoved = 0;
    
    for (const [key, offers] of Object.entries(groupedOffers)) {
      // Sort by fetchedAt descending (newest first)
      offers.sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime());
      
      if (args.keepOnlyLatestBatch) {
        // Find the latest batch (offers with the same fetchedAt)
        const latestFetchTime = offers[0].fetchedAt;
        const latestBatch = offers.filter(o => o.fetchedAt === latestFetchTime);
        const oldBatches = offers.filter(o => o.fetchedAt !== latestFetchTime);
        
        toDelete.push(...oldBatches);
        oldBatchesRemoved += oldBatches.length;
        
        // Work with latest batch for duplicate removal
        offers.splice(0, offers.length, ...latestBatch);
      }
      
      if (args.removeDuplicates && offers.length > 1) {
        // Intelligent duplicate detection
        const uniqueOffers: typeof offers = [];
        const duplicates: typeof offers = [];
        
        for (const offer of offers) {
          const isDuplicate = uniqueOffers.some(unique => {
            // Check if titles are similar (allowing for minor variations)
            const titleSimilarity = calculateSimilarity(offer.title.toLowerCase(), unique.title.toLowerCase());
            
            // Check if discount percentages are the same
            const sameDiscount = offer.discountPct === unique.discountPct;
            
            // Check if descriptions are similar (if both exist)
            let descSimilarity = 1;
            if (offer.description && unique.description) {
              descSimilarity = calculateSimilarity(
                offer.description.toLowerCase(), 
                unique.description.toLowerCase()
              );
            }
            
            // Consider duplicate if title is very similar (>80%) or exact discount match with similar title (>60%)
            return titleSimilarity > 0.8 || (sameDiscount && titleSimilarity > 0.6 && descSimilarity > 0.7);
          });
          
          if (isDuplicate) {
            duplicates.push(offer);
          } else {
            uniqueOffers.push(offer);
          }
        }
        
        toDelete.push(...duplicates);
        duplicatesRemoved += duplicates.length;
      }
    }
    
    if (args.dryRun) {
      return {
        totalOffers: allOffers.length,
        wouldDelete: toDelete.length,
        wouldKeep: allOffers.length - toDelete.length,
        duplicatesRemoved,
        oldBatchesRemoved,
        breakdown: Object.entries(groupedOffers).map(([key, offers]) => ({
          placeAndPlatform: key,
          totalOffers: offers.length,
          uniqueFetchTimes: [...new Set(offers.map(o => o.fetchedAt))].length
        })).slice(0, 10) // Show first 10 for preview
      };
    }
    
    // Delete identified offers
    for (const offer of toDelete) {
      await ctx.db.delete(offer._id);
    }
    
    return {
      totalOffers: allOffers.length,
      deleted: toDelete.length,
      remaining: allOffers.length - toDelete.length,
      duplicatesRemoved,
      oldBatchesRemoved
    };
  },
});

// Helper function for string similarity (Levenshtein distance based)
function calculateSimilarity(str1: string, str2: string): number {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return 1 - matrix[len1][len2] / maxLen;
}