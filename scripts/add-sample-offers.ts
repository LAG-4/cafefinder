import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Convex client
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL not found in environment variables');
}
const client = new ConvexHttpClient(convexUrl);

async function addSampleOffers() {
  console.log('Adding sample offers...');

  const sampleOffers = [
    {
      placeSlug: "hard-rock-cafe",
      platform: "zomato",
      title: "20% Off on Food",
      description: "Get 20% discount on all food items",
      validityText: "Valid till 31st Dec 2024",
      effectivePriceText: "₹800 for ₹1000",
      discountPct: 20,
      minSpend: 1000,
      terms: ["Valid on food only", "Not applicable on beverages", "Cannot be combined with other offers"],
      deepLink: "https://zomato.com/hyderabad/hard-rock-cafe",
      fetchedAt: new Date().toISOString(),
      isActive: true,
    },
    {
      placeSlug: "hard-rock-cafe",
      platform: "swiggy",
      title: "Free Dessert on Orders Above ₹1500",
      description: "Complimentary dessert with orders above ₹1500",
      validityText: "Valid for dine-in only",
      effectivePriceText: "Free dessert worth ₹300",
      discountPct: 0,
      minSpend: 1500,
      terms: ["Valid for dine-in only", "Subject to availability"],
      deepLink: "https://swiggy.com/restaurants/hard-rock-cafe",
      fetchedAt: new Date().toISOString(),
      isActive: true,
    },
    {
      placeSlug: "social",
      platform: "dineout",
      title: "30% Off on Weekdays",
      description: "Get 30% off on total bill for weekday visits",
      validityText: "Monday to Thursday only",
      effectivePriceText: "₹700 for ₹1000",
      discountPct: 30,
      minSpend: 800,
      terms: ["Valid Monday to Thursday", "Not valid on public holidays"],
      deepLink: "https://dineout.co.in/hyderabad/social",
      fetchedAt: new Date().toISOString(),
      isActive: true,
    },
    {
      placeSlug: "starbucks",
      platform: "zomato",
      title: "Buy 2 Get 1 Free",
      description: "Buy any 2 beverages and get 1 free",
      validityText: "Valid all day",
      effectivePriceText: "₹600 for ₹900",
      discountPct: 33,
      minSpend: 600,
      terms: ["Valid on beverages only", "Lowest priced item will be free"],
      deepLink: "https://zomato.com/hyderabad/starbucks",
      fetchedAt: new Date().toISOString(),
      isActive: true,
    }
  ];

  let addedCount = 0;

  for (const offer of sampleOffers) {
    try {
      await client.mutation(api.offers.addOffer, offer);
      addedCount++;
      console.log(`Added offer: ${offer.title} for ${offer.placeSlug}`);
    } catch (error) {
      console.error(`Error adding offer ${offer.title}:`, error);
    }
  }

  console.log(`Successfully added ${addedCount} sample offers!`);
}

// Add sample platform mappings too
async function addSampleMappings() {
  console.log('Adding sample platform mappings...');

  const sampleMappings = [
    {
      placeSlug: "hard-rock-cafe",
      platform: "zomato",
      url: "https://zomato.com/hyderabad/hard-rock-cafe-banjara-hills",
      confidence: 0.95,
    },
    {
      placeSlug: "hard-rock-cafe",
      platform: "swiggy",
      url: "https://swiggy.com/restaurants/hard-rock-cafe-banjara-hills-hyderabad",
      confidence: 0.90,
    },
    {
      placeSlug: "social",
      platform: "zomato",
      url: "https://zomato.com/hyderabad/social-hitech-city",
      confidence: 0.98,
    },
    {
      placeSlug: "social",
      platform: "dineout",
      url: "https://dineout.co.in/hyderabad/social-hitech-city",
      confidence: 0.85,
    },
  ];

  let addedCount = 0;

  for (const mapping of sampleMappings) {
    try {
      await client.mutation(api.offers.addPlacePlatformMapping, mapping);
      addedCount++;
      console.log(`Added mapping: ${mapping.placeSlug} -> ${mapping.platform}`);
    } catch (error) {
      console.error(`Error adding mapping for ${mapping.placeSlug}:`, error);
    }
  }

  console.log(`Successfully added ${addedCount} sample mappings!`);
}

async function run() {
  await addSampleOffers();
  await addSampleMappings();
}

run();