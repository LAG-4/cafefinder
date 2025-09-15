# 🔧 GitHub Actions Fix Guide

## Current Issue
Your GitHub Actions workflows are failing because of missing environment variables and configuration issues.

## ✅ Quick Fix Steps

### 1. Configure Repository Secrets

Go to your GitHub repository:
1. Click **Settings** (repository settings, not your account)
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of these:

#### Required Secrets:

```
Name: APP_URL
Value: https://your-vercel-app-domain.vercel.app
```

#### Optional but Recommended Secrets:

```
Name: CRON_SECRET
Value: your-random-secret-here-123456789
```

```
Name: ADMIN_TOKEN  
Value: your-admin-token-here
```

### 2. Find Your Vercel App URL

If you don't know your Vercel app URL:

1. Go to [vercel.com](https://vercel.com)
2. Find your cafefinder project
3. Copy the URL (it looks like `https://cafefinder-abc123.vercel.app`)
4. Use this as your `APP_URL` value

### 3. Test the Fix

After adding the secrets:

1. Go to your repository's **Actions** tab
2. Click on **Reliable Offer Scraping** workflow
3. Click **Run workflow** button
4. Select **test** strategy
5. Click **Run workflow**

This will run a quick test to verify everything is working.

## 🔄 Workflow Changes Made

I've created two improved workflows:

### 1. `reliable-scraping.yml` (Primary)
- Runs every hour with the simple, reliable strategy
- Better error handling and retry logic
- Clearer output and debugging info

### 2. `advanced-scraping.yml` (Updated)
- Runs every 3 hours (reduced from every hour to avoid conflicts)
- Simplified from 3 regions to 2 (primary/backup)
- Better environment validation
- Improved error messages

## 🚨 Common Issues & Fixes

### Issue: "APP_URL secret is missing"
**Fix:** Add the `APP_URL` secret in GitHub repository settings

### Issue: "Server health check failed"
**Fix:** 
- Verify your Vercel app is deployed and running
- Check the URL is correct (no trailing slash)
- Make sure your app has the `/api/scraping/batch` endpoint

### Issue: "CONVEX_URL environment variable is required"
**Fix:** Make sure your Vercel app has the `CONVEX_URL` environment variable set

### Issue: Timeout errors
**Fix:** The workflows now have better retry logic and longer timeouts

## 🧪 Testing Steps

1. **Test locally first:**
   ```bash
   curl -X POST "https://your-app.vercel.app/api/scraping/batch" \
     -H "Content-Type: application/json" \
     -d '{"mode": "batch", "limit": 1}'
   ```

2. **Test GitHub Actions:**
   - Use the "test" strategy first
   - Check the logs for detailed error messages
   - Once test passes, try "smart" strategy

## 📊 Monitoring

After fixing:
- Check Actions tab for success/failure status
- View results at: `https://your-app.vercel.app/admin/offers`
- Logs show detailed progress and results

## 🔍 Still Having Issues?

If it still doesn't work:
1. Check the Actions logs for specific error messages
2. Verify your Vercel deployment is working
3. Test the API endpoints manually using curl or browser
4. Ensure all environment variables are set in both GitHub and Vercel