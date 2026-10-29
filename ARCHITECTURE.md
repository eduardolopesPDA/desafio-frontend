# Arquitetura — CN Toon Vault

> Requisitos: `docs/spec.md` · Contratos REST e Socket.IO: `docs/contracts.md` · Decisões: `docs/decisions.md`

## 1. Visão geral

Uma única aplicação React em `src/`, publicada em **dois alvos de build** que compartilham 100% do código da app:

| Alvo | Ferramenta | Entrada | History do Router | Para quê |
|---|---|---|---|---|
| **Extensão Chrome (MV3)** | WXT | `src/entrypoints/app/` → `app.html`, aberta numa aba pelo `background.ts` ao clicar no ícone | hash | WXT é obrigatório no projeto |
| **Web** | Vite | `index.html` → `src/web/main.tsx` | browser | Deploy público, Playwright e Lighthouse exigidos pelo spec |

Os dois entrypoints só chamam `bootstrap({ history })` (`src/app/bootstrap.tsx`), que inicia o MSW, cria o `QueryClient` e o router e renderiza a app.

Não há back-end: **o MSW é a API em todos os ambientes**, inclusive no deploy.

```
┌─────────────────────────────────────────────────────────────────────┐
│ UI         routes/ (telas) · features/*/components · components/ui  │  React + Tailwind + shadcn/ui
├─────────────────────────────────────────────────────────────────────┤
│ Estado     features/*/queries.ts (TanStack Query)                   │  cache, mutations, otimismo
│            routes/ (TanStack Router: search params, guards)         │  estado da URL, rotas privadas
├─────────────────────────────────────────────────────────────────────┤
│ Transporte features/*/api.ts → lib/http (Axios)                     │  REST tipado
│            lib/realtime (socket.io-client)                          │  eventos
├────────────────────────── rede ─────────────────────────────────────┤
│ Mocks      mocks/ (MSW handlers + @mswjs/socket.io-binding + db)    │  "servidor" simulado
└─────────────────────────────────────────────────────────────────────┘
        contracts/ (schemas zod + tipos) é usado por Transporte e por Mocks
```

## 2. Estrutura de pastas

```text
.
├── agents/ · skills/ · docs/        # instruções para IA e documentação
├── ARCHITECTURE.md · README.md
├── index.html                       # entrada do alvo web
├── wxt.config.ts                    # alvo extensão
├── vite.config.ts                   # alvo web
├── components.json                  # shadcn/ui
├── playwright.config.ts
├── lighthouse/                      # configs LHCI (mobile/desktop) e reports/
├── tests/e2e/                       # specs Playwright + baselines visuais
├── public/                          # assets, mockServiceWorker.js
└── src/
    ├── entrypoints/                 # WXT
    │   ├── background.ts            # abre app.html numa aba
    │   └── app/{index.html,main.tsx}
    ├── web/main.tsx                 # entrada web
    ├── app/                         # bootstrap, providers, createAppRouter(history), queryClient
    ├── routes/                      # TanStack Router file-based (gera routeTree.gen.ts)
    ├── features/                    # uma pasta por domínio
    │   ├── catalog/  nft/  favorites/  cart/  checkout/  orders/
    │   ├── auth/  profile/  wallets/
    │   └── <feature>/{api.ts, queries.ts, components/, *.test.ts}
    ├── contracts/                   # schemas zod de requests, responses, erros e eventos
    ├── lib/
    │   ├── http/                    # instância Axios, interceptors, normalização de erros
    │   ├── realtime/                # cliente socket, dedupe/versão de eventos
    │   ├── money/                   # aritmética decimal (strings) e formatação TC/ETH
    │   └── utils.ts                 # reexporta cn() do pacote `cn` (shadcn)
    ├── components/
    │   ├── ui/                      # gerado pelo shadcn (adaptado ao tema CN)
    │   └── …                        # layout, skeletons, feedback compartilhados
    ├── mocks/
    │   ├── browser.ts               # startMocks(): controles da URL, setupWorker, pedidos pendentes
    │   ├── handlers/                # um arquivo por recurso REST + index com todos
    │   ├── realtime.ts              # Socket.IO simulado: conexões, nft.updated / order.updated
    │   ├── http.ts · session.ts     # route() com cenário e erros do contrato · sessão e hash de senha
    │   ├── catalog.ts · carts.ts    # regras compartilhadas: NFTs, tiragem, carrinho, cotação
    │   ├── devtools.ts              # ?scenario, ?reset e window.__cnMock
    │   ├── db/                      # estado persistido em localStorage, reset e dinheiro (big.js)
    │   ├── fixtures/                # 16 NFTs, 2 usuários, cupons, carteiras, gas fee
    │   └── scenarios/               # latência, falhas, timeouts, conflitos
    └── styles/globals.css           # Tailwind v4 + tokens do tema
```

