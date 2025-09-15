'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
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

export default function OfferCard({ offer, onLinkClick }: OfferCardProps) {
  const [showTerms, setShowTerms] = useState(false);
  
  const handleLinkClick = () => {
    onLinkClick?.(offer);
    if (offer.deepLink) {
      window.open(offer.deepLink, '_blank', 'noopener,noreferrer');
    }
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
      
      if (diffMinutes < 1) return 'Now';
      if (diffMinutes < 60) return `${diffMinutes}m`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
      return `${Math.floor(diffMinutes / 1440)}d`;
    } catch {
      return '';
    }
  };
  
  const discountDisplay = getDiscountDisplay();
  
  return (
    <Card 
      className="group transition-all duration-200 hover:shadow-md border"
      style={{ 
        borderColor: 'var(--border)', 
        backgroundColor: 'var(--card)'
      }}
    >
      <CardContent className="p-2">
        {/* Compact header */}
        <div className="flex items-start justify-between mb-1.5">
          {discountDisplay && (
            <Badge 
              className="text-xs font-bold px-1.5 py-0.5 rounded border-0"
              style={{ 
                backgroundColor: 'var(--primary)', 
                color: 'var(--primary-foreground)',
                fontSize: '10px'
              }}
            >
              {discountDisplay}
            </Badge>
          )}
          <span 
            className="text-xs"
            style={{ color: 'var(--muted-foreground)', fontSize: '10px' }}
          >
            {timeAgo(offer.fetchedAt)}
          </span>
        </div>
        
        {/* Compact title */}
        <h3 
          className="font-medium mb-1 line-clamp-2 leading-tight"
          style={{ color: 'var(--foreground)', fontSize: '13px' }}
        >
          {offer.title}
        </h3>
        
        {/* Description */}
        {offer.description && (
          <p 
            className="mb-1.5 line-clamp-1 leading-tight"
            style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}
          >
            {offer.description}
          </p>
        )}
        
        {/* Compact metadata */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs">
            {offer.validityText && (
              <span 
                className="px-1.5 py-0.5 rounded truncate max-w-16"
                style={{ 
                  backgroundColor: 'var(--muted)', 
                  color: 'var(--muted-foreground)',
                  fontSize: '10px'
                }}
              >
                {offer.validityText}
              </span>
            )}
            {offer.minSpend && (
              <span 
                className="px-1.5 py-0.5 rounded"
                style={{ 
                  backgroundColor: 'var(--muted)', 
                  color: 'var(--muted-foreground)',
                  fontSize: '10px'
                }}
              >
                ₹{offer.minSpend}+
              </span>
            )}
          </div>
          
          <Button
            onClick={handleLinkClick}
            size="sm"
            className="h-5 px-1.5 transition-all duration-200"
            disabled={!offer.deepLink}
            style={{ 
              backgroundColor: 'var(--primary)', 
              color: 'var(--primary-foreground)',
              fontSize: '9px'
            }}
          >
            <ExternalLink className="w-2.5 h-2.5 mr-0.5" />
            View
          </Button>
        </div>
        
        {/* Compact terms toggle */}
        {offer.terms && offer.terms.length > 0 && (
          <div>
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: 'var(--primary)', fontSize: '10px' }}
            >
              {showTerms ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              Terms
            </button>
            {showTerms && (
              <div 
                className="mt-1.5 p-1.5 rounded border space-y-0.5"
                style={{ 
                  backgroundColor: 'var(--muted)', 
                  borderColor: 'var(--border)',
                  color: 'var(--muted-foreground)',
                  fontSize: '9px'
                }}
              >
                {offer.terms.map((term, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    <span style={{ color: 'var(--primary)' }} className="mt-0.5">•</span>
                    <span className="leading-relaxed">{term}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}