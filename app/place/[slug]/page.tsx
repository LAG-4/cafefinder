import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import StructuredData from "../../../components/StructuredData";

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
  raw: Record<string, string>;
}

interface PlacePageProps {
  params: { slug: string };
}

async function getPlaceData(slug: string): Promise<PlaceItem | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://cafefinder-hyd.vercel.app'}/api/places`, {
      cache: 'force-cache'
    });
    const data = await response.json();
    const place = data.items?.find((item: PlaceItem) => item.slug === slug);
    return place || null;
  } catch (error) {
    console.error('Error fetching place data:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const place = await getPlaceData(params.slug);
  
  if (!place) {
    return {
      title: "Place Not Found | CafeHopper",
      description: "The requested place could not be found.",
    };
  }

  const title = `${place.name} - ${place.area} | CafeHopper`;
  const description = `Discover ${place.name} in ${place.area}, Hyderabad. ${place.type} with ${place.scores.overall}% overall rating. Perfect for food, work, and hangouts.`;

  return {
    title,
    description,
    keywords: [
      place.name,
      place.area,
      place.type,
      "Hyderabad",
      "cafe",
      "restaurant",
      "bar",
      "pub",
      "food",
      "dining"
    ],
    openGraph: {
      title,
      description,
      url: `https://cafefinder-hyd.vercel.app/place/${params.slug}`,
      siteName: "CafeHopper",
      images: [
        {
          url: place.image,
          width: 800,
          height: 600,
          alt: `${place.name} in ${place.area}, Hyderabad`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [place.image],
    },
    alternates: {
      canonical: `/place/${params.slug}`,
    },
  };
}

export default async function PlacePage({ params }: PlacePageProps) {
  const place = await getPlaceData(params.slug);

  if (!place) {
    notFound();
  }

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

            {/* Scores Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
          </div>
        </div>
      </div>
    </>
  );
}
