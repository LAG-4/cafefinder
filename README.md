# Hyd Cafe Finder 

**A NomadList-style discovery platform for Hyderabad's best cafes, restaurants, bars, and hangout spots.**

## 🎯 What is Hyd Cafe Finder?

Hyd Cafe Finder is a curated discovery platform that helps you find the perfect spots to work, meet friends, or simply enjoy great food and drinks in Hyderabad. With a clean, data-driven interface inspired by NomadList, it showcases detailed ratings and information about the city's top cafes, restaurants, pubs, and bars.

## ✨ Current Features

### 🏗️ Technical Stack
- **Next.js 15** with App Router for modern React development
- **React 19** for cutting-edge component architecture
- **Tailwind v4** for responsive, utility-first styling
- **TypeScript** for type-safe development
- **shadcn/ui** components for consistent, accessible UI

### 🎨 User Experience
- **Grid-based layout** showcasing cafe cards with rich visual information
- **Dark/Light mode toggle** for comfortable browsing at any time
- **Interactive hover effects** revealing quick stats and ratings
- **Modal popups** with detailed information and rating breakdowns
- **Responsive design** optimized for desktop and mobile devices
- **Fast filtering and search** capabilities

### 📊 Data & Content
- **Comprehensive database** of Hyderabad's top 100+ cafes, restaurants, and bars
- **Multiple rating categories** including food quality, ambiance, service, and value
- **Location-based information** with area/neighborhood details
- **Real-time data** parsed from CSV backend
- **Rich metadata** including cuisine types, price ranges, and special features

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm package manager

### Installation

1) **Clone the repository**
```powershell
git clone https://github.com/LAG-4/cafefinder.git
cd cafefinder
```

2) **Install dependencies**
```powershell
pnpm install
# or
npm install
```

3) **Run the development server**
```powershell
npm run dev
```

4) **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
cafefinder/
├── app/                    # Next.js 15 App Router
│   ├── api/places/        # Backend API for data fetching
│   ├── place/[slug]/      # Individual place detail pages
│   ├── sections/          # Main grid components
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui component library
│   ├── CafeCard.tsx      # Individual cafe display cards
│   ├── FilterSidebar.tsx # Search and filter controls
│   └── TopBar.tsx        # Header navigation
├── lib/                  # Utilities and type definitions
├── public/               # Static assets and metadata
└── hyderabad_top_100_cafes_restaurants_bars_ranked.csv
```

## 📈 Data Source

The platform currently uses a curated CSV dataset (`hyderabad_top_100_cafes_restaurants_bars_ranked.csv`) containing:
- **Place names and locations**
- **Multiple rating dimensions** (food, ambiance, service, value)
- **Cuisine types and specialties**
- **Pricing information**
- **Neighborhood classifications**
- **Special features** (WiFi, outdoor seating, parking, etc.)

The data is served through `/api/places` endpoint which parses the CSV server-side using PapaParse for optimal performance.

## 🔮 Future Vision: Crowdsourced Platform

### The NomadList for Hyderabad Hangouts

We're building toward a **community-driven platform** where cafe enthusiasts, digital nomads, students, and locals can contribute to and benefit from collective knowledge about Hyderabad's food and social scene.

### 🌟 Planned Features

#### 👥 Community Contributions
- **User-generated reviews** with photo uploads
- **Real-time check-ins** and crowd density reporting
- **Personal rating systems** across multiple dimensions
- **Community-verified information** about amenities and features
- **Collaborative spot recommendations** based on preferences

#### 🎯 Smart Discovery
- **AI-powered recommendations** based on user preferences and behavior
- **Filter by work-friendliness** (WiFi quality, noise levels, power outlets)
- **Social matching** - find spots where like-minded people hang out
- **Event integration** - discover cafes hosting meetups, workshops, or social events
- **Mood-based suggestions** (studying, dates, business meetings, casual hangouts)

#### 📱 Enhanced Experience
- **Mobile app** with location-based notifications
- **Real-time updates** on wait times, available seating, and current ambiance
- **Social features** - follow reviewers with similar tastes
- **Loyalty integration** with participating cafes
- **Group planning tools** for organizing meetups

#### 🏆 Gamification & Community
- **Reviewer badges** and reputation systems
- **Local expert recognition** for consistent, helpful contributors
- **Monthly featured spots** based on community votes
- **Challenges and rewards** for exploring new places
- **Cafe owner engagement** tools for responding to feedback

### 🎨 Why NomadList-Inspired?

Just as NomadList revolutionized how digital nomads discover cities and coworking spaces, Hyd Cafe Finder aims to:
- **Democratize local knowledge** through community contributions
- **Provide data-driven insights** for better decision making
- **Build trust through transparency** in ratings and reviews
- **Create serendipitous discoveries** of hidden gems
- **Foster community connections** around shared spaces

## 🎁 Offers Aggregation

Hyd Cafe Finder includes a comprehensive **Trivago-style offers aggregation system** that fetches and compares live discounts from multiple platforms, providing users with the best deals available for each restaurant.

### How It Works

The offers system aggregates current discounts and promotions from major food delivery and dining platforms:

- **Supported Platforms**: Zomato, Swiggy (with extensible architecture for Dineout, EazyDiner, etc.)
- **Real-time Data**: Fetches fresh offers every 30 minutes with intelligent caching
- **Smart Ranking**: AI-powered scoring based on discount value, platform trust, and offer completeness
- **Graceful Fallbacks**: Continues to work even if individual platforms are unavailable

### Features

- **Offers Tab**: New tab on each place detail page showing current deals
- **Cross-platform Comparison**: See offers from all platforms in one place
- **Deep Linking**: "View on Platform" buttons redirect to the source app for redemption
- **Rate Limiting**: Respectful scraping with built-in rate limits and cooldowns
- **Caching**: 30-minute cache TTL for fast performance
- **Error Handling**: Robust error handling with provider-specific fallbacks

### Technical Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   UI Components │    │   API Routes     │    │   Provider System   │
│                 │    │                  │    │                     │
│ OffersTab       │◄──►│ /api/offers/     │◄──►│ ZomatoProvider      │
│ OfferCard       │    │ [slug]           │    │ SwiggyProvider      │
│ Badge Count     │    │                  │    │ DineoutProvider     │
│                 │    │ /_revalidate     │    │ [Future Providers]  │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │   Core Services      │
                    │                      │
                    │ • Mapping System     │
                    │ • Caching Layer      │
                    │ • Ranking Engine     │
                    │ • Rate Limiting      │
                    │ • Error Handling     │
                    └──────────────────────┘
```

