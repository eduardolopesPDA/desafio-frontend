# Contratos REST e Socket.IO

> A fonte de verdade são os schemas zod em `src/contracts/` (um arquivo por recurso), usados pela app e pelos mocks. Este arquivo os espelha: ao mudar um schema, atualize aqui.

Base URL: `VITE_API_URL` (padrão `/api`). Autenticação: `Authorization: Bearer <token>`.

## Convenções

- Valores monetários são **strings decimais** em par TC/ETH: `{ "tc": "1250.50", "eth": "0.4200" }` (`moneySchema`). TC com 2 casas, ETH com 4.
- Quantidades são inteiros. Datas são ISO 8601 (UTC).
- Listas paginadas: `{ items: T[], page, pageSize, total }`.
- Query string com lista repete a chave: `?rarity=raro&rarity=epico`.
- Recursos com tempo real carregam `version: number`, que sobe a cada mudança.
- Domínios fixos com rótulo em `src/contracts/`: shows (`SHOW_NAMES`), raridades (`RARITY_NAMES`, da mais comum à mais rara), redes (`NETWORK_NAMES`: `ooo`, `elmore`, `park`) e avatares (`AVATAR_NAMES`).

## Erros

Formato único: `{ "error": { "code": string, "message": string, "fields"?: Record<string, string> } }`. `message` é texto para o usuário; `fields` aponta o campo (em notação de ponto, ex.: `collector.email`) ou, na tiragem, o id do item do carrinho.

| HTTP | `code` | Quando |
|---|---|---|
| 400 / 422 | `VALIDATION_ERROR` | Campos ou parâmetros inválidos (`fields` preenchido) |
| 401 | `UNAUTHENTICATED` · `SESSION_EXPIRED` | Sem sessão ou token inválido · sessão expirada |
| 401 | `INVALID_CREDENTIALS` | Login com e-mail ou senha incorretos |
| 403 | `FORBIDDEN` | Recurso de outro colecionador |
| 404 | `NFT_NOT_FOUND` · `NOT_FOUND` | NFT · outro recurso inexistente |
| 409 | `EMAIL_TAKEN` | Conflito no cadastro ou no perfil |
| 409 | `SOLD_OUT` · `EDITION_LIMIT` | Tiragem esgotada · quantidade acima do disponível ou do limite por pedido |
| 409 | `QUOTE_CHANGED` | Preço, tiragem, cupom ou taxa mudou desde a cotação, ou cotação expirada |
| 409 | `IDEMPOTENCY_CONFLICT` | Mesma `Idempotency-Key` com conteúdo diferente |
| 409 | `WALLET_REJECTED` · `WALLET_DISCONNECTED` | Carteira recusou a conexão · carteira não conectada na rede ao assinar |
| 410 | `NFT_BURNED` | NFT queimado |
| 422 | `COUPON_INVALID` · `COUPON_EXPIRED` | Cupom |
| 500 | `INTERNAL_ERROR` | Erro no servidor |
| 503 | `NETWORK_UNAVAILABLE` | Falha transitória / blockchain simulada indisponível |

O cliente (`lib/http`) também produz `NETWORK_ERROR` (sem resposta), `TIMEOUT` e `UNKNOWN` (resposta fora deste formato). Esses nunca vêm da API.

## Recursos

### Sessão e Toon Pass (`auth.ts`)
| Método | Rota | Corpo → Resposta |
|---|---|---|
| POST | `/auth/register` | `{ name, email, password, avatar }` → `201 Session` |
| POST | `/auth/login` | `{ email, password }` → `Session` |
| GET | `/auth/session` | → `{ user, expiresAt }` |
| POST | `/auth/logout` | → `204` |

`Session = { token, user, expiresAt }`; `User = { id, name, email, avatar, createdAt }`. Senha: mínimo de 8 caracteres, com letra e número. A sessão dura 24 h.

### CN NFTs (`nft.ts`)
| Método | Rota | Resposta |
|---|---|---|
| GET | `/nfts?q&rarity&show&sort&page&pageSize` | `Paginated<NftSummary>`. `sort`: `newest` (padrão), `price_asc`, `price_desc`, `rarity`. `pageSize` padrão 12, máx. 48 |
| GET | `/nfts/featured` | `{ items: NftSummary[] }` — destaques da semana |
| GET | `/nfts/:id` | `NftDetail`; `404 NFT_NOT_FOUND` ou `410 NFT_BURNED` |

- `id` é um slug (`enchiridion`). `q` busca no nome, personagem, show e raridade, sem acento e sem caixa.
- `NftSummary = { id, name, character, show, rarity, price, image, available, maxPerOrder, featured, createdAt, version }`. `available` soma as edições.
- `NftDetail = NftSummary + { gallery, lore, episode, attributes: { forca, caos, nostalgia }, editions }`.
- `Edition = { id, name, media, supply, available }`. Edição com `available: 0` está indisponível.

### Favoritos — Toon Stars (`favorites.ts`)
| Método | Rota | Resposta |
|---|---|---|
| GET | `/favorites` | `{ nftIds: string[] }` |
| PUT | `/favorites/:nftId` | `204` (idempotente) |
| DELETE | `/favorites/:nftId` | `204` (idempotente) |

