<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAlertsStore } from '../stores/alerts';
import { useQuotesStore } from '../stores/quotes';
import { findStock, STOCK_UNIVERSE } from '../data/stocks';

const alerts = useAlertsStore();
const quotes = useQuotesStore();

const form = ref({
  symbol: '',
  direction: 'above' as 'above' | 'below',
  price: 0,
});

onMounted(async () => {
  const missing = alerts.alerts.map((a) => a.symbol).filter((s) => !quotes.get(s));
  if (missing.length) await quotes.refreshMany(missing);
});

function submit() {
  if (!form.value.symbol || !form.value.price) return;
  alerts.add({
    symbol: form.value.symbol.trim().toUpperCase(),
    direction: form.value.direction,
    price: Number(form.value.price),
  });
  form.value = { symbol: '', direction: 'above', price: 0 };
}

const decorated = computed(() =>
  alerts.alerts.map((a) => {
    const q = quotes.get(a.symbol);
    const triggered = q
      ? a.direction === 'above'
        ? q.price >= a.price
        : q.price <= a.price
      : false;
    return { ...a, quote: q, meta: findStock(a.symbol), triggered };
  }),
);

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
</script>

<template>
  <div>
    <h1>Price Alerts</h1>

    <div class="card" style="margin-bottom: 20px">
      <h2>Create Alert</h2>
      <div class="row" style="flex-wrap: wrap">
        <select v-model="form.symbol" style="width: 160px">
          <option value="">Symbol…</option>
          <option v-for="s in STOCK_UNIVERSE" :key="s.symbol" :value="s.symbol">
            {{ s.symbol }} — {{ s.name }}
          </option>
        </select>
        <select v-model="form.direction" style="width: 140px">
          <option value="above">Price above</option>
          <option value="below">Price below</option>
        </select>
        <input
          v-model.number="form.price"
          type="number"
          step="0.01"
          placeholder="Trigger price"
          style="width: 160px"
        />
        <button class="primary" @click="submit">Add Alert</button>
      </div>
    </div>

    <div v-if="!decorated.length" class="empty">No alerts yet. Create one above.</div>

    <div v-else class="card" style="padding: 0">
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Rule</th>
            <th style="text-align: right">Current</th>
            <th style="text-align: right">Distance</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in decorated" :key="a.id">
            <td>
              <span class="mono" style="font-weight: 700">{{ a.symbol }}</span>
              <div class="muted" style="font-size: 12px">{{ a.meta?.name }}</div>
            </td>
            <td class="mono">
              {{ a.direction === 'above' ? '↑' : '↓' }}
              ${{ fmt(a.price) }}
            </td>
            <td class="mono" style="text-align: right">
              <template v-if="a.quote">${{ fmt(a.quote.price) }}</template>
              <span v-else class="muted">—</span>
            </td>
            <td class="mono muted" style="text-align: right">
              <template v-if="a.quote">
                {{ a.quote.price > a.price ? '+' : '' }}${{ fmt(a.quote.price - a.price) }}
              </template>
            </td>
            <td>
              <span v-if="a.triggered" class="badge" style="background: var(--green); color: #000; border-color: var(--green)">
                TRIGGERED
              </span>
              <span v-else class="badge">Watching</span>
            </td>
            <td>
              <button class="danger" @click="alerts.remove(a.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
