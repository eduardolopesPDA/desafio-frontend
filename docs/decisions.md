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
21. **Erros normalizados em `ApiError` no interceptor do Axios** — features e TanStack Query tratam um tipo só (`code`, `status`, `fields`, `isTransient`), sem conhecer o Axios. Cancelamentos passam intactos para o Query reconhecê-los.
22. **Cupom guardado no carrinho (`PUT/DELETE /cart/coupon`), não só enviado na cotação** — o spec pede carrinho que sobrevive a refresh e merge; o cupom faz parte desse estado. A cotação usa o cupom do carrinho.
23. **Conexão de carteira pela API (`POST /wallets/:id/connect`)** — o spec pede simular conexão, recusa e desconexão. Pela API, os cenários `wallet-rejected` e `wallet-disconnected` agem na rede, sem caminho alternativo na UI. A conexão fica só em memória, como numa carteira real.
24. **Preço no NFT, tiragem por edição** — o detalhe precisa de "edição indisponível" e limite de tiragem; preço por edição complicaria cotação e eventos sem ganho para o spec. `nft.updated` leva o total e a lista `editions`.
25. **Bootstrap importa a app depois de `startMocks()`** — o `engine.io-client` captura o `WebSocket` global no import; carregar a app antes do MSW faria o socket escapar da interceptação.
26. **Socket.IO na mesma origem, sem `VITE_SOCKET_URL`** — funciona igual na web e na extensão (`chrome-extension://`), e o `ws.link` casa qualquer host. Uma variável seria configuração sem uso.
27. **Testes da API simulada no Node (`tests/api/`, `msw/node`)** — cobrem regras de negócio (idempotência, cotação, isolamento) em segundos, pelo cliente Axios real e validando respostas com os schemas. O E2E prova o MSW no navegador; não repete cada regra.
28. **`ignoreRestSiblings` no ESLint** — tirar campos internos com `const { interno, ...publico }` é o jeito mais legível de montar respostas; sem a opção, o lint acusa a variável descartada.
29. **Imagens provisórias em WebP** — `public/nfts/<id>-<n>.webp` (800×800) e `public/avatars/<id>.webp` (256×256) são cartões gerados (cores do show, iniciais e nome; a raridade fica no selo da interface) até os assets do Figma chegarem. Já em WebP e nos caminhos finais, para a troca não mexer em fixtures nem telas. Os `alt` das fixtures descrevem a arte final e precisam ser revisados na troca.
30. **Identidade visual provisória, até o acesso ao Figma** — tinta preta sobre papel branco, contorno grosso e sombra dura de cartum, e o xadrez do Cartoon Network como assinatura (faixa do topo e logotipo). Bowlby One nos títulos e Baloo 2 no corpo (`@fontsource`, só o subset latino da display). A cor forte fica nas artes; a interface usa amarelo para a ação principal e azul para o foco. Tokens em `globals.css`; os componentes shadcn foram adaptados a eles, sem mudar comportamento.
31. **Selo de raridade com forma e texto** — cada raridade tem ícone próprio além da cor (spec §8: estados não dependentes só de cor).
32. **Filtros com ToggleGroup do shadcn (Radix)** — chips com `aria-pressed`, navegação por setas (papel `toolbar`) e ícone de check quando ligados. No celular ficam atrás do botão "Filtros", que mostra quantos estão ativos.

## Em aberto

- MSW na extensão via service worker vs. `msw/native` (validar na Fase 0, ver `ARCHITECTURE.md` §10).
- Host do deploy (Vercel, Netlify ou Cloudflare Pages).
