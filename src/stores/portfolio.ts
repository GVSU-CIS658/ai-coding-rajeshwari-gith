import { defineStore } from 'pinia';
import { DEFAULT_PORTFOLIO } from '../data/stocks';

export interface Holding {
  symbol: string;
  shares: number;
  avgCost: number;
}

const STORAGE_KEY = 'sp_portfolio';

function load(): Holding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_PORTFOLIO];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [...DEFAULT_PORTFOLIO];
  } catch {
    return [...DEFAULT_PORTFOLIO];
  }
}

export const usePortfolioStore = defineStore('portfolio', {
  state: () => ({
    holdings: load() as Holding[],
  }),
  getters: {
    symbols: (state) => state.holdings.map((h) => h.symbol),
    findBySymbol:
      (state) =>
      (symbol: string): Holding | undefined =>
        state.holdings.find((h) => h.symbol === symbol.toUpperCase()),
  },
  actions: {
    addOrUpdate(h: Holding) {
      const sym = h.symbol.toUpperCase();
      const existing = this.holdings.find((x) => x.symbol === sym);
      if (existing) {
        // weighted average cost basis
        const totalShares = existing.shares + h.shares;
        const totalCost = existing.shares * existing.avgCost + h.shares * h.avgCost;
        existing.shares = totalShares;
        existing.avgCost = totalShares > 0 ? totalCost / totalShares : 0;
      } else {
        this.holdings.push({ ...h, symbol: sym });
      }
      this.persist();
    },
    remove(symbol: string) {
      this.holdings = this.holdings.filter((h) => h.symbol !== symbol.toUpperCase());
      this.persist();
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.holdings));
    },
  },
});
