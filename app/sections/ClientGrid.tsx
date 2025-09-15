"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { VisuallyHidden } from "../../components/ui/visually-hidden";
import { useUi } from "../../components/ui-store";
import { BestDiscountBadge, DiscountList } from "../../components/DiscountComponents";
import { RestaurantDiscounts, Discount } from "../../lib/types";
import { getBestDiscount } from "../../lib/discountService";

type Item = {
  id: string;
  name: string;
  area: string;
  type: string;
  image: string;
  scores: { overall: number; cost: number; wifi: number; liked: number; safety: number };
  raw: Record<string, string>;
};

interface ClientGridProps {
  activeFilters: Record<string, boolean>;
  searchQuery?: string;
  sortOption?: string;
}

function searchItems(items: Item[], query: string): Item[] {
  if (!query.trim()) return items;
  
  const lowercaseQuery = query.toLowerCase();
  return items.filter(item => 
    item.name.toLowerCase().includes(lowercaseQuery) ||
    item.area.toLowerCase().includes(lowercaseQuery) ||
    item.type.toLowerCase().includes(lowercaseQuery) ||
    (item.raw.Location && item.raw.Location.toLowerCase().includes(lowercaseQuery))
  );
}

function sortItems(items: Item[], sortOption: string): Item[] {
  const sorted = [...items];
  
  switch (sortOption) {
    case "top":
      return sorted.sort((a, b) => b.scores.overall - a.scores.overall);
    case "cost":
      return sorted.sort((a, b) => b.scores.cost - a.scores.cost); // Higher cost score = better value
    case "wifi":
      return sorted.sort((a, b) => b.scores.wifi - a.scores.wifi);
    case "reviews":
      // Sort by aesthetic score as a proxy for reviews
      return sorted.sort((a, b) => {
        const aAesthetic = parseFloat(a.raw.Aesthetic_Score || "0");
        const bAesthetic = parseFloat(b.raw.Aesthetic_Score || "0");
        return bAesthetic - aAesthetic;
      });
    default:
      return sorted;
  }
}

function filterItems(items: Item[], filters: Record<string, boolean>): Item[] {
  if (Object.keys(filters).length === 0 || !Object.values(filters).some(Boolean)) {
    return items;
  }

  return items.filter(item => {
    // Budget filter - items with cost score >= 4 (good value)
    if (filters.cheap && item.scores.cost < 4) return false;
    
    // Fast Wi-Fi filter - check Wi-Fi field for "good" or "very good"
    if (filters['fast-wifi']) {
      const wifi = item.raw["Wi-Fi Speed and Reliability"]?.toLowerCase() || "";
      if (!wifi.includes("good") && !wifi.includes("very good")) return false;
    }
    
    // Quiet filter - check noise level for "okay" or better
    if (filters.quiet) {
      const noise = item.raw["Noise Level"]?.toLowerCase() || "";
      if (noise.includes("bad") || noise.includes("rowdy")) return false;
    }
    
    // Outdoor filter - check if has outdoor seating mentioned
    if (filters.outdoor) {
      const ambiance = item.raw["Ambiance and Interior Comfort"]?.toLowerCase() || "";
      const images = item.raw["Images"]?.toLowerCase() || "";
      if (!ambiance.includes("outdoor") && !images.includes("outdoor")) return false;
    }
    
    // Pet friendly filter - check safety and inclusion fields
    if (filters.pet) {
      const safety = item.raw["Safety (General Safety and Safe for Women/LGBTQ+)"]?.toLowerCase() || "";
      if (!safety.includes("good") && !safety.includes("very good")) return false;
    }
    
    // Open late filter - can't determine from current data, so always pass
    if (filters.late) {
      // Would need operating hours data
    }
    
    // Parking filter - check walkability/accessibility
    if (filters.parking) {
      const walkability = item.raw["Walkability/Accessibility"]?.toLowerCase() || "";
      if (!walkability.includes("good") && !walkability.includes("very good")) return false;
    }
    
    // Good veg filter - check food quality
    if (filters.veg) {
      const food = item.raw["Food Quality and Taste"]?.toLowerCase() || "";
      if (!food.includes("good") && !food.includes("very good")) return false;
    }
    
    // Great coffee filter - check drink quality and type
    if (filters.coffee) {
      const drinks = item.raw["Drink Quality and Selection"]?.toLowerCase() || "";
      const type = item.type.toLowerCase();
      if (!type.includes("cafe") && (!drinks.includes("good") && !drinks.includes("very good"))) return false;
    }
    
    return true;
  });
}

