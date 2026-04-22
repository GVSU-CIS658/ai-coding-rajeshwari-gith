<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import { useSettingsStore } from './stores/settings';
import { useWatchlistStore } from './stores/watchlist';
import TickerTape from './components/TickerTape.vue';
import StockSearch from './components/StockSearch.vue';
import Aurora from './components/Aurora.vue';

const settings = useSettingsStore();
const watchlist = useWatchlistStore();
</script>

<template>
  <Aurora />

  <div class="app-shell">
    <header class="topbar">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">SP</span>
        <span>StockPulse</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/watchlist">
          Watchlist
          <span v-if="watchlist.symbols.length" class="mono" style="opacity: 0.6; margin-left: 4px">
            {{ watchlist.symbols.length }}
          </span>
        </RouterLink>
        <RouterLink to="/portfolio">Portfolio</RouterLink>
        <RouterLink to="/alerts">Alerts</RouterLink>
        <RouterLink to="/settings">Settings</RouterLink>
      </nav>

      <StockSearch />

      <button
        class="theme-toggle"
        @click="settings.toggleTheme()"
        :title="settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        {{ settings.theme === 'dark' ? '☾' : '☀' }}
      </button>
    </header>

    <TickerTape />

    <main class="container">
      <RouterView />
    </main>

    <footer class="container" style="padding-top: 40px; padding-bottom: 40px; color: var(--muted); font-size: 12px; font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.05em">
      STOCKPULSE · VUE 3 · PINIA · CHART.JS · ALPHA VANTAGE
    </footer>
  </div>
</template>