### Environment Configuration

Create a `.env.local` file with these variables:

```bash
# Offers Configuration
OFFERS_CACHE_PROVIDER=memory          # memory | redis
OFFERS_TTL_MINUTES=30                 # Cache duration
PROVIDERS_ENABLED=zomato,swiggy       # Active platforms
ADMIN_TOKEN=your-admin-token          # For force refresh

# Optional Redis (for production)
REDIS_URL=redis://localhost:6379

# Scraping Limits
SCRAPE_BLOCK_COOLDOWN_MIN=30          # Cooldown on errors
SCRAPE_MAX_PARALLEL=2                 # Concurrent requests
```

### Usage Examples

**Basic Offers Fetch**:
```bash
curl https://cafefinder-hyd.vercel.app/api/offers/hard-rock-cafe
```

**Force Refresh** (Admin only):
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://cafefinder-hyd.vercel.app/api/offers/hard-rock-cafe?refresh=true
```

**Cache Warming**:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"warmPopular": true}' \
  https://cafefinder-hyd.vercel.app/api/offers/_revalidate
```

### Adding New Providers

1. **Create Provider Class**:
```typescript
// lib/offers/providers/newplatform.ts
export class NewPlatformProvider extends BaseOfferProvider {
  platform = 'newplatform' as const;
  
  async fetchOffers(input: OfferProviderInput): Promise<ProviderResult> {
    // Implementation
  }
}
```

2. **Update Types**:
```typescript
// lib/offers/types.ts
export type Platform = 'zomato' | 'swiggy' | 'newplatform' | ...;
```

3. **Register Provider**:
```typescript
// lib/offers/service.ts
const providers = {
  zomato: zomatoProvider,
  swiggy: swiggyProvider,
  newplatform: newPlatformProvider,
  // ...
};
```

4. **Add Mappings**:
```json
// lib/offers/mapping/mappings.json
[
  {
    "placeSlug": "example-cafe",
    "platform": "newplatform",
    "url": "https://newplatform.com/...",
    "confidence": 1.0
  }
]
```

### Development Commands

```bash
# Run tests
npm test

# Validate mappings
npm run validate-mappings

# Check mapping URLs
npm run validate-mappings -- --check-urls

# Type checking
npm run typecheck

# Development server
npm run dev
```

### Operational Notes

- **Caching**: Uses in-memory LRU cache by default; Redis recommended for production
- **Rate Limiting**: 6 requests/minute per platform with burst allowance
- **Error Handling**: Exponential backoff with 30-minute cooldowns on persistent failures
- **Monitoring**: Use `/api/offers/_revalidate` (GET) for runtime stats
- **Data Quality**: Manual mappings override fuzzy matching for accuracy

### Maintenance

- **Update Mappings**: Regularly verify and update platform URLs in `mappings.json`
- **Monitor Logs**: Check provider errors and adjust selectors as platforms change
- **Performance**: Monitor cache hit rates and API response times
- **Scaling**: Consider Redis and distributed caching for high traffic

---

## 🤝 Contributing

We welcome contributions from developers, designers, and cafe enthusiasts! Whether you want to:
- Add new features or improve existing ones
- Contribute to the data collection and verification
- Help with UI/UX design and user experience
- Share feedback and suggestions for the platform

Please feel free to open issues, submit pull requests, or reach out with ideas.

## 📧 Contact & Feedback

- **GitHub**: [github.com/LAG-4/cafefinder](https://github.com/LAG-4/cafefinder)
- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join community discussions about Hyderabad's cafe scene

---

**Built with ❤️ for the Hyderabad community**

*Discover your next favorite hangout spot, one cafe at a time.*
