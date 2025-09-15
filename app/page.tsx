import FilterSidebar from "../components/FilterSidebar";
import TopBar from "../components/TopBar";
import { Suspense } from "react";
import ClientGrid from "./sections/ClientGrid";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <TopBar />
      <div className="mt-6 md:mt-8 flex flex-col md:flex-row gap-6 md:gap-8">
        <FilterSidebar />
        <section className="flex-1">
          <Suspense fallback={<div>Loading…</div>}>
            <ClientGrid />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
