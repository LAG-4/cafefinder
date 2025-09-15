'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OffersTab } from './offers/OffersTab';
import { Badge } from '@/components/ui/badge';
import { Gift, Info } from 'lucide-react';

interface PlaceItem {
  id: string;
  slug: string;
  name: string;
  area: string;
  type: string;
  image: string;
  scores: {
    overall: number;
    cost: number;
    wifi: number;
    safety: number;
    liked: number;
  };
  rawScores: {
    aestheticScore: number;
    socialMediaFriendliness: string;
    funFactor?: string;
    crowdVibe: string;
    ambianceAndInteriorComfort: string;
    communityVibe: string;
    safety: string;
    inclusionForeigners: string;
    racismFreeEnvironment: string;
    lighting: string;
    musicQualityAndVolume: string;
    wifiSpeedAndReliability: string;
    laptopWorkFriendliness: string;
    valueForMoney: string;
    foodQualityAndTaste: string;
    drinkQualityAndSelection: string;
    cleanlinessAndHygiene: string;
    serviceSpeed: string;
    staffFriendliness: string;
    seatingComfort: string;
    noiseLevel: string;
    temperatureComfort: string;
    availabilityOfPowerOutlets: string;
    menuClarityAndUsability: string;
    waitTimes: string;
    easeOfReservations: string;
    crowdDensity: string;
    lineOfSight: string;
    foodSafety: string;
    proactiveService: string;
    airQuality: string;
    restroomCleanliness: string;
    paymentConvenience: string;
    walkabilityAccessibility: string;
  };
  rank: number;
}

interface PlaceDetailTabsProps {
  place: PlaceItem;
}

export default function PlaceDetailTabs({ place }: PlaceDetailTabsProps) {
  const [offersCount, setOffersCount] = useState<number | null>(null);
  
  const handleOffersLoaded = (count: number) => {
    setOffersCount(count);
  };
  
  const handleOfferClick = (offer: any) => {
    // Track offer clicks for analytics
    console.log('Offer clicked:', offer.platform, offer.title);
  };
  
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="offers" className="flex items-center gap-2">
          <Gift className="w-4 h-4" />
          Offers
          {offersCount !== null && offersCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {offersCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-6">
        <div className="space-y-6">
          {/* Scores Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {place.scores.cost}/5
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Value</div>
            </div>
            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {place.scores.wifi}/5
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">WiFi</div>
            </div>
            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {place.scores.safety}/5
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Safety</div>
            </div>
            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {place.scores.liked}/5
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Service</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://maps.google.com/maps?q=${encodeURIComponent(place.name + " " + place.area + " Hyderabad")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View on Maps
            </a>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(place.name + " " + place.area + " Hyderabad")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Search Online
            </a>
          </div>
          
          {/* Additional place information could go here */}
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">About</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {place.name} is a {place.type.toLowerCase()} located in {place.area}, Hyderabad. 
              With an overall rating of {place.scores.overall}%, it's a great choice for dining, 
              working, or hanging out with friends.
            </p>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="offers" className="mt-6">
        <OffersTab 
          slug={place.slug} 
          onOfferClick={handleOfferClick}
          onOffersLoaded={handleOffersLoaded}
        />
      </TabsContent>
    </Tabs>
  );
}