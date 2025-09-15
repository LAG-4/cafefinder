import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error('Please set CONVEX_URL environment variable');
  console.error('Set it in your .env.local file as NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud');
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

interface SampleOffer {
  placeSlug: string;
  platform: string;
  title: string;
  description?: string;
  validityText?: string;
  effectivePriceText?: string;
  discountPct?: number;
  minSpend?: number;
  terms?: string[];
  deepLink: string;
  fetchedAt: string;
  isActive: boolean;
  offerType?: string;
}

const sampleOffers: SampleOffer[] = [
  {
    placeSlug: "hard-rock-cafe",
    platform: "zomato",
    title: "20% Off on Total Bill",
    description: "Get 20% discount on your total bill",
    validityText: "Valid till 31st Dec 2025",
    effectivePriceText: "Save ₹200 on ₹1000",
    discountPct: 20,
    minSpend: 1000,
    terms: ["Valid on dine-in only", "Cannot be combined with other offers"],
    deepLink: "https://www.zomato.com/hyderabad/hard-rock-cafe-gachibowli",
    fetchedAt: new Date().toISOString(),
    isActive: true,
    offerType: "restaurant"
  },
  {
    placeSlug: "cafe-mocha",
    platform: "zomato", 
    title: "Buy 1 Get 1 Free Coffee",
    description: "Buy any coffee and get another one free",
    validityText: "Valid on weekdays only",
    effectivePriceText: "Save up to ₹150",
    discountPct: 50,
    minSpend: 200,
    terms: ["Valid Monday to Friday", "Same or lesser value item free"],
    deepLink: "https://www.zomato.com/hyderabad/cafe-mocha-banjara-hills",
    fetchedAt: new Date().toISOString(),
    isActive: true,
    offerType: "beverage"
  },
  {
    placeSlug: "toit-brewpub",
    platform: "zomato",
    title: "Happy Hours - 25% Off Beer",
    description: "Get 25% off on all beer during happy hours",
    validityText: "Valid 4 PM to 7 PM daily",
    effectivePriceText: "Starting from ₹225",
    discountPct: 25,
    minSpend: 500,
    terms: ["Valid 4 PM to 7 PM only", "Applicable on beer only"],
    deepLink: "https://www.zomato.com/hyderabad/toit-jubilee-hills",
    fetchedAt: new Date().toISOString(),
    isActive: true,
    offerType: "alcohol"
  },
  {
    placeSlug: "starbucks",
    platform: "zomato",
    title: "Free Pastry with Coffee",
    description: "Get a free pastry with any grande coffee purchase",
    validityText: "Valid till stocks last",
    effectivePriceText: "Save ₹180",
    discountPct: 0,
    minSpend: 300,
    terms: ["Valid on grande size and above", "Subject to availability"],
    deepLink: "https://www.zomato.com/hyderabad/starbucks-gvk-one-mall",
    fetchedAt: new Date().toISOString(),
    isActive: true,
    offerType: "combo"
  },
  {
    placeSlug: "social",
    platform: "zomato",
    title: "Flat ₹300 Off",
    description: "Flat ₹300 off on bill above ₹1500",
    validityText: "Valid on all days",
    effectivePriceText: "Pay ₹1200 for ₹1500",
    discountPct: 20,
    minSpend: 1500,
    terms: ["Minimum order ₹1500", "Valid on dine-in and delivery"],
    deepLink: "https://www.zomato.com/hyderabad/social-jubilee-hills",
    fetchedAt: new Date().toISOString(),
    isActive: true,
    offerType: "flat-discount"
  }
];

async function addSampleOffers(): Promise<void> {
  console.log('🚀 Adding sample offers to database...');
  let addedCount = 0;
  let errorCount = 0;
  
  for (const offer of sampleOffers) {
    try {
      await client.mutation(api.offers.upsertOffer, {
        ...offer,
        lastCheckedAt: offer.fetchedAt,
        sourceUrl: offer.deepLink,
      });
      addedCount++;
      console.log(`✅ Added offer: "${offer.title}" for ${offer.placeSlug}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Error adding offer for ${offer.placeSlug}:`, error);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully added: ${addedCount} offers`);
  console.log(`❌ Errors: ${errorCount} offers`);
  console.log(`📝 Total processed: ${sampleOffers.length} offers`);
  
  if (addedCount > 0) {
    console.log('\n🎉 Sample offers have been added to your database!');
    console.log('You can view them in the admin dashboard at /admin/offers');
  }
}

// Add sample scraping status entries for the places
async function addSampleScrapingStatus(): Promise<void> {
  console.log('\n🔧 Adding sample scraping status entries...');
  
  const samplePlaces = [
    {
      placeSlug: "hard-rock-cafe",
      zomatoUrl: "https://www.zomato.com/hyderabad/hard-rock-cafe-gachibowli",
    },
    {
      placeSlug: "cafe-mocha", 
      zomatoUrl: "https://www.zomato.com/hyderabad/cafe-mocha-banjara-hills",
    },
    {
      placeSlug: "toit-brewpub",
      zomatoUrl: "https://www.zomato.com/hyderabad/toit-jubilee-hills",
    },
    {
      placeSlug: "starbucks",
      zomatoUrl: "https://www.zomato.com/hyderabad/starbucks-gvk-one-mall",
    },
    {
      placeSlug: "social",
      zomatoUrl: "https://www.zomato.com/hyderabad/social-jubilee-hills",
    }
  ];
  
  let statusCount = 0;
  
  for (const place of samplePlaces) {
    try {
      const now = new Date().toISOString();
      const nextScrape = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      
      await client.mutation(api.offers.updateScrapingStatus, {
        placeSlug: place.placeSlug,
        zomatoUrl: place.zomatoUrl,
        lastScrapedAt: now,
        nextScrapeAt: nextScrape,
        status: 'success',
        offersFound: 1,
      });
      
      statusCount++;
      console.log(`✅ Added scraping status for ${place.placeSlug}`);
    } catch (error) {
      console.error(`❌ Error adding scraping status for ${place.placeSlug}:`, error);
    }
  }
  
  console.log(`✅ Added ${statusCount} scraping status entries`);
}

async function run(): Promise<void> {
  try {
    console.log('🎯 Sample Offers Setup Script');
    console.log('===============================\n');
    
    await addSampleOffers();
    await addSampleScrapingStatus();
    
    console.log('\n🎉 Setup complete! Your Hyd Cafe Finder now has sample data.');
    console.log('💡 Visit /admin/offers to see the offers in the admin dashboard.');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  run();
}

export { addSampleOffers, addSampleScrapingStatus };