Hyd Cafe Finder — NomadList‑style UI for Hyderabad hangouts.

What’s included
- Next.js 15 App Router, React 19, Tailwind v4
- Grid of cards with shadcn-style UI and dark mode toggle
- CSV-backed API at `/api/places` parsing `hyderabad_cafes_restaurants_pubs_bars_detailed_ratings.csv`
- Hover stats overlay and modal popup with detailed bars (no route navigation)

Getting started

1) Install deps
```powershell
pnpm install
# or
npm install
```

2) Run the dev server
```powershell
npm run dev
```

3) Open http://localhost:3000

Data
- Place your CSV at project root: `hyderabad_cafes_restaurants_pubs_bars_detailed_ratings.csv`
- The grid fetches from `/api/places` which parses the CSV on the server using PapaParse.
