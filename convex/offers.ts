import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query offers for a specific place
export const getOffersByPlace = query({
  args: { placeSlug: v.string() },
  handler: async (ctx, args) => {
    const offers = await ctx.db.query("offers").collect();
    return offers.filter(offer => 
      offer.placeSlug === args.placeSlug && offer.isActive
    );
  },
});

// Query offers by platform
export const getOffersByPlatform = query({
  args: { platform: v.string() },
  handler: async (ctx, args) => {
    const offers = await ctx.db.query("offers").collect();
    return offers.filter(offer => 
      offer.platform === args.platform && offer.isActive
    );
  },
});

// Add a new offer
export const addOffer = mutation({
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("offers", args);
  },
});

// Update offer active status
export const updateOfferStatus = mutation({
  args: {
    offerId: v.id("offers"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.offerId, { isActive: args.isActive });
  },
});

// Get all active offers
export const getAllActiveOffers = query({
  handler: async (ctx) => {
    const offers = await ctx.db.query("offers").collect();
    return offers.filter(offer => offer.isActive);
  },
});

// Platform mappings functions
export const getPlacePlatformMappings = query({
  args: { placeSlug: v.string() },
  handler: async (ctx, args) => {
    const mappings = await ctx.db.query("placePlatformMappings").collect();
    return mappings.filter(mapping => mapping.placeSlug === args.placeSlug);
  },
});

export const addPlacePlatformMapping = mutation({
  args: {
    placeSlug: v.string(),
    platform: v.string(),
    url: v.string(),
    lastVerifiedAt: v.optional(v.string()),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("placePlatformMappings", args);
  },
});