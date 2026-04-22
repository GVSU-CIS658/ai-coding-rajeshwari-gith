<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useQuotesStore } from '../stores/quotes';
import { usePortfolioStore } from '../stores/portfolio';
import { useWatchlistStore } from '../stores/watchlist';
import { useAlertsStore } from '../stores/alerts';
import { useSettingsStore } from '../stores/settings';
import { STOCK_UNIVERSE, findStock } from '../data/stocks';
import StockCard from '../components/StockCard.vue';

const quotes = useQuotesStore();
const portfolio = usePortfolioStore();
const watchlist = useWatchlistStore();
const alerts = useAlertsStore();
const settings = useSettingsStore();

const hotSymbols = computed(() => {
  const set = new Set<string>([
    ...watchlist.symbols.slice(0, 4),
    ...portfolio.symbols.slice(0, 4),
    ...STOCK_UNIVERSE.slice(0, 8).map((s) => s.symbol),
  ]);
  return [...set].slice(0, 8);
});

const allSymbols = computed(() => {
  const set = new Set<string>([
    ...portfolio.symbols,
    ...watchlist.symbols,
    ...STOCK_UNIVERSE.slice(0, 12).map((s) => s.symbol),
  ]);
  return [...set];
});

onMounted(async () => {
  const missing = allSymbols.value.filter((s) => !quotes.get(s));
  if (missing.length) await quotes.refreshMany(missing);
});

const portfolioValue = computed(() =>
  portfolio.holdings.reduce((sum, h) => {
    const q = quotes.get(h.symbol);
    return sum + (q ? q.price * h.shares : h.avgCost * h.shares);
  }, 0),
);
const portfolioCost = computed(() =>
  portfolio.holdings.reduce((sum, h) => sum + h.avgCost * h.shares, 0),
);
const portfolioPL = computed(() => portfolioValue.value - portfolioCost.value);
const portfolioPLPct = computed(() =>
  portfolioCost.value ? (portfolioPL.value / portfolioCost.value) * 100 : 0,
);

const movers = computed(() => {
  const qs = allSymbols.value
    .map((s) => quotes.get(s))
    .filter((q): q is NonNullable<typeof q> => !!q);
  const sorted = [...qs].sort((a, b) => b.changePct - a.changePct);
  return {
    gainers: sorted.slice(0, 5),
    losers: sorted.slice(-5).reverse(),
  };
});

const marketStatus = computed(() => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && hour >= 9 && hour < 16;
  return { isOpen, now };
});

const greeting = computed(() => {
  const h = marketStatus.value.now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
});

const triggeredAlerts = computed(() => {
  const qMap: Record<string, { price: number }> = {};
  for (const [sym, q] of Object.entries(quotes.bySymbol)) qMap[sym] = { price: q.price };
  return alerts.checkTriggered(qMap);
});

