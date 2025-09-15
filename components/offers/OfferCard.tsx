'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock, Tag, Info } from 'lucide-react';
import { useState } from 'react';

type Offer = {
  id: string;
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
};

interface OfferCardProps {
  offer: Offer;
  onLinkClick?: (offer: Offer) => void;
}

const platformColors: Record<string, string> = {
  zomato: 'bg-red-100 text-red-800 border-red-200',
  swiggy: 'bg-orange-100 text-orange-800 border-orange-200',
  dineout: 'bg-blue-100 text-blue-800 border-blue-200',
  eazydiner: 'bg-purple-100 text-purple-800 border-purple-200',
  magicpin: 'bg-green-100 text-green-800 border-green-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

const platformNames: Record<string, string> = {
  zomato: 'Zomato',
  swiggy: 'Swiggy',
  dineout: 'Dineout',
  eazydiner: 'EazyDiner',
  magicpin: 'MagicPin',
  other: 'Other',
};

export function OfferCard({ offer, onLinkClick }: OfferCardProps) {
  const [showTerms, setShowTerms] = useState(false);
  
  const handleLinkClick = () => {
    onLinkClick?.(offer);
    if (offer.deepLink) {
      window.open(offer.deepLink, '_blank', 'noopener,noreferrer');
    }
  };
  
  const formatPlatformName = (platform: string) => {
    return platformNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  };
  
  const getPlatformColor = (platform: string) => {
    return platformColors[platform] || platformColors.other;
  };
  
  const getDiscountDisplay = () => {
    if (offer.discountPct) {
      return `${offer.discountPct}% OFF`;
    }
    if (offer.effectivePriceText) {
      return offer.effectivePriceText;
    }
    return null;
  };
  
  const timeAgo = (fetchedAt: string) => {
    try {
      const now = new Date();
      const fetched = new Date(fetchedAt);
      const diffMinutes = Math.floor((now.getTime() - fetched.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
      return `${Math.floor(diffMinutes / 1440)}d ago`;
    } catch {
      return '';
    }
  };
  
  const discountDisplay = getDiscountDisplay();
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Platform badge and discount */}
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="secondary" 
              className={`text-xs font-medium ${getPlatformColor(offer.platform)}`}
            >
              {formatPlatformName(offer.platform)}
            </Badge>
            {discountDisplay && (
              <Badge variant="outline" className="text-xs font-semibold text-green-700 bg-green-50">
                <Tag className="w-3 h-3 mr-1" />
                {discountDisplay}
              </Badge>
            )}
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {offer.title}
          </h3>
          
          {/* Description */}
          {offer.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {offer.description}
            </p>
          )}
          
          {/* Validity and min spend */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
            {offer.validityText && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{offer.validityText}</span>
              </div>
            )}
            {offer.minSpend && (
              <div className="flex items-center gap-1">
                <span>Min: ₹{offer.minSpend}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span>{timeAgo(offer.fetchedAt)}</span>
            </div>
          </div>
          
          {/* Terms toggle */}
          {offer.terms && offer.terms.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Info className="w-3 h-3" />
                {showTerms ? 'Hide' : 'Show'} terms
              </button>
              {showTerms && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  {offer.terms.map((term, index) => (
                    <div key={index} className="mb-1 last:mb-0">
                      • {term}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action button */}
        <div className="flex-shrink-0">
          <Button
            onClick={handleLinkClick}
            size="sm"
            className="whitespace-nowrap"
            disabled={!offer.deepLink}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View on {formatPlatformName(offer.platform)}
          </Button>
        </div>
      </div>
    </Card>
  );
}