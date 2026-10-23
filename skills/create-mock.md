---
name: create-mock
description: Cria ou altera a simulação de API do CN Toon Vault com MSW — handler REST, fixtures, estado no db, cenários de rede e falha e eventos Socket.IO via @mswjs/socket.io-binding. Use sempre que precisar de um endpoint simulado novo, mudar uma regra do servidor simulado, adicionar um cenário de falha, fixture ou evento de tempo real, ou quando o usuário digitar /create-mock.
---

# Criar mock (MSW)

O MSW é o back-end deste projeto: roda em desenvolvimento, no deploy, na extensão e nos
testes. Por isso ele precisa ser **consistente** (todos os recursos leem e escrevem no
mesmo `db`), **determinístico** (o mesmo cenário produz sempre o mesmo resultado) e
**fiel ao contrato** (`src/contracts/`). Nada disso pode vazar para o código da app.

## 1. Contrato primeiro

Confirme que o schema do request/response existe em `src/contracts/` e está espelhado em
`docs/contracts.md`. Se não existir, crie antes do handler.

## 2. Estado e fixtures

- Dados iniciais em `src/mocks/fixtures/` (NFTs dos shows do CN, usuários, cupons, carteiras).
- Leitura e escrita sempre pelo `src/mocks/db/`, que persiste localmente e sabe se
  resetar para as fixtures.
- Se o recurso tem tempo real, incremente `version` a cada mudança.

## 3. Handler

Em `src/mocks/handlers/<recurso>.ts`:

1. Aplique o cenário ativo (latência, falha forçada) pelo helper de `src/mocks/scenarios/`.
2. Autentique pelo header `Authorization` quando a rota for privada (`401` se inválida/expirada).
3. Valide o body com o schema; erros no formato padrão (`VALIDATION_ERROR` com `fields`).
4. Aplique a regra de negócio no `db` (tiragem, cupom, idempotência, isolamento por usuário).
5. Responda com o schema de resposta.

Registre o handler na lista exportada por `src/mocks/handlers/index.ts`.

## 4. Cenários de falha

Cada cenário do spec §6 tem um nome estável (ex.: `slow-network`, `out-of-order`,
`session-expired`, `coupon-expired`, `price-changed`, `sold-out`, `order-timeout`,
`tx-rejected`, `blockchain-down`). Adicione o cenário em `src/mocks/scenarios/`, documente
no `README.md` e garanta que ele pode ser ativado por `?scenario=<nome>` e pelo Playwright.

## 5. Eventos Socket.IO

- Emita pelo binding `@mswjs/socket.io-binding` em `src/mocks/realtime.ts`.
- Payload conforme `docs/contracts.md`: `eventId` único, recurso afetado e `version`.
- Emita só para a sessão dona do recurso.
- Para testar dedupe, o cenário pode reemitir um evento com o mesmo `eventId` ou com
  `version` antiga.

## 6. Verificar

- Ative o cenário na web e confira a resposta na aba Network.
- Rode o reset e confirme que o estado volta às fixtures.
- Garanta um E2E cobrindo o cenário (skill `e2e-test`).
