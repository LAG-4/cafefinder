'use client';

import { useEffect, useState } from 'react';
import { OfferCard } from './OfferCard';
import { Button } from '@/components/ui/button';
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

export function OffersTab({ slug, onOfferClick, onOffersLoaded }: OffersTabProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [providerErrors, setProviderErrors] = useState<{ platform: string; reason: string }[]>([]);
  
  const fetchOffers = async (forceRefresh = false) => {
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
  };
  
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
  }, [slug]);
  
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
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-500">Loading offers...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load offers</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button 
            onClick={() => fetchOffers()}
            size="sm"
            variant="outline"
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
          <Gift className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No offers available</h3>
          <p className="text-sm text-gray-500 mb-4">
            There are currently no offers for this place. Check back later for new deals!
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400">{formatLastUpdated(lastUpdated)}</p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header with refresh info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Current Offers ({offers.length})
          </h3>
          {lastUpdated && (
            <p className="text-sm text-gray-500">{formatLastUpdated(lastUpdated)}</p>
          )}
        </div>
        <Button
          onClick={() => fetchOffers(true)}
          size="sm"
          variant="outline"
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>
      
      {/* Provider errors (if any) */}
      {providerErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Some platforms couldn't be checked
              </h4>
              <div className="mt-1 text-xs text-yellow-700">
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
      
      {/* Offers list */}
      <div className="space-y-3">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onLinkClick={onOfferClick}
          />
        ))}
      </div>
      
      {/* Footer note */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">
          Offers are updated every 30 minutes. Terms and conditions apply.
        </p>
      </div>
    </div>
  );
}