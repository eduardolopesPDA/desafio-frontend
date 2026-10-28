/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    projects: [
      // Unitários ficam ao lado do código; tests/e2e é do Playwright.
      { extends: true, test: { name: 'unit', include: ['src/**/*.test.ts'] } },
      // API simulada (MSW no Node) chamada pelo cliente Axios da app.
      {
        extends: true,
        test: {
          name: 'api',
          include: ['tests/api/**/*.test.ts'],
          setupFiles: ['tests/api/setup.ts'],
          env: { VITE_API_URL: 'http://localhost/api' },
        },
      },
    ],
  },
})
