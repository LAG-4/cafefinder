# Scraped Deals Aggregation Plan (Hyderabad)

## Goal
Build a reliable pipeline that:
1) Scrapes dine-in offers/deals for each restaurant from multiple platforms (3+ per restaurant).
2) Stores a normalized, timestamped snapshot in Firestore.
3) Lets the Flutter app display cached deals (never scrape from user devices).
4) Keeps data trustworthy (source URL + last updated + stale handling).

This doc is the implementation strategy (not code).

---

## Non-Negotiables (Trust + UX)
- **Never scrape from the mobile app**. Only backend/worker scrapes.
- **Always store and display `sourceUrl`** per platform, so users can verify.
- **Always store and display `fetchedAt`** ("Last updated").
- **Never overwrite good data with empty data**.
  - If blocked/failed, keep last known offers and mark `stale=true`.
- **Store raw extracted offer text** (not full HTML) for debugging and trust.

---

## Data Model

### Source of truth for platform links (recommended)
Store platform URLs on the place document so the worker never has to "search".

`places/{placeId}`
- `name`, `rank`, etc.
- `platforms` (map)
  - `zomato: { url }`
  - `swiggy_dineout: { url }`
  - `eazydiner: { url }`
  - `dineout: { url }` (only if the domain works reliably)
  - additional platforms later

Optional:
- `platformCoverageIncomplete: bool` (true if < 3 platforms)
- `dealsSummary` (lightweight summary for list views)

### Scraped output (separate collection)
Keep the scraped deals out of `places` to avoid bloated docs.

`placeOffers/{placeId}`
- `updatedAt` (server timestamp)
- `providers` (map keyed by provider id)
  - `<providerKey>`:
    - `sourceUrl: string`
    - `fetchedAt: timestamp`
    - `status: "ok" | "blocked" | "error" | "parse_error"`
    - `stale: bool`
    - `parserVersion: string`
    - `offers: [Offer]` (normalized)
    - `rawOfferTexts: [string]` (optional but strongly recommended)
    - `errorMessage: string` (only on failure)
    - `hash: string` (hash of normalized offers)

### Normalized Offer schema
Minimal fields to start (extend later):
- `title: string` (eg "Flat 20% OFF")
- `mode: "prebook" | "walkin" | "billpay" | "bank" | "unknown"`
- `type: "percentage" | "flat" | "cashback" | "coupon" | "unknown"`
- `value: number?` (percent or amount, depending on type)
- `currency: "INR"?`
- `minSpend: number?`
- `maxDiscount: number?`
- `couponCode: string?`
- `paymentInstrument: string?` (eg "HDFC Diners")
- `validityText: string?` (raw time window text)
- `terms: string?` (short constraints)
- `source: { providerKey, sourceUrl }`

---

## Ingestion of Your "Updated List"

### Purpose
Your updated dataset becomes a repeatable import step that upserts platform URLs into Firestore.

### Approach
1) Maintain a CSV/Sheet export with:
   - `placeId` (preferred) OR `slug` + enough info to match.
   - provider URLs for at least 3 platforms.
2) Run an import script:
   - Validates URLs (https, expected domain).
   - Writes to `places/{placeId}.platforms.<provider>.url`.
   - Marks `platformCoverageIncomplete` if missing.

### Validation rules
- Reject non-https URLs.
- Reject URLs not matching expected domain for that provider.
- Deduplicate identical URLs across places.

---

## Scraper Worker (Deterministic)

### Responsibilities
- Read all `places` documents.
- For each place, build tasks: one task per provider URL.
- Fetch HTML, parse offers, normalize.
- Write results to `placeOffers/{placeId}`.
- Record a run summary for monitoring.

### Task scheduling logic
- Refresh interval per provider (start with 24h for all).
- Only scrape if due: `now - fetchedAt > interval`.
- Support manual overrides via `forceRefresh` flags.

### Write minimization
- Compute `hash` of normalized offers.
- If `hash` unchanged:
  - Optionally update `fetchedAt` but avoid rewriting large arrays.

---

## Ban/Block Avoidance (No Proxies Needed Initially)

### Rate limiting
- **Per-domain concurrency = 1**.
- Global concurrency low (3-5 total threads/async tasks).
- Add jittered delays per request (eg 5-20s).

### Backoff
- On 403/429 bursts for a domain:
  - Stop scraping that domain for hours.
  - Mark provider status `blocked`.
  - Keep last known offers and set `stale=true`.

### Failure-safe behavior
- Parse error or blocked:
  - Do not wipe existing offers.
  - Store `errorMessage` and set `stale=true`.

---

## Provider Parsers (Robustness Strategy)

### General principles
- Prefer plain HTTP + HTML parsing.
- Avoid browser automation for routine scraping.
- Save sample HTML fixtures and add parser unit tests.

### Zomato
- Target a page where "Dining Offers" are visible (commonly restaurant `/info`).
- Extract offer blocks + labels (PRE-BOOK / INSTANT / BANK).

### Swiggy Dineout
- Target `/dineout` pages.
- Extract:
  - Pre-book offers
  - Walk-in offers
  - Additional offers (bank/coupon)

### Third provider
- Add once confirmed that the public web page exposes deals without login.

---

## Scheduling & Deployment

### Option A (free-first): GitHub Actions cron
- Nightly run (and later 2-4 times/day).
- Firestore service account JSON stored in GitHub Secrets.
- Runner executes the scraper.

### Option B: small VPS
- Cron job runs the scraper.
- Better control over IP reputation and long-running logs.

Avoid:
- Running scraping inside the app.

---

## Monitoring & QA

### Run logs
Create `scrapeRuns/{runId}`:
- startedAt, finishedAt
- counts: ok/blocked/parse_error/error
- per-provider breakdown

### Health rules
- If a provider suddenly returns 0 offers/huge parse errors across many places:
  - Treat as scraper breakage.
  - Do not overwrite existing offers.
  - Trigger an alert (email/Discord later).

### Spot checks
- Daily sample check: open source URL for 5-10 places and compare stored rawOfferTexts.
- Add a manual "Report wrong offer" in-app later to flag issues.

---

## Flutter Integration

### Read path
- Continue loading places from `places`.
- Load offers from `placeOffers/{placeId}`:
  - list view uses optional `places.dealsSummary`
  - detail view loads full `placeOffers` doc

### UI rules
- Show grouped offers by platform.
- Show `Last updated` and `Verify on <platform>` link.
- If `stale=true`, show a subtle stale label.

---

## Agentic Automation (Use as Support, Not Core)

Use an agentic browser bot for:
- Parser repair when pages change.
- Finding/fixing broken platform URLs.
- QA screenshots + comparison.

Do NOT use agents for daily bulk scraping (slow, fragile, inconsistent).

---

## Milestones
1) Firestore schema update: `platforms` on `places`, create `placeOffers`.
2) Build import script for platform URLs.
3) Build scraper skeleton: fetch + throttling + Firestore writer + run logs.
4) Implement Provider #1 (Zomato) with fixtures/tests.
5) Implement Provider #2 (Swiggy Dineout) with fixtures/tests.
6) Add scheduled runs (GitHub Actions or VPS) + health checks.
7) Add Flutter UI for offers.
8) Add Provider #3.
9) Scale: sharding + due-task logic + better monitoring.

---

## Open Questions
- Which 3 providers are in scope for V1 (besides Zomato + Swiggy Dineout)?
- What refresh cadence do you want (daily vs multiple times/day)?
- How will the updated list map to `places/{placeId}` (doc id vs slug matching)?
