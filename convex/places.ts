import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query all places with optional filtering
export const getAllPlaces = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      const allPlaces = await ctx.db.query("places").collect();
      let filtered = allPlaces.filter(place => place.type === args.type);
      filtered.sort((a, b) => a.rank - b.rank);
      
      if (args.limit) {
        return filtered.slice(0, args.limit);
      }
      return filtered;
    }
    
    let query = ctx.db.query("places");
    
    if (args.limit) {
      return await query.take(args.limit);
    }
    
    return await query.collect();
  },
});

// Query a single place by slug
export const getPlaceBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const places = await ctx.db.query("places").collect();
    return places.find(place => place.slug === args.slug);
  },
});

// Query places by rank range
export const getPlacesByRankRange = query({
  args: {
    startRank: v.number(),
    endRank: v.number(),
  },
  handler: async (ctx, args) => {
    const places = await ctx.db.query("places").collect();
    return places.filter(place => 
      place.rank >= args.startRank && place.rank <= args.endRank
    ).sort((a, b) => a.rank - b.rank);
  },
});

// Add a new place
export const addPlace = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    area: v.string(),
    type: v.string(),
    image: v.optional(v.string()),
    rank: v.number(),
    scores: v.object({
      overall: v.number(),
      cost: v.number(),
      wifi: v.number(),
      safety: v.number(),
      liked: v.number(),
    }),
    rawScores: v.object({
      aestheticScore: v.number(),
      socialMediaFriendliness: v.string(),
      funFactor: v.optional(v.string()),
      crowdVibe: v.string(),
      ambianceAndInteriorComfort: v.string(),
      communityVibe: v.string(),
      safety: v.string(),
      inclusionForeigners: v.string(),
      racismFreeEnvironment: v.string(),
      lighting: v.string(),
      musicQualityAndVolume: v.string(),
      wifiSpeedAndReliability: v.string(),
      laptopWorkFriendliness: v.string(),
      valueForMoney: v.string(),
      foodQualityAndTaste: v.string(),
      drinkQualityAndSelection: v.string(),
      cleanlinessAndHygiene: v.string(),
      serviceSpeed: v.string(),
      staffFriendliness: v.string(),
      seatingComfort: v.string(),
      noiseLevel: v.string(),
      temperatureComfort: v.string(),
      availabilityOfPowerOutlets: v.string(),
      menuClarityAndUsability: v.string(),
      waitTimes: v.string(),
      easeOfReservations: v.string(),
      crowdDensity: v.string(),
      lineOfSight: v.string(),
      foodSafety: v.string(),
      proactiveService: v.string(),
      airQuality: v.string(),
      restroomCleanliness: v.string(),
      paymentConvenience: v.string(),
      walkabilityAccessibility: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("places", args);
  },
});

// Search places by name
export const searchPlaces = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const allPlaces = await ctx.db.query("places").collect();
    
    return allPlaces.filter(place => 
      place.name.toLowerCase().includes(args.searchTerm.toLowerCase()) ||
      place.area.toLowerCase().includes(args.searchTerm.toLowerCase())
    );
  },
});