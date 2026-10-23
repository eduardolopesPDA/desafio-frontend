---
name: debug
description: Investiga e corrige bugs na extensão Chrome (WXT + React + TanStack + Tailwind), incluindo popup em branco, rota que não carrega, estilo que não aplica, tabela em loop e erros de tipo do WXT. Use sempre que o usuário relatar erro, comportamento inesperado, tela em branco, algo "não funciona", ou digitar /debug.
---

# Debug de extensão

Extensão tem mais de um contexto de execução (popup, service worker, páginas), cada
um com seu próprio DevTools. Boa parte do tempo perdido em debug vem de olhar o
console errado. Reproduza primeiro, encontre a causa e só então corrija.

## 1. Reproduzir

Rode `npm run dev` (abre o Chrome com a extensão e hot reload) e descreva o passo a
passo exato que leva ao erro. Se não reproduzir, pergunte ao usuário o que falta.

## 2. Olhar o console certo

- **Popup:** botão direito dentro do popup → *Inspecionar*. O DevTools da página
  aberta na aba não mostra erros do popup.
- **Background (service worker):** `chrome://extensions` → link *service worker* →
  Inspecionar.
- **Build/tipos:** a saída do terminal do `npm run dev`.

## 3. Causas comuns neste projeto

| Sintoma | Verifique |
|---|---|
| Tela em branco / rota não abre | A URL tem `#/`? A rota está em `addChildren` no `src/router.tsx`? |
| Estilo Tailwind não aplica | `main.tsx` importa `@/styles/globals.css`? Plugin `@tailwindcss/vite` no `wxt.config.ts`? |
| Tabela em loop / travando | `data` ou `columns` recriados a cada render (ver skill `create-table`) |
| Erro de tipo após mudar config ou entrypoint | Rode `npx wxt prepare` para regenerar `.wxt/` |
| Mudança não aparece | Recarregue a extensão em `chrome://extensions` (manifest não tem hot reload) |
| `browser.x` undefined | Falta permissão no manifest (`wxt.config.ts`) |

## 4. Corrigir e travar

1. Faça a menor correção que resolve a causa, não o sintoma.
2. Adicione um teste que falharia sem a correção (skill `test`).
3. Rode `npm run compile` e `npm test -- --run` e informe o resultado.
