import { defineConfig } from 'wxt'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'node:path'

export default defineConfig({
  srcDir: 'src',
  manifest: { name: 'CN Toon Vault' },
  vite: () => ({
    plugins: [tanstackRouter({ target: 'react' }), react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  }),
})
