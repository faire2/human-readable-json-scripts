import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  base: process.env.NODE_ENV === 'production' ? '/human-readable-json-scripts/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
