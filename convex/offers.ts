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

    // Insert new offers
    const insertPromises = args.offers.map(offer => 
      ctx.db.insert("offers", {
        placeSlug: args.placeSlug,
        platform: args.platform,
        ...offer,
        lastCheckedAt: offer.lastCheckedAt || offer.fetchedAt,
        sourceUrl: offer.sourceUrl || offer.deepLink,
      })
    );

    await Promise.all(insertPromises);
    return args.offers.length;
  },
});

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