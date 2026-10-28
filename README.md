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

| Variável | Padrão | Descrição |
|---|---|---|
Copie `.env.example` para `.env` para sobrescrever. Todas são opcionais.

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api` | Base URL da API REST (interceptada pelo MSW) |
| `VITE_MSW_SCENARIO` | `default` | Cenário inicial do MSW (_a implementar na Fase 1_) |
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
