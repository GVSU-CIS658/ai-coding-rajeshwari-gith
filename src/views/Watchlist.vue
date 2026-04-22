<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useWatchlistStore } from '../stores/watchlist';
import { useQuotesStore } from '../stores/quotes';
import { findStock, STOCK_UNIVERSE } from '../data/stocks';

const watchlist = useWatchlistStore();
const quotes = useQuotesStore();
const newSymbol = ref('');

onMounted(async () => {
  const missing = watchlist.symbols.filter((s) => !quotes.get(s));
  if (missing.length) await quotes.refreshMany(missing);
});

const rows = computed(() =>
  watchlist.symbols.map((sym) => ({
    symbol: sym,
    meta: findStock(sym),
    quote: quotes.get(sym),
  })),
);

function addSymbol() {
  const s = newSymbol.value.trim().toUpperCase();
  if (!s) return;
  watchlist.add(s);
  newSymbol.value = '';
  if (!quotes.get(s)) quotes.refresh(s);
}

function refreshAll() {
  quotes.refreshMany(watchlist.symbols);
}

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

const suggestions = computed(() =>
  STOCK_UNIVERSE.filter((s) => !watchlist.symbols.includes(s.symbol)).slice(0, 6),
);
</script>

<template>
  <div>
    <div class="row between" style="margin-bottom: 18px">
      <h1>Watchlist</h1>
      <div class="row">
        <input v-model="newSymbol" placeholder="Add symbol (e.g. AAPL)" @keyup.enter="addSymbol" />
        <button class="primary" @click="addSymbol">Add</button>
        <button @click="refreshAll" :disabled="quotes.loading">
          {{ quotes.loading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="quotes.status" class="status-pill mono" style="margin-bottom: 12px; display: inline-block">
      {{ quotes.status }}
    </div>

    <div v-if="!rows.length" class="empty">
      Your watchlist is empty. Add a symbol above or try:
      <div style="margin-top: 12px">
        <button
          v-for="s in suggestions"
          :key="s.symbol"
          class="mono"
          style="margin-right: 8px"
          @click="watchlist.add(s.symbol)"
        >
          + {{ s.symbol }}
        </button>
      </div>
    </div>

    <div v-else class="card" style="padding: 0; overflow: hidden">
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Sector</th>
            <th style="text-align: right">Price</th>
            <th style="text-align: right">Change</th>
            <th style="text-align: right">% Change</th>
            <th style="text-align: right">Volume</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.symbol">
            <td>
              <RouterLink :to="{ name: 'stock', params: { symbol: row.symbol } }" class="mono" style="font-weight: 700">
                {{ row.symbol }}
              </RouterLink>
            </td>
            <td class="muted">{{ row.meta?.name || '—' }}</td>
            <td>
              <span v-if="row.meta" class="badge">{{ row.meta.sector }}</span>
            </td>
            <td class="mono" style="text-align: right">
              <template v-if="row.quote">${{ fmt(row.quote.price) }}</template>
              <span v-else class="muted">—</span>
            </td>
            <td class="mono" style="text-align: right" :class="row.quote && row.quote.change >= 0 ? 'pos' : 'neg'">
              <template v-if="row.quote">
                {{ row.quote.change >= 0 ? '+' : '' }}{{ fmt(row.quote.change) }}
              </template>
            </td>
            <td class="mono" style="text-align: right" :class="row.quote && row.quote.changePct >= 0 ? 'pos' : 'neg'">
              <template v-if="row.quote">
                {{ row.quote.changePct >= 0 ? '+' : '' }}{{ fmt(row.quote.changePct) }}%
              </template>
            </td>
            <td class="mono muted" style="text-align: right">
              <template v-if="row.quote">{{ row.quote.volume.toLocaleString() }}</template>
            </td>
            <td>
              <button class="danger" @click="watchlist.remove(row.symbol)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
