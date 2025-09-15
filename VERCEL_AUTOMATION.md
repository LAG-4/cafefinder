# 🚀 Vercel Deployment Guide for Automated Scraping

## Overview

This guide explains how to deploy the Hyd Cafe Finder to Vercel with fully automated offer scraping that runs **without requiring you to manually start any processes**.

## 🎯 Automated Scraping Options

### Option 1: Vercel Cron Jobs (Recommended - Requires Vercel Pro)

**Best for: Production deployments with reliable automation**

1. **Upgrade to Vercel Pro** ($20/month)
2. **Deploy normally** - the `vercel.json` is already configured
3. **Automatic hourly scraping** starts immediately after deployment

**How it works:**
- Vercel automatically calls `/api/scraping/cron` every hour
- Scrapes all 79+ places in parallel (takes 2-3 minutes total)
- No manual intervention required
- Fully serverless and scalable

### Option 2: External Cron Service (Free Alternative)

**Best for: Free deployments with external automation**

Choose any external cron service:

#### A) **Cron-job.org** (Free)
1. Go to [cron-job.org](https://cron-job.org)
2. Create account and add new job:
   - **URL:** `https://your-app.vercel.app/api/scraping/cron`
   - **Method:** POST
   - **Schedule:** Every hour (`0 * * * *`)
   - **Optional:** Add header `Authorization: Bearer YOUR_CRON_SECRET`

#### B) **GitHub Actions** (Free for public repos)
Create `.github/workflows/scraping.yml`:
```yaml
name: Hourly Scraping
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Scraping
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-app.vercel.app/api/scraping/cron
```

#### C) **Zapier** (Free tier available)
1. Create Zap with Schedule trigger (every hour)
2. Add Webhook action to POST to your cron endpoint

## 🔧 Environment Variables Setup

Add these to your Vercel environment variables:

### Required:
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud
CONVEX_URL=https://your-convex-url.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-name
```

### Optional (for security):
```bash
ADMIN_TOKEN=your-secure-random-token
CRON_SECRET=your-cron-secret-token
```

## 📊 Performance Optimizations

### Fast Parallel Scraping
- **20 places per batch** (up from 5)
- **Parallel processing** instead of sequential
- **100ms stagger** instead of 2-second delays
- **Chunks of 10** for optimal performance
- **Total time: 2-3 minutes** for all 79 places

### Memory and Timeout Settings
The `vercel.json` includes:
- **5-minute timeout** for scraping endpoints
- **Optimized function configuration**

## 🎮 Manual Controls

### Local Development:
```bash
# Fast scraping - all places at once
npm run scraper:fast-all

# Initialize from CSV
npm run scraper:fast-init

# Single optimized batch
npm run scraper:fast-batch

# Continuous (old way)
npm run scraper:fast-continuous
```

### Production (via API):
```bash
# Trigger full scraping manually
curl -X POST https://your-app.vercel.app/api/scraping/batch \
  -H "Content-Type: application/json" \
  -d '{"mode": "all"}'

# Check status
curl https://your-app.vercel.app/api/scraping/batch
```

### Admin Dashboard:
- Visit `/admin/offers`
- Click **"Scrape All Places"** button
- Real-time progress updates
- Automatic refresh after completion

## 🔄 How the Automation Works

### 1. Scheduled Trigger
- External cron service OR Vercel cron calls `/api/scraping/cron`
- Authenticated with optional `CRON_SECRET`

### 2. Batch Processing
- `/api/scraping/cron` calls `/api/scraping/batch` internally
- Processes all places in optimized parallel chunks
- Updates database with fresh offers

### 3. Data Management
- **Upserts new offers** (creates or updates)
- **Marks missing offers as inactive** (maintains data integrity)
- **Tracks scraping status** with timestamps and success rates

### 4. Result Tracking
- Each place has `lastScrapedAt` and `nextScrapeAt` timestamps
- Success/failure counts tracked per place
- Admin dashboard shows real-time status

## 🚀 Deployment Steps

1. **Prepare Convex:**
   ```bash
   npx convex dev  # Deploy schema and functions
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables:**
   - Go to Vercel dashboard → Project → Settings → Environment Variables
   - Add all required variables listed above

4. **Choose Automation Method:**
   - **Pro users:** Automatic (already configured in `vercel.json`)
   - **Free users:** Set up external cron service

5. **Verify Setup:**
   - Visit `/admin/offers` to see current offers
   - Test manual scraping with "Scrape All Places" button
   - Monitor first automated run

## 📈 Monitoring and Maintenance

### Health Check Endpoints:
- `GET /api/scraping/batch` - Service status
- `GET /api/scraping/cron` - Cron configuration info
- `/admin/offers` - Full dashboard with statistics

### Key Metrics to Monitor:
- **Success rate** (should be >90%)
- **Scraping duration** (should be 2-5 minutes)
- **Offer counts** (should stay relatively stable)
- **Last scraped times** (should update hourly)

### Troubleshooting:
- Check Vercel function logs for errors
- Verify environment variables are set
- Test individual API endpoints manually
- Monitor Convex database status

## 🎉 Expected Results

After deployment:
- **79+ restaurants** automatically scraped hourly
- **500+ offers** updated in real-time
- **Zero manual intervention** required
- **2-3 minute** scraping cycles
- **Fresh data** always available to users

Your scraping system will run completely automatically, keeping all restaurant offers up-to-date without any manual work from you! 🎊