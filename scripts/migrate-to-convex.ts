import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Convex client
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL not found in environment variables');
}
const client = new ConvexHttpClient(convexUrl);

function csvValueToString(value: any): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return String(value).trim();
}

function scoreToNumber(score: string): number {
  switch (score.toLowerCase()) {
    case 'very good': return 5;
    case 'good': return 4;
    case 'okay': return 3;
    case 'bad': return 2;
    case 'very bad': return 1;
    default: return 3; // default to okay
  }
}

async function migrateData() {
  console.log('Starting data migration...');

  try {
    // Read and parse CSV file
    const csvPath = path.join(process.cwd(), 'hyderabad_top_100_cafes_restaurants_bars_ranked.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      skip_records_with_error: true
    });

    console.log(`Found ${records.length} records in CSV`);

    // Read places.json for additional context
    const placesPath = path.join(process.cwd(), 'places.json');
    const placesData = JSON.parse(fs.readFileSync(placesPath, 'utf-8'));
    
    console.log(`Found ${placesData.items.length} items in places.json`);

    let migratedCount = 0;

    for (const record of records) {
      try {
        const csvRecord = record as any; // Type assertion for CSV record
        
        // Create slug from name
        const slug = csvRecord.Name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);

        // Find corresponding item in places.json for scores
        const placeItem = placesData.items.find((item: any) => 
          item.name === csvRecord.Name || item.slug === slug
        );

        const scores = placeItem?.scores || {
          overall: parseInt(csvRecord.Rank) ? Math.max(1, Math.min(5, 6 - Math.floor(parseInt(csvRecord.Rank) / 20))) : 3,
          cost: scoreToNumber(csvValueToString(csvRecord['Value for Money / Pricing'])),
          wifi: scoreToNumber(csvValueToString(csvRecord['Wi-Fi Speed and Reliability'])),
          safety: scoreToNumber(csvValueToString(csvRecord['Safety (General Safety and Safe for Women/LGBTQ+)'])),
          liked: scoreToNumber(csvValueToString(csvRecord['Social Media Friendliness']))
        };

        const placeData = {
          slug,
          name: csvValueToString(csvRecord.Name),
          area: csvValueToString(csvRecord.Location),
          type: csvValueToString(csvRecord.Type),
          image: csvValueToString(csvRecord.Images),
          rank: parseInt(csvRecord.Rank) || 0,
          scores,
          rawScores: {
            aestheticScore: parseFloat(csvRecord.Aesthetic_Score) || 0,
            socialMediaFriendliness: csvValueToString(csvRecord['Social Media Friendliness']),
            funFactor: csvValueToString(csvRecord['Fun Factor/Nightlife Quality (For Bars/Pubs)']),
            crowdVibe: csvValueToString(csvRecord['Crowd Vibe (Chill, Lively, Too Rowdy, etc.)']),
            ambianceAndInteriorComfort: csvValueToString(csvRecord['Ambiance and Interior Comfort']),
            communityVibe: csvValueToString(csvRecord['Community Vibe (Welcoming, Regulars, Neutral Ground Feel)']),
            safety: csvValueToString(csvRecord['Safety (General Safety and Safe for Women/LGBTQ+)']),
            inclusionForeigners: csvValueToString(csvRecord['Inclusion/Friendliness to Foreigners']),
            racismFreeEnvironment: csvValueToString(csvRecord['Racism-Free Environment']),
            lighting: csvValueToString(csvRecord['Lighting (Brightness & Mood Suitability)']),
            musicQualityAndVolume: csvValueToString(csvRecord['Music Quality and Volume']),
            wifiSpeedAndReliability: csvValueToString(csvRecord['Wi-Fi Speed and Reliability']),
            laptopWorkFriendliness: csvValueToString(csvRecord['Laptop/Work Friendliness (For Cafes)']),
            valueForMoney: csvValueToString(csvRecord['Value for Money / Pricing']),
            foodQualityAndTaste: csvValueToString(csvRecord['Food Quality and Taste']),
            drinkQualityAndSelection: csvValueToString(csvRecord['Drink Quality and Selection']),
            cleanlinessAndHygiene: csvValueToString(csvRecord['Cleanliness and Hygiene']),
            serviceSpeed: csvValueToString(csvRecord['Service Speed']),
            staffFriendliness: csvValueToString(csvRecord['Staff Friendliness and Attentiveness']),
            seatingComfort: csvValueToString(csvRecord['Seating Comfort']),
            noiseLevel: csvValueToString(csvRecord['Noise Level']),
            temperatureComfort: csvValueToString(csvRecord['Temperature Comfort (A/C effectiveness)']),
            availabilityOfPowerOutlets: csvValueToString(csvRecord['Availability of Power Outlets']),
            menuClarityAndUsability: csvValueToString(csvRecord['Menu Clarity and Usability']),
            waitTimes: csvValueToString(csvRecord['Wait Times / Queue Management']),
            easeOfReservations: csvValueToString(csvRecord['Ease of Reservations/Bookings']),
            crowdDensity: csvValueToString(csvRecord['Crowd Density (Not Too Crowded / Overcrowded)']),
            lineOfSight: csvValueToString(csvRecord['Line of Sight/Personal Space at Tables']),
            foodSafety: csvValueToString(csvRecord['Food Safety (Visible Practices & Perceived Trust)']),
            proactiveService: csvValueToString(csvRecord['Proactive Service (Order Accuracy & Refills Without Prompting)']),
            airQuality: csvValueToString(csvRecord['Air Quality (Indoors and Immediate Surroundings)']),
            restroomCleanliness: csvValueToString(csvRecord['Restroom Cleanliness']),
            paymentConvenience: csvValueToString(csvRecord['Payment Convenience (Multiple Digital Options/No Cash-Only Hassle)']),
            walkabilityAccessibility: csvValueToString(csvRecord['Walkability/Accessibility'])
          }
        };

        await client.mutation(api.places.addPlace, placeData);
        migratedCount++;
        console.log(`Migrated: ${placeData.name} (${migratedCount}/${records.length})`);

      } catch (error) {
        console.error(`Error migrating record ${(record as any).Name}:`, error);
      }
    }

    console.log(`Successfully migrated ${migratedCount} places to Convex!`);

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
migrateData();