const sectorPerf = computed(() => {
  const by: Record<string, { total: number; count: number }> = {};
  for (const sym of allSymbols.value) {
    const q = quotes.get(sym);
    const meta = findStock(sym);
    if (!q || !meta) continue;
    if (!by[meta.sector]) by[meta.sector] = { total: 0, count: 0 };
    by[meta.sector].total += q.changePct;
    by[meta.sector].count += 1;
  }
  return Object.entries(by)
    .map(([sector, { total, count }]) => ({ sector, avg: count ? total / count : 0 }))
    .sort((a, b) => b.avg - a.avg);
});

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function timeStr() {
  return marketStatus.value.now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const showBanner = ref(!settings.apiKey);
</script>

<template>
  <div>
    <!-- Hero -->
    <div class="row between wrap" style="margin-bottom: 36px; align-items: flex-start; gap: 24px">
      <div>
        <h1 class="display hero">
          {{ greeting }},<br />
          <em>Trader.</em>
        </h1>
        <div class="subtitle" style="margin-top: 12px">
          {{ marketStatus.now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
          · <span :class="marketStatus.isOpen ? 'pos' : 'muted'">
            Market {{ marketStatus.isOpen ? 'open' : 'closed' }}
          </span>
        </div>
      </div>

      <div class="card" style="padding: 14px 18px; min-width: 240px">
        <div class="row" style="gap: 10px; margin-bottom: 4px">
          <span class="pill" :class="marketStatus.isOpen ? 'live' : ''" style="font-family: 'Space Grotesk'; font-weight: 600">
            {{ marketStatus.isOpen ? 'LIVE' : 'CLOSED' }}
          </span>
          <span class="mono muted" style="font-size: 12px">{{ timeStr() }} EDT</span>
        </div>
        <div class="muted" style="font-size: 12px">
          {{ marketStatus.isOpen ? 'Trading in session' : 'Opens Mon–Fri 9:30 AM ET' }}
        </div>
      </div>
    </div>

    <div v-if="showBanner" class="card" style="margin-bottom: 24px">
      <div class="row between">
        <div style="font-size: 13px">
          <strong>Demo mode</strong>
          <span class="muted"> — prices simulated. Add a free Alpha Vantage key in </span>
          <RouterLink to="/settings" style="color: var(--accent)">Settings</RouterLink>
          <span class="muted"> for live quotes.</span>
        </div>
        <button class="ghost" @click="showBanner = false">✕</button>
      </div>
    </div>

    <!-- KPI row -->
    <div class="grid cols-4" style="margin-bottom: 32px">
      <div class="kpi">
        <div class="kpi-label">Portfolio Value</div>
        <div class="kpi-value">${{ fmt(portfolioValue) }}</div>
        <div class="kpi-sub" :class="portfolioPL >= 0 ? 'pos' : 'neg'">
          {{ portfolioPL >= 0 ? '+' : '' }}${{ fmt(portfolioPL) }}
          ({{ portfolioPLPct >= 0 ? '+' : '' }}{{ fmt(portfolioPLPct) }}%)
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Gainers</div>
        <div class="kpi-value pos">{{ movers.gainers.filter((g) => g.changePct > 0).length }}</div>
        <div class="kpi-sub">of {{ allSymbols.length }} tracked</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Losers</div>
        <div class="kpi-value neg">{{ movers.losers.filter((l) => l.changePct < 0).length }}</div>
        <div class="kpi-sub">of {{ allSymbols.length }} tracked</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Active Alerts</div>
        <div class="kpi-value">{{ alerts.alerts.length }}</div>
        <div class="kpi-sub" :class="triggeredAlerts.length ? 'pos' : ''">
          {{ triggeredAlerts.length }} triggered
        </div>
      </div>
    </div>

    <!-- Hot stocks -->
    <div class="section-head">
      <h2>Hot Stocks</h2>
      <RouterLink to="/watchlist" class="link">Open Watchlist →</RouterLink>
    </div>

    <div class="grid cols-4" style="margin-bottom: 36px">
      <StockCard
        v-for="sym in hotSymbols"
        :key="sym"
        :symbol="sym"
        :quote="quotes.get(sym)"
      />
    </div>

    <!-- Movers table + sectors -->
    <div class="grid cols-2" style="margin-bottom: 32px">
      <div class="card">
        <div class="section-head" style="margin-bottom: 8px">
          <h2 style="font-size: 16px">Top Gainers</h2>
          <span class="badge">Today</span>
        </div>
        <table>
          <tbody>
            <tr v-for="q in movers.gainers" :key="q.symbol">
              <td>
                <RouterLink :to="{ name: 'stock', params: { symbol: q.symbol } }" class="mono" style="font-weight: 700; color: var(--text)">
                  {{ q.symbol }}
                </RouterLink>
              </td>
              <td class="muted" style="font-size: 12.5px">{{ findStock(q.symbol)?.name || '' }}</td>
              <td class="mono" style="text-align: right">${{ fmt(q.price) }}</td>
              <td style="text-align: right">
                <span class="pill pos">▲ {{ fmt(q.changePct) }}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="section-head" style="margin-bottom: 8px">
          <h2 style="font-size: 16px">Top Losers</h2>
          <span class="badge">Today</span>
        </div>
        <table>
          <tbody>
            <tr v-for="q in movers.losers" :key="q.symbol">
              <td>
                <RouterLink :to="{ name: 'stock', params: { symbol: q.symbol } }" class="mono" style="font-weight: 700; color: var(--text)">
                  {{ q.symbol }}
                </RouterLink>
              </td>
              <td class="muted" style="font-size: 12.5px">{{ findStock(q.symbol)?.name || '' }}</td>
              <td class="mono" style="text-align: right">${{ fmt(q.price) }}</td>
              <td style="text-align: right">
                <span class="pill neg">▼ {{ fmt(Math.abs(q.changePct)) }}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="section-head" style="margin-bottom: 14px">
        <h2 style="font-size: 16px">Sector Performance</h2>
        <span class="badge">Avg % Change</span>
      </div>
      <div class="grid cols-3">
        <div v-for="s in sectorPerf" :key="s.sector" class="card hover" style="padding: 14px; background: var(--surface-2)">
          <div class="kpi-label" style="margin-bottom: 6px">{{ s.sector }}</div>
          <div class="mono" :class="s.avg >= 0 ? 'pos' : 'neg'" style="font-size: 20px; font-weight: 700">
            {{ s.avg >= 0 ? '+' : '' }}{{ fmt(s.avg) }}%
          </div>
        </div>
      </div>
    </div>

    <div v-if="quotes.status" class="status-pill" style="margin-top: 24px; display: inline-block">
      {{ quotes.status }}
    </div>
  </div>
</template>
