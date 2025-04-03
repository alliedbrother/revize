import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
  },
  // Set application name for browser tab
  define: {
    'process.env.APP_NAME': JSON.stringify('revize.io')
  }
})
