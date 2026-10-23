---
name: create-feature
description: Implementa uma funcionalidade do CN Toon Vault de ponta a ponta — contrato, mock, transporte (Axios), estado (TanStack Query), tela (Router + shadcn/ui) e testes — seguindo a arquitetura por features. Use sempre que o usuário pedir para criar, adicionar ou implementar uma feature, tela, fluxo ou requisito do spec, ou digitar /create-feature. Para só uma rota, prefira /create-route; para só um mock, /create-mock.
---

# Criar feature

Uma feature só está pronta quando funciona **pela rede**: a tela consome uma query, a
query chama o Axios, o Axios bate no MSW, e o MSW responde conforme o contrato. Atalhos
(dados fixos no componente, setters chamados direto) são eliminatórios no spec. A ordem
abaixo existe para que cada camada seja construída sobre algo que já funciona.

## 1. Partir do requisito

Leia a seção correspondente em `docs/spec.md` e marque mentalmente cada estado exigido:
carregamento, vazio, erro, sucesso, atualização em segundo plano e os cenários de falha
listados no §6. Leia `ARCHITECTURE.md` para saber onde cada parte fica. Se o requisito
for ambíguo, pergunte em vez de adivinhar.

## 2. Implementar de baixo para cima

1. **Contrato** — schemas zod em `src/contracts/` (request, response, erros). Atualize
   `docs/contracts.md`.
2. **Mock** — handler, fixtures e cenários de falha em `src/mocks/` (skill `create-mock`).
3. **Transporte** — funções em `src/features/<domínio>/api.ts` usando a instância Axios
   de `lib/http`, repassando o `signal` e validando a resposta com o schema.
4. **Estado** — `queryOptions`/mutations em `src/features/<domínio>/queries.ts`, com
   query keys por factory e a política de `ARCHITECTURE.md` §4.
5. **Lógica pura** em `src/lib/` (ex.: cálculo com `lib/money`), com teste unitário.
6. **Componentes** em `src/features/<domínio>/components/`, com shadcn/ui adaptado ao tema.
7. **Tela** — rota em `src/routes/` (skill `create-route`).

Não crie abstrações, props ou opções que o spec não pede (YAGNI).

## 3. Verificar

1. Tipos e testes unitários: `npm run compile` e `npm test -- --run`.
2. Na web (`npm run dev:web`), percorra o fluxo nos viewports 390, 768 e 1440 e com os
   cenários de falha (`?scenario=…`).
3. Confira teclado, foco e leitor de tela nos estados novos.
4. Escreva ou atualize o E2E correspondente (skill `e2e-test`).
5. Informe o resultado real, inclusive falhas.

## 4. Registrar

- Marque o item em `docs/roadmap.md`.
- Registre em `docs/decisions.md` qualquer escolha não óbvia.
- Se a feature criou cenário de mock novo, documente no `README.md`.
