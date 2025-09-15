export interface Cafe {
  id: string;
  name: string;
  description?: string;
  rating?: number;
  location?: string;
  [key: string]: unknown;
}

export interface Discount {
  id: string;
  title: string;
  description: string;
  percentage?: number;
  amount?: number;
  code?: string;
  platform: 'zomato' | 'swiggy' | 'ubereats' | 'dunzo' | 'direct';
  validUntil?: Date;
  minOrder?: number;
  maxDiscount?: number;
  isActive: boolean;
  terms?: string;
  url?: string;
}

export interface RestaurantDiscounts {
  restaurantId: string;
  restaurantName: string;
  discounts: Discount[];
  lastUpdated: Date;
}
