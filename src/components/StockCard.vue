<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useWatchlistStore } from '../stores/watchlist';
import type { Quote } from '../services/alphaVantage';
import { findStock } from '../data/stocks';

const props = defineProps<{
  symbol: string;
  quote?: Quote;
}>();

const router = useRouter();
const watchlist = useWatchlistStore();

const meta = computed(() => findStock(props.symbol));

const avatarClass = computed(() => {
  // stable hash → palette slot
  const slots = ['av-violet', 'av-cyan', 'av-pink', 'av-amber', 'av-green', 'av-rose'];
  const h = props.symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return slots[h % slots.length];
});

const rangePos = computed(() => {
  if (!props.quote) return 50;
  const { low, high, price } = props.quote;
  if (high === low) return 50;
  return Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100));
});

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function open() {
  router.push({ name: 'stock', params: { symbol: props.symbol } });
}

function toggleFav(e: Event) {
  e.stopPropagation();
  if (watchlist.has(props.symbol)) watchlist.remove(props.symbol);
  else watchlist.add(props.symbol);
}

const isFav = computed(() => watchlist.has(props.symbol));
</script>

<template>
  <div class="stock-card" @click="open">
    <div class="stock-card-top">
      <div class="avatar" :class="avatarClass">{{ symbol.charAt(0) }}</div>
      <div class="stock-card-meta">
        <div class="stock-card-sym">{{ symbol }}</div>
        <div class="stock-card-name">{{ meta?.name || '—' }}</div>
      </div>
      <button
        class="stock-card-fav"
        :class="{ active: isFav }"
        @click="toggleFav"
        style="background: transparent; border: none; padding: 4px; font-size: 18px; color: var(--muted-soft); cursor: pointer"
        :style="{ color: isFav ? 'var(--accent)' : undefined }"
        :title="isFav ? 'Remove from watchlist' : 'Add to watchlist'"
      >
        {{ isFav ? '♥' : '♡' }}
      </button>
    </div>

    <div>
      <div class="stock-card-price">
        <template v-if="quote">${{ fmt(quote.price) }}</template>
        <span v-else class="muted">—</span>
      </div>
      <div v-if="quote" class="stock-card-change">
        <span class="pill" :class="quote.changePct >= 0 ? 'pos' : 'neg'">
          {{ quote.changePct >= 0 ? '▲' : '▼' }}
          {{ Math.abs(quote.changePct).toFixed(2) }}%
        </span>
        <span :class="quote.change >= 0 ? 'pos' : 'neg'">
          {{ quote.change >= 0 ? '+' : '' }}{{ fmt(quote.change) }}
        </span>
      </div>
    </div>

    <div v-if="quote" class="stock-card-stats">
      <div class="stock-card-stat">
        <span class="label">Open</span>
        <span class="val">${{ fmt(quote.open) }}</span>
      </div>
      <div class="stock-card-stat">
        <span class="label">High</span>
        <span class="val">${{ fmt(quote.high) }}</span>
      </div>
      <div class="stock-card-stat">
        <span class="label">Low</span>
        <span class="val">${{ fmt(quote.low) }}</span>
      </div>
      <div class="stock-card-stat">
        <span class="label">Vol</span>
        <span class="val">{{ (quote.volume / 1_000_000).toFixed(1) }}M</span>
      </div>
    </div>

    <div v-if="quote" class="range-bar">
      <div
        class="range-bar-fill"
        :class="quote.change >= 0 ? 'pos' : 'neg'"
        :style="{ width: rangePos + '%' }"
      ></div>
    </div>
  </div>
</template>
