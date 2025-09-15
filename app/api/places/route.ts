import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";

type Place = Record<string, string> & {
  Name: string;
  Location: string;
  Type: string;
  Images: string;
  Aesthetic_Score?: string;
};

function score(value: string) {
  const map: Record<string, number> = {
    "very bad": 1,
    bad: 2,
    okay: 3,
    good: 4,
    "very good": 5,
    great: 5,
  };
  return map[String(value || "").trim().toLowerCase()] ?? null;
}

export const runtime = "nodejs";

export async function GET() {
  // Switch to the ranked Top 100 CSV as the canonical data source
  const file = path.join(process.cwd(), "hyderabad_top_100_cafes_restaurants_bars_ranked.csv");
  const csv = await fs.readFile(file, "utf8");
  const parsed = Papa.parse<Place>(csv, { header: true, skipEmptyLines: true });
  const isHttpUrl = (s: string | undefined) => {
    if (!s) return false;
    try {
      const u = new URL(s);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };
  const items = (parsed.data as Place[]).map((row: Place, idx: number) => {
    const images = (row.Images || "").split(",").map((s: string) => s.trim());
    const first = images[0];
    const image = isHttpUrl(first) ? first : "https://picsum.photos/800/600";
    const aesthetic = Number.parseFloat(String(row.Aesthetic_Score ?? "").trim());
    const overallPct = Number.isFinite(aesthetic) ? Math.max(0, Math.min(100, Math.round(aesthetic))) : null;
    return {
      id: String(idx + 1),
      slug: row.Name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name: row.Name,
      area: row.Location,
      type: row.Type,
      image,
      // quick stats for the hover bar
      scores: {
        // Use Aesthetic_Score from the ranked CSV when available; otherwise derive a rough average
        overall:
          overallPct ??
          Math.round(
            (((score(row["Food Quality and Taste"]) ?? 0) +
              (score(row["Drink Quality and Selection"]) ?? 0) +
              (score(row["Ambiance and Interior Comfort"]) ?? 0)) /
              3) * 20
          ),
        cost: score(row["Value for Money / Pricing"]) ?? 0,
        wifi: score(row["Wi-Fi Speed and Reliability"]) ?? 0,
        safety: score(row["Safety (General Safety and Safe for Women/LGBTQ+)"]) ?? 0,
        liked: score(row["Staff Friendliness and Attentiveness"]) ?? 0,
      },
      raw: row,
    };
  });
  return NextResponse.json({ items });
}
