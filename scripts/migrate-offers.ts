#!/usr/bin/env node
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error('CONVEX_URL environment variable is required');
  process.exit(1);
}

async function runMigration() {
  const client = new ConvexHttpClient(CONVEX_URL!);
  
  try {
    console.log('Running offers migration...');
    const result = await client.mutation(api.migrations.migrateOffers, {});
    console.log('Migration completed successfully!');
    console.log(result);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();