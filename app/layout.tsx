import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { ThemeToggle } from "../components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hyd Cafe Finder",
  description: "Discover the best cafes, restaurants, and pubs in Hyderabad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-rose-600 text-white font-bold">CF</span>
                <div className="font-semibold">Hyd Cafe Finder</div>
              </div>
                <div className="hidden md:block text-sm text-zinc-500 dark:text-zinc-400">Hyderabad hangouts for food, work and fun</div>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <a href="#" className="rounded-md bg-zinc-900 text-white px-3 py-1.5 text-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">Join</a>
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">© {new Date().getFullYear()} Hyd Cafe Finder</footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
