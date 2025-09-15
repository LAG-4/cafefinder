"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { VisuallyHidden } from "../../components/ui/visually-hidden";
import { useUi } from "../../components/ui-store";

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

export default function ClientGrid({ activeFilters }: ClientGridProps) {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const { view } = useUi();
  
  useEffect(() => {
    fetch("/api/places").then((r) => r.json()).then((d) => {
      setAllItems(d.items);
      setFilteredItems(d.items);
    });
  }, []);

  useEffect(() => {
    setFilteredItems(filterItems(allItems, activeFilters));
  }, [allItems, activeFilters]);

  return (
    <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5" : "space-y-3 sm:space-y-4"}>
      {filteredItems.map((c) => (
        <Dialog key={c.id}>
          <DialogTrigger asChild>
            <a 
              className={`group block rounded-xl overflow-hidden border transition relative ${view === "list" ? "flex flex-col sm:flex-row" : ""}`}
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
              <div className={`relative ${view === "list" ? "aspect-[4/3] sm:aspect-[3/2] sm:w-48 sm:flex-shrink-0" : "aspect-[4/3]"}`}>
                <Image
                  src={isValidHttpUrl(c.image) ? c.image : "https://picsum.photos/800/600"}
                  alt={c.name}
                  fill
                  sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 text-white">
                  <div className="text-lg sm:text-xl font-semibold">{c.name}</div>
                  <div className="text-xs sm:text-sm opacity-90">{c.area}</div>
                </div>
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
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition hidden sm:block">
                  <div className="backdrop-blur-md bg-black/40 rounded-xl p-2 sm:p-3 text-white">
                    {[
                      { label: "Overall", value: c.scores.overall },
                      { label: "Cost", value: c.scores.cost * 20 },
                      { label: "Internet", value: c.scores.wifi * 20 },
                      { label: "Liked", value: c.scores.liked * 20 },
                      { label: "Safety", value: c.scores.safety * 20 },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center gap-2 sm:gap-3 py-0.5 sm:py-1">
                        <div className="w-16 sm:w-24 text-xs sm:text-sm">{r.label}</div>
                        <div className="flex-1 h-2 sm:h-3 rounded-full bg-white/30">
                          <div className="h-2 sm:h-3 rounded-full bg-emerald-400" style={{ width: `${Math.min(r.value, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4 flex items-center justify-between flex-1">
                <div className="space-y-1">
                  <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{c.type}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Hyderabad · {c.area}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">Overall: {c.scores.overall.toFixed(2)}/100</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Cost: {c.scores.cost.toFixed(2)}/5</div>
                </div>
              </div>
            </a>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 m-2 sm:m-6">
            <VisuallyHidden>
              <DialogTitle>{c.name} - Cafe Details</DialogTitle>
            </VisuallyHidden>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[500px] sm:min-h-[600px]">
              <div className="relative h-48 sm:h-80 lg:h-full min-h-[200px] sm:min-h-[300px]">
                <Image src={isValidHttpUrl(c.image) ? c.image : "https://picsum.photos/800/600"} alt={c.name} fill className="object-cover lg:rounded-l-xl" />
              </div>
              <div className="p-4 sm:p-6 flex flex-col">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-2xl sm:text-3xl font-semibold mb-2">{c.name}</h3>
                  <p className="mb-2" style={{ color: 'var(--muted-foreground)' }}>{c.type} · {c.area}</p>
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: 'var(--accent)', 
                      color: 'var(--primary)' 
                    }}
                  >
                    🏆 Rank #{c.raw.Rank || "?"}
                  </div>
                </div>

                <Tabs defaultValue="overview" className="flex-1">
                  <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 mb-4 text-xs sm:text-sm">
                    <TabsTrigger value="overview" className="px-1 sm:px-3">Overview</TabsTrigger>
                    <TabsTrigger value="scores" className="px-1 sm:px-3">Scores</TabsTrigger>
                    <TabsTrigger value="vibe" className="px-1 sm:px-3">Vibe</TabsTrigger>
                    <TabsTrigger value="practical" className="hidden sm:block px-1 sm:px-3">Practical</TabsTrigger>
                    <TabsTrigger value="inclusion" className="hidden sm:block px-1 sm:px-3">Inclusion</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div 
                        className="p-3 sm:p-4 rounded-lg"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        <div 
                          className="text-xl sm:text-2xl font-bold"
                          style={{ color: 'var(--primary)' }}
                        >
                          {c.scores.overall.toFixed(2)}/100
                        </div>
                        <div className="text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>Overall Score</div>
                      </div>
                      <div 
                        className="p-3 sm:p-4 rounded-lg"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        <div className="text-xl sm:text-2xl font-bold text-emerald-600">{parseFloat(c.raw["Aesthetic_Score"] || "0").toFixed(2)}</div>
                        <div className="text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>Aesthetic Score</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <KeyVal label="Location" value={c.raw["Location"]} />
                      <KeyVal label="Type" value={c.raw["Type"]} />
                      <KeyVal label="Crowd Vibe" value={c.raw["Crowd Vibe (Chill, Lively, Too Rowdy, etc.)"]} />
                      <KeyVal label="Wi-Fi" value={c.raw["Wi-Fi Speed and Reliability"]} />
                      <KeyVal label="Work Friendly" value={c.raw["Laptop/Work Friendliness (For Cafes)"]} />
                      <KeyVal label="Safety" value={c.raw["Safety (General Safety and Safe for Women/LGBTQ+)"]} />
                    </div>
                    
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                      <div className="text-xs sm:text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>📍 Map View</div>
                      <div 
                        className="h-24 sm:h-32 rounded flex items-center justify-center text-xs sm:text-sm"
                        style={{ 
                          backgroundColor: 'var(--border)', 
                          color: 'var(--muted-foreground)' 
                        }}
                      >
                        Interactive map coming soon
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="scores">
                    <div className="space-y-2">
                      {["Food Quality and Taste","Drink Quality and Selection","Ambiance and Interior Comfort","Music Quality and Volume","Service Speed","Staff Friendliness and Attentiveness","Cleanliness and Hygiene","Value for Money / Pricing"].map((k) => (
                        <Bar key={k} label={k} value={c.raw[k]} />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="vibe">
                    <div className="space-y-3">
                      <KeyVal label="Community Vibe" value={c.raw["Community Vibe (Welcoming, Regulars, Neutral Ground Feel)"]} />
                      <KeyVal label="Lighting" value={c.raw["Lighting (Brightness & Mood Suitability)"]} />
                      <KeyVal label="Noise Level" value={c.raw["Noise Level"]} />
                      <KeyVal label="Temperature Comfort" value={c.raw["Temperature Comfort (A/C effectiveness)"]} />
                      <KeyVal label="Line of Sight/Personal Space" value={c.raw["Line of Sight/Personal Space at Tables"]} />
                    </div>
                  </TabsContent>

                  <TabsContent value="practical">
                    <div className="space-y-3">
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
                    <div className="space-y-3">
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
      ))}
    </div>
  );
}

function Bar({ label, value }: { label: string; value: string }) {
  const map: Record<string, number> = { "very bad": 10, bad: 25, okay: 50, good: 75, "very good": 90, great: 100 };
  const v = map[String(value || "").toLowerCase()] ?? 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-52 text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
        <Emoji label={label} />
        {label}
      </div>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
        <div className="h-full bg-emerald-500" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function KeyVal({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-56 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
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
