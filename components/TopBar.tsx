import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useUi } from "./ui-store";
import { LayoutGrid, List as ListIcon, X, Plus, Wifi, Star, DollarSign, MessageSquare } from "lucide-react";

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

  const clearSearch = () => {
    setQuery("");
    onSearchChange?.("");
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

      <Button variant="outline" className="sm:hidden order-2 w-full" onClick={clearSearch}>
        <X className="h-4 w-4" /> Clear search
      </Button>
      
      <Button variant="outline" className="hidden sm:flex order-3" onClick={clearSearch}>
        <X className="h-4 w-4" /> Clear search
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
          className={`h-11 rounded-none flex-1 sm:flex-none cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-950/20 ${view === "grid" ? "" : ""}`}
          onClick={() => setView("grid")}
          style={view !== "grid" ? { color: 'var(--muted-foreground)' } : {}}
        >
          <LayoutGrid className={`h-4 w-4 transition-colors ${view !== "grid" ? "hover:text-red-500" : ""}`} /> Grid
        </Button>
        <Button
          variant={view === "list" ? "default" : "ghost"}
          className={`h-11 rounded-none flex-1 sm:flex-none cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-950/20 ${view === "list" ? "" : ""}`}
          onClick={() => setView("list")}
          style={view !== "list" ? { color: 'var(--muted-foreground)' } : {}}
        >
          <ListIcon className={`h-4 w-4 transition-colors ${view !== "list" ? "hover:text-red-500" : ""}`} /> List
        </Button>
      </div>

      <div className="order-5 w-full sm:w-auto">
        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-48 h-11">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">
              <Star className="h-4 w-4 mr-2" />
              Sort by: Top rated
            </SelectItem>
            <SelectItem value="cost">
              <DollarSign className="h-4 w-4 mr-2" />
              Cost (low)
            </SelectItem>
            <SelectItem value="wifi">
              <Wifi className="h-4 w-4 mr-2" />
              Wi-Fi (fast)
            </SelectItem>
            <SelectItem value="reviews">
              <MessageSquare className="h-4 w-4 mr-2" />
              Reviews
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        className="ml-auto order-6 bg-red-600 hover:bg-red-700 text-white"
        style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        <Plus className="h-4 w-4" /> Add place
      </Button>
    </div>
  );
}
