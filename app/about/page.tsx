"use client";
import Link from "next/link";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Github, HeartHandshake, Users, Filter, Sparkles, Stars, MessageSquare, Mail } from "lucide-react";

export default function AboutPage() {
  const email = "aryan@lagaryan.click"; // Update if needed
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <header className="mb-6 sm:mb-8">
        <Badge variant="secondary" className="uppercase tracking-wide">About</Badge>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold">CafeHopper: Hyderabad’s Community‑Powered Cafe Guide</h1>
        <p className="mt-2 text-muted-foreground">Find cafes, restaurants, and bars that truly fit your plans.</p>
      </header>

      <main className="space-y-8">
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="px-0">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Why this exists</h2>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                Picking a place shouldn’t be a chore. We all care about the little things like vibes, seating, Wi‑Fi access and power sockets for the days you have to work outside, budget, late hours, parking, veg/non‑veg options. But most apps don’t surface those details.
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                <strong>CafeHopper</strong> is a simple idea: a beautiful, filterable guide where people share their <em>knowledge and experiences</em> from actually visiting spots around Hyderabad. We actually want the part of choosing the place to be the easiest so you cna focus on enjoying your time there.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <Feature
                  icon={<Users className="h-5 w-5" />}
                  title="Powered by people"
                  desc="People like you going out, sharing real experiences and practical details you can trust."
                />
                <Feature
                  icon={<Filter className="h-5 w-5" />}
                  title="Filters that matter"
                  desc="Find the perfect place by vibe, Wi‑Fi quality, power sockets, budget, hours, seating and more."
                />
                <Feature
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Gems, not noise"
                  desc="Chances to discover genuinely good options, popular picks and hidden gems alike."
                />
                <Feature
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Short, useful reviews"
                  desc="Quick and honest: what to try, what to skip, and what to expect."
                />
              </div>
            </section>

            <section id="contribute" className="mt-8 scroll-mt-28">
              <div className="rounded-xl border p-5 sm:p-6 space-y-3" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--card) 75%, transparent)' }}>
                <h2 className="text-xl font-semibold">Your experiences make this work</h2>
                <p className="text-muted-foreground">
                  This platform only becomes truly useful when people like you add your perspective. If you’ve visited a place, share a few quick notes — seating, vibe, music volume, staff, prices, best dishes, crowd, or any tips. Your voice helps others discover better spots.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button asChild>
                    <Link href="/">Start exploring</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="https://github.com/LAG-4/cafefinder" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                      <Github className="h-4 w-4" /> Contribute on GitHub
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            <section id="feedback" className="mt-8 scroll-mt-28">
              <div className="rounded-xl border p-5 sm:p-6 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <h2 className="text-xl font-semibold">I’m a solo dev — your feedback is gold</h2>
                <p className="text-muted-foreground">
                  I’m building and maintaining this on my own. That means some bugs or rough edges might slip through. If you run into issues or have suggestions or you think some data may be wrongly represented, I’d really appreciate hearing from you. Your feedback helps make CafeHopper better for everyone.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button asChild variant="secondary">
                    <a href={`mailto:${email}`} className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" /> {email}
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="https://github.com/LAG-4/cafefinder/issues/new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                      <Github className="h-4 w-4" /> File an issue
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoCard
                  icon={<HeartHandshake className="h-5 w-5 text-red-500" />}
                  title="Community‑powered"
                  desc="If this helps you, help it grow — by contributing experiences, sharing with friends the more people use it, the better it gets."
                />
                <InfoCard
                  icon={<Stars className="h-5 w-5 text-yellow-500" />}
                  title="What we value"
                  desc={
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>Honest, specific notes over vague ratings</li>
                      <li>Inclusive options for every budget and preference</li>
                      <li>Respect for staff, spaces, and other visitors</li>
                    </ul>
                  }
                />
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-red-50 dark:hover:bg-red-950/10">
      <div className="mt-0.5 text-red-600 dark:text-red-400">{icon}</div>
      <div>
        <div className="font-semibold leading-none mb-1">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}
