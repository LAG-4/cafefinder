"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";

type Item = {
  id: string;
  name: string;
  area: string;
  type: string;
  image: string;
  scores: { overall: number; cost: number; wifi: number; liked: number; safety: number };
  raw: Record<string, string>;
};

export default function ClientGrid() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    fetch("/api/places").then((r) => r.json()).then((d) => setItems(d.items));
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((c) => (
        <Dialog key={c.id}>
          <DialogTrigger asChild>
            <a className="group block rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md transition relative">
              <div className="relative aspect-[4/3]">
                <Image
                  src={isValidHttpUrl(c.image) ? c.image : "https://picsum.photos/800/600"}
                  alt={c.name}
                  fill
                  sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-xl font-semibold">{c.name}</div>
                  <div className="text-sm opacity-90">{c.area}</div>
                </div>
                {/* Hover stats pill like screenshot */}
                <div className="absolute top-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition">
                  <div className="backdrop-blur-md bg-black/40 rounded-xl p-3 text-white">
                    {[
                      { label: "Overall", value: c.scores.overall },
                      { label: "Cost", value: c.scores.cost * 20 },
                      { label: "Internet", value: c.scores.wifi * 20 },
                      { label: "Liked", value: c.scores.liked * 20 },
                      { label: "Safety", value: c.scores.safety * 20 },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center gap-3 py-1">
                        <div className="w-24 text-sm">{r.label}</div>
                        <div className="flex-1 h-3 rounded-full bg-white/30">
                          <div className="h-3 rounded-full bg-emerald-400" style={{ width: `${Math.min(r.value, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-zinc-700 dark:text-zinc-300">{c.type}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Hyderabad · {c.area}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">Wi‑Fi score: {c.scores.wifi}/5</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Safety: {c.scores.safety}/5</div>
                </div>
              </div>
            </a>
          </DialogTrigger>
          <DialogContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="relative h-60 md:h-full min-h-[240px]">
                <Image src={isValidHttpUrl(c.image) ? c.image : "https://picsum.photos/800/600"} alt={c.name} fill className="object-cover rounded-l-xl md:rounded-r-none" />
              </div>
              <div className="p-5">
                <h3 className="text-2xl font-semibold mb-1">{c.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{c.type} · {c.area}</p>

                <Tabs defaultValue="summary">
                  <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="scores">Scores</TabsTrigger>
                    <TabsTrigger value="vibe">Vibe</TabsTrigger>
                    <TabsTrigger value="practical">Practical</TabsTrigger>
                    <TabsTrigger value="inclusion">Inclusion</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary">
                    <div className="space-y-3">
                      <KeyVal label="Rank" value={c.raw["Rank"]} />
                      <KeyVal label="Location" value={c.raw["Location"]} />
                      <KeyVal label="Type" value={c.raw["Type"]} />
                      <KeyVal label="Aesthetic Score" value={String(c.raw["Aesthetic_Score"] ?? "—")} />
                      <KeyVal label="Crowd Vibe" value={c.raw["Crowd Vibe (Chill, Lively, Too Rowdy, etc.)"]} />
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
      <div className="w-52 text-xs text-zinc-600 dark:text-zinc-400">{label}</div>
      <div className="flex-1 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function KeyVal({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-56 text-zinc-600 dark:text-zinc-400">{label}</div>
      <div className="flex-1 font-medium text-zinc-900 dark:text-zinc-100">{value || "—"}</div>
    </div>
  );
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
