"use client";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Wifi, VolumeX, Dog, Clock8, ParkingSquare, Leaf, Coffee, Sun, IndianRupee } from "lucide-react";

type Toggle = {
  key: string;
  label: string;
};

const toggles: (Toggle & { icon: React.ReactNode })[] = [
  { key: "cheap", label: "Budget", icon: <IndianRupee className="h-4 w-4" /> },
  { key: "fast-wifi", label: "Fast Wi‑Fi", icon: <Wifi className="h-4 w-4" /> },
  { key: "quiet", label: "Quiet", icon: <VolumeX className="h-4 w-4" /> },
  { key: "outdoor", label: "Outdoor", icon: <Sun className="h-4 w-4" /> },
  { key: "pet", label: "Pet friendly", icon: <Dog className="h-4 w-4" /> },
  { key: "late", label: "Open late", icon: <Clock8 className="h-4 w-4" /> },
  { key: "parking", label: "Parking", icon: <ParkingSquare className="h-4 w-4" /> },
  { key: "veg", label: "Good veg", icon: <Leaf className="h-4 w-4" /> },
  { key: "coffee", label: "Great coffee", icon: <Coffee className="h-4 w-4" /> },
];

export default function FilterSidebar() {
  const [active, setActive] = useState<Record<string, boolean>>({});
  return (
    <aside className="w-full md:w-72 shrink-0 md:sticky md:top-16 h-max md:self-start">
      <Card className="md:rounded-xl bg-white dark:bg-zinc-900">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Filters</div>
            <Button variant="ghost" className="h-8 px-2 text-rose-600" onClick={() => setActive({})}>Clear</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {toggles.map((t) => {
              const on = !!active[t.key];
              return (
                <Button
                  key={t.key}
                  variant="outline"
                  className={`justify-start gap-2 h-9 text-sm transition-colors ${
                    on 
                      ? "bg-rose-600 hover:bg-rose-500 border-rose-600 text-white dark:bg-rose-600 dark:border-rose-600 dark:text-white" 
                      : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  }`}
                  onClick={() => setActive((prev) => ({ ...prev, [t.key]: !prev[t.key] }))}
                >
                  {t.icon}
                  {t.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
