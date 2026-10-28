# CN Toon Vault

Marketplace de NFTs temático do Cartoon Network — solução do desafio descrito em [`docs/spec.md`](docs/spec.md).

> 🚧 Em construção. As seções abaixo são exigidas pelo spec (§12) e serão completadas durante a implementação (`docs/roadmap.md`).

- **Deploy:** _a definir_
- **Arquitetura:** [`ARCHITECTURE.md`](ARCHITECTURE.md)

## Setup

Requisitos: Node.js 20+ e Google Chrome.

```bash
npm install
npx playwright install chromium   # navegador dos testes E2E
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | App web em modo dev |
| `npm run build` / `npm run preview` | Build da web (`dist/`, com checagem de tipos) / serve o build |
| `npm run dev:ext` | Extensão em modo dev (WXT abre o Chrome com a extensão carregada) |
| `npm run build:ext` | Build da extensão (`.output/chrome-mv3`) |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes E2E e regressão visual (Playwright, sobre o build web) |
| `npm run lighthouse` | Auditoria Lighthouse (mobile e desktop) |
| `npm run lint` | ESLint, incluindo as regras de dependência entre camadas |

## Hooks de commit

O `npm install` ativa os hooks de `.githooks/` (script `prepare`, que roda `git config core.hooksPath .githooks`):

- **`pre-commit`** roda o ESLint no conteúdo staged (o que vai para o commit, não o que está no disco), incluindo as regras de dependência entre camadas do `ARCHITECTURE.md`. Para checar o projeto inteiro: `npm run lint`.
- **`commit-msg`** valida a mensagem: verbo no presente, em português, sem prefixo, até 72 caracteres e sem ponto final, como em `Adiciona cupom promocional ao carrinho`.

## Variáveis de ambiente

Copie `.env.example` para `.env` para sobrescrever. Todas são opcionais.

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api` | Base URL da API REST (interceptada pelo MSW) |
| `VITE_MSW_SCENARIO` | `default` | Cenário inicial do MSW quando nenhum foi escolhido no navegador |

O Socket.IO conecta na mesma origem da app (`/socket.io/`), também interceptado pelo MSW.

## Credenciais fictícias

| Colecionador | E-mail | Senha | Para testar |
|---|---|---|---|
| Finn Mertens | `finchin@ooo.com` | `Finn1234` | Carteiras principal e secundária, Enchiridion nas Toon Stars |
| Gumball Watterson | `gumball@elmore.com` | `Gumball1234` | Só a carteira principal (cadastre a secundária) |

Cupons: `BUBBLEGUM10` (10%), `RIGBYFAIL` (100 TC / 0,0333 ETH) e `CUPOM_REINO_DOCE_EXPIRADO` (expirado). Qualquer outro código é inválido.

As senhas existem no mock só como hash SHA-256 com salt (`src/mocks/fixtures/index.ts`).

## Cenários do MSW

Não há back-end: o MSW é a API em todos os ambientes, inclusive no deploy. O estado (catálogo, carrinhos, pedidos, contas) fica no `localStorage` e sobrevive a refresh.

- **Escolher um cenário:** abra qualquer URL com `?scenario=<nome>`, por exemplo `/?scenario=slow-network`. A escolha fica salva até outra; volte com `?scenario=default`.
- **Resetar o universo:** `?reset` restaura fixtures, apaga sessões, carrinhos e pedidos. Combina com o cenário: `/?reset&scenario=tx-rejected`.
- **Pelo console** (`window.__cnMock`): `scenarios()` lista os cenários, `scenario` mostra o ativo, `setScenario(nome)`, `reset()`, `expireSessions()`, `updateNft(id, { price, editions })` (emite `nft.updated`) e `disconnectSockets(ms)`.
- **No Playwright:** navegue com os mesmos parâmetros e espere `window.__cnMock` existir antes de interagir.

| Cenário | O que acontece |
|---|---|
| `default` | Sucesso, latência fixa de 250 ms |
| `slow-network` | Toda resposta leva 2,5 s (skeletons) |
| `variable-latency` | Latência entre 100 ms e 2 s, mesma sequência a cada carregamento |
| `out-of-order` | Listagem do catálogo: chamadas ímpares levam 2 s, pares 300 ms |
| `catalog-error` | Listagem responde 503 nas 3 primeiras chamadas e depois se recupera |
| `server-error` | Toda requisição responde 500 |
| `offline` | Toda requisição falha na rede |
| `favorite-error` | Favoritar e desfavoritar respondem 503 |
| `blockchain-down` | Criar pedido e conectar carteira respondem 503 |
| `price-changed` | 1,5 s após a cotação, o preço do 1º item do carrinho sobe 10% (`nft.updated`) |
| `sold-out` | 1,5 s após a cotação, a edição do 1º item do carrinho esgota (`nft.updated`) |
| `order-timeout` | O 1º pedido é criado, mas a resposta leva 15 s (o cliente desiste em 10 s) |
| `tx-rejected` | Transações são recusadas na rede |
| `wallet-rejected` | A carteira recusa a conexão |
| `wallet-disconnected` | A carteira desconecta na 1ª tentativa de assinar |
| `duplicate-events` | Eventos de socket chegam duplicados e seguidos de uma versão antiga |

Os gatilhos "1º" valem uma vez por carregamento de página.

## Reproduzindo os fluxos de falha

Regras que não precisam de cenário, porque vêm dos dados:

- **Busca vazia:** pesquise `Scooby-Doo`.
- **NFT inexistente e queimado:** `/nfts/nao-existe` (404) e `/nfts/gema-do-lich` (410).
- **Edição indisponível e esgotado:** Edição Holográfica da `coroa-do-rei-gelado`; `moletom-do-rigby` sem tiragem.
- **Conflito de cadastro:** cadastre-se com `finchin@ooo.com`.
- **Cupom inválido ou expirado:** `QUALQUERCOISA` e `CUPOM_REINO_DOCE_EXPIRADO`.
- **Sessão expirada:** logado, rode `__cnMock.expireSessions()` no console e navegue.
- **Acesso não autorizado:** abra uma rota privada sem login, ou o pedido de outro colecionador (403).

_O passo a passo pela interface de cada cenário entra junto com as telas (Fases 2 a 6)._
