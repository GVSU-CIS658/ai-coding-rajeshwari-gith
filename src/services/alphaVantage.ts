// Thin wrapper around Alpha Vantage with sessionStorage caching + rate-limit pacing.
// Free tier: 5 requests/minute, 25/day. We pace at 13s between calls and cache aggressively.

import { syntheticHistory, syntheticQuote } from '../data/stocks';

const BASE_URL = 'https://www.alphavantage.co/query';

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  source: 'live' | 'cache' | 'demo';
  fetchedAt: number;
}

export interface HistoryPoint {
  date: string;
  close: number;
}

const QUOTE_CACHE_KEY = (s: string) => `av_q_${s}`;
const HIST_CACHE_KEY = (s: string) => `av_h_${s}`;

function readCache<T>(key: string, maxAgeSec: number): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if ((Date.now() - ts) / 1000 > maxAgeSec) return null;
    return data as T;
  } catch {
    return null;
  }
}
function writeCache<T>(key: string, data: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    /* ignore */
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchQuote(symbol: string, apiKey: string, maxAgeSec = 45): Promise<Quote> {
  const sym = symbol.toUpperCase();
  const cached = readCache<Quote>(QUOTE_CACHE_KEY(sym), maxAgeSec);
  if (cached) return { ...cached, source: 'cache' };

  if (!apiKey) {
    const q = syntheticQuote(sym);
    return { ...q, source: 'demo', fetchedAt: Date.now() };
  }

  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${apiKey}`;
  const resp = await fetch(url);
  const json = await resp.json();
  const g = json['Global Quote'] || json['globalQuote'];

  if (!g || !g['05. price']) {
    // rate-limited or unknown symbol → fall back to demo
    const q = syntheticQuote(sym);
    return { ...q, source: 'demo', fetchedAt: Date.now() };
  }

  const price = parseFloat(g['05. price']);
  const change = parseFloat(g['09. change']);
  const changePct = parseFloat(String(g['10. change percent']).replace('%', ''));

  const quote: Quote = {
    symbol: sym,
    price,
    change,
    changePct,
    open: parseFloat(g['02. open']),
    high: parseFloat(g['03. high']),
    low: parseFloat(g['04. low']),
    volume: parseInt(g['06. volume'] || '0', 10),
    source: 'live',
    fetchedAt: Date.now(),
  };
  writeCache(QUOTE_CACHE_KEY(sym), quote);
  return quote;
}

export async function fetchHistory(
  symbol: string,
  apiKey: string,
  maxAgeSec = 600,
): Promise<HistoryPoint[]> {
  const sym = symbol.toUpperCase();
  const cached = readCache<HistoryPoint[]>(HIST_CACHE_KEY(sym), maxAgeSec);
  if (cached) return cached;

  if (!apiKey) return syntheticHistory(sym, 100);

  const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${sym}&outputsize=compact&apikey=${apiKey}`;
  const resp = await fetch(url);
  const json = await resp.json();
  const series = json['Time Series (Daily)'];
  if (!series) return syntheticHistory(sym, 100);

  const points: HistoryPoint[] = Object.entries(series)
    .map(([date, ohlc]: [string, any]) => ({
      date,
      close: parseFloat(ohlc['4. close']),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  writeCache(HIST_CACHE_KEY(sym), points);
  return points;
}

export async function fetchManyQuotes(
  symbols: string[],
  apiKey: string,
  onUpdate: (q: Quote) => void,
  onStatus?: (msg: string) => void,
): Promise<void> {
  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    onStatus?.(`Loading ${sym} (${i + 1}/${symbols.length})…`);
    try {
      const q = await fetchQuote(sym, apiKey);
      onUpdate(q);
    } catch {
      const q = syntheticQuote(sym);
      onUpdate({ ...q, source: 'demo', fetchedAt: Date.now() });
    }
    // Pace only when actually hitting the network for non-cached symbols
    if (apiKey && i < symbols.length - 1) {
      await sleep(13_000);
    }
  }
  onStatus?.('');
}
