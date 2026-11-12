import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the app works under https://<user>.github.io/<repo>/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2020' },
})
