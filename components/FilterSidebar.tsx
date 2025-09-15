"use client";
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

interface FilterSidebarProps {
  activeFilters: Record<string, boolean>;
  onFilterChange: (filters: Record<string, boolean>) => void;
}

export default function FilterSidebar({ activeFilters, onFilterChange }: FilterSidebarProps) {
  return (
    <aside className="w-full md:w-72 shrink-0 md:sticky md:top-16 h-max md:self-start">
      <Card className="md:rounded-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium" style={{ color: 'var(--foreground)' }}>Filters</div>
            <Button 
              variant="ghost" 
              className="h-8 px-2" 
              style={{ color: 'var(--primary)' }}
              onClick={() => onFilterChange({})}
            >
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {toggles.map((t) => {
              const on = !!activeFilters[t.key];
              return (
                <Button
                  key={t.key}
                  variant="outline"
                  className={`justify-start gap-2 h-9 text-sm transition-colors ${
                    on 
                      ? "text-white" 
                      : ""
                  }`}
                  style={{
                    backgroundColor: on ? 'var(--primary)' : 'var(--card)',
                    borderColor: on ? 'var(--primary)' : 'var(--border)',
                    color: on ? 'var(--primary-foreground)' : 'var(--foreground)'
                  }}
                  onClick={() => onFilterChange({ ...activeFilters, [t.key]: !activeFilters[t.key] })}
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
