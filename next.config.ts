import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "picsum.photos" },
      // Cafe and restaurant image domains
      { protocol: "https", hostname: "cafe.hardrock.com" },
      { protocol: "https", hostname: "assets.architecturaldigest.in" },
      { protocol: "https", hostname: "b.zmtcdn.com" },
      { protocol: "https", hostname: "brandsandbranches.com" },
      { protocol: "https", hostname: "www.theparkhotels.com" },
      { protocol: "https", hostname: "dynamic-media-cdn.tripadvisor.com" },
      { protocol: "https", hostname: "newsmeter.in" },
      { protocol: "https", hostname: "imgmediagumlet.lbb.in" },
      { protocol: "https", hostname: "clubrstorage.blob.core.windows.net" },
      { protocol: "https", hostname: "hospitalitybizindia.com" },
      { protocol: "https", hostname: "bpage.sgp1.digitaloceanspaces.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "dineout-media-assets.swiggy.com" },
      { protocol: "https", hostname: "content.jdmagicbox.com" },
      { protocol: "https", hostname: "district-150.com" },
      { protocol: "https", hostname: "www.venuelook.com" },
      { protocol: "https", hostname: "cdn.venuelook.com" },
    ],
  },
};

export default nextConfig;
