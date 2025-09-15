// Test script to add sample offers and test duplicate key fix
export const sampleOffers = [
  {
    id: "zomato:social:exclusiveoffer-1",
    platform: "zomato",
    title: "Exclusive Offer - 20% Off",
    description: "Get 20% off on your total bill",
    discountPct: 20,
    deepLink: "https://zomato.com/social",
    fetchedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "zomato:social:exclusiveoffer-2", 
    platform: "zomato",
    title: "Exclusive Offer - 20% Off", // Same title to test duplicate prevention
    description: "Get 20% off on your total bill",
    discountPct: 20,
    deepLink: "https://zomato.com/social",
    fetchedAt: "2024-01-15T10:00:01Z"
  },
  {
    id: "swiggy:social:exclusiveoffer-3",
    platform: "swiggy", 
    title: "Exclusive Offer - 20% Off", // Same title, different platform
    description: "Get 20% off on your total bill",
    discountPct: 20,
    deepLink: "https://swiggy.com/social",
    fetchedAt: "2024-01-15T10:00:02Z"
  },
  {
    id: "dineout:social:exclusiveoffer-4",
    platform: "dineout",
    title: "Exclusive Offer - 20% Off", // Same title, different platform
    description: "Get 20% off on your total bill", 
    discountPct: 20,
    deepLink: "https://dineout.co.in/social",
    fetchedAt: "2024-01-15T10:00:03Z"
  }
];