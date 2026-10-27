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
14. **MSW fixado em 2.x** — `@mswjs/socket.io-binding@0.2.0` (exigido pelo spec, §6) declara peer `msw@^2.10.2` e não há versão para o MSW 3. Atualizar só quando o binding suportar.
15. **`.npmrc` com `legacy-peer-deps=true`** — `@hookform/resolvers@6` declara peers opcionais conflitantes (`effect` v3 via `@typeschema` vs. v4) que o projeto não usa; sem a flag, `npm install` falha com ERESOLVE. Efeito colateral: conflitos reais de peer deixam de travar o install — conferir com `npm install --dry-run --legacy-peer-deps=false` ao adicionar dependências.
16. **Vulnerabilidades do `@lhci/cli` aceitas** — as 16 do `npm audit` vêm todas dele (puppeteer, tmp, extract-zip…); `npm audit --omit=dev` = 0. É ferramenta local de auditoria, sem input não confiável, e a única "correção" oferecida é um downgrade para 0.1.0.
17. **`cn()` do pacote `cn`** — o shadcn CLI 4 usa o pacote oficial `cn` no lugar de `clsx` + `tailwind-merge`; os componentes gerados importam dele diretamente.
18. **ID de NFT é um slug** (`enchiridion`, `espada-de-sangue-de-demonio`) — URLs legíveis para deep link e SEO, e fixtures determinísticas para E2E e Lighthouse.
19. **TypeScript 6.0, não 7** — o `typescript-eslint` (até a canary) exige `typescript <6.1`; o TS 7 é a reescrita em Go e ainda não expõe a API que ele usa. Subir quando houver suporte.
20. **ESLint com as regras de dependência** — as regras do `ARCHITECTURE.md §2` viram `no-restricted-imports` por pasta em `eslint.config.js`, sem plugin extra. Rodam no hook `pre-commit` (`.githooks/`, ativado por `core.hooksPath` no `prepare`), sem husky/lint-staged: o hook lê o conteúdo do índice (`git show :arquivo`) e passa para `ESLint#lintText`, então valida exatamente o que vai para o commit.

## Em aberto

- MSW na extensão via service worker vs. `msw/native` (validar na Fase 0, ver `ARCHITECTURE.md` §10).
- Host do deploy (Vercel, Netlify ou Cloudflare Pages).
