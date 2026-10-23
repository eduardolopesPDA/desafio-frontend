---
name: test
description: Escreve e roda testes com Vitest + Testing Library + happy-dom (com WxtVitest para as APIs da extensão). Use sempre que o usuário pedir para testar, criar ou corrigir testes, aumentar cobertura, verificar se algo funciona via teste, ou digitar /test.
---

# Testes

Teste o que o usuário percebe e a lógica que pode quebrar, não detalhes de
implementação. Um teste que quebra ao renomear uma classe CSS ou extrair um
componente atrapalha mais do que ajuda.

Ferramentas: Vitest, `@testing-library/react`, `@testing-library/user-event`,
`@testing-library/jest-dom`, happy-dom e o plugin `WxtVitest()` (configurado em
`vitest.config.ts`), que fornece um navegador falso para `browser.*` e `storage`.

## 1. Onde fica o teste

Ao lado do arquivo testado: `format.ts` → `format.test.ts`, `Foo.tsx` → `Foo.test.tsx`.

## 2. O que testar

- **Sempre:** funções de `src/lib/`. São puras, rápidas e onde mora a regra.
- **Componentes e telas:** comportamento visível — texto exibido, clique, navegação.
- **Storage / `browser.*`:** use o fake do `WxtVitest()` e chame `fakeBrowser.reset()`
  em `beforeEach` para um teste não vazar estado para o outro.
- **Rotas:** veja a skill `create-route` (router com `createMemoryHistory`).

## 3. Como escrever

- Busque elementos por papel e texto (`getByRole`, `getByText`, `getByLabelText`),
  nunca por classe CSS ou `data-testid` quando houver alternativa acessível.
- Interaja com `userEvent` (mais próximo do usuário real que `fireEvent`).
- Um comportamento por `it`, com nome que descreve o comportamento
  ("ordena por nome ao clicar no cabeçalho").

## 4. Rodar e reportar

- `npm test -- --run` para rodar uma vez (como numa CI).
- Informe o resultado real. Se algo falhar, mostre a saída e não declare pronto.
- Não altere um teste só para fazê-lo passar sem entender por que falhou.
