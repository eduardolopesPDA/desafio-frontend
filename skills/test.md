---
name: test
description: Escreve e roda testes unitários com Vitest para a lógica pura do CN Toon Vault — dinheiro em strings decimais, dedupe e versão de eventos, schemas e helpers. Use sempre que o usuário pedir teste unitário, cobertura de lógica, ou digitar /test. Para fluxos de tela, use /e2e-test.
---

# Testes unitários (Vitest)

No spec, quem prova os fluxos é o Playwright (`skills/e2e-test.md`). O Vitest cobre o que
é mais barato testar isolado e onde um erro é silencioso: cálculo de dinheiro, regras de
dedupe de eventos, transformação de dados e schemas. Não use Vitest para reproduzir um
fluxo de tela que o E2E já cobre.

## 1. Onde fica o teste

Ao lado do arquivo testado: `money.ts` → `money.test.ts`.

## 2. O que testar

- **`lib/money`:** soma, desconto e total com strings decimais; arredondamento e
  formatação de TC/ETH. Inclua casos que quebrariam com `number` (ex.: `0.1 + 0.2`).
- **`lib/realtime`:** evento repetido (`eventId`), versão antiga, versão nova.
- **Schemas de `contracts/`:** aceitam respostas válidas e rejeitam as malformadas.
- **Helpers de `features/*`** que contenham regra (ex.: montar query keys, mesclar carrinho).

## 3. Como escrever

- Um comportamento por `it`, com nome que descreve o comportamento.
- Sem mocks de módulos internos quando a função for pura — passe a entrada e confira a saída.
- Teste de componente só quando houver lógica de interação que o E2E não alcança; nesse
  caso use Testing Library por papel/texto e `userEvent`.

## 4. Rodar e reportar

- `npm test -- --run` para rodar uma vez.
- Informe o resultado real. Se algo falhar, mostre a saída e não declare pronto.
- Não altere um teste só para fazê-lo passar sem entender por que falhou.
