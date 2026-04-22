<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useQuotesStore } from '../stores/quotes';
import { useWatchlistStore } from '../stores/watchlist';

const quotesStore = useQuotesStore();
const watchlist = useWatchlistStore();

const tapeSymbols = computed(() => {
  // ensure at least 10 tickers on the tape for good scroll length
  const base = [...watchlist.symbols];
  if (base.length < 10) {
    const extras = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'META', 'AMZN', 'NFLX', 'AMD', 'JPM'];
    for (const e of extras) {
      if (!base.includes(e)) base.push(e);
      if (base.length >= 12) break;
    }
  }
  return base;
});

onMounted(() => {
  // preload symbols that don't have a quote yet (uses cache/demo if no key)
  const missing = tapeSymbols.value.filter((s) => !quotesStore.get(s));
  if (missing.length) {
    quotesStore.refreshMany(missing);
  }
});

function fmt(n: number, digits = 2) {
  return n.toFixed(digits);
}
</script>

<template>
  <div class="ticker-tape">
    <div class="ticker-track">
      <span
        v-for="sym in [...tapeSymbols, ...tapeSymbols]"
        :key="sym + Math.random()"
        class="ticker-item"
      >
        <span class="ticker-symbol mono">{{ sym }}</span>
        <template v-if="quotesStore.get(sym)">
          <span class="mono">${{ fmt(quotesStore.get(sym)!.price) }}</span>
          <span
            class="mono"
            :class="quotesStore.get(sym)!.change >= 0 ? 'pos' : 'neg'"
          >
            {{ quotesStore.get(sym)!.change >= 0 ? '▲' : '▼' }}
            {{ fmt(quotesStore.get(sym)!.changePct) }}%
          </span>
        </template>
        <span v-else class="muted mono">—</span>
      </span>
    </div>
  </div>
</template>
