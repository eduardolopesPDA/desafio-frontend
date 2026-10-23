# Arquitetura

## Visão geral
Extensão para Chrome (Manifest V3) feita com **WXT + React + TypeScript + Vite**.
A UI roda no **popup**. Não há backend: os dados são locais (constantes, JSON ou `wxt/storage`).

```
popup.html ──> main.tsx ──> RouterProvider (hash history)
                                └── routes/ ──> components/ ──> lib/ (dados, storage, utils)
```

## Camadas (pastas em `src/`)
| Pasta | Responsabilidade |
|---|---|
| `entrypoints/` | Pontos de entrada do WXT (popup, background...). Só montam a app; sem regra de negócio. |
| `routes/` | Uma tela por arquivo + definição da árvore de rotas. |
| `components/` | Componentes reutilizáveis. `ui/` = visuais genéricos; `data-table/` = wrapper do TanStack Table. |
| `hooks/` | Hooks React compartilhados. |
| `lib/` | Funções puras, dados mockados, acesso ao storage. Sem React. |
| `types/` | Tipos de domínio compartilhados. |

## Roteamento
- TanStack Router **code-based** (`src/router.tsx`).
- **Hash history** (`createHashHistory`): o popup é servido em `chrome-extension://<id>/popup.html`,
  então rotas com path real quebrariam ao recarregar.

## Estilo
Tailwind CSS v4 via `@tailwindcss/vite`, importado em `src/styles/globals.css`.

## Testes
Vitest + Testing Library + happy-dom. `WxtVitest()` simula as APIs da extensão (`browser.*`, `storage`).

## Regras
- Lógica pura fica em `lib/` e é testada sem renderizar componentes.
- Componentes de rota orquestram; componentes em `components/` não conhecem rotas.
- Importações via alias `@/` (fornecido pelo WXT).
