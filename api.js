/**
 * AlphaVantage API wrapper
 * - GLOBAL_QUOTE  : live price / change / volume
 * - TIME_SERIES_DAILY : 100-day closing-price history
 * Caches in sessionStorage so reloads don't burn quota.
 * Free tier: 25 req/day, 5 req/min  →  we pace at 1 per 13 s.
 */
(function () {
  'use strict';
  const BASE = 'https://www.alphavantage.co/query';
  const mem  = {};   // in-memory layer on top of sessionStorage

  /* ── cache ─────────────────────────────────────────────── */
  function cRead(key, maxSec) {
    const hit = mem[key];
    if (hit && Date.now() - hit.ts < maxSec * 1000) return hit.data;
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (Date.now() - obj.ts < maxSec * 1000) { mem[key] = obj; return obj.data; }
    } catch {}
    return null;
  }
  function cWrite(key, data) {
    const obj = { data, ts: Date.now() };
    mem[key] = obj;
    try { sessionStorage.setItem(key, JSON.stringify(obj)); } catch {}
  }

  /* ── helpers ────────────────────────────────────────────── */
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function fmtVol(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return String(n);
  }

  function checkRateLimit(json) {
    if (json['Note'] || json['Information'])
      throw Object.assign(new Error('rate_limit'), { code: 'rate_limit' });
  }

  /* ── GLOBAL_QUOTE ───────────────────────────────────────── */
  async function fetchQuote(symbol, apiKey, maxAgeSec = 45) {
    const key = `av_q_${symbol}`;
    const hit = cRead(key, maxAgeSec);
    if (hit) return { ...hit, _cached: true };

    const url = `${BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    checkRateLimit(json);

    const q = json['Global Quote'];
    if (!q || !q['05. price']) throw Object.assign(new Error('no_data'), { code: 'no_data' });

    const pct = parseFloat((q['10. change percent'] || '0').replace('%', ''));
    const data = {
      price:       parseFloat(q['05. price'])  || 0,
      open:        parseFloat(q['02. open'])   || 0,
      high:        parseFloat(q['03. high'])   || 0,
      low:         parseFloat(q['04. low'])    || 0,
      change:      parseFloat(q['09. change']) || 0,
      pct,
      volume:      fmtVol(parseInt(q['06. volume']) || 0),
      lastUpdated: q['07. latest trading day'] || '',
    };
    cWrite(key, data);
    return data;
  }

  /* ── TIME_SERIES_DAILY ──────────────────────────────────── */
  async function fetchHistory(symbol, apiKey, maxAgeSec = 300) {
    const key = `av_h_${symbol}`;
    const hit = cRead(key, maxAgeSec);
    if (hit) return hit;

    const url = `${BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}&outputsize=compact`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    checkRateLimit(json);

    const series = json['Time Series (Daily)'];
    if (!series) throw Object.assign(new Error('no_data'), { code: 'no_data' });

    // Sort ascending, return closing prices
    const closes = Object.entries(series)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => parseFloat(v['4. close']));

    cWrite(key, closes);
    return closes;
  }

  /* ── Batch watchlist quotes with rate-limit pacing ─────── */
  /**
   * @param {string[]} symbols
   * @param {string}   apiKey
   * @param {(sym: string, quote: object) => void} onUpdate   called per symbol
   * @param {(status: string) => void}              onStatus  'fetching'|'live'|'rate_limited'|'error'
   */
  async function fetchWatchlist(symbols, apiKey, onUpdate, onStatus) {
    if (!apiKey || !symbols.length) return;
    onStatus('fetching');
    let ok = 0;

    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      try {
        const q = await fetchQuote(sym, apiKey);
        onUpdate(sym, q);
        ok++;
        onStatus('live:' + ok + '/' + symbols.length);
        // Only pace if not served from cache
        if (!q._cached && i < symbols.length - 1) await sleep(13000);
      } catch (e) {
        console.warn('[AV] ' + sym + ':', e.message);
        if (e.code === 'rate_limit') { onStatus('rate_limited'); return; }
        // other errors (network, no_data) → skip symbol
      }
    }

    onStatus(ok > 0 ? 'live' : 'error');
  }

  window.AlphaVantage = { fetchQuote, fetchHistory, fetchWatchlist };
})();
