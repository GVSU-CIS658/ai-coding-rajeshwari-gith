# StockPulse — Live Stock Watchlist & Portfolio

**CIS 371 · GVSU · AI Hackathon 2026**

A single-page stock watchlist and portfolio tracker built with Vue 3, with live
quotes from the Alpha Vantage API.

## Live Demo

Deployed via GitHub Pages — see the repo's Pages URL.

## Features

- **Dashboard** — portfolio KPIs, top gainers/losers, sector performance summary
- **Watchlist** — add / remove / refresh symbols, live price table
- **Portfolio** — holdings with market value, cost basis, gain/loss, weighted-avg
  cost basis when buying more shares, allocation doughnut chart, 60-day value
  history line chart
- **Stock Detail** — per-symbol page with live quote, range selector (1W–1Y),
  price history chart, period stats
- **Price Alerts** — above/below triggers per symbol, live status
- **Settings** — Alpha Vantage API key, theme toggle, cache clear
- **Ticker Tape** — scrolling live price strip across the top
- **Dark / Light Mode** — persisted in localStorage

## Tech Stack

- **Vue 3** (Composition API + `<script setup>`) + TypeScript
- **Vue Router 4** (hash history, works on GitHub Pages with no server config)
- **Pinia** for state management (watchlist, portfolio, alerts, quotes, settings)
- **Chart.js** + **vue-chartjs** for price and allocation charts
- **Vite** for dev/build
- **Alpha Vantage** REST API (`GLOBAL_QUOTE`, `TIME_SERIES_DAILY`)
- **GitHub Actions** for CI/CD (build Vite → deploy to Pages)

## API Integration

Alpha Vantage free tier limits (5 req/min, 25/day) are handled by:

- `sessionStorage` caching — quotes cached 45s, history 10min
- 13s pacing between network calls when refreshing a batch
- Graceful fallback to seeded synthetic prices when no API key is set or when
  the rate limit is hit

## Running Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/` and is deployed to GitHub Pages by the workflow in
`.github/workflows/deploy.yml`.

## AI Assistance

This project was built with help from Claude (Anthropic) — used for planning the
component architecture, scaffolding Vue/Pinia boilerplate, writing the Alpha
Vantage wrapper with caching + rate-limit pacing, and styling. All code was
reviewed before commit.
