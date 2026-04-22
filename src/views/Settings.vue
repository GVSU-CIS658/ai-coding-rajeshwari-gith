<script setup lang="ts">
import { ref } from 'vue';
import { useSettingsStore } from '../stores/settings';

const settings = useSettingsStore();
const draftKey = ref(settings.apiKey);
const saved = ref(false);

function save() {
  settings.setApiKey(draftKey.value);
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}

function clearCache() {
  const toDelete: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i);
    if (k && (k.startsWith('av_q_') || k.startsWith('av_h_'))) toDelete.push(k);
  }
  toDelete.forEach((k) => sessionStorage.removeItem(k));
  alert(`Cleared ${toDelete.length} cached quotes/histories.`);
}
</script>

<template>
  <div>
    <div style="margin-bottom: 32px">
      <h1 class="display hero">Set<em>tings.</em></h1>
      <div class="subtitle" style="margin-top: 10px">API key, appearance, and cache</div>
    </div>

    <div class="card" style="margin-bottom: 20px; max-width: 720px">
      <h2>Alpha Vantage API Key</h2>
      <p class="muted" style="margin: 0 0 12px 0">
        Get a free key at
        <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener">
          alphavantage.co/support/#api-key
        </a>
        and paste it here to enable live stock data. Without a key the app runs in demo mode with
        simulated prices.
      </p>
      <div class="row">
        <input
          v-model="draftKey"
          placeholder="Your API key"
          style="flex: 1"
          type="password"
          autocomplete="off"
        />
        <button class="primary" @click="save">Save</button>
      </div>
      <div v-if="saved" class="pos" style="margin-top: 10px; font-size: 13px">✓ Saved</div>
      <div class="muted" style="margin-top: 12px; font-size: 12px">
        Free tier limits: 5 requests/minute, 25/day. StockPulse paces requests at 13s and caches
        quotes for 45s / histories for 10min.
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px; max-width: 720px">
      <h2>Appearance</h2>
      <div class="row">
        <button
          :class="{ primary: settings.theme === 'dark' }"
          @click="settings.setTheme('dark')"
        >
          Dark
        </button>
        <button
          :class="{ primary: settings.theme === 'light' }"
          @click="settings.setTheme('light')"
        >
          Light
        </button>
      </div>
    </div>

    <div class="card" style="max-width: 720px">
      <h2>Cache</h2>
      <p class="muted" style="margin: 0 0 12px 0">
        Clear cached quotes and price histories. Next page load will refetch from Alpha Vantage.
      </p>
      <button @click="clearCache">Clear Cache</button>
    </div>
  </div>
</template>