export default function ClientGrid({ activeFilters, searchQuery = "", sortOption = "top" }: ClientGridProps) {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [discountData, setDiscountData] = useState<RestaurantDiscounts[]>([]);
  const { view } = useUi();
  
  useEffect(() => {
    // Fetch places and discounts data
    Promise.all([
      fetch("/api/places").then((r) => r.json()),
      fetch("/api/discounts").then((r) => r.json())
    ]).then(([placesData, discountsData]) => {
      setAllItems(placesData.items);
      setFilteredItems(placesData.items);
      setDiscountData(discountsData.discounts);
    });
  }, []);

  const getRestaurantDiscounts = (restaurantId: string): Discount[] => {
    const restaurant = discountData.find(d => d.restaurantId === restaurantId);
    return restaurant?.discounts || [];
  };

  useEffect(() => {
    let items = filterItems(allItems, activeFilters);
    items = searchItems(items, searchQuery);
    items = sortItems(items, sortOption);
    setFilteredItems(items);
  }, [allItems, activeFilters, searchQuery, sortOption]);

  return (
    <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5" : "space-y-3 sm:space-y-4"}>
      {filteredItems.map((c) => {
        const restaurantDiscounts = getRestaurantDiscounts(c.id);
        const bestDiscount = getBestDiscount(restaurantDiscounts);
        
        return (
        <Dialog key={c.id}>
          <DialogTrigger asChild>
            <a 
              className={`group block rounded-xl overflow-hidden border transition relative ${view === "list" ? "flex flex-row items-stretch" : ""}`}
              style={{ 
                borderColor: 'var(--border)', 
                backgroundColor: 'var(--card)',
                boxShadow: 'var(--shadow, none)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className={`relative ${view === "list" ? "w-24 sm:w-48 aspect-square sm:aspect-[3/2] flex-shrink-0" : "aspect-[4/3]"}`}>
                <Image
                  src={isValidHttpUrl(c.image) ? c.image : "https://picsum.photos/800/600"}
                  alt={c.name}
                  fill
                  sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                  className="object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const img = e.target as HTMLImageElement;
                    if (img.src !== "https://picsum.photos/800/600") {
                      img.src = "https://picsum.photos/800/600";
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                
                {/* Best discount badge */}
                <BestDiscountBadge discount={bestDiscount} />
                
                {view !== "list" && (
                  <>
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 text-white">
                      <div className="text-lg sm:text-xl font-semibold">{c.name}</div>
                      <div className="text-xs sm:text-sm opacity-90">{c.area}</div>
                    </div>
                  </>
                )}
                {/* Rank badge */}
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                  <div 
                    className="text-white text-xs font-bold px-2 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    #{c.raw.Rank || "?"}
                  </div>
                </div>
                {/* Hover stats pill like screenshot */}
                <div className={`absolute opacity-0 group-hover:opacity-100 transition hidden sm:block ${view === "list" ? "top-2 left-2 right-2" : "top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3"}`}>
                  <div className="backdrop-blur-md bg-black/40 rounded-xl p-2 sm:p-3 text-white">
                    {[
                      { label: "Overall", value: c.scores.overall },
                      { label: "Cost", value: c.scores.cost * 20 },
                      { label: "Internet", value: c.scores.wifi * 20 },
                      { label: "Liked", value: c.scores.liked * 20 },
                      { label: "Safety", value: c.scores.safety * 20 },
                    ].map((r) => {
                      const getColor = (percentage: number) => {
                        if (percentage <= 20) return "#ef4444"; // red-500
                        if (percentage <= 40) return "#f97316"; // orange-500
                        if (percentage <= 60) return "#eab308"; // yellow-500
                        if (percentage <= 80) return "#84cc16"; // lime-500
                        return "#22c55e"; // green-500
                      };
                      
                      return (
                        <div key={r.label} className="flex items-center gap-2 sm:gap-3 py-0.5 sm:py-1">
                          <div className="w-16 sm:w-24 text-xs sm:text-sm">{r.label}</div>
                          <div className="flex-1 h-2 sm:h-3 rounded-full bg-white/30">
                            <div 
                              className="h-2 sm:h-3 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${Math.min(r.value, 100)}%`,
                                backgroundColor: getColor(Math.min(r.value, 100))
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className={`p-3 sm:p-4 flex ${view === "list" ? "flex-col justify-center" : "items-center justify-between"} flex-1 ${view === "list" ? "min-h-[80px] space-y-1" : ""}`}>
                <div className={`${view === "list" ? "space-y-1" : "space-y-1 flex-1"}`}>
                  {view === "list" && (
                    <div className="font-semibold text-base leading-tight" style={{ color: 'var(--foreground)' }}>{c.name}</div>
                  )}
                  <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{c.type}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Hyderabad · {c.area}</div>
                  {view === "list" && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-sm font-medium">Overall: {c.scores.overall.toFixed(2)}/100</div>
                      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Cost: {c.scores.cost.toFixed(2)}/5</div>
                      {restaurantDiscounts.length > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          {restaurantDiscounts.length} offer{restaurantDiscounts.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {view !== "list" && (
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="text-sm font-medium">Overall: {c.scores.overall.toFixed(2)}/100</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Cost: {c.scores.cost.toFixed(2)}/5</div>
                    {restaurantDiscounts.length > 0 && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        {restaurantDiscounts.length} offer{restaurantDiscounts.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </a>
          </DialogTrigger>
          <DialogContent className="max-h-[95vh] overflow-y-auto p-0 mx-2 my-2 sm:mx-6 sm:my-6 max-w-4xl w-[calc(100vw-16px)] sm:w-full">
            <VisuallyHidden>
              <DialogTitle>{c.name} - Cafe Details</DialogTitle>
            </VisuallyHidden>
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0 min-h-[500px] sm:min-h-[600px]">
              <div className="relative h-48 sm:h-64 lg:h-full min-h-[200px] sm:min-h-[300px]">
                <Image 
                  src={isValidHttpUrl(c.image) ? c.image : "https://picsum.photos/800/600"} 
                  alt={c.name} 
                  fill 
                  className="object-cover lg:rounded-l-xl"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const img = e.target as HTMLImageElement;
                    if (img.src !== "https://picsum.photos/800/600") {
                      img.src = "https://picsum.photos/800/600";
                    }
                  }}
                />
              </div>
              <div className="p-4 sm:p-6 flex flex-col min-h-[400px]">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2">{c.name}</h3>
                  <p className="mb-3 text-sm sm:text-base" style={{ color: 'var(--muted-foreground)' }}>{c.type} · {c.area}</p>
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: 'var(--accent)', 
                      color: 'var(--primary)' 
                    }}
                  >
                    🏆 Rank #{c.raw.Rank || "?"}
                  </div>
                  {restaurantDiscounts.length > 0 && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        🎉 {restaurantDiscounts.length} Active Offer{restaurantDiscounts.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                <Tabs defaultValue="overview" className="flex-1">
                  <div className="w-full overflow-x-auto mb-4">
                    <TabsList className="flex w-max min-w-full lg:w-full lg:grid lg:grid-cols-6 h-auto p-1 gap-1 bg-zinc-100 dark:bg-zinc-800">
                      <TabsTrigger value="overview" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-100">Overview</TabsTrigger>
                      <TabsTrigger value="offers" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-100">
                        Offers{restaurantDiscounts.length > 0 && ` (${restaurantDiscounts.length})`}
                      </TabsTrigger>
                      <TabsTrigger value="scores" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-100">Scores</TabsTrigger>
                      <TabsTrigger value="vibe" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-100">Vibe</TabsTrigger>
                      <TabsTrigger value="practical" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-100">Practical</TabsTrigger>
                      <TabsTrigger value="inclusion" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-100">Inclusion</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="overview" className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div 
                        className="p-4 sm:p-4 rounded-lg"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        <div 
                          className="text-2xl sm:text-2xl font-bold"
                          style={{ color: 'var(--primary)' }}
                        >
                          {c.scores.overall.toFixed(2)}/100
                        </div>
                        <div className="text-sm sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>Overall Score</div>
                      </div>
                      <div 
                        className="p-4 sm:p-4 rounded-lg"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        <div className="text-2xl sm:text-2xl font-bold text-emerald-600">{parseFloat(c.raw["Aesthetic_Score"] || "0").toFixed(2)}</div>
                        <div className="text-sm sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>Aesthetic Score</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-3">
                      <KeyVal label="Location" value={c.raw["Location"]} />
                      <KeyVal label="Type" value={c.raw["Type"]} />
                      <KeyVal label="Crowd Vibe" value={c.raw["Crowd Vibe (Chill, Lively, Too Rowdy, etc.)"]} />
                      <KeyVal label="Wi-Fi" value={c.raw["Wi-Fi Speed and Reliability"]} />
                      <KeyVal label="Work Friendly" value={c.raw["Laptop/Work Friendliness (For Cafes)"]} />
                      <KeyVal label="Safety" value={c.raw["Safety (General Safety and Safe for Women/LGBTQ+)"]} />
                    </div>
                    
                    <div className="mt-4 sm:mt-6 p-4 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                      <div className="text-sm sm:text-sm font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>📍 Map View</div>
                      <div 
                        className="h-32 sm:h-32 rounded flex items-center justify-center text-sm sm:text-sm"
                        style={{ 
                          backgroundColor: 'var(--border)', 
                          color: 'var(--muted-foreground)' 
                        }}
                      >
                        Interactive map coming soon
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="offers" className="space-y-4">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold mb-2">Available Offers & Discounts</h4>
                      <p className="text-sm text-gray-600">
                        Save money on your next order from {c.name} with these current offers across different platforms.
                      </p>
                    </div>
                    <DiscountList discounts={restaurantDiscounts} />
                  </TabsContent>

                  <TabsContent value="scores">
                    <div className="space-y-4">
                      {["Food Quality and Taste","Drink Quality and Selection","Ambiance and Interior Comfort","Music Quality and Volume","Service Speed","Staff Friendliness and Attentiveness","Cleanliness and Hygiene","Value for Money / Pricing"].map((k) => (
                        <Bar key={k} label={k} value={c.raw[k]} />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="vibe">
                    <div className="space-y-4">
                      <KeyVal label="Community Vibe" value={c.raw["Community Vibe (Welcoming, Regulars, Neutral Ground Feel)"]} />
                      <KeyVal label="Lighting" value={c.raw["Lighting (Brightness & Mood Suitability)"]} />
                      <KeyVal label="Noise Level" value={c.raw["Noise Level"]} />
                      <KeyVal label="Temperature Comfort" value={c.raw["Temperature Comfort (A/C effectiveness)"]} />
                      <KeyVal label="Line of Sight/Personal Space" value={c.raw["Line of Sight/Personal Space at Tables"]} />
                    </div>
                  </TabsContent>

                  <TabsContent value="practical">
                    <div className="space-y-4">
                      <KeyVal label="Wi‑Fi" value={c.raw["Wi-Fi Speed and Reliability"]} />
                      <KeyVal label="Laptop/Work Friendly" value={c.raw["Laptop/Work Friendliness (For Cafes)"]} />
                      <KeyVal label="Power Outlets" value={c.raw["Availability of Power Outlets"]} />
                      <KeyVal label="Menu Clarity" value={c.raw["Menu Clarity and Usability"]} />
                      <KeyVal label="Wait Times" value={c.raw["Wait Times / Queue Management"]} />
                      <KeyVal label="Reservations" value={c.raw["Ease of Reservations/Bookings"]} />
                      <KeyVal label="Payment Convenience" value={c.raw["Payment Convenience (Multiple Digital Options/No Cash-Only Hassle)"]} />
                      <KeyVal label="Walkability/Accessibility" value={c.raw["Walkability/Accessibility"]} />
                    </div>
                  </TabsContent>

                  <TabsContent value="inclusion">
                    <div className="space-y-4">
                      <KeyVal label="Safety (general + women/LGBTQ+)" value={c.raw["Safety (General Safety and Safe for Women/LGBTQ+)"]} />
                      <KeyVal label="Inclusion/Friendliness to Foreigners" value={c.raw["Inclusion/Friendliness to Foreigners"]} />
                      <KeyVal label="Racism-Free Environment" value={c.raw["Racism-Free Environment"]} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        );
      })}
    </div>
  );
}

function Bar({ label, value }: { label: string; value: string }) {
  const map: Record<string, number> = { "very bad": 10, bad: 25, okay: 50, good: 75, "very good": 90, great: 100 };
  const v = map[String(value || "").toLowerCase()] ?? 0;
  
  // Color coding based on the value
  const getColor = (percentage: number) => {
    if (percentage <= 20) return "#ef4444"; // red-500
    if (percentage <= 40) return "#f97316"; // orange-500
    if (percentage <= 60) return "#eab308"; // yellow-500
    if (percentage <= 80) return "#84cc16"; // lime-500
    return "#22c55e"; // green-500
  };
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="w-full sm:w-52 text-sm sm:text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
        <Emoji label={label} />
        {label}
      </div>
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1 min-w-0 h-5 sm:h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <div 
            className="h-full transition-all duration-300" 
            style={{ 
              width: `${v}%`,
              backgroundColor: getColor(v)
            }} 
          />
        </div>
        <div className="text-xs font-medium w-16 sm:w-auto flex-shrink-0" style={{ color: 'var(--foreground)' }}>{value}</div>
      </div>
    </div>
  );
}

function KeyVal({ label, value }: { label: string; value?: string }) {
  // Check if this is a rating value that should show a progress bar
  const ratingTerms = ["very bad", "bad", "okay", "good", "very good", "great"];
  const isRating = value && ratingTerms.some(term => value.toLowerCase().includes(term));
  
  if (isRating) {
    const map: Record<string, number> = { "very bad": 10, bad: 25, okay: 50, good: 75, "very good": 90, great: 100 };
    const v = map[String(value || "").toLowerCase()] ?? 0;
    
    const getColor = (percentage: number) => {
      if (percentage <= 20) return "#ef4444"; // red-500
      if (percentage <= 40) return "#f97316"; // orange-500
      if (percentage <= 60) return "#eab308"; // yellow-500
      if (percentage <= 80) return "#84cc16"; // lime-500
      return "#22c55e"; // green-500
    };
    
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
        <div className="w-full sm:w-56 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
          <Emoji label={label} />
          {label}
        </div>
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1 min-w-0 h-5 sm:h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
            <div 
              className="h-full transition-all duration-300" 
              style={{ 
                width: `${v}%`,
                backgroundColor: getColor(v)
              }} 
            />
          </div>
          <div className="w-20 text-xs font-medium flex-shrink-0" style={{ color: 'var(--foreground)' }}>{value}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
      <div className="w-full sm:w-56 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
        <Emoji label={label} />
        {label}
      </div>
      <div className="flex-1 font-medium" style={{ color: 'var(--foreground)' }}>{value || "—"}</div>
    </div>
  );
}

function Emoji({ label }: { label: string }) {
  const l = label.toLowerCase();
  const map: [string, string][] = [
    ["wi-fi", "📶"],
    ["wifi", "📶"],
    ["rank", "🏆"],
    ["location", "📍"],
    ["type", "🏪"],
    ["aesthetic", "🎨"],
    ["crowd", "👥"],
    ["food", "🍽️"],
    ["drink", "🥤"],
    ["ambiance", "🛋️"],
    ["music", "🎵"],
    ["service", "⚡"],
    ["staff", "🙂"],
    ["clean", "🧼"],
    ["value", "💸"],
    ["community", "🤝"],
    ["lighting", "💡"],
    ["noise", "🔇"],
    ["temperature", "🌡️"],
    ["space", "📐"],
    ["laptop", "💻"],
    ["work", "💻"],
    ["outlets", "🔌"],
    ["power", "🔌"],
    ["menu", "📜"],
    ["wait", "⏳"],
    ["reserv", "🗓️"],
    ["payment", "💳"],
    ["walk", "🚶"],
    ["safety", "🛡️"],
    ["inclusion", "🌍"],
    ["racism", "🚫"],
  ];
  const found = map.find(([k]) => l.includes(k))?.[1] ?? "·";
  return <span aria-hidden className="mr-1">{found}</span>;
}

function isValidHttpUrl(s: string | undefined) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
