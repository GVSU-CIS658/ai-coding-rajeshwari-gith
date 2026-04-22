<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { usePortfolioStore } from '../stores/portfolio';
import { useQuotesStore } from '../stores/quotes';
import { useSettingsStore } from '../stores/settings';
import { findStock } from '../data/stocks';
import { fetchHistory } from '../services/alphaVantage';
import AllocationChart from '../components/AllocationChart.vue';
import PriceChart from '../components/PriceChart.vue';

const portfolio = usePortfolioStore();
const quotes = useQuotesStore();
const settings = useSettingsStore();

const newHolding = ref({ symbol: '', shares: 0, avgCost: 0 });
const portfolioHistory = ref<{ date: string; close: number }[]>([]);
const loadingHistory = ref(false);

onMounted(async () => {
  const missing = portfolio.symbols.filter((s) => !quotes.get(s));
  if (missing.length) await quotes.refreshMany(missing);
  await computePortfolioHistory();
});

async function computePortfolioHistory() {
  if (!portfolio.holdings.length) return;
  loadingHistory.value = true;
  // Use synthetic/cached history for each holding to keep this fast.
  // For live, each TIME_SERIES_DAILY hit costs an API call — cache handles repeat.
  const histories = await Promise.all(
    portfolio.holdings.map((h) => fetchHistory(h.symbol, settings.apiKey)),
  );
  // Align by last 60 dates of the shortest series
  const minLen = Math.min(...histories.map((h) => h.length));
  const days = Math.min(60, minLen);
  const out: { date: string; close: number }[] = [];
  for (let i = minLen - days; i < minLen; i++) {
    let total = 0;
    let date = '';
    for (let j = 0; j < histories.length; j++) {
      const pt = histories[j][i];
      total += pt.close * portfolio.holdings[j].shares;
      date = pt.date;
    }
    out.push({ date, close: Math.round(total * 100) / 100 });
  }
  portfolioHistory.value = out;
  loadingHistory.value = false;
}

const rows = computed(() =>
  portfolio.holdings.map((h) => {
    const q = quotes.get(h.symbol);
    const price = q ? q.price : h.avgCost;
    const marketValue = price * h.shares;
    const costBasis = h.avgCost * h.shares;
    const gain = marketValue - costBasis;
    const gainPct = costBasis ? (gain / costBasis) * 100 : 0;
    return {
      ...h,
      meta: findStock(h.symbol),
      quote: q,
      price,
      marketValue,
      costBasis,
      gain,
      gainPct,
    };
  }),
);

const totals = computed(() => {
  const marketValue = rows.value.reduce((s, r) => s + r.marketValue, 0);
  const costBasis = rows.value.reduce((s, r) => s + r.costBasis, 0);
  const gain = marketValue - costBasis;
  const gainPct = costBasis ? (gain / costBasis) * 100 : 0;
  return { marketValue, costBasis, gain, gainPct };
});

const allocation = computed(() =>
  rows.value.map((r) => ({ label: r.symbol, value: r.marketValue })),
);

function addHolding() {
  if (!newHolding.value.symbol || !newHolding.value.shares) return;
  portfolio.addOrUpdate({
    symbol: newHolding.value.symbol.trim().toUpperCase(),
    shares: Number(newHolding.value.shares),
    avgCost: Number(newHolding.value.avgCost) || 0,
  });
  newHolding.value = { symbol: '', shares: 0, avgCost: 0 };
  computePortfolioHistory();
}

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
</script>

<template>
  <div>
    <div style="margin-bottom: 32px">
      <h1 class="display hero">Port<em>folio.</em></h1>
      <div class="subtitle" style="margin-top: 10px">
        {{ portfolio.holdings.length }} holding{{ portfolio.holdings.length === 1 ? '' : 's' }}
        · Weighted-average cost basis
      </div>
    </div>

    <div class="grid cols-4" style="margin-bottom: 20px">
      <div class="card kpi">
        <div class="kpi-label">Market Value</div>
        <div class="kpi-value mono">${{ fmt(totals.marketValue) }}</div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">Cost Basis</div>
        <div class="kpi-value mono">${{ fmt(totals.costBasis) }}</div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">Total Gain/Loss</div>
        <div class="kpi-value mono" :class="totals.gain >= 0 ? 'pos' : 'neg'">
          {{ totals.gain >= 0 ? '+' : '' }}${{ fmt(totals.gain) }}
        </div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">Return</div>
        <div class="kpi-value mono" :class="totals.gainPct >= 0 ? 'pos' : 'neg'">
          {{ totals.gainPct >= 0 ? '+' : '' }}{{ fmt(totals.gainPct) }}%
        </div>
      </div>
    </div>

    <div class="grid cols-2" style="margin-bottom: 20px">
      <div class="card">
        <h2>Allocation</h2>
        <AllocationChart v-if="allocation.length" :slices="allocation" />
        <div v-else class="empty">No holdings yet.</div>
      </div>
      <div class="card">
        <h2>60-Day Portfolio Value</h2>
        <PriceChart
          v-if="portfolioHistory.length"
          :points="portfolioHistory"
          label="Portfolio Value"
          color="#22d3ee"
        />
        <div v-else class="loading">{{ loadingHistory ? 'Computing…' : 'No data' }}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px">
      <h2>Add Holding</h2>
      <div class="row" style="flex-wrap: wrap">
        <input v-model="newHolding.symbol" placeholder="Symbol" style="width: 120px" />
        <input
          v-model.number="newHolding.shares"
          type="number"
          placeholder="Shares"
          style="width: 120px"
        />
        <input
          v-model.number="newHolding.avgCost"
          type="number"
          step="0.01"
          placeholder="Avg cost"
          style="width: 140px"
        />
        <button class="primary" @click="addHolding">Add / Buy More</button>
      </div>
      <div class="muted" style="margin-top: 8px; font-size: 12px">
        Adding an existing symbol uses weighted-average cost basis.
      </div>
    </div>

    <div class="card" style="padding: 0">
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th style="text-align: right">Shares</th>
            <th style="text-align: right">Avg Cost</th>
            <th style="text-align: right">Price</th>
            <th style="text-align: right">Market Value</th>
            <th style="text-align: right">Gain/Loss</th>
            <th style="text-align: right">%</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.symbol">
            <td>
              <RouterLink :to="{ name: 'stock', params: { symbol: r.symbol } }" class="mono" style="font-weight: 700">
                {{ r.symbol }}
              </RouterLink>
              <div class="muted" style="font-size: 12px">{{ r.meta?.name }}</div>
            </td>
            <td class="mono" style="text-align: right">{{ r.shares }}</td>
            <td class="mono" style="text-align: right">${{ fmt(r.avgCost) }}</td>
            <td class="mono" style="text-align: right">${{ fmt(r.price) }}</td>
            <td class="mono" style="text-align: right">${{ fmt(r.marketValue) }}</td>
            <td class="mono" style="text-align: right" :class="r.gain >= 0 ? 'pos' : 'neg'">
              {{ r.gain >= 0 ? '+' : '' }}${{ fmt(r.gain) }}
            </td>
            <td class="mono" style="text-align: right" :class="r.gainPct >= 0 ? 'pos' : 'neg'">
              {{ r.gainPct >= 0 ? '+' : '' }}{{ fmt(r.gainPct) }}%
            </td>
            <td>
              <button class="danger" @click="portfolio.remove(r.symbol)">Sell All</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
