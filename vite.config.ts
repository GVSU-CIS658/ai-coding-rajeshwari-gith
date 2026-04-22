import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/ai-coding-rajeshwari-gith/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
