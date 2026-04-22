<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useQuotesStore } from '../stores/quotes';
import { usePortfolioStore } from '../stores/portfolio';
import { useWatchlistStore } from '../stores/watchlist';
import { useAlertsStore } from '../stores/alerts';
import { useSettingsStore } from '../stores/settings';
import { STOCK_UNIVERSE, findStock } from '../data/stocks';

const quotes = useQuotesStore();
const portfolio = usePortfolioStore();
const watchlist = useWatchlistStore();
const alerts = useAlertsStore();
const settings = useSettingsStore();

const allSymbols = computed(() => {
  const set = new Set<string>([
    ...portfolio.symbols,
    ...watchlist.symbols,
    ...STOCK_UNIVERSE.slice(0, 10).map((s) => s.symbol),
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

const triggeredAlerts = computed(() => {
  const qMap: Record<string, { price: number }> = {};
  for (const [sym, q] of Object.entries(quotes.bySymbol)) qMap[sym] = { price: q.price };
  return alerts.checkTriggered(qMap);
});

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

const showBanner = ref(!settings.apiKey);
</script>

<template>
  <div>
    <h1>Market Dashboard</h1>

    <div v-if="showBanner" class="card" style="margin-bottom: 18px; border-color: var(--accent)">
      <div class="row between">
        <div>
          <strong>Demo mode.</strong>
          <span class="muted">
            No Alpha Vantage API key set — prices are simulated. Add a free key in
          </span>
          <RouterLink to="/settings">Settings</RouterLink>
          <span class="muted"> for live quotes.</span>
        </div>
        <button @click="showBanner = false">Dismiss</button>
      </div>
    </div>

    <div class="grid cols-4" style="margin-bottom: 20px">
      <div class="card kpi">
        <div class="kpi-label">Portfolio Value</div>
        <div class="kpi-value mono">${{ fmt(portfolioValue, 2) }}</div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">Today's P&amp;L</div>
        <div class="kpi-value mono" :class="portfolioPL >= 0 ? 'pos' : 'neg'">
          {{ portfolioPL >= 0 ? '+' : '' }}${{ fmt(portfolioPL, 2) }}
        </div>
        <div class="muted mono" style="font-size: 13px">
          {{ portfolioPL >= 0 ? '+' : '' }}{{ fmt(portfolioPLPct, 2) }}%
        </div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">Watchlist</div>
        <div class="kpi-value mono">{{ watchlist.symbols.length }}</div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">Active Alerts</div>
        <div class="kpi-value mono">
          {{ alerts.alerts.length }}
          <span v-if="triggeredAlerts.length" class="mono pos" style="font-size: 13px; margin-left: 8px">
            ({{ triggeredAlerts.length }} triggered)
          </span>
        </div>
      </div>
    </div>

    <div class="grid cols-2" style="margin-bottom: 20px">
      <div class="card">
        <h2>Top Gainers</h2>
        <table>
          <tbody>
            <tr v-for="q in movers.gainers" :key="q.symbol">
              <td>
                <RouterLink :to="{ name: 'stock', params: { symbol: q.symbol } }" class="mono" style="font-weight: 600">
                  {{ q.symbol }}
                </RouterLink>
              </td>
              <td class="muted">{{ findStock(q.symbol)?.name || '' }}</td>
              <td class="mono">${{ fmt(q.price) }}</td>
              <td class="mono pos">+{{ fmt(q.changePct) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h2>Top Losers</h2>
        <table>
          <tbody>
            <tr v-for="q in movers.losers" :key="q.symbol">
              <td>
                <RouterLink :to="{ name: 'stock', params: { symbol: q.symbol } }" class="mono" style="font-weight: 600">
                  {{ q.symbol }}
                </RouterLink>
              </td>
              <td class="muted">{{ findStock(q.symbol)?.name || '' }}</td>
              <td class="mono">${{ fmt(q.price) }}</td>
              <td class="mono neg">{{ fmt(q.changePct) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Sector Performance (avg %)</h2>
      <div class="grid cols-3" style="margin-top: 8px">
        <div v-for="s in sectorPerf" :key="s.sector" class="card" style="padding: 12px">
          <div class="muted" style="font-size: 12px">{{ s.sector }}</div>
          <div class="mono" :class="s.avg >= 0 ? 'pos' : 'neg'" style="font-size: 18px; font-weight: 700">
            {{ s.avg >= 0 ? '+' : '' }}{{ fmt(s.avg) }}%
          </div>
        </div>
      </div>
    </div>

    <div v-if="quotes.status" class="status-pill mono" style="margin-top: 18px; display: inline-block">
      {{ quotes.status }}
    </div>
  </div>
</template>
