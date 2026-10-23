---
name: e2e-test
description: Escreve e roda testes E2E e de regressão visual com Playwright no build web do CN Toon Vault, controlando cenários e reset do MSW, nos viewports desktop e mobile. Use sempre que o usuário pedir teste E2E, teste de fluxo, regressão visual, atualizar baselines, cobrir um cenário do spec §9, ou digitar /e2e-test.
---

# Testes E2E (Playwright)

A ausência de E2E executáveis é eliminatória no spec, e os 12 cenários do §9 são o
roteiro. Os testes rodam contra o build web (`vite preview`) com o MSW ativo, no
Chromium, nos projetos desktop (1440) e mobile (390) definidos em `playwright.config.ts`.

## 1. Escolher o cenário

Mapeie o teste para um item do spec §9 e para o cenário do MSW que o sustenta. Um arquivo
por fluxo em `tests/e2e/` (ex.: `catalog.spec.ts`, `checkout.spec.ts`).

## 2. Preparar o estado

- Antes de cada teste: reset do MSW e cenário desejado, via `page.addInitScript` (ou
  `?scenario=<nome>`). Use os helpers/fixtures de `tests/e2e/` em vez de repetir a lógica.
- Login por helper que usa a UI ou a API simulada — nunca escrevendo token à mão sem
  passar pelo fluxo, exceto em testes que não são sobre autenticação.
- Testes independentes: nenhum depende da ordem ou do estado de outro.

## 3. Escrever

- Localize por papel e nome acessível: `getByRole('button', { name: 'Adicionar ao cofre' })`.
- Espere por estado visível (`await expect(...).toBeVisible()`), nunca `waitForTimeout`.
- Tempo real: dispare o evento pelo mecanismo do MSW/Socket.IO (cenário ou helper de
  teste), nunca mexendo no cache ou no DOM.
- Falhas: verifique a mensagem ao usuário **e** a recuperação (nova tentativa, rollback).
- Teclado: navegue com `page.keyboard` e confira o foco (`toBeFocused`).

## 4. Regressão visual

- `await expect(page).toHaveScreenshot('catalog.png')` em catálogo, detalhe, carrinho e checkout.
- Dados determinísticos, animações desligadas e fontes carregadas antes da captura.
- Baselines ficam versionadas. Atualize com `npx playwright test --update-snapshots`
  **só** quando a mudança visual for intencional, e diga isso no resumo.

## 5. Rodar e reportar

- `npm run test:e2e` (os dois projetos). Para um arquivo: `npx playwright test tests/e2e/cart.spec.ts`.
- Em falha, abra o trace (`npx playwright show-trace`) antes de mexer no teste.
- Informe o resultado real por projeto (desktop/mobile).