### Cofre / Carrinho (`cart.ts`)
Visitante se identifica com o header `X-Guest-Cart-Id` (id gerado pelo cliente); usuário logado usa o próprio carrinho. Toda rota devolve o `Cart` atualizado.

| Método | Rota | Corpo |
|---|---|---|
| GET | `/cart` | |
| POST | `/cart/items` | `{ nftId, editionId, quantity }` → `201`. Mesma edição soma na linha existente |
| PATCH | `/cart/items/:itemId` | `{ quantity }` |
| DELETE | `/cart/items/:itemId` | |
| PUT | `/cart/coupon` | `{ code }` (maiúsculas não importam) |
| DELETE | `/cart/coupon` | |
| POST | `/cart/merge` | Com sessão + `X-Guest-Cart-Id`: junta o carrinho do visitante ao do usuário, limitado à tiragem |

`Cart = { id, items: CartItem[], coupon: { code, description } | null, updatedAt }`. `CartItem = { id, nftId, editionId, editionName, name, image, quantity, unitPrice, available, maxPerOrder }`, com preço e disponibilidade **atuais** do catálogo.

### Cotação & Gas Fee (`quote.ts`)
| Método | Rota | Corpo → Resposta |
|---|---|---|
| POST | `/quote` | `{ network }` → `Quote` |

`Quote = { id, network, items, coupon, subtotal, discount, gasFee, total, createdAt, expiresAt }`, com `items[] = { itemId, nftId, editionId, editionName, name, image, quantity, unitPrice, lineTotal }`. Usa o carrinho e o cupom atuais. Falha com `409 SOLD_OUT`/`EDITION_LIMIT` (com `fields` por item) ou `422 COUPON_*`. Vale 10 min.

### Pedidos / Transações (`order.ts`)
| Método | Rota | Corpo → Resposta |
|---|---|---|
| POST | `/orders` | Header `Idempotency-Key`. `{ quoteId, walletId, network, collector: { name, email, autographName? } }` → `201 Order` (`pending`) |
| GET | `/orders/:id` | `Order`; `403` se for de outro colecionador |
| GET | `/orders` | `{ items: Order[] }` do colecionador, mais recentes primeiro |

- **Idempotência:** a mesma chave com o mesmo corpo devolve o mesmo pedido (`200`); com outro corpo, `409 IDEMPOTENCY_CONFLICT`.
- **Revalidação:** o pedido recalcula a cotação no momento; qualquer diferença → `409 QUOTE_CHANGED`. Exige carteira conectada na rede (`409 WALLET_DISCONNECTED`).
- **Estados:** `pending` ("Minerando Bloco...") → `confirmed` (com `txHash`, `blockNumber`, `explorerUrl`) ou `rejected` (com `reason`). A tiragem fica reservada enquanto pendente e volta na recusa.
- **Recibo:** `items`, valores e `coupon` são um snapshot; mudanças no catálogo não os alteram. Na confirmação, o carrinho perde só os itens e quantidades comprados.

`Order = { id, status, version, network, wallet: { id, label, address }, collector, items, coupon, subtotal, discount, gasFee, total, txHash, blockNumber, explorerUrl, reason, createdAt, updatedAt }`.

### Perfil do Collector (`profile.ts`)
| Método | Rota | Corpo → Resposta |
|---|---|---|
| GET | `/profile` | → `User` |
| PATCH | `/profile` | `{ name?, email?, avatar? }` → `User`; `409 EMAIL_TAKEN` |
| POST | `/profile/password` | `{ currentPassword, newPassword }` → `204`; senha atual errada vem em `fields.currentPassword` |

### Carteiras Cripto (`wallet.ts`)
| Método | Rota | Corpo → Resposta |
|---|---|---|
| GET | `/wallets` | → `{ items: Wallet[] }` (principal primeiro) |
| POST | `/wallets` | `{ label, address, network, role: "primary" \| "secondary" }` → `201 Wallet`. Uma de cada papel |
| PATCH | `/wallets/:id` | `{ label?, address?, network? }` → `Wallet` (desconecta a carteira) |
| POST | `/wallets/:id/connect` | `{ network }` → `{ walletId, network, connectedAt }`; `409 WALLET_REJECTED` |
| DELETE | `/wallets/:id/connect` | → `204` |

Endereço fictício: `0x` + 40 caracteres hexadecimais. A conexão é simulada e não sobrevive a refresh, como numa carteira real.

## Eventos Socket.IO (`events.ts`)

Conexão: `socket.io-client` na mesma origem da app, transporte `websocket`, com `auth: { token }` quando há sessão. Visitantes também conectam (recebem só eventos públicos).

| Evento | Destino | Payload |
|---|---|---|
| `nft.updated` | Todos | `{ eventId, nftId, version, price, available, editions: [{ id, available }] }` |
| `order.updated` | Só o dono do pedido | `{ eventId, orderId, version, status, reason }` |

O cliente ignora `eventId` já processado e `version` menor ou igual à última aplicada para o mesmo recurso.
