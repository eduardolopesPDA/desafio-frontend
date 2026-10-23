# Decisões (ADR resumido)

Formato: **Decisão** — motivo. Registre aqui toda escolha não óbvia. A stack obrigatória está em `docs/spec.md` §2.

1. **Dois alvos de build: extensão (WXT) e web (Vite)** — o WXT é obrigatório no projeto, mas o spec exige deploy público, URL que sobrevive a refresh, Lighthouse com SEO e telas de 390 a 1440 px. Uma extensão sozinha não entrega isso. O código da app é único; só os entrypoints mudam.
2. **Extensão abre a app numa aba (página `app.html`), não num popup** — o popup é limitado a ~800×600 px e fecha ao perder foco, o que inviabiliza checkout e layouts desktop.
3. **Hash history na extensão, browser history na web** — `chrome-extension://…/app.html` não resolve paths; na web, paths reais são necessários para deep link e SEO. O router recebe o history no `bootstrap`.
4. **TanStack Router file-based** — são ~10 rotas com layout protegido; a geração de rotas dá tipagem de params e search params sem manutenção manual.
5. **Arquitetura por feature (`src/features/<domínio>`)** — o spec tem muitos domínios (catálogo, carrinho, checkout, conta…); agrupar por domínio mantém `api.ts`, `queries.ts` e componentes de cada fluxo juntos.
6. **Schemas zod em `src/contracts/` compartilhados entre app e mocks** — o spec exige contratos tipados e reutilizados entre desenvolvimento, demo e testes.
7. **MSW também no deploy** — não há back-end; a URL pública precisa funcionar com a API simulada.
8. **Dinheiro como string + `big.js`** — o spec exige precisão decimal em TC/ETH; `number` perde precisão.
9. **Sessão com token em `localStorage`** — permite recuperar a sessão após refresh com a API simulada; senhas só existem como hash no mock.
10. **Formulários com react-hook-form + zod** — padrão do componente `Form` do shadcn/ui; reaproveita os schemas de `contracts/`.
11. **Playwright e Lighthouse rodam no build web** — é o artefato publicado e o único auditável pelo Lighthouse de forma reproduzível.
12. **Vitest para unitários** — complementar à stack obrigatória; cobre lógica pura (dinheiro, dedupe de eventos) mais rápido que E2E.
13. **TanStack Table removido** — o spec não tem telas tabulares (catálogo é grade de cards, carrinho é lista). Reavaliar se surgir histórico de pedidos em tabela.

## Em aberto

- MSW na extensão via service worker vs. `msw/native` (validar na Fase 0, ver `ARCHITECTURE.md` §10).
- Host do deploy (Vercel, Netlify ou Cloudflare Pages).
