import { defineStore } from 'pinia';
import { fetchQuote, fetchManyQuotes, type Quote } from '../services/alphaVantage';
import { useSettingsStore } from './settings';

interface QuotesState {
  bySymbol: Record<string, Quote>;
  status: string;
  loading: boolean;
}

export const useQuotesStore = defineStore('quotes', {
  state: (): QuotesState => ({
    bySymbol: {},
    status: '',
    loading: false,
  }),
  getters: {
    get:
      (state) =>
      (symbol: string): Quote | undefined =>
        state.bySymbol[symbol.toUpperCase()],
  },
  actions: {
    async refresh(symbol: string) {
      const settings = useSettingsStore();
      const q = await fetchQuote(symbol, settings.apiKey);
      this.bySymbol[q.symbol] = q;
      return q;
    },
    async refreshMany(symbols: string[]) {
      if (!symbols.length) return;
      const settings = useSettingsStore();
      this.loading = true;
      await fetchManyQuotes(
        symbols,
        settings.apiKey,
        (q) => {
          this.bySymbol[q.symbol] = q;
        },
        (msg) => {
          this.status = msg;
        },
      );
      this.loading = false;
    },
  },
});
