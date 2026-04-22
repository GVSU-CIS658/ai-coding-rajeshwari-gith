// Static reference data + realistic seed prices for demo / fallback when no API key.
// Real prices come from Alpha Vantage at runtime.

export interface StockMeta {
  symbol: string;
  name: string;
  sector: string;
  seedPrice: number;
}

export const STOCK_UNIVERSE: StockMeta[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', seedPrice: 178.42 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', seedPrice: 412.18 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', seedPrice: 154.90 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Disc.', seedPrice: 182.30 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Technology', seedPrice: 488.75 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', seedPrice: 902.50 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Disc.', seedPrice: 175.20 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', seedPrice: 162.40 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', seedPrice: 198.55 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', seedPrice: 278.90 },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication', seedPrice: 612.40 },
  { symbol: 'COIN', name: 'Coinbase Global', sector: 'Financials', seedPrice: 222.80 },
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'Technology', seedPrice: 24.60 },
  { symbol: 'INTC', name: 'Intel Corp.', sector: 'Technology', seedPrice: 38.20 },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', seedPrice: 60.10 },
  { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Communication', seedPrice: 112.30 },
  { symbol: 'PYPL', name: 'PayPal Holdings', sector: 'Financials', seedPrice: 64.20 },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Financials', seedPrice: 36.40 },
];

export function findStock(symbol: string): StockMeta | undefined {
  return STOCK_UNIVERSE.find((s) => s.symbol === symbol.toUpperCase());
}

// Seeded RNG so the synthetic data is stable across reloads (fallback only)
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function syntheticHistory(symbol: string, days = 100): { date: string; close: number }[] {
  const meta = findStock(symbol);
  const base = meta ? meta.seedPrice : 100;
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRand(seed);
  const out: { date: string; close: number }[] = [];
  let price = base * 0.85;
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const drift = 0.0008;
    const vol = 0.018;
    const change = drift + (rand() - 0.5) * vol * 2;
    price = price * (1 + change);
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), close: Math.round(price * 100) / 100 });
  }
  // anchor last close near seed
  const last = out[out.length - 1];
  const target = base + (rand() - 0.5) * base * 0.04;
  const ratio = target / last.close;
  out.forEach((p) => (p.close = Math.round(p.close * ratio * 100) / 100));
  return out;
}

export function syntheticQuote(symbol: string): {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
} {
  const hist = syntheticHistory(symbol, 2);
  const prev = hist[0].close;
  const close = hist[1].close;
  const change = close - prev;
  const changePct = (change / prev) * 100;
  const high = close * 1.012;
  const low = close * 0.988;
  return {
    symbol,
    price: Math.round(close * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
    open: Math.round(prev * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    volume: Math.floor(20_000_000 + Math.random() * 60_000_000),
  };
}

export const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'META', 'NFLX', 'COIN'];

export const DEFAULT_PORTFOLIO = [
  { symbol: 'AAPL', shares: 50, avgCost: 152.30 },
  { symbol: 'NVDA', shares: 15, avgCost: 612.44 },
  { symbol: 'MSFT', shares: 20, avgCost: 378.50 },
  { symbol: 'TSLA', shares: 30, avgCost: 195.80 },
  { symbol: 'META', shares: 12, avgCost: 445.20 },
  { symbol: 'AMZN', shares: 25, avgCost: 168.90 },
];

export const DEFAULT_ALERTS = [
  { id: 'a1', symbol: 'AAPL', direction: 'above' as const, price: 180 },
  { id: 'a2', symbol: 'TSLA', direction: 'below' as const, price: 160 },
  { id: 'a3', symbol: 'NVDA', direction: 'above' as const, price: 950 },
];
