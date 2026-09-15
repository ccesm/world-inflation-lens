import { defineConfig } from 'vite'

export default defineConfig({
  base: '/world-inflation-lens/',
  build: {
    rollupOptions: { output: { manualChunks: { 'global-data': ['./src/data/globalInflation.js'], 'driver-data': ['./data/inflation/drivers.json'], 'monitor-data': ['./data/inflation/monitor.json'] } } },
  },
})
