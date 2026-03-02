# Fate of the Eight

A Formula 1 fantasy league web app. Participants draft constructors, assign drivers, and accumulate points based on real-world race results across a season.

**Live:** https://fate-of-the-eight.vercel.app/

## Features

- Season standings and points tracking per constructor
- Race-by-race points breakdown (table + cumulative chart)
- Driver detail pages with per-race point history
- Constructor detail pages with driver lineups and charts
- Driver swap management
- Draft selection interface
- Multi-season support (2022–2026)
- Automated weekly data sync from F1 race results via GitHub Actions

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 13 (Pages Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Images | Cloudinary |
| Analytics | Vercel Analytics + Speed Insights |
| Logging | Axiom (next-axiom) |
| Email | Mailgun |
| Data pipeline | Python + FastF1 |
| Hosting | Vercel |

## Project Structure

```
f1-fantasy-league/
├── client/                     # Next.js app
│   ├── components/             # Shared React components
│   ├── constants/              # Colors, config per season
│   ├── helpers/                # Utility functions (Cloudinary URLs, sorting, etc.)
│   ├── lib/                    # Supabase client
│   ├── pages/                  # Routes
│   │   ├── index.tsx           # Season selector homepage
│   │   └── [season]/
│   │       ├── standings.tsx
│   │       ├── race-points.tsx
│   │       ├── swap-drivers.tsx
│   │       ├── drivers/
│   │       ├── constructors/
│   │       └── races/
│   ├── public/                 # Static assets
│   ├── styles/                 # Global CSS
│   └── types/                  # TypeScript interfaces
├── supabase-data-generator/    # Python data pipeline
│   ├── generate-data.py        # Main sync script (FastF1 → Supabase)
│   └── requirements.txt
└── .github/workflows/
    ├── update_website_data.yaml   # Runs every Monday — syncs race results
    └── revalidate_pages.yaml      # Runs every Thursday — revalidates static pages
```

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- A [Supabase](https://supabase.com) project

### Environment Variables

Create `client/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally

```bash
cd client
yarn install
yarn dev
```

The app will be available at `http://localhost:3000`.

Other client scripts:

```bash
yarn build    # Production build
yarn start    # Start production server
yarn lint     # ESLint
yarn format   # Prettier (via pretty-quick)
```

## Database

Supabase (PostgreSQL) with the following tables:

| Table | Description |
|---|---|
| `season` | Each league season (year) |
| `constructor` | Fantasy constructors per season |
| `driver` | F1 drivers per season |
| `constructor_driver` | Driver assignments per constructor |
| `race` | Race calendar per season |
| `driver_race_result` | Points per driver per race |
| `draft` | Draft instances |
| `draft_selection` | Constructor picks per draft |
| `driver_transaction` | Driver swap history |

Key RPC functions: `sum_constructor_points_by_season`, `total_points_by_constructor_by_race`

## Data Pipeline

Race results are synced automatically each Monday via GitHub Actions using the [FastF1](https://github.com/theOehrly/Fast-F1) Python library.

To run manually from the repo root:

```bash
# Development
yarn update-standings:dev

# Production
yarn update-standings:prod
```

Required environment variables for the pipeline (set as GitHub Actions secrets):

```env
SUPABASE_SERVICE_ROLE_KEY=
MG_API_KEY=              # Mailgun API key for email notifications
SEASON=2026
```

## Automation

| Workflow | Schedule | Action |
|---|---|---|
| `update_website_data` | Mondays 10:00 UTC (+ manual) | Fetches race results, updates Supabase, sends email notification |
| `revalidate_pages` | Thursdays 10:00 UTC (+ manual) | Pings revalidation endpoint to refresh static pages |

## Images

Car and driver number images are served from Cloudinary under the path:

```
/f1-fantasy-league/{season}/cars/{constructor-name}.webp
/f1-fantasy-league/{season}/numbers/{constructor-name}.webp
```

URLs are generated at runtime from the constructor name and season — no image URLs are stored in the database.
