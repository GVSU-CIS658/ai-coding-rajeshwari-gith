<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuotesStore } from '../stores/quotes';
import { useWatchlistStore } from '../stores/watchlist';
import { useSettingsStore } from '../stores/settings';
import { fetchHistory, type HistoryPoint } from '../services/alphaVantage';
import { findStock } from '../data/stocks';
import PriceChart from '../components/PriceChart.vue';

const route = useRoute();
const router = useRouter();
const quotes = useQuotesStore();
const watchlist = useWatchlistStore();
const settings = useSettingsStore();

const symbol = computed(() => String(route.params.symbol || '').toUpperCase());
const history = ref<HistoryPoint[]>([]);
const loading = ref(false);
const range = ref<'1W' | '1M' | '3M' | '6M' | '1Y'>('3M');

const meta = computed(() => findStock(symbol.value));
const quote = computed(() => quotes.get(symbol.value));

const rangedHistory = computed(() => {
  const days = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[range.value];
  return history.value.slice(Math.max(0, history.value.length - days));
});

const stats = computed(() => {
  if (!rangedHistory.value.length) return null;
  const closes = rangedHistory.value.map((p) => p.close);
  const high = Math.max(...closes);
  const low = Math.min(...closes);
  const first = closes[0];
  const last = closes[closes.length - 1];
  const change = last - first;
  const changePct = (change / first) * 100;
  return { high, low, first, last, change, changePct };
});

async function load() {
  loading.value = true;
  if (!quote.value) await quotes.refresh(symbol.value);
  history.value = await fetchHistory(symbol.value, settings.apiKey);
  loading.value = false;
}

onMounted(load);
watch(symbol, load);

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function toggleWatchlist() {
  if (watchlist.has(symbol.value)) watchlist.remove(symbol.value);
  else watchlist.add(symbol.value);
}
</script>

<template>
  <div>
    <button @click="router.back()" style="margin-bottom: 16px">← Back</button>

    <div class="row between" style="margin-bottom: 28px; flex-wrap: wrap; gap: 20px">
      <div>
        <h1 class="display hero" style="font-size: 56px">
          <span class="mono" style="font-family: 'JetBrains Mono', monospace; font-size: 48px">{{ symbol }}</span>
        </h1>
        <div style="margin-top: 10px" class="row">
          <span v-if="meta" class="subtitle">{{ meta.name }}</span>
          <span v-if="meta" class="badge">{{ meta.sector }}</span>
          <span v-if="quote" class="status-pill">{{ quote.source }}</span>
        </div>
      </div>
      <div class="row">
        <button :class="{ primary: !watchlist.has(symbol) }" @click="toggleWatchlist">
          {{ watchlist.has(symbol) ? '★ In Watchlist' : '☆ Add to Watchlist' }}
        </button>
      </div>
    </div>

    <div v-if="quote" class="grid cols-4" style="margin-bottom: 20px">
      <div class="card kpi">
        <div class="kpi-label">Price</div>
        <div class="kpi-value mono">${{ fmt(quote.price) }}</div>
        <div class="mono" :class="quote.change >= 0 ? 'pos' : 'neg'" style="font-size: 13px">
          {{ quote.change >= 0 ? '+' : '' }}{{ fmt(quote.change) }} ({{ quote.changePct >= 0 ? '+' : '' }}{{ fmt(quote.changePct) }}%)
        </div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">Open</div>
        <div class="kpi-value mono">${{ fmt(quote.open) }}</div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">Day Range</div>
        <div class="kpi-value mono" style="font-size: 16px">
          ${{ fmt(quote.low) }} – ${{ fmt(quote.high) }}
        </div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">Volume</div>
        <div class="kpi-value mono">{{ quote.volume.toLocaleString() }}</div>
      </div>
    </div>

    <div class="card">
      <div class="row between" style="margin-bottom: 12px">
        <h2 style="margin: 0">Price History</h2>
        <div class="row" style="gap: 4px">
          <button
            v-for="r in (['1W', '1M', '3M', '6M', '1Y'] as const)"
            :key="r"
            :class="{ primary: range === r }"
            @click="range = r"
            style="padding: 4px 10px"
          >
            {{ r }}
          </button>
        </div>
      </div>
      <div v-if="loading" class="loading">Loading history…</div>
      <PriceChart
        v-else-if="rangedHistory.length"
        :points="rangedHistory"
        :label="symbol"
        :color="stats && stats.change >= 0 ? '#00c896' : '#ff4560'"
      />
      <div v-else class="empty">No history available</div>

      <div v-if="stats" class="grid cols-4" style="margin-top: 20px">
        <div>
          <div class="muted" style="font-size: 11px; text-transform: uppercase">{{ range }} Range High</div>
          <div class="mono" style="font-size: 16px">${{ fmt(stats.high) }}</div>
        </div>
        <div>
          <div class="muted" style="font-size: 11px; text-transform: uppercase">{{ range }} Range Low</div>
          <div class="mono" style="font-size: 16px">${{ fmt(stats.low) }}</div>
        </div>
        <div>
          <div class="muted" style="font-size: 11px; text-transform: uppercase">{{ range }} Change</div>
          <div class="mono" :class="stats.change >= 0 ? 'pos' : 'neg'" style="font-size: 16px">
            {{ stats.change >= 0 ? '+' : '' }}${{ fmt(stats.change) }}
          </div>
        </div>
        <div>
          <div class="muted" style="font-size: 11px; text-transform: uppercase">{{ range }} %</div>
          <div class="mono" :class="stats.changePct >= 0 ? 'pos' : 'neg'" style="font-size: 16px">
            {{ stats.changePct >= 0 ? '+' : '' }}{{ fmt(stats.changePct) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
