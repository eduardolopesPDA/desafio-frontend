import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Regras de dependência do ARCHITECTURE.md §2. Cada bloco repete as restrições que valem
// para ele, porque um bloco mais específico substitui (não mescla) a regra do anterior.
const noMocks = {
  group: ['@/mocks', '@/mocks/**', '**/mocks/**'],
  message: 'A app nunca importa mocks/ (só app/bootstrap.tsx). Ver ARCHITECTURE.md §2.',
}
const upperLayers = (layer) => ({
  group: ['@/app', '@/app/**', '@/routes', '@/routes/**', '@/features/**', '@/components/**'],
  message: `${layer} não depende de camadas acima dela. Ver ARCHITECTURE.md §2.`,
})
const restrict = (...patterns) => ({ 'no-restricted-imports': ['error', { patterns }] })

export default defineConfig([
  globalIgnores([
    'dist',
    '.output',
    '.wxt',
    'src/routeTree.gen.ts',
    'public/mockServiceWorker.js',
    'playwright-report',
    'test-results',
    'lighthouse/reports',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    rules: restrict(noMocks),
  },
  {
    // Rotas usam as features por queries e componentes, nunca chamando api.ts direto.
    files: ['src/routes/**'],
    rules: {
      ...restrict(noMocks, {
        group: ['@/features/*/api'],
        message: 'Rotas acessam dados pelas queries da feature (TanStack Query), não pelo api.ts.',
      }),
      // O plugin do router cuida do HMR das rotas, que exportam `Route`.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/features/**'],
    rules: restrict(
      noMocks,
      { group: ['@/app', '@/app/**', '@/routes', '@/routes/**'], message: 'Features não dependem de app/ nem de routes/.' },
      {
        group: ['@/features/*/*', '!@/features/*/queries'],
        message: 'Outra feature só é usada pelo queries.ts dela; dentro da mesma feature use import relativo.',
      },
    ),
  },
  { files: ['src/lib/**'], rules: restrict(noMocks, upperLayers('lib/')) },
  { files: ['src/contracts/**'], rules: restrict(noMocks, upperLayers('contracts/')) },
  {
    files: ['src/mocks/**'],
    rules: restrict({
      group: [...upperLayers().group, '@/lib/**', '@/web/**', '@/entrypoints/**'],
      message: 'mocks/ importa só contracts/ e os próprios arquivos. Ver ARCHITECTURE.md §2.',
    }),
  },
  { files: ['src/app/bootstrap.tsx'], rules: { 'no-restricted-imports': 'off' } },
  // Gerados pelo shadcn: exportam componentes e variantes juntos.
  { files: ['src/components/ui/**'], rules: { 'react-refresh/only-export-components': 'off' } },
  { files: ['*.config.ts', 'eslint.config.js'], languageOptions: { globals: globals.node } },
])
