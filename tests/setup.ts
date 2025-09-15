// Test setup file
import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables
beforeAll(() => {
  process.env.OFFERS_CACHE_PROVIDER = 'memory';
  process.env.OFFERS_TTL_MINUTES = '30';
  process.env.PROVIDERS_ENABLED = 'zomato,swiggy';
  process.env.ADMIN_TOKEN = 'test-token';
  process.env.SCRAPE_BLOCK_COOLDOWN_MIN = '30';
  process.env.SCRAPE_MAX_PARALLEL = '2';
});

// Clean up after each test
afterEach(() => {
  // Reset any global state if needed
});

afterAll(() => {
  // Global cleanup
});