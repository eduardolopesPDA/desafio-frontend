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

## Hooks de commit

O `npm install` ativa os hooks de `.githooks/` (script `prepare`, que roda `git config core.hooksPath .githooks`):

- **`pre-commit`** roda o ESLint no conteúdo staged (o que vai para o commit, não o que está no disco), incluindo as regras de dependência entre camadas do `ARCHITECTURE.md`. Para checar o projeto inteiro: `npm run lint`.
- **`commit-msg`** valida a mensagem: verbo no presente, em português, sem prefixo, até 72 caracteres e sem ponto final, como em `Adiciona cupom promocional ao carrinho`.

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
