# Contratos REST e Socket.IO

> **Rascunho.** Ajuste durante a implementação. A fonte de verdade em código são os schemas zod em `src/contracts/`; este arquivo deve espelhá-los.

Base URL: `VITE_API_URL` (padrão `/api`). Autenticação: `Authorization: Bearer <token>`.

## Convenções

- Valores monetários são **strings decimais**: `{ "tc": "1250.50", "eth": "0.4200" }`.
- Quantidades são inteiros.
- Listas paginadas: `{ items: T[], page, pageSize, total }`.
- Recursos com tempo real carregam `version: number`.

## Erros

Formato único: `{ "error": { "code": string, "message": string, "fields"?: Record<string, string> } }`

| HTTP | `code` | Quando |
|---|---|---|
| 400 / 422 | `VALIDATION_ERROR` | Campos inválidos (`fields` preenchido) |
| 401 | `UNAUTHENTICATED` · `SESSION_EXPIRED` | Sem sessão · sessão expirada |
| 403 | `FORBIDDEN` | Recurso de outro colecionador |
| 404 | `NFT_NOT_FOUND` · `NOT_FOUND` | NFT ou recurso inexistente |
| 409 | `EMAIL_TAKEN` | Conflito no cadastro |
| 409 | `SOLD_OUT` · `EDITION_LIMIT` | Tiragem esgotada · quantidade acima do limite |
| 409 | `QUOTE_CHANGED` | Preço, tiragem, cupom ou taxa mudou desde a cotação |
| 409 | `IDEMPOTENCY_CONFLICT` | Mesma `Idempotency-Key` com conteúdo diferente |
| 410 | `NFT_BURNED` | NFT queimado |
| 422 | `COUPON_INVALID` · `COUPON_EXPIRED` | Cupom |
| 503 | `NETWORK_UNAVAILABLE` | Falha transitória / blockchain simulada indisponível |

## Recursos

### Sessão e Toon Pass
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastro (nome, e-mail, senha, avatar) → sessão |
| POST | `/auth/login` | Login → `{ token, user, expiresAt }` |
| GET | `/auth/session` | Sessão atual |
| POST | `/auth/logout` | Encerra a sessão |

### CN NFTs
| Método | Rota | Descrição |
|---|---|---|
| GET | `/nfts?q&rarity&show&sort&page&pageSize` | Listagem. `rarity` e `show` aceitam múltiplos valores. `sort`: `price_asc`, `price_desc`, `newest`, `rarity` |
| GET | `/nfts/featured` | Destaques da semana |
| GET | `/nfts/:id` | Detalhe (galeria, lore, atributos, edições, tiragem disponível) |

### Favoritos (Toon Stars)
| Método | Rota |
|---|---|
| GET | `/favorites` |
| PUT | `/favorites/:nftId` |
| DELETE | `/favorites/:nftId` |

### Cofre / Carrinho
| Método | Rota | Descrição |
|---|---|---|
| GET | `/cart` | Carrinho do usuário ou do visitante (`X-Guest-Cart-Id`) |
| POST | `/cart/items` | `{ nftId, editionId, quantity }` |
| PATCH | `/cart/items/:itemId` | `{ quantity }` |
| DELETE | `/cart/items/:itemId` | |
| POST | `/cart/merge` | Junta o carrinho do visitante ao do usuário após login |

### Cotação & Gas Fee
| Método | Rota | Descrição |
|---|---|---|
| POST | `/quote` | `{ coupon?, network, currency }` → `{ quoteId, items, subtotal, discount, gasFee, total, expiresAt }`. Valida cupom e tiragem |

### Pedidos / Transações
| Método | Rota | Descrição |
|---|---|---|
| POST | `/orders` | Header `Idempotency-Key`. Body `{ quoteId, walletId, network }` → pedido `pending` |
| GET | `/orders/:id` | Estado (`pending`, `confirmed`, `rejected`) e recibo (snapshot imutável, `txHash`, `explorerUrl`) |
| GET | `/orders` | Histórico do colecionador |

### Perfil do Collector
| Método | Rota |
|---|---|
| GET | `/profile` |
| PATCH | `/profile` (dados e avatar) |
| POST | `/profile/password` (`{ currentPassword, newPassword }`) |

### Carteiras Cripto
| Método | Rota |
|---|---|
| GET | `/wallets` |
| POST | `/wallets` (`{ label, address, network, role: "primary" \| "secondary" }`) |
| PATCH | `/wallets/:id` |

## Eventos Socket.IO

| Evento | Payload |
|---|---|
| `nft.updated` | `{ eventId, nftId, version, price: { tc, eth }, available }` |
| `order.updated` | `{ eventId, orderId, version, status, reason? }` |

O cliente ignora `eventId` já processado e `version` menor ou igual à última aplicada para o mesmo recurso.
