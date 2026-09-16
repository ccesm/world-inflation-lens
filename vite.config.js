import { defineConfig } from 'vite'

export default defineConfig({
  base: '/world-inflation-lens/',
  build: {
    rollupOptions: { output: { manualChunks: { 'external-data': ['./data/external/gpr.json', './data/external/gscpi.json', './data/external/fao-food.json', './data/external/sipri-military.json'], 'global-data': ['./src/data/globalInflation.js'], 'driver-data': ['./data/inflation/drivers.json'], 'monitor-data': ['./data/inflation/monitor.json'] } } },
  },
})
