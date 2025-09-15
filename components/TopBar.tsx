"use client";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useUi } from "./ui-store";
import { LayoutGrid, List as ListIcon, X, Plus } from "lucide-react";

export default function TopBar() {
  const [query, setQuery] = useState("");
  const { view, setView } = useUi();
  const [sort, setSort] = useState("top");

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
      <div className="flex-1 min-w-48 order-1">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cafes, areas, tags…"
        />
      </div>

      <Button variant="outline" className="sm:hidden order-2 w-full">
        <X className="h-4 w-4" /> Toggle Filters
      </Button>
      
      <Button variant="outline" className="hidden sm:flex order-3">
        <X className="h-4 w-4" /> Close filters
      </Button>

      <div className="h-11 inline-flex rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900 order-4 w-full sm:w-auto">
        <Button
          variant={view === "grid" ? "default" : "ghost"}
          className={`h-11 rounded-none flex-1 sm:flex-none ${view === "grid" ? "" : "text-zinc-700 dark:text-zinc-300"}`}
          onClick={() => setView("grid")}
        >
          <LayoutGrid className="h-4 w-4" /> Grid
        </Button>
        <Button
          variant={view === "list" ? "default" : "ghost"}
          className={`h-11 rounded-none flex-1 sm:flex-none ${view === "list" ? "" : "text-zinc-700 dark:text-zinc-300"}`}
          onClick={() => setView("list")}
        >
          <ListIcon className="h-4 w-4" /> List
        </Button>
      </div>

      <div className="relative order-5 w-full sm:w-auto">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-11 pl-3 pr-8 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-full sm:w-auto min-w-48"
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
