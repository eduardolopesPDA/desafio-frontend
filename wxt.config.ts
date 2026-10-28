import { defineConfig } from 'wxt'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'node:path'

export default defineConfig({
  srcDir: 'src',
  // `action` é necessário para o clique no ícone chegar ao background.
  manifest: { name: 'CN Toon Vault', action: {} },
  vite: () => ({
    plugins: [tanstackRouter({ target: 'react' }), react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  }),
})
