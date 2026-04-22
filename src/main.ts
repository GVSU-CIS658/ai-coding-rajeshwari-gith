import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/global.css';
import { useSettingsStore } from './stores/settings';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// apply persisted theme before mount
const settings = useSettingsStore();
settings.applyTheme();

app.mount('#app');