### Regras de dependência

- `routes/` → `features/` → `lib/`, `contracts/`. Nunca o contrário.
- Uma feature usa outra apenas pelo que ela exporta em `queries.ts` (ex.: `checkout` usa as queries de `cart`).
- `mocks/` importa só `contracts/` e os próprios arquivos. O código da app **nunca** importa `mocks/`, exceto `app/bootstrap.tsx`.
- Componentes, hooks e o cliente Axios não contêm dados fictícios nem caminhos alternativos para mock (exigência do spec, §6).

## 3. Roteamento (TanStack Router)

File-based, em `src/routes/`, com o plugin `@tanstack/router-plugin/vite` nos dois alvos.

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Toon Vault — destaques e catálogo. Search params: `q`, `rarity`, `show`, `sort`, `page` | público |
| `/nfts/$nftId` | Detalhe do Toon NFT | público |
| `/cart` | Cofre / Carrinho | público (visitante) |
| `/login` (`?redirect=`) · `/register` | Toon Pass | público |
| `/checkout` | Checkout de Autógrafos / Pagamento | privado |
| `/orders/$orderId` | Pedido pendente, confirmado (recibo) ou recusado | privado |
| `/profile` · `/wallets` | Perfil · Cofre de Carteiras | privado |
| `*` | Não encontrado (`notFoundComponent` na raiz) | — |

- Rotas privadas ficam sob o layout `_authenticated` (`beforeLoad` verifica a sessão e redireciona para `/login?redirect=<rota atual>`).
- Search params são validados com `validateSearch` (zod). Valor ausente ou inválido cai no padrão, e os padrões saem da URL (`stripSearchParams`). Mudar busca, filtro ou ordem zera `page`.
- Listas repetem a chave na URL (`?rarity=raro&rarity=epico`), como na API: `parseSearch`/`stringifySearch` próprios em `app/router.ts`, no lugar do JSON padrão do router.
- O catálogo não usa loader: a lista vem de `useQuery` com `keepPreviousData`, para filtrar sem trocar a página por skeleton e mostrar erro com nova tentativa no lugar. O detalhe usa loader (`ensureQueryData`): `NFT_NOT_FOUND` vira `notFound()`, e `NFT_BURNED` e falhas vão para o `errorComponent`.
- Skeleton de rota só aparece depois de 400 ms de espera (`defaultPendingMs`), e fica pelo menos 300 ms na tela.

## 4. Estado remoto e política de cache (TanStack Query)

| Tema | Política |
|---|---|
| Query keys | Factories por feature (`nftKeys.list(params)`). Dados privados começam com `['user', userId, …]` para isolar usuários. |
| `staleTime` | Padrão 30 s. Carrinho, cotação e pedido pendente: 0 (sempre revalidam). |
| Listagem | `placeholderData: keepPreviousData` para paginação/filtro sem layout shift. |
| Cancelamento | `signal` do Query repassado ao Axios; respostas fora de ordem são descartadas porque cada combinação de parâmetros tem sua própria key. |
| Retries | Queries: até 2, com backoff, só para erro de rede/5xx. 4xx nunca. Mutations: sem retry automático. |
| Pedido | `POST /orders` reenviado com a **mesma** `Idempotency-Key` após timeout; a key nasce no início do checkout e é guardada até a confirmação. |
| Otimismo | Favoritar (Toon Star): `onMutate` atualiza o cache, `onError` faz rollback, `onSettled` invalida. Os toggles são enfileirados (`scope`), na ordem dos cliques; o rollback volta ao último estado aceito pelo servidor (não ao snapshot, que pode ser otimismo de um clique que também falhou) e só o último toggle pendente do NFT o aplica; a invalidação espera o último toggle terminar. |
| Invalidação | Após mutation, invalida as keys do recurso afetado; eventos de socket atualizam via `setQueryData` e invalidam a cotação. |
| Sessão | `['auth', 'session']` (fora de `['user']`), `staleTime`/`gcTime` infinitos e sem retry: só muda por login, cadastro, logout ou 401. O `beforeLoad` da raiz faz `ensureQueryData`, então `useCurrentUser()` é síncrono. |
| Logout / troca de usuário | `queryClient.removeQueries({ queryKey: ['user'] })` e limpa a sessão (login e cadastro também removem `['user']`, para a troca de usuário sem logout). A partir da Fase 4, desconecta o socket. |

