import { defineStore } from 'pinia';
import { DEFAULT_WATCHLIST } from '../data/stocks';

const STORAGE_KEY = 'sp_watchlist';

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_WATCHLIST];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [...DEFAULT_WATCHLIST];
  } catch {
    return [...DEFAULT_WATCHLIST];
  }
}

export const useWatchlistStore = defineStore('watchlist', {
  state: () => ({
    symbols: load() as string[],
  }),
  actions: {
    add(symbol: string) {
      const s = symbol.toUpperCase();
      if (!this.symbols.includes(s)) {
        this.symbols.push(s);
        this.persist();
      }
    },
    remove(symbol: string) {
      this.symbols = this.symbols.filter((s) => s !== symbol.toUpperCase());
      this.persist();
    },
    has(symbol: string): boolean {
      return this.symbols.includes(symbol.toUpperCase());
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.symbols));
    },
  },
});
