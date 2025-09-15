'use client';

import { useEffect, useState, useCallback } from 'react';
import OfferCard from './OfferCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertCircle, Gift } from 'lucide-react';

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

type OffersResponse = {
  placeSlug: string;
  lastRefreshedAt: string;
  offers: Offer[];
  providerErrors?: { platform: string; reason: string }[];
  error?: string;
};

interface OffersTabProps {
  slug: string;
  onOfferClick?: (offer: Offer) => void;
  onOffersLoaded?: (count: number) => void;
}

const platformNames: Record<string, string> = {
  zomato: 'Zomato',
  swiggy: 'Swiggy',
  dineout: 'Dineout',
  eazydiner: 'EazyDiner',
  magicpin: 'MagicPin',
  other: 'Other',
};

export function OffersTab({ slug, onOfferClick, onOffersLoaded }: OffersTabProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [providerErrors, setProviderErrors] = useState<{ platform: string; reason: string }[]>([]);
  
  const fetchOffers = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const url = `/api/offers/${slug}${forceRefresh ? '?refresh=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: OffersResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setOffers(data.offers || []);
      setLastUpdated(data.lastRefreshedAt);
      setProviderErrors(data.providerErrors || []);
      
      // Notify parent about offers count
      onOffersLoaded?.(data.offers?.length || 0);
      
    } catch (err) {
      console.error('Failed to fetch offers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load offers');
      setOffers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug, onOffersLoaded]);
  
  useEffect(() => {
    let mounted = true;
    
    fetchOffers().finally(() => {
      if (mounted) {
        // Component is still mounted after fetch
      }
    });
    
    return () => {
      mounted = false;
    };
  }, [fetchOffers]);
  
  const formatLastUpdated = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just updated';
      if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `Updated ${Math.floor(diffMinutes / 60)}h ago`;
      return `Updated ${Math.floor(diffMinutes / 1440)}d ago`;
    } catch {
      return 'Recently updated';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading offers...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <AlertCircle className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--destructive)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>Unable to load offers</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>{error}</p>
          <Button 
            onClick={() => fetchOffers()}
            size="sm"
            variant="outline"
            style={{ 
              borderColor: 'var(--border)', 
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)' 
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    );
  }
  
  if (offers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <Gift className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>No offers available</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            There are currently no offers for this place. Check back later for new deals!
          </p>
          {lastUpdated && (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatLastUpdated(lastUpdated)}</p>
          )}
        </div>
      </div>
    );
  }
  
  // Group offers by platform
  const offersByPlatform = offers.reduce((acc, offer) => {
    if (!acc[offer.platform]) {
      acc[offer.platform] = [];
    }
    acc[offer.platform].push(offer);
    return acc;
  }, {} as Record<string, Offer[]>);
  
  const platforms = Object.keys(offersByPlatform).sort();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              {offers.length} Offer{offers.length === 1 ? '' : 's'} Available
            </h3>
            {platforms.length > 1 && (
              <Badge 
                className="text-xs font-medium px-1.5 py-0.5" 
                style={{ 
                  backgroundColor: 'var(--muted)', 
                  color: 'var(--muted-foreground)',
                  border: '1px solid var(--border)',
                  fontSize: '10px'
                }}
              >
                {platforms.length} platform{platforms.length === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
          {lastUpdated && (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>
        <Button
          onClick={() => fetchOffers(true)}
          size="sm"
          variant="outline"
          disabled={refreshing}
          className="h-7"
          style={{ 
            borderColor: 'var(--border)', 
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            fontSize: '11px'
          }}
        >
          {refreshing ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1.5" />
          )}
          Refresh
        </Button>
      </div>
      
      {/* Provider errors */}
      {providerErrors.length > 0 && (
        <div 
          className="rounded-lg p-3 border"
          style={{ 
            backgroundColor: 'var(--muted)', 
            borderColor: 'var(--border)' 
          }}
        >
          <div className="flex">
            <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" style={{ color: 'var(--destructive)' }} />
            <div>
              <h4 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Some platforms couldn&apos;t be checked
              </h4>
              <div className="mt-1 text-xs space-y-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {providerErrors.map((error, index) => (
                  <div key={index}>
                    {error.platform}: {error.reason}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Offers grouped by platform */}
      <div className="space-y-4">
        {platforms.map((platform) => {
          const platformOffers = offersByPlatform[platform];
          const platformName = platformNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
          
          return (
            <div key={platform} className="space-y-2.5">
              {/* Platform header */}
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {platformName}
                </h4>
                <Badge 
                  className="text-xs font-medium px-1.5 py-0.5"
                  style={{ 
                    backgroundColor: 'var(--primary)', 
                    color: 'var(--primary-foreground)',
                    fontSize: '10px'
                  }}
                >
                  {platformOffers.length}
                </Badge>
              </div>
              
              {/* Platform offers grid - more compact */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {platformOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onLinkClick={onOfferClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer */}
      <div className="text-center py-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Updated every 30 minutes • Terms apply
        </p>
      </div>
    </div>
  );
}