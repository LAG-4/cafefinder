"use client";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useUi } from "./ui-store";
import { LayoutGrid, List as ListIcon, X, Plus } from "lucide-react";

interface TopBarProps {
  onSearchChange?: (query: string) => void;
  onSortChange?: (sort: string) => void;
}

export default function TopBar({ onSearchChange, onSortChange }: TopBarProps) {
  const [query, setQuery] = useState("");
  const { view, setView } = useUi();
  const [sort, setSort] = useState("top");

  const handleSearchChange = (value: string) => {
    setQuery(value);
    onSearchChange?.(value);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    onSortChange?.(value);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
      <div className="flex-1 min-w-48 order-1">
        <Input
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search cafes, areas, tags…"
        />
      </div>

      <Button variant="outline" className="sm:hidden order-2 w-full">
        <X className="h-4 w-4" /> Toggle Filters
      </Button>
      
      <Button variant="outline" className="hidden sm:flex order-3">
        <X className="h-4 w-4" /> Close filters
      </Button>

      <div 
        className="h-11 inline-flex rounded-lg border overflow-hidden order-4 w-full sm:w-auto"
        style={{ 
          borderColor: 'var(--border)', 
          backgroundColor: 'var(--card)' 
        }}
      >
        <Button
          variant={view === "grid" ? "default" : "ghost"}
          className={`h-11 rounded-none flex-1 sm:flex-none ${view === "grid" ? "" : ""}`}
          onClick={() => setView("grid")}
          style={view !== "grid" ? { color: 'var(--muted-foreground)' } : {}}
        >
          <LayoutGrid className="h-4 w-4" /> Grid
        </Button>
        <Button
          variant={view === "list" ? "default" : "ghost"}
          className={`h-11 rounded-none flex-1 sm:flex-none ${view === "list" ? "" : ""}`}
          onClick={() => setView("list")}
          style={view !== "list" ? { color: 'var(--muted-foreground)' } : {}}
        >
          <ListIcon className="h-4 w-4" /> List
        </Button>
      </div>

      <div className="relative order-5 w-full sm:w-auto">
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="h-11 pl-3 pr-8 rounded-lg border w-full sm:w-auto min-w-48"
          style={{ 
            borderColor: 'var(--border)', 
            backgroundColor: 'var(--card)',
            color: 'var(--foreground)'
          }}
        >
          <option value="top">Sort by: Top rated</option>
          <option value="cost">Cost (low)</option>
          <option value="wifi">Wi‑Fi (fast)</option>
          <option value="reviews">Reviews</option>
        </select>
      </div>

      <Button className="ml-auto"><Plus className="h-4 w-4" /> Add place</Button>
    </div>
  );
}
