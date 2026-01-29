import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { ServiceAccount } from "firebase-admin/app";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

dotenv.config({ path: ".env.local" });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!serviceAccountPath) {
  console.error(
    "FIREBASE_SERVICE_ACCOUNT is required. Set it to your service account JSON path.",
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8"),
) as ServiceAccount;

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: projectId || serviceAccount.project_id,
  });
}

const db = getFirestore();

type PlaceRow = Record<string, string>;

function score(value: string | undefined) {
  const map: Record<string, number> = {
    "very bad": 1,
    bad: 2,
    okay: 3,
    good: 4,
    "very good": 5,
    great: 5,
  };
  return map[String(value || "").trim().toLowerCase()] ?? 0;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function firstHttpUrl(values: string[]) {
  for (const value of values) {
    if (isHttpUrl(value)) return value;
  }
  return "";
}

async function seedPlaces() {
  console.log("Seeding places into Firestore...");

  const csvPath = path.join(
    process.cwd(),
    "hyderabad_top_100_cafes_restaurants_bars_ranked.csv",
  );

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found at ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse<PlaceRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.warn("CSV parse warnings:", parsed.errors);
  }

  let batch = db.batch();
  let batchCount = 0;
  let successCount = 0;
  let errorCount = 0;
  const batchLimit = 400;

  const commitBatch = async () => {
    if (batchCount == 0) return;
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  };

  for (const row of parsed.data) {
    try {
      const name = row["Name"] || "";
      const location = row["Location"] || "";
      const type = row["Type"] || "";
      if (!name || !location || !type) continue;

      const slug = slugify(`${name}-${location}`);
      const rankValue = Number.parseInt(row["Rank"] || "0", 10);
      const rank = Number.isFinite(rankValue) && rankValue > 0 ? rankValue : 999;

      const images = (row["Images"] || "")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      const image = firstHttpUrl(images);

      const aestheticRaw = Number.parseFloat(row["Aesthetic_Score"] || "");
      const aestheticScore = Number.isFinite(aestheticRaw) ? aestheticRaw : 0;

      const fallbackOverall = Math.round(
        (((score(row["Food Quality and Taste"]) ?? 0) +
          (score(row["Drink Quality and Selection"]) ?? 0) +
          (score(row["Ambiance and Interior Comfort"]) ?? 0)) /
          3) * 20,
      );
      const overall = aestheticScore > 0 ? Math.round(aestheticScore) : fallbackOverall;

      const data = {
        slug,
        name,
        area: location,
        type,
        image,
        rank,
        scores: {
          overall,
          cost: score(row["Value for Money / Pricing"]),
          wifi: score(row["Wi-Fi Speed and Reliability"]),
          safety: score(row["Safety (General Safety and Safe for Women/LGBTQ+)"]),
          liked: score(row["Staff Friendliness and Attentiveness"]),
        },
        rawScores: {
          aestheticScore,
          socialMediaFriendliness: row["Social Media Friendliness"] || "",
          funFactor: row["Fun Factor/Nightlife Quality (For Bars/Pubs)"] || "",
          crowdVibe: row["Crowd Vibe (Chill, Lively, Too Rowdy, etc.)"] || "",
          ambianceAndInteriorComfort: row["Ambiance and Interior Comfort"] || "",
          communityVibe:
            row["Community Vibe (Welcoming, Regulars, Neutral Ground Feel)"] || "",
          safety: row["Safety (General Safety and Safe for Women/LGBTQ+)"] || "",
          inclusionForeigners: row["Inclusion/Friendliness to Foreigners"] || "",
          racismFreeEnvironment: row["Racism-Free Environment"] || "",
          lighting: row["Lighting (Brightness & Mood Suitability)"] || "",
          musicQualityAndVolume: row["Music Quality and Volume"] || "",
          wifiSpeedAndReliability: row["Wi-Fi Speed and Reliability"] || "",
          laptopWorkFriendliness: row["Laptop/Work Friendliness (For Cafes)"] || "",
          valueForMoney: row["Value for Money / Pricing"] || "",
          foodQualityAndTaste: row["Food Quality and Taste"] || "",
          drinkQualityAndSelection: row["Drink Quality and Selection"] || "",
          cleanlinessAndHygiene: row["Cleanliness and Hygiene"] || "",
          serviceSpeed: row["Service Speed"] || "",
          staffFriendliness: row["Staff Friendliness and Attentiveness"] || "",
          seatingComfort: row["Seating Comfort"] || "",
          noiseLevel: row["Noise Level"] || "",
          temperatureComfort: row["Temperature Comfort (A/C effectiveness)"] || "",
          availabilityOfPowerOutlets: row["Availability of Power Outlets"] || "",
          menuClarityAndUsability: row["Menu Clarity and Usability"] || "",
          waitTimes: row["Wait Times / Queue Management"] || "",
          easeOfReservations: row["Ease of Reservations/Bookings"] || "",
          crowdDensity:
            row["Crowd Density (Not Too Crowded / Overcrowded)"] || "",
          lineOfSight: row["Line of Sight/Personal Space at Tables"] || "",
          foodSafety:
            row["Food Safety (Visible Practices & Perceived Trust)"] || "",
          proactiveService:
            row["Proactive Service (Order Accuracy & Refills Without Prompting)"] ||
            "",
          airQuality: row["Air Quality (Indoors and Immediate Surroundings)"] || "",
          restroomCleanliness: row["Restroom Cleanliness"] || "",
          paymentConvenience:
            row[
              "Payment Convenience (Multiple Digital Options/No Cash-Only Hassle)"
            ] || "",
          walkabilityAccessibility: row["Walkability/Accessibility"] || "",
        },
      };

      const docRef = db.collection("places").doc(slug);
      batch.set(docRef, data, { merge: true });
      batchCount++;
      successCount++;

      if (batchCount >= batchLimit) {
        await commitBatch();
        process.stdout.write(".");
      }
    } catch (error) {
      errorCount++;
      console.error("Failed to import place:", row["Name"], error);
    }
  }

  await commitBatch();

  console.log("\nSeeding complete.");
  console.log(`Imported: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

seedPlaces().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
