# CN Toon Vault

Marketplace de NFTs temático do Cartoon Network — solução do desafio descrito em [`docs/spec.md`](docs/spec.md).

> 🚧 Em construção. As seções abaixo são exigidas pelo spec (§12) e serão completadas durante a implementação (`docs/roadmap.md`).

- **Deploy:** _a definir_
- **Arquitetura:** [`ARCHITECTURE.md`](ARCHITECTURE.md)

## Setup

Requisitos: Node.js 20+ e Google Chrome.

```bash
npm install
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Extensão em modo dev (WXT abre o Chrome com a extensão carregada) |
| `npm run dev:web` | App web em modo dev |
| `npm run build` / `npm run build:web` | Build da extensão (`.output/chrome-mv3`) / da web (`dist/`) |
| `npm run zip` | Pacote `.zip` da extensão |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes E2E e regressão visual (Playwright) |
| `npm run lighthouse` | Auditoria Lighthouse (mobile e desktop) |

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api` | Base URL da API REST (interceptada pelo MSW) |
| `VITE_SOCKET_URL` | _a definir_ | URL do Socket.IO (interceptada pelo MSW) |

## Credenciais fictícias

| Colecionador | E-mail | Senha |
|---|---|---|
| Finn | `finchin@ooo.com` | _a definir_ |
| Gumball | `gumball@elmore.com` | _a definir_ |

## Cenários do MSW

_Como selecionar (`?scenario=`), listar e resetar os cenários._

## Reproduzindo os fluxos de falha

_Passo a passo de cada cenário de falha do spec §6._
