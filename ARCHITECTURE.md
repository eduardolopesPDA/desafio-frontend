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
    │   └── utils.ts                 # cn() do shadcn e helpers
    ├── components/
    │   ├── ui/                      # gerado pelo shadcn (adaptado ao tema CN)
    │   └── …                        # layout, skeletons, feedback compartilhados
    ├── mocks/
    │   ├── browser.ts               # setupWorker + socket binding
    │   ├── handlers/                # um arquivo por recurso REST
    │   ├── realtime.ts              # emissão de nft.updated / order.updated
    │   ├── db/                      # estado em memória, persistência local e reset
    │   ├── fixtures/                # 12–20 NFTs, ≥ 2 usuários, cupons, carteiras
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
| `/` | Toon Vault — catálogo. Search params: `q`, `rarity[]`, `show[]`, `sort`, `page` | público |
| `/nfts/$nftId` | Detalhe do Toon NFT | público |
| `/cart` | Cofre / Carrinho | público (visitante) |
| `/login` (`?redirect=`) · `/register` | Toon Pass | público |
| `/checkout` | Checkout de Autógrafos / Pagamento | privado |
| `/orders/$orderId` | Pedido pendente, confirmado (recibo) ou recusado | privado |
| `/profile` · `/wallets` | Perfil · Cofre de Carteiras | privado |
| `*` | Não encontrado (`notFoundComponent` na raiz) | — |

- Rotas privadas ficam sob o layout `_authenticated` (`beforeLoad` verifica a sessão e redireciona para `/login?redirect=<rota atual>`).
- Search params são validados com `validateSearch` (zod). Mudar filtro zera `page`.

## 4. Estado remoto e política de cache (TanStack Query)

| Tema | Política |
|---|---|
| Query keys | Factories por feature (`nftKeys.list(params)`). Dados privados começam com `['user', userId, …]` para isolar usuários. |
| `staleTime` | Padrão 30 s. Carrinho, cotação e pedido pendente: 0 (sempre revalidam). |
| Listagem | `placeholderData: keepPreviousData` para paginação/filtro sem layout shift. |
| Cancelamento | `signal` do Query repassado ao Axios; respostas fora de ordem são descartadas porque cada combinação de parâmetros tem sua própria key. |
| Retries | Queries: até 2, com backoff, só para erro de rede/5xx. 4xx nunca. Mutations: sem retry automático. |
| Pedido | `POST /orders` reenviado com a **mesma** `Idempotency-Key` após timeout; a key nasce no início do checkout e é guardada até a confirmação. |
| Otimismo | Favoritar (Toon Star): `onMutate` atualiza o cache, `onError` faz rollback, `onSettled` invalida. |
| Invalidação | Após mutation, invalida as keys do recurso afetado; eventos de socket atualizam via `setQueryData` e invalidam a cotação. |
| Logout / troca de usuário | `queryClient.removeQueries({ queryKey: ['user'] })`, desconecta o socket e limpa a sessão. |

## 5. Tempo real (Socket.IO)

- Uma conexão `socket.io-client` por sessão; autenticada com o token; encerrada no logout.
- Eventos `nft.updated` e `order.updated` (formato em `docs/contracts.md`) trazem `eventId`, recurso afetado e `version`.
- O cliente guarda a última `version` por recurso: ignora versões antigas/iguais e `eventId` repetido.
- Na reconexão, invalida as queries ativas (carrinho, cotação, pedido pendente) para reconciliar com a REST.
- Listeners são registrados em hooks com cleanup; nada sobrevive ao ciclo de vida do componente ou da sessão.
- **Transporte nos mocks:** `@mswjs/socket.io-binding` sobre a interceptação de WebSocket do MSW. Limitações (sem servidor real, eventos disparados pelo `mocks/db` e pelos cenários) documentadas aqui ao final da implementação.

## 6. Valores monetários

Preços, descontos, Gas Fee e totais trafegam como **strings decimais** e são calculados com `big.js` em `lib/money`. Nunca usar `number` para dinheiro. Quantidades são inteiras. A cotação da API é a referência para fechar o pedido.

## 7. Sessão (Toon Pass)

- Token salvo em `localStorage` para recuperar a sessão após refresh; interceptor do Axios envia `Authorization`.
- `401 SESSION_EXPIRED` → limpa a sessão e redireciona para `/login?redirect=…`, preservando o carrinho (no servidor simulado) e o rascunho do checkout (`sessionStorage`).
- Carrinho de visitante identificado por `guestCartId`; ao logar, `POST /cart/merge`.
- O mock guarda senhas apenas como hash (Web Crypto, SHA-256 + salt).

## 8. Mocks (MSW)

- Handlers por recurso em `mocks/handlers/`, sobre um `db` em memória persistido em `localStorage`. **Reset** restaura as fixtures.
- Cenários de rede em `mocks/scenarios/` (lentidão, latência variável, fora de ordem, timeout, 4xx/5xx, blockchain indisponível, sessão expirada, cupom expirado, preço alterado, esgotado, transação recusada).
- Seleção de cenário: `?scenario=<nome>` ou painel de dev; persistida em `localStorage`. Playwright define via `page.addInitScript`.

## 9. Testes e qualidade

| Ferramenta | Escopo | Alvo |
|---|---|---|
| Vitest | Unitários de `lib/` (money, dedupe de eventos), schemas e funções puras | — |
| Playwright | E2E dos 12 cenários do spec, Chromium, viewports desktop (1440) e mobile (390); regressão visual de catálogo, detalhe, carrinho e checkout | build web (`vite preview`) |
| Lighthouse (LHCI) | Home e detalhe, perfis mobile e desktop, 3 execuções, mediana; reports HTML/JSON em `lighthouse/reports/` | build web |

## 10. Riscos a validar na Fase 0

- **MSW na extensão:** registrar o service worker do MSW numa página `chrome-extension://` pode não ser permitido. Fallback: no alvo extensão, usar os interceptors do MSW sem service worker (`msw/native`), mantendo os mesmos handlers.
- **Deploy com browser history:** o host precisa de fallback SPA (rewrite de todas as rotas para `index.html`).
