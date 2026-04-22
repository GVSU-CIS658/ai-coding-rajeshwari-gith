<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { STOCK_UNIVERSE } from '../data/stocks';

const router = useRouter();
const query = ref('');
const open = ref(false);

const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return STOCK_UNIVERSE.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
  ).slice(0, 8);
});

function select(symbol: string) {
  query.value = '';
  open.value = false;
  router.push({ name: 'stock', params: { symbol } });
}

function onFocus() {
  open.value = true;
}

function onBlur() {
  // delay so click on result fires first
  setTimeout(() => (open.value = false), 150);
}
</script>

<template>
  <div class="search-wrap">
    <input
      v-model="query"
      @focus="onFocus"
      @blur="onBlur"
      placeholder="Search stocks (AAPL, Tesla…)"
    />
    <div v-if="open && results.length" class="search-results">
      <div
        v-for="r in results"
        :key="r.symbol"
        class="search-result-item"
        @mousedown.prevent="select(r.symbol)"
      >
        <div class="row between">
          <div>
            <span class="mono" style="font-weight: 700">{{ r.symbol }}</span>
            <span class="muted" style="margin-left: 10px">{{ r.name }}</span>
          </div>
          <span class="badge">{{ r.sector }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
