import { createRouter, createWebHashHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Watchlist from '../views/Watchlist.vue';
import Portfolio from '../views/Portfolio.vue';
import StockDetail from '../views/StockDetail.vue';
import Alerts from '../views/Alerts.vue';
import Settings from '../views/Settings.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard },
    { path: '/watchlist', name: 'watchlist', component: Watchlist },
    { path: '/portfolio', name: 'portfolio', component: Portfolio },
    { path: '/alerts', name: 'alerts', component: Alerts },
    { path: '/settings', name: 'settings', component: Settings },
    { path: '/stock/:symbol', name: 'stock', component: StockDetail, props: true },
  ],
});

export default router;
