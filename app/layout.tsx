import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { UiProvider } from "../components/ui-store";
import { ThemeToggle } from "../components/ThemeToggle";
import { BGPattern } from "../components/ui/bg-pattern";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CafeHopper - Discover Hyderabad's Best Cafes",
  description: "Discover the best cafes, restaurants, and pubs in Hyderabad with CafeHopper",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
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
                  <ThemeToggle />
                  <a 
                    href="#" 
                    className="rounded-md px-3 py-1.5 text-sm transition-colors hover:opacity-80"
                    style={{ 
                      backgroundColor: 'var(--primary)', 
                      color: 'var(--primary-foreground)' 
                    }}
                  >
                    Join
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
        </ThemeProvider>
      </body>
    </html>
  );
}
