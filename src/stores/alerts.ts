import { defineStore } from 'pinia';
import { DEFAULT_ALERTS } from '../data/stocks';

export interface Alert {
  id: string;
  symbol: string;
  direction: 'above' | 'below';
  price: number;
}

const STORAGE_KEY = 'sp_alerts';

function load(): Alert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_ALERTS];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [...DEFAULT_ALERTS];
  } catch {
    return [...DEFAULT_ALERTS];
  }
}

export const useAlertsStore = defineStore('alerts', {
  state: () => ({
    alerts: load() as Alert[],
  }),
  actions: {
    add(a: Omit<Alert, 'id'>) {
      this.alerts.push({ ...a, id: `a${Date.now()}`, symbol: a.symbol.toUpperCase() });
      this.persist();
    },
    remove(id: string) {
      this.alerts = this.alerts.filter((a) => a.id !== id);
      this.persist();
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.alerts));
    },
    checkTriggered(quotes: Record<string, { price: number }>): Alert[] {
      return this.alerts.filter((a) => {
        const q = quotes[a.symbol];
        if (!q) return false;
        return a.direction === 'above' ? q.price >= a.price : q.price <= a.price;
      });
    },
  },
});
