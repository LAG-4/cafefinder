import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Main places/restaurants table
  places: defineTable({
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
    // Store all the detailed raw scores from CSV
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
  })
    .index("by_slug", ["slug"])
    .index("by_rank", ["rank"])
    .index("by_type", ["type"]),

  // Offers table for discount data
  offers: defineTable({
    placeSlug: v.string(),
    platform: v.string(), // Always 'zomato' for now
    title: v.string(),
    description: v.optional(v.string()),
    validityText: v.optional(v.string()),
    effectivePriceText: v.optional(v.string()),
    discountPct: v.optional(v.number()),
    minSpend: v.optional(v.number()),
    terms: v.optional(v.array(v.string())),
    deepLink: v.string(), // Original Zomato restaurant URL
    fetchedAt: v.string(),
    isActive: v.boolean(),
    expiresAt: v.optional(v.string()), // When offer expires
    lastCheckedAt: v.optional(v.string()), // When we last verified this offer exists - made optional for backward compatibility
    offerType: v.optional(v.string()), // 'bank', 'prebook', 'surprise', 'exclusive', etc.
    sourceUrl: v.optional(v.string()), // Source Zomato URL where this offer was found - made optional for backward compatibility
  })
    .index("by_place", ["placeSlug"])
    .index("by_platform", ["platform"])
    .index("by_active", ["isActive"])
    .index("by_last_checked", ["lastCheckedAt"])
    .index("by_place_active", ["placeSlug", "isActive"]),

  // Scraping status to track when we last scraped each restaurant
  scrapingStatus: defineTable({
    placeSlug: v.string(),
    zomatoUrl: v.string(),
    lastScrapedAt: v.string(),
    nextScrapeAt: v.string(),
    status: v.string(), // 'pending', 'success', 'error', 'disabled'
    errorMessage: v.optional(v.string()),
    offersFound: v.number(),
  })
    .index("by_place", ["placeSlug"])
    .index("by_next_scrape", ["nextScrapeAt"])
    .index("by_status", ["status"]),
});
