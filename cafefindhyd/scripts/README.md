# Scraper scripts

## Setup

1. Create a virtual environment.
2. Install dependencies:

```
pip install -r scripts/requirements.txt
```

## Import provider URLs

Expected CSV columns:

- placeId or slug
- zomato
- swiggy_dineout
- eazydiner
- dineout

Run:

```
python -m scripts.import_platform_urls path/to/updated_list.csv \
  --credentials /path/to/service-account.json
```

## Run scraper

```
python -m scripts.scraper.scraper \
  --credentials /path/to/service-account.json
```

Add `--force` to override refresh windows.

## If CSV already imported to Firestore

If your `places` docs already have fields like `Zomato` / `Swiggy` / `Dineout`,
run this once to backfill `platforms.*.url`:

```
python -m scripts.migrate_platform_fields --credentials /path/to/service-account.json
```

## Quick check (no Firestore)

```
python -m scripts.scraper.quick_check
```

Add `--pair provider=url` to test specific URLs.
