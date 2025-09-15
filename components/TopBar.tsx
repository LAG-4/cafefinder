"use client";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function TopBar() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("top");

  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-4">
      <div className="flex-1 min-w-48">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cafes, areas, tags…"
        />
      </div>

      <Button variant="outline">Close filters</Button>

      <div className="h-11 inline-flex rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
        <button
          className={`px-3 md:px-4 ${view === "grid" ? "bg-zinc-100" : "bg-white"}`}
          onClick={() => setView("grid")}
        >
          Grid view
        </button>
        <button
          className={`px-3 md:px-4 ${view === "list" ? "bg-zinc-100" : "bg-white"}`}
          onClick={() => setView("list")}
        >
          List
        </button>
      </div>

      <div className="relative">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-11 pl-3 pr-8 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
        >
          <option value="top">Sort by: Top rated</option>
          <option value="cost">Cost (low)</option>
          <option value="wifi">Wi‑Fi (fast)</option>
          <option value="reviews">Reviews</option>
        </select>
      </div>

      <Button className="ml-auto">Add place</Button>
    </div>
  );
}
