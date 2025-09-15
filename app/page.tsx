import FilterSidebar from "../components/FilterSidebar";
import TopBar from "../components/TopBar";
import { Suspense } from "react";
import ClientGrid from "./sections/ClientGrid";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <TopBar />
      <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8">
        <div className="lg:hidden">
          <FilterSidebar />
        </div>
        <div className="hidden lg:block">
          <FilterSidebar />
        </div>
        <section className="flex-1 min-w-0">
          <Suspense fallback={<div className="text-center py-8">Loading cafes...</div>}>
            <ClientGrid />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
