<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useWatchlistStore } from '../stores/watchlist';
import { useQuotesStore } from '../stores/quotes';
import { findStock, STOCK_UNIVERSE } from '../data/stocks';
import StockCard from '../components/StockCard.vue';

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
    <div class="row between wrap" style="margin-bottom: 32px; align-items: flex-start; gap: 20px">
      <div>
        <h1 class="display hero">Watch<em>list.</em></h1>
        <div class="subtitle" style="margin-top: 10px">
          {{ watchlist.symbols.length }} stock{{ watchlist.symbols.length === 1 ? '' : 's' }} tracked
          · Click any card to explore
        </div>
      </div>
      <div class="row wrap">
        <input v-model="newSymbol" placeholder="Add symbol…" @keyup.enter="addSymbol" style="width: 180px" />
        <button class="primary" @click="addSymbol">＋ Add</button>
        <button @click="refreshAll" :disabled="quotes.loading">
          {{ quotes.loading ? '↻ Loading' : '↻ Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="quotes.status" class="status-pill" style="margin-bottom: 20px; display: inline-block">
      {{ quotes.status }}
    </div>

    <div v-if="!rows.length" class="empty">
      <div style="margin-bottom: 14px">Your watchlist is empty.</div>
      <div class="row wrap" style="justify-content: center">
        <button
          v-for="s in suggestions"
          :key="s.symbol"
          class="mono"
          @click="watchlist.add(s.symbol); quotes.refresh(s.symbol)"
        >
          ＋ {{ s.symbol }}
        </button>
      </div>
    </div>

    <div v-else>
      <div class="grid cols-4" style="margin-bottom: 32px">
        <StockCard
          v-for="row in rows"
          :key="row.symbol"
          :symbol="row.symbol"
          :quote="row.quote"
        />
      </div>

      <div class="section-head">
        <h2 class="eyebrow">Table View</h2>
      </div>

      <div class="card" style="padding: 0; overflow: hidden">
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
                <RouterLink :to="{ name: 'stock', params: { symbol: row.symbol } }" class="mono" style="font-weight: 700; color: var(--text)">
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
              <td style="text-align: right">
                <span v-if="row.quote" class="pill" :class="row.quote.changePct >= 0 ? 'pos' : 'neg'">
                  {{ row.quote.changePct >= 0 ? '▲' : '▼' }} {{ fmt(Math.abs(row.quote.changePct)) }}%
                </span>
              </td>
              <td class="mono muted" style="text-align: right; font-size: 12px">
                <template v-if="row.quote">{{ (row.quote.volume / 1_000_000).toFixed(1) }}M</template>
              </td>
              <td>
                <button class="danger" @click="watchlist.remove(row.symbol)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
