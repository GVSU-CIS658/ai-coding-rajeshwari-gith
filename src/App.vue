<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import { useSettingsStore } from './stores/settings';
import TickerTape from './components/TickerTape.vue';
import StockSearch from './components/StockSearch.vue';

const settings = useSettingsStore();
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="dot"></span>
        StockPulse
      </div>
      <nav class="nav">
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/watchlist">Watchlist</RouterLink>
        <RouterLink to="/portfolio">Portfolio</RouterLink>
        <RouterLink to="/alerts">Alerts</RouterLink>
        <RouterLink to="/settings">Settings</RouterLink>
      </nav>
      <div class="topbar-spacer"></div>
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

    <footer class="container" style="padding-top: 40px; color: var(--muted); font-size: 12px">
      StockPulse · Vue 3 · Vue Router · Pinia · Chart.js · Alpha Vantage
    </footer>
  </div>
</template>