## 5. Tempo real (Socket.IO)

- Uma conexão `socket.io-client` por sessão; autenticada com o token; encerrada no logout.
- Eventos `nft.updated` e `order.updated` (formato em `docs/contracts.md`) trazem `eventId`, recurso afetado e `version`.
- O cliente guarda a última `version` por recurso: ignora versões antigas/iguais e `eventId` repetido.
- Na reconexão, invalida as queries ativas (carrinho, cotação, pedido pendente) para reconciliar com a REST.
- Listeners são registrados em hooks com cleanup; nada sobrevive ao ciclo de vida do componente ou da sessão.

### Transporte nos mocks

O `socket.io-client` conecta na mesma origem (`/socket.io/`, transporte `websocket`). O MSW substitui o `WebSocket` global e o `ws.link` de `mocks/realtime.ts` atende a conexão; o `@mswjs/socket.io-binding` traduz o protocolo Engine.IO/Socket.IO. Os eventos nascem das mudanças no `mocks/db` (preço, tiragem, pedido), dos cenários e de `window.__cnMock`, nunca da UI.

Limitações conhecidas:

- **Só transporte `websocket`.** O MSW intercepta WebSocket, não o long-polling do Engine.IO. O cliente precisa de `transports: ['websocket']`.
- **A app carrega depois do MSW.** O `engine.io-client` guarda o `WebSocket` global no import. Por isso o `bootstrap` faz `import()` do router só depois de `startMocks()`; um import estático da app ali quebraria a interceptação.
- **Handshake simplificado.** O binding responde o `CONNECT` na hora, sem validar `auth`. O mock lê o token do pacote `40{...}` e só então associa a conexão ao colecionador; até isso, ela recebe apenas eventos públicos. Token inválido não recusa a conexão: ela fica como visitante.
- **Heartbeat manual.** O binding não envia ping; o mock manda `2` a cada 20 s para o cliente não cair por `pingTimeout`.
- **Sem rooms, namespaces nem acks.** O isolamento por usuário é feito filtrando as conexões no próprio mock.
- **Por aba.** O "servidor" vive em cada aba; duas abas não trocam eventos entre si, mas compartilham o estado pelo `localStorage` ao recarregar.
- **Queda simulada.** `__cnMock.disconnectSockets(ms)` fecha as conexões e recusa reconexões por `ms`, para testar reconexão e reconciliação.

## 6. Valores monetários

Preços, descontos, Gas Fee e totais trafegam como **strings decimais** e são calculados com `big.js` em `lib/money`. Nunca usar `number` para dinheiro. Quantidades são inteiras. A cotação da API é a referência para fechar o pedido.

## 7. Sessão (Toon Pass)

Código em `features/auth/session.ts` (sem React) e `features/auth/queries.ts` (hooks).

- **Onde fica o token:** a sessão inteira (`{ token, user, expiresAt }`) em `localStorage`, chave `cn-toon-vault:session`, validada pelo schema na leitura. O interceptor do Axios envia `Authorization` com o token que a feature passa por `setAccessToken`.
- **Restauração:** o `beforeLoad` da raiz faz `ensureQueryData(sessionQuery())`. Sem token salvo, a sessão é `null` sem requisição. Com token, `GET /auth/session` valida e atualiza o usuário salvo.
- **Falha transitória na restauração:** só 401 desloga (limpa o token e a sessão vira `null`). Rede, timeout, 5xx ou resposta fora do contrato mantêm o usuário salvo, sem retry e sem quebrar a app. Se o token de fato caiu, o próximo 401 de qualquer requisição encerra a sessão pelo fluxo de expiração. A exceção é uma sessão salva com `expiresAt` já vencido, que vira visitante.
- **Login e cadastro:** salvam a sessão, chamam `setAccessToken`, removem `['user']` e gravam a sessão no cache. A navegação (para `redirect`) é do componente.
- **Logout:** `POST /auth/logout` (falha ignorada) e depois `endSession`: limpa storage, token, `['user']` e põe a sessão como `null`. A navegação é do componente.
- **Expiração (`401 SESSION_EXPIRED` ou `UNAUTHENTICATED`):** `lib/http` expõe `onUnauthorized(handler)` e não conhece features. O handler é registrado no `bootstrap` (`handleSessionExpiry`), roda `endSession` e navega para `/login` com `search: { redirect: router.state.location.href, reason: 'expired' }`, preservando o carrinho (no servidor simulado) e o rascunho do checkout (`sessionStorage`). Usa só APIs do router, então vale na hash history (extensão) e na browser history (web). O erro continua sendo rejeitado como `ApiError` para quem fez a requisição.
  - Só conta o 401 de uma requisição que levou o token **atual**. Quando várias expiram juntas, a primeira limpa o token e as outras já não batem, então há um redirect só. Respostas atrasadas de uma sessão anterior (após logout ou troca de usuário) são ignoradas. Já em `/login`, não navega, para não trocar o `redirect` por `/login`.
  - `GET /auth/session` e `POST /auth/logout` pedem `skipUnauthorizedHandler`: tratam o próprio 401.
  - Limitação aceita: um 401 que chegue durante o próprio `POST /auth/logout` (outra requisição processada depois do fim da sessão no servidor) ainda dispara o fluxo de expiração: o usuário sai do mesmo jeito, mas pode cair em `/login` com o aviso de sessão expirada. A janela é a latência do logout; não compensa o custo de evitar.
