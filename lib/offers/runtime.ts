import pino from 'pino';
import { Platform } from './types';
import { getConfig } from '../config';

// Logger setup
export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: ['url', 'headers'],
});

// Rate limiter using token bucket algorithm
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private capacity: number;
  private refillRate: number; // tokens per second
  
  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  tryConsume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  private refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
  
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

// Rate limiters per platform
const rateLimiters = new Map<Platform, TokenBucket>();

// Blocked platforms tracker (for cooldown)
const blockedPlatforms = new Map<Platform, number>(); // platform -> blocked until timestamp

// Active requests semaphore
let activeRequests = 0;

function getRateLimiter(platform: Platform): TokenBucket {
  if (!rateLimiters.has(platform)) {
    const config = getConfig();
    const platformConfig = config.providers.configs[platform];
    
    // Convert requests per minute to tokens per second
    const tokensPerSecond = platformConfig.rateLimit.requestsPerMinute / 60;
    const bucket = new TokenBucket(platformConfig.rateLimit.burstLimit, tokensPerSecond);
    rateLimiters.set(platform, bucket);
  }
  
  return rateLimiters.get(platform)!;
}

export function isPlatformBlocked(platform: Platform): boolean {
  const blockedUntil = blockedPlatforms.get(platform);
  if (!blockedUntil) return false;
  
  if (Date.now() > blockedUntil) {
    blockedPlatforms.delete(platform);
    return false;
  }
  
  return true;
}

export function blockPlatform(platform: Platform, durationMs?: number): void {
  const config = getConfig();
  const duration = durationMs || (config.scraping.blockCooldownMinutes * 60 * 1000);
  const blockedUntil = Date.now() + duration;
  
  blockedPlatforms.set(platform, blockedUntil);
  logger.warn({ platform, blockedUntil: new Date(blockedUntil) }, 'Platform blocked due to errors');
}

export function unblockPlatform(platform: Platform): void {
  blockedPlatforms.delete(platform);
  logger.info({ platform }, 'Platform unblocked manually');
}

export async function waitForRateLimit(platform: Platform): Promise<boolean> {
  const rateLimiter = getRateLimiter(platform);
  
  // Check if platform is blocked
  if (isPlatformBlocked(platform)) {
    logger.debug({ platform }, 'Platform is blocked, skipping request');
    return false;
  }
  
  // Check global concurrency limit
  const config = getConfig();
  if (activeRequests >= config.scraping.maxParallel) {
    logger.debug({ activeRequests, maxParallel: config.scraping.maxParallel }, 'Global concurrency limit reached');
    return false;
  }
  
  // Try to consume a token
  if (!rateLimiter.tryConsume()) {
    logger.debug({ platform, availableTokens: rateLimiter.getAvailableTokens() }, 'Rate limit exceeded');
    return false;
  }
  
  return true;
}

export function incrementActiveRequests(): void {
  activeRequests++;
  logger.debug({ activeRequests }, 'Request started');
}

export function decrementActiveRequests(): void {
  activeRequests = Math.max(0, activeRequests - 1);
  logger.debug({ activeRequests }, 'Request completed');
}

export function getActiveRequestsCount(): number {
  return activeRequests;
}

// Exponential backoff utility
export function calculateBackoffDelay(attemptNumber: number, baseDelayMs: number = 1000): number {
  const maxDelay = 30000; // 30 seconds max
  const delay = Math.min(baseDelayMs * Math.pow(2, attemptNumber - 1), maxDelay);
  
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, delay + jitter);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Error classification
export function classifyError(error: any): {
  isRetryable: boolean;
  shouldBlock: boolean;
  blockDuration?: number;
} {
  const status = error?.response?.status;
  const code = error?.code;
  
  if (status === 429 || status === 503) {
    // Rate limited or service unavailable - block for longer
    return { isRetryable: false, shouldBlock: true, blockDuration: 30 * 60 * 1000 }; // 30 minutes
  }
  
  if (status === 403 || status === 401) {
    // Forbidden or unauthorized - might be blocked
    return { isRetryable: false, shouldBlock: true, blockDuration: 60 * 60 * 1000 }; // 1 hour
  }
  
  if (status >= 500 || code === 'ECONNRESET' || code === 'ETIMEDOUT') {
    // Server error or connection issues - retryable
    return { isRetryable: true, shouldBlock: false };
  }
  
  if (status === 404) {
    // Not found - don't retry, don't block
    return { isRetryable: false, shouldBlock: false };
  }
  
  // Unknown error - don't retry but don't block either
  return { isRetryable: false, shouldBlock: false };
}

// Retry wrapper with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  platform: Platform,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const classification = classifyError(error);
      
      logger.warn({
        platform,
        attempt,
        maxAttempts,
        error: error instanceof Error ? error.message : String(error),
        status: (error as any)?.response?.status,
        classification,
      }, 'Request failed');
      
      if (classification.shouldBlock) {
        blockPlatform(platform, classification.blockDuration);
      }
      
      if (!classification.isRetryable || attempt === maxAttempts) {
        break;
      }
      
      // Wait before retry
      const delay = calculateBackoffDelay(attempt);
      logger.debug({ platform, attempt, delay }, 'Retrying after delay');
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// Get runtime stats
export function getRuntimeStats() {
  const config = getConfig();
  const blockedPlatformsList = Array.from(blockedPlatforms.entries()).map(([platform, blockedUntil]) => ({
    platform,
    blockedUntil: new Date(blockedUntil),
    timeRemaining: Math.max(0, blockedUntil - Date.now()),
  }));
  
  const rateLimiterStats = Array.from(rateLimiters.entries()).map(([platform, limiter]) => ({
    platform,
    availableTokens: limiter.getAvailableTokens(),
  }));
  
  return {
    activeRequests,
    maxParallel: config.scraping.maxParallel,
    blockedPlatforms: blockedPlatformsList,
    rateLimiters: rateLimiterStats,
  };
}

// Reset all runtime state (useful for testing)
export function resetRuntimeState(): void {
  rateLimiters.clear();
  blockedPlatforms.clear();
  activeRequests = 0;
}