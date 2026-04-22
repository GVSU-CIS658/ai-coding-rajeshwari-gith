import { defineStore } from 'pinia';

interface SettingsState {
  apiKey: string;
  theme: 'dark' | 'light';
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    apiKey: localStorage.getItem('sp_api_key') || '',
    theme: (localStorage.getItem('sp_theme') as 'dark' | 'light') || 'dark',
  }),
  actions: {
    setApiKey(key: string) {
      this.apiKey = key.trim();
      localStorage.setItem('sp_api_key', this.apiKey);
    },
    setTheme(theme: 'dark' | 'light') {
      this.theme = theme;
      localStorage.setItem('sp_theme', theme);
      this.applyTheme();
    },
    toggleTheme() {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
    },
    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.theme);
    },
  },
});
