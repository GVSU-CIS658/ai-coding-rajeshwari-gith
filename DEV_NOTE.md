# Development Note — StockPulse (Vue)

## AI tools used
- Claude (Anthropic) — planning, Vue/Pinia scaffolding, Alpha Vantage wrapper,
  Chart.js integration, styling, debugging.
- All generated code was reviewed before commit.

## Stock data service
- **Alpha Vantage** — https://www.alphavantage.co
  - `GLOBAL_QUOTE` → live price / change / % / volume / day high/low
  - `TIME_SERIES_DAILY` → 100 trading days of close history (used for detail
    chart and the 60-day portfolio value chart)
  - Free tier: 25 requests/day, 5 requests/minute
  - Client-side `sessionStorage` caching: 45s for quotes, 10min for histories
  - 13-second pacing between network calls to respect the 5 req/min limit
  - Graceful fallback to deterministic seeded synthetic data when no key is set
    or the daily quota is exhausted

## Vue ecosystem
- **Vue 3** — Composition API with `<script setup>`, TypeScript
- **Vue Router 4** — hash history for GitHub Pages SPA support
  - Routes: `/`, `/watchlist`, `/portfolio`, `/alerts`, `/settings`, `/stock/:symbol`
- **Pinia** — separate stores for concerns:
  - `settings` (theme + API key, persisted to `localStorage`)
  - `watchlist` (persisted symbols list)
  - `portfolio` (holdings with weighted-avg cost basis, persisted)
  - `alerts` (above/below triggers, persisted)
  - `quotes` (live price cache, indexed by symbol)
- **Vite** — build tool; `npm run build` produces `dist/` which is deployed

## What's working
- Live stock data via Alpha Vantage when an API key is entered in Settings
- Simulated fallback so the app is fully usable without a key
- Stock search autocomplete by ticker or company name
- Watchlist — add / remove / refresh, persisted
- Portfolio — add positions with weighted-avg cost basis, live P&L, allocation
  doughnut chart, 60-day portfolio value line chart
- Stock detail page — live quote, 1W / 1M / 3M / 6M / 1Y range selector, price
  history line chart, period stats
- Price alerts — above/below per symbol, triggered state against current price
- Dashboard — portfolio KPIs, top 5 gainers / losers, sector performance grid,
  active-alert counter
- Scrolling ticker tape with CSS-keyframe animation
- Dark / light theme toggle persisted across sessions

## Limitations
- Alpha Vantage free tier caps at 25 req/day and 5 req/min. Large watchlists
  pace slowly. `sessionStorage` cache and pacing mitigate this.
- The search autocomplete looks within a curated ~18-ticker universe (not a
  full exchange symbol search).
- `TIME_SERIES_DAILY` with `outputsize=compact` returns ~100 trading days;
  longer charts fall back to deterministic synthetic history.

## Deployment
- GitHub Actions workflow in `.github/workflows/deploy.yml`
- Build step: `npm install && npm run build`
- Publishes `dist/` to GitHub Pages
- `vite.config.ts` sets `base: '/ai-coding-rajeshwari-gith/'` so asset paths
  resolve correctly under the repo subpath
