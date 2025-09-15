import { NextResponse } from "next/server";
import { generateDiscountsForRestaurants } from "../../../lib/discountService";
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

export const runtime = "nodejs";

export async function GET() {
  try {
    // Read the same CSV file as the places API
    const file = path.join(process.cwd(), "hyderabad_top_100_cafes_restaurants_bars_ranked.csv");
    const csv = await fs.readFile(file, "utf8");
    const parsed = Papa.parse<Place>(csv, { header: true, skipEmptyLines: true });
    
    // Extract restaurant info for discount generation
    const restaurants = (parsed.data as Place[]).map((row: Place, idx: number) => ({
      id: String(idx + 1),
      name: row.Name
    }));
    
    // Generate discounts for all restaurants
    const discounts = generateDiscountsForRestaurants(restaurants);
    
    return NextResponse.json({ 
      discounts,
      totalRestaurants: restaurants.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    );
  }
}