'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Offer {
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
  isActive: boolean;
  offerType?: string;
  expiresAt?: string;
  lastCheckedAt: string;
}

interface PlaceOffers {
  placeSlug: string;
  offers: Offer[];
  lastFetchedAt: string;
  activeOffers: number;
  totalOffers: number;
}

interface OffersData {
  success: boolean;
  totalPlaces: number;
  totalOffers: number;
  activeOffers: number;
  places: PlaceOffers[];
  lastUpdated: string;
}

export default function AdminOffersPage() {
  const [data, setData] = useState<OffersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [expandedPlace, setExpandedPlace] = useState<string | null>(null);
  const [scrapingInProgress, setScrapingInProgress] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState<string>('');

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/offers');
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch offers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const triggerFullScraping = async () => {
    try {
      setScrapingInProgress(true);
      setScrapingStatus('Starting full scraping of all places...');
      
      const response = await fetch('/api/scraping/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'all' })
      });
      
      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      setScrapingStatus(`Scraping completed! ${result.success} successful, ${result.failed} failed, ${result.total} total places.`);
      
      // Refresh the offers data
      setTimeout(() => {
        fetchOffers();
      }, 2000);
      
    } catch (err) {
      setScrapingStatus(`Error: ${err instanceof Error ? err.message : 'Scraping failed'}`);
    } finally {
      setScrapingInProgress(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const filteredPlaces = data?.places.filter(place => {
    const matchesSearch = place.placeSlug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === null || 
      (filterActive ? place.activeOffers > 0 : place.activeOffers === 0);
    
    return matchesSearch && matchesFilter;
  }) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getOfferTypeColor = (type?: string) => {
    switch (type) {
      case 'bank': return 'bg-blue-100 text-blue-800';
      case 'prebook': return 'bg-green-100 text-green-800';
      case 'exclusive': return 'bg-purple-100 text-purple-800';
      case 'dining': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading offers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-red-600">Error: {error}</div>
            <Button onClick={fetchOffers} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">All Offers Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor scraped offers from all restaurants
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={triggerFullScraping} 
            variant="default"
            disabled={scrapingInProgress}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {scrapingInProgress ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            {scrapingInProgress ? 'Scraping...' : 'Scrape All Places'}
          </Button>
          <Button onClick={fetchOffers} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Scraping Status */}
      {scrapingStatus && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className={`flex items-center gap-2 ${scrapingInProgress ? 'text-blue-600' : 'text-green-600'}`}>
              {scrapingInProgress ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              <span className="font-medium">{scrapingStatus}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MapPin className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Places</p>
                  <p className="text-2xl font-bold">{data.totalPlaces}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Offers</p>
                  <p className="text-2xl font-bold">{data.totalOffers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Offers</p>
                  <p className="text-2xl font-bold text-green-600">{data.activeOffers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingDown className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive Offers</p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.totalOffers - data.activeOffers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterActive === null ? "default" : "outline"}
                onClick={() => setFilterActive(null)}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterActive === true ? "default" : "outline"}
                onClick={() => setFilterActive(true)}
                size="sm"
              >
                Has Offers
              </Button>
              <Button
                variant={filterActive === false ? "default" : "outline"}
                onClick={() => setFilterActive(false)}
                size="sm"
              >
                No Offers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Places List */}
      <div className="space-y-4">
        {filteredPlaces.map((place) => (
          <Card key={place.placeSlug} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedPlace(
                expandedPlace === place.placeSlug ? null : place.placeSlug
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg capitalize">
                    {place.placeSlug.replace(/-/g, ' ')}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Last fetched: {getTimeAgo(place.lastFetchedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(place.lastFetchedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant={place.activeOffers > 0 ? "default" : "secondary"}>
                      {place.activeOffers} active
                    </Badge>
                    <div className="text-sm text-gray-600 mt-1">
                      {place.totalOffers} total
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            {expandedPlace === place.placeSlug && (
              <CardContent className="border-t bg-gray-50">
                <div className="space-y-3">
                  {place.offers.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No offers found</p>
                  ) : (
                    place.offers.map((offer) => (
                      <div 
                        key={offer.id}
                        className={`p-4 rounded-lg border ${
                          offer.isActive ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-300 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{offer.title}</h4>
                              {offer.offerType && (
                                <Badge className={getOfferTypeColor(offer.offerType)}>
                                  {offer.offerType}
                                </Badge>
                              )}
                              <Badge variant={offer.isActive ? "default" : "secondary"}>
                                {offer.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {offer.discountPct && (
                                <Badge variant="outline">{offer.discountPct}% off</Badge>
                              )}
                            </div>
                            
                            {offer.description && (
                              <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Fetched: {formatDate(offer.fetchedAt)}</span>
                              <span>Checked: {formatDate(offer.lastCheckedAt)}</span>
                              {offer.validityText && (
                                <span>Valid: {offer.validityText}</span>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(offer.deepLink, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredPlaces.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No places found matching your criteria.</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="mt-8 text-sm text-gray-500 text-center">
          Last updated: {formatDate(data.lastUpdated)}
        </div>
      )}
    </div>
  );
}