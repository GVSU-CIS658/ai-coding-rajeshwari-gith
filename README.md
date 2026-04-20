# StockPulse — AI Hackathon Project
**CIS 371 · GVSU · 2026**

A live stock watchlist and portfolio web app built with AI-assisted rapid development.

## Live Demo
🔗 Deployed at GitHub Pages (see URL above)

## Features
- **Live Stock Data** — Alpha Vantage API (`GLOBAL_QUOTE` + `TIME_SERIES_DAILY`)
- **Stock Search** — Search by ticker symbol with autocomplete
- **Watchlist** — Add/remove stocks, sparkline mini-charts, sector badges
- **Portfolio** — Holdings with P&L, allocation donut chart, 60-day equity curve
- **Stock Detail** — Interactive price chart (1W–1Y), volume bars, momentum gauge, 52-week range
- **Price Alerts** — Set above/below price alerts per stock
- **Market Dashboard** — Gainers/losers, sector heatmap, Bloomberg-style market heat map, news feed
- **Scrolling Ticker Tape** — Live price strip with real-time updates
- **Dark / Light Mode** — Persisted across sessions

## Stock Data API
**Alpha Vantage** — https://www.alphavantage.co
- Endpoint: `GLOBAL_QUOTE` for live price/change/volume
- Endpoint: `TIME_SERIES_DAILY` for 100-day price history
- Caching: sessionStorage (45s for quotes, 5min for history)
- Rate limiting: 13s pacing between requests (free tier = 5 req/min)

## AI Tools Used
- **Claude (Anthropic)** — UI design, component architecture, API integration, debugging
- Used for: planning, code generation, styling, Alpha Vantage integration, chart rendering

## Tech Stack
- React 18 (via CDN + Babel standalone) — prototype UI
- Alpha Vantage REST API
- Vanilla JS / CSS custom properties for theming
- GitHub Actions for CI/CD deployment

> **Note:** This is a hi-fi prototype demonstrating the full feature set.
> The Vue + Vue Router + Pinia version shares the same architecture and API integration pattern.

## What's Working
- ✅ Live stock data via Alpha Vantage (add API key in Settings)
- ✅ Stock search and watchlist management
- ✅ Portfolio P&L tracking
- ✅ Interactive price charts with volume
- ✅ Price alerts system
- ✅ Market heatmap and sector performance
- ✅ Dark/light mode
- ✅ GitHub Pages deployment

## Deployment Notes
- No build step required — fully browser-side
- Add your Alpha Vantage API key in the Settings page for live data
- Free API tier: 25 requests/day, 5 requests/minute
- App gracefully falls back to realistic simulated data if no key is set

## Setup
No installation needed. Open `index.html` in a browser or visit the GitHub Pages URL.

To use live stock data:
1. Get a free API key at https://www.alphavantage.co/support/#api-key
2. Open the app → Settings → paste your API key → Save
