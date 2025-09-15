"use client";
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import StructuredData from "../../../components/StructuredData";
import PlaceDetailTabs from "../../../components/PlaceDetailTabs";

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

interface PlacePageProps {
  params: { slug: string };
}



export default function PlacePage({ params }: PlacePageProps) {
  const placeData = useQuery(api.places.getPlaceBySlug, { slug: params.slug });

  if (!placeData && placeData !== null) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!placeData) {
    notFound();
  }

  const place: PlaceItem = {
    id: placeData._id,
    slug: placeData.slug,
    name: placeData.name,
    area: placeData.area,
    type: placeData.type,
    image: placeData.image || "https://picsum.photos/800/600",
    scores: placeData.scores,
    rawScores: placeData.rawScores,
    rank: placeData.rank
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "LocalBusiness"],
    "name": place.name,
    "description": `${place.type} in ${place.area}, Hyderabad`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": place.area,
      "addressLocality": "Hyderabad",
      "addressRegion": "Telangana",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "17.3850",
      "longitude": "78.4867"
    },
    "image": place.image,
    "priceRange": place.scores.cost <= 2 ? "₹" : place.scores.cost <= 3 ? "₹₹" : place.scores.cost <= 4 ? "₹₹₹" : "₹₹₹₹",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": (place.scores.overall / 20).toFixed(1),
      "bestRating": "5",
      "worstRating": "1"
    },
    "servesCuisine": ["Indian", "Continental"],
    "hasMap": `https://maps.google.com/maps?q=${encodeURIComponent(place.name + " " + place.area + " Hyderabad")}`,
    "openingHours": "Mo-Su 09:00-23:00"
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
          {/* Hero Image */}
          <div className="aspect-[16/9] relative">
            <Image
              src={place.image}
              alt={`${place.name} in ${place.area}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  {place.name}
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  {place.type} • {place.area}
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {place.scores.overall}% Overall Rating
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
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

            {/* Tabbed Content */}
            <PlaceDetailTabs place={place} />
          </div>
        </div>
      </div>
    </>
  );
}
