import { Discount, RestaurantDiscounts } from './types';

// Mock discount generator - In production, this would be replaced with actual web scraping
function generateMockDiscounts(restaurantName: string, restaurantId: string): Discount[] {
  const discounts: Discount[] = [];
  
  // Generate random discounts for different platforms
  const platforms: Array<'zomato' | 'swiggy' | 'ubereats' | 'dunzo' | 'direct'> = ['zomato', 'swiggy', 'ubereats', 'dunzo', 'direct'];
  
  // Ensure every restaurant has at least 1-2 discounts
  const numDiscounts = Math.floor(Math.random() * 3) + 1; // 1-3 discounts per restaurant
  
  for (let i = 0; i < numDiscounts; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const discountType = Math.random() > 0.5 ? 'percentage' : 'amount';
    
    let discount: Discount;
    
    if (discountType === 'percentage') {
      const percentage = [10, 15, 20, 25, 30, 40, 50][Math.floor(Math.random() * 7)];
      discount = {
        id: `${restaurantId}-${platform}-${i}`,
        title: getDiscountTitle(platform, percentage),
        description: getDiscountDescription(platform, percentage),
        percentage,
        platform,
        validUntil: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within 30 days
        minOrder: [99, 199, 299, 399, 499][Math.floor(Math.random() * 5)],
        maxDiscount: [50, 100, 150, 200, 300][Math.floor(Math.random() * 5)],
        isActive: Math.random() > 0.1, // 90% chance of being active
        code: generatePromoCode(platform),
        url: getPlatformUrl(platform, restaurantName),
        terms: getTermsAndConditions(platform)
      };
    } else {
      const amount = [50, 75, 100, 125, 150, 200][Math.floor(Math.random() * 6)];
      discount = {
        id: `${restaurantId}-${platform}-${i}`,
        title: getAmountDiscountTitle(platform, amount),
        description: getAmountDiscountDescription(platform, amount),
        amount,
        platform,
        validUntil: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        minOrder: [199, 299, 399, 499, 599][Math.floor(Math.random() * 5)],
        isActive: Math.random() > 0.1,
        code: generatePromoCode(platform),
        url: getPlatformUrl(platform, restaurantName),
        terms: getTermsAndConditions(platform)
      };
    }
    
    discounts.push(discount);
  }
  
  return discounts;
}

function getDiscountTitle(platform: string, percentage: number): string {
  const platformNames = {
    zomato: 'Zomato',
    swiggy: 'Swiggy',
    ubereats: 'Uber Eats',
    dunzo: 'Dunzo',
    direct: 'Restaurant'
  };
  
  return `${percentage}% OFF on ${platformNames[platform as keyof typeof platformNames]}`;
}

function getDiscountDescription(platform: string, percentage: number): string {
  const descriptions = [
    `Get ${percentage}% discount on your order`,
    `Save ${percentage}% on food delivery`,
    `${percentage}% off on your next meal`,
    `Flat ${percentage}% discount available`,
    `Special ${percentage}% off offer`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function getAmountDiscountTitle(platform: string, amount: number): string {
  const platformNames = {
    zomato: 'Zomato',
    swiggy: 'Swiggy',
    ubereats: 'Uber Eats',
    dunzo: 'Dunzo',
    direct: 'Restaurant'
  };
  
  return `₹${amount} OFF on ${platformNames[platform as keyof typeof platformNames]}`;
}

function getAmountDiscountDescription(platform: string, amount: number): string {
  return `Flat ₹${amount} discount on your order`;
}

function generatePromoCode(platform: string): string {
  const codes = {
    zomato: ['ZOMATO20', 'WELCOME30', 'SAVE25', 'FIRST40', 'PARTY15'],
    swiggy: ['SWIGGY25', 'SUPER30', 'SAVE20', 'NEW40', 'FEAST15'],
    ubereats: ['UBER20', 'RIDE25', 'EATS30', 'SAVE15', 'NEW35'],
    dunzo: ['DUNZO15', 'QUICK20', 'SAVE25', 'FAST30', 'NEW40'],
    direct: ['DIRECT10', 'SPECIAL15', 'SAVE20', 'WELCOME25', 'VIP30']
  };
  
  const platformCodes = codes[platform as keyof typeof codes] || codes.direct;
  return platformCodes[Math.floor(Math.random() * platformCodes.length)];
}

function getPlatformUrl(platform: string, restaurantName: string): string {
  const encodedName = encodeURIComponent(restaurantName.toLowerCase().replace(/\s+/g, '-'));
  
  const urls = {
    zomato: `https://www.zomato.com/hyderabad/${encodedName}`,
    swiggy: `https://www.swiggy.com/restaurants/${encodedName}`,
    ubereats: `https://www.ubereats.com/in/hyderabad/food-delivery/${encodedName}`,
    dunzo: `https://www.dunzo.com/hyderabad/${encodedName}`,
    direct: '#'
  };
  
  return urls[platform as keyof typeof urls] || '#';
}

function getTermsAndConditions(platform: string): string {
  const terms = {
    zomato: 'Valid on Zomato app only. Not applicable on alcohol. Cannot be combined with other offers.',
    swiggy: 'Valid on Swiggy platform. Minimum order value applies. Limited time offer.',
    ubereats: 'Valid on Uber Eats app. Delivery charges may apply. Terms and conditions apply.',
    dunzo: 'Valid on Dunzo app. Available in select areas. Limited time offer.',
    direct: 'Valid for dine-in and takeaway. Cannot be combined with other offers.'
  };
  
  return terms[platform as keyof typeof terms] || 'Terms and conditions apply.';
}

// Generate discounts for all restaurants
export function generateDiscountsForRestaurant(restaurantName: string, restaurantId: string): RestaurantDiscounts {
  return {
    restaurantId,
    restaurantName,
    discounts: generateMockDiscounts(restaurantName, restaurantId),
    lastUpdated: new Date()
  };
}

// Get discounts for multiple restaurants
export function generateDiscountsForRestaurants(restaurants: Array<{id: string, name: string}>): RestaurantDiscounts[] {
  return restaurants.map(restaurant => 
    generateDiscountsForRestaurant(restaurant.name, restaurant.id)
  );
}

export function getBestDiscount(discounts: Discount[]): Discount | null {
  if (!discounts.length) return null;
  
  return discounts
    .filter(d => d.isActive)
    .sort((a, b) => {
      // Sort by percentage first, then by amount
      const aValue = a.percentage || (a.amount && a.minOrder ? (a.amount / a.minOrder) * 100 : 0);
      const bValue = b.percentage || (b.amount && b.minOrder ? (b.amount / b.minOrder) * 100 : 0);
      return bValue - aValue;
    })[0] || null;
}

export function getDiscountsByPlatform(discounts: Discount[], platform: string): Discount[] {
  return discounts.filter(d => d.platform === platform && d.isActive);
}