import { Skeleton } from "@/components/ui/skeleton";

interface CafeCardSkeletonProps {
  view?: "grid" | "list";
}

export function CafeCardSkeleton({ view = "grid" }: CafeCardSkeletonProps) {
  if (view === "list") {
    return (
      <div className="flex flex-row items-stretch border rounded-xl overflow-hidden">
        {/* Image skeleton */}
        <Skeleton className="w-24 sm:w-48 aspect-square sm:aspect-[3/2] flex-shrink-0" />
        
        {/* Content skeleton */}
        <div className="flex-1 p-4 space-y-3">
          {/* Title and rank */}
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>
          
          {/* Scores */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12 rounded" />
            <Skeleton className="h-6 w-12 rounded" />
            <Skeleton className="h-6 w-12 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group block rounded-xl overflow-hidden border">
      {/* Image skeleton */}
      <div className="relative aspect-[4/3]">
        <Skeleton className="w-full h-full" />
        
        {/* Rank badge skeleton */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>
        
        {/* Title overlay skeleton */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
          <Skeleton className="h-5 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Scores row */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-12 rounded" />
          <Skeleton className="h-6 w-12 rounded" />
          <Skeleton className="h-6 w-12 rounded" />
          <Skeleton className="h-6 w-12 rounded" />
        </div>
        
        {/* Type */}
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function CafeGridSkeleton({ view = "grid", count = 6 }: { view?: "grid" | "list"; count?: number }) {
  return (
    <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5" : "space-y-3 sm:space-y-4"}>
      {Array.from({ length: count }).map((_, index) => (
        <CafeCardSkeleton key={index} view={view} />
      ))}
    </div>
  );
}