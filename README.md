# Geographic Analytics Dashboard

A modern analytics platform featuring an interactive choropleth map of the Philippines with real-time regional performance metrics.

## Features

- **Interactive Philippines Map**: SVG-based choropleth visualization of all 17 regions
- **Real-time Data**: Live connection to Supabase with automatic fallback
- **Multiple Metrics**: Toggle between Transactions, Revenue, and Store counts
- **Region Details**: Click any region for detailed performance metrics
- **Responsive Design**: Built with Tailwind CSS for all screen sizes

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev:next

# Access the dashboard
http://localhost:3000/geographic
```

## Tech Stack

- **Next.js 14** with TypeScript
- **React 18** with Hooks
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Supabase** for data backend

## Scout v5 Features

- **Gold-only data service** (views: `gold_recent_transactions`, `gold_kpi_overview`, `gold_brand_performance`; RPCs: `get_gold_recent_transactions`, `get_gold_recent_transactions_count`, `get_gold_brand_performance`, `get_gold_kpi_overview`, `get_master_filters`)
- **Master data** for filters/joins (`brands`, `categories`, `products`, `competitor_sets`, `geo_region`, `geo_place`, `stores`, `price_bands`, `time_dim`)
- **Faceted filters** with URL-synced **Global Filter Bar**
- **Pages**: home, live, brand, mix, behavior, profile, market, saved, insights, predict
- **Modules**: Saved Queries, AI Insight Templates, Predictive Metrics, ChartVision, LearnBot
- **Security**: RLS + role scopes; audit trail on RPCs
- **SLOs**: RPC p95 ≤ 250 ms, LCP p95 ≤ 2.5 s, error ≤ 0.5%
- **Observability**: PostHog, Sentry, function logs
- **Exports**: CSV tables, PNG charts

See **/docs/v5_features.json** for the machine-readable spec and **/docs/v5_checklist.md** for ship-blockers.