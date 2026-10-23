---
name: create-table
description: Cria uma tabela/listagem com TanStack Table usando o componente genérico DataTable do projeto. Use sempre que o usuário pedir uma tabela, grid, listagem de itens, colunas, ou ordenação/filtro/paginação de uma lista, ou digitar /create-table.
---

# Criar tabela (TanStack Table)

TanStack Table é headless: ele calcula linhas e colunas, e o projeto decide o
markup. Para não repetir esse markup em cada tela, toda tabela passa pelo componente
`src/components/data-table/DataTable.tsx`, que recebe `columns` e `data`. Só crie
outro `useReactTable` se o requisito realmente não couber no `DataTable`, e registre
o motivo em `docs/decisions.md`.

## 1. Tipar a linha

Defina o tipo da linha (em `src/types/` se for compartilhado). Esse tipo é o
genérico que dá autocomplete às colunas.

## 2. Definir as colunas

Use `createColumnHelper<Linha>()` e defina as colunas **fora do componente** (ou com
`useMemo`). Colunas recriadas a cada render fazem a tabela recalcular tudo.

## 3. Garantir `data` estável

`data` precisa ter referência estável: constante de módulo, `useMemo` ou estado.
Array literal criado dentro do render (`data={[...]}`) gera loop de re-render — é o
bug mais comum com TanStack Table.

## 4. Recursos só quando pedidos

Ordenação, filtro e paginação exigem row models (`getSortedRowModel`,
`getFilteredRowModel`, `getPaginationRowModel`). Habilite só o que o requisito pede.
Se o estado precisar sobreviver à navegação, guarde-o em search params da rota
(skill `create-route`).

## 5. Layout no popup

O popup tem ~400px. Prefira poucas colunas, texto truncado com `truncate` e rolagem
horizontal no container (`overflow-x-auto`) em vez de espremer as colunas.

## 6. Testar

Renderize a tabela e verifique cabeçalhos e linhas com `getByRole('columnheader')`
e `getAllByRole('row')`. Se houver ordenação, clique no cabeçalho com `userEvent` e
confira a nova ordem.