- **Rotas privadas:** layout `_authenticated` com `beforeLoad` que faz `ensureQueryData(sessionQuery())` e, se for `null`, `redirect` para `/login?redirect=<location.href>`. Devolve `{ user }` no contexto das rotas filhas.
- **Socket (Fase 4):** `endSession` é o ponto em que o socket da sessão será desconectado (comentário no código), cobrindo logout, troca de usuário e expiração.
- Carrinho de visitante identificado por `guestCartId`; ao logar, `POST /cart/merge` (Fase 4).
- O mock guarda senhas apenas como hash (Web Crypto, SHA-256 + salt).

## 8. Mocks (MSW)

- Handlers por recurso em `mocks/handlers/`, todos declarados com `route()` (`mocks/http.ts`). Ele aplica latência e falhas do cenário, converte `MockError` no corpo de erro do contrato e persiste o `db` após escritas.
- Requests validados com os schemas de `contracts/`; erros de validação saem como `VALIDATION_ERROR` com `fields`.
- Um único `db` (`mocks/db`) mantém catálogo, contas, sessões, favoritos, carrinhos, cotações, pedidos e carteiras consistentes, persistido em `localStorage`. **Reset** (`?reset`) restaura as fixtures. Conexões de carteira ficam só em memória.
- Regras de negócio no mock: tiragem e limite por pedido, cupons, cotação revalidada no pedido, idempotência, reserva de tiragem enquanto o pedido está pendente, recibo como snapshot e isolamento por usuário.
- Pedidos pendentes "mineram" por 4 s. O resultado e o horário são gravados na criação, então refresh no meio não perde nem duplica o pedido: `startMocks()` reagenda os pendentes e a leitura confirma os vencidos.
- Cenários em `mocks/scenarios/`, determinísticos (latências fixas ou de PRNG com semente). A lista está no `README.md`.
- Seleção: `?scenario=<nome>` (persistido em `localStorage`), `VITE_MSW_SCENARIO` como padrão, ou `window.__cnMock.setScenario()`.

## 9. Testes e qualidade

| Ferramenta | Escopo | Alvo |
|---|---|---|
| Vitest — `unit` | Unitários de `lib/` (money, http, dedupe de eventos), ao lado do código | — |
| Vitest — `api` | Regras da API simulada (`tests/api/`): handlers no `msw/node`, chamados pelo Axios da app, respostas validadas pelos schemas | — |
| Playwright | E2E dos 12 cenários do spec, Chromium, viewports desktop (1440) e mobile (390); regressão visual de catálogo, detalhe, carrinho e checkout | build web (`vite preview`) |
| Lighthouse (LHCI) | Home e detalhe, perfis mobile e desktop, 3 execuções, mediana; reports HTML/JSON em `lighthouse/reports/` | build web |

## 10. Riscos a validar na Fase 0

- **MSW na extensão:** registrar o service worker do MSW numa página `chrome-extension://` pode não ser permitido. Fallback: no alvo extensão, usar os interceptors do MSW sem service worker (`msw/native`), mantendo os mesmos handlers.
- **Deploy com browser history:** o host precisa de fallback SPA (rewrite de todas as rotas para `index.html`).
