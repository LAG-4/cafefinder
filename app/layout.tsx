import type { Metadata } from "next";
import { Montserrat, Fira_Code } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { UiProvider } from "../components/ui-store";
import { ThemeToggle } from "../components/ThemeToggle";
import { BGPattern } from "../components/ui/bg-pattern";
import { ConvexClientProvider } from "../components/ConvexProvider";
import { Plus } from "lucide-react";
import StructuredData from "../components/StructuredData";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CafeHopper - Discover Hyderabad's Best Cafes, Restaurants & Bars",
    template: "%s | CafeHopper - Hyderabad's Best Food & Drink Guide"
  },
  description: "Discover and explore the top 100 cafes, restaurants, bars, and pubs in Hyderabad. Find perfect spots for work, dining, hanging out with friends, or enjoying great coffee and food in the city.",
  keywords: [
    "Hyderabad cafes",
    "best restaurants Hyderabad",
    "coffee shops Hyderabad",
    "bars pubs Hyderabad",
    "food places Hyderabad",
    "co-working cafes",
    "hangout spots Hyderabad",
    "dining Hyderabad",
    "cafe hopping",
    "Telangana restaurants"
  ],
  authors: [{ name: "CafeHopper Team" }],
  creator: "CafeHopper",
  publisher: "CafeHopper",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://cafefinder-hyd.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CafeHopper - Discover Hyderabad's Best Cafes, Restaurants & Bars",
    description: "Discover and explore the top 100 cafes, restaurants, bars, and pubs in Hyderabad. Find perfect spots for work, dining, hanging out with friends, or enjoying great coffee and food in the city.",
    url: "https://cafefinder-hyd.vercel.app",
    siteName: "CafeHopper",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "CafeHopper - Discover Hyderabad's Best Cafes and Restaurants",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CafeHopper - Discover Hyderabad's Best Cafes & Restaurants",
    description: "Find the perfect cafe, restaurant, or bar in Hyderabad. Top 100 curated spots for food, work, and hangouts.",
    images: ["/twitter-image.svg"],
    creator: "@cafehopper_hyd",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code-here",
    yandex: "your-yandex-verification-code-here",
    yahoo: "your-yahoo-verification-code-here",
  },
  category: "food and drink",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CafeHopper",
    "url": "https://cafefinder-hyd.vercel.app",
    "description": "Discover and explore the top 100 cafes, restaurants, bars, and pubs in Hyderabad. Find perfect spots for work, dining, hanging out with friends, or enjoying great coffee and food in the city.",
    "inLanguage": "en-US",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://cafefinder-hyd.vercel.app/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "CafeHopper",
      "url": "https://cafefinder-hyd.vercel.app"
    },
    "about": {
      "@type": "LocalBusiness",
      "name": "Hyderabad Food & Beverage Directory",
      "description": "Complete guide to the best cafes, restaurants, bars and pubs in Hyderabad",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Hyderabad",
        "addressRegion": "Telangana", 
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "17.3850",
        "longitude": "78.4867"
      },
      "servesCuisine": ["Indian", "Continental", "Asian", "Italian", "Mexican", "Chinese"],
      "priceRange": "₹₹-₹₹₹₹"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData data={structuredData} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CafeHopper" />
        <meta name="theme-color" content="#ee5a24" />
        <meta name="msapplication-TileColor" content="#ee5a24" />
        <meta name="msapplication-navbutton-color" content="#ee5a24" />
      </head>
      <body className={`${montserrat.variable} ${firaCode.variable} antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <BGPattern 
          variant="dots" 
          mask="fade-center" 
          size={20} 
          fill="var(--muted-foreground)" 
          className="opacity-30"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <UiProvider>
              <div className="min-h-screen flex flex-col">
            <header 
              className="sticky top-0 z-40 backdrop-blur border-b" 
              style={{ 
                backgroundColor: 'color-mix(in srgb, var(--background) 80%, transparent)',
                borderColor: 'var(--border)' 
              }}
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/" className="font-bold text-xl transition-colors hover:opacity-80" style={{ color: 'var(--primary)' }}>
                  CafeHopper
                </Link>
              </div>
                <div className="hidden md:block text-sm" style={{ color: 'var(--muted-foreground)' }}>Hyderabad hangouts for food, work and fun</div>
                <div className="flex items-center gap-4">
                  <Link 
                    href="/admin" 
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    admin
                  </Link>
                  <ThemeToggle />
                  <a 
                    href="#" 
                    className="rounded-md px-3 py-1.5 text-sm transition-colors hover:opacity-80 flex items-center gap-2"
                    style={{ 
                      backgroundColor: 'var(--primary)', 
                      color: 'var(--primary-foreground)' 
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add place</span>
                    <span className="sm:hidden">Add</span>
                  </a>
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer 
              className="border-t py-6 text-center text-sm" 
              style={{ 
                borderColor: 'var(--border)', 
                color: 'var(--muted-foreground)' 
              }}
            >
              © {new Date().getFullYear()} CafeHopper
            </footer>
          </div>
          </UiProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
