"use client";
import { useState } from "react";

type Toggle = {
  key: string;
  label: string;
};

const toggles: Toggle[] = [
  { key: "cheap", label: "<$" },
  { key: "fast-wifi", label: "Fast Wi‑Fi" },
  { key: "quiet", label: "Quiet" },
  { key: "outdoor", label: "Outdoor" },
  { key: "pet", label: "Pet friendly" },
  { key: "late", label: "Open late" },
  { key: "parking", label: "Parking" },
  { key: "veg", label: "Good veg" },
  { key: "coffee", label: "Great coffee" },
];

export default function FilterSidebar() {
  const [active, setActive] = useState<Record<string, boolean>>({});
  return (
    <aside className="w-full md:w-72 shrink-0 md:sticky md:top-16 h-max md:self-start">
      <div className="p-3 md:p-4 border md:rounded-xl border-zinc-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Filters</div>
          <button
            className="text-xs text-rose-600"
            onClick={() => setActive({})}
          >
            Clear
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          {toggles.map((t) => (
            <button
              key={t.key}
              onClick={() =>
                setActive((prev) => ({ ...prev, [t.key]: !prev[t.key] }))
              }
              className={`text-left text-sm px-3 py-2 rounded-md border transition ${
                active[t.key]
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
