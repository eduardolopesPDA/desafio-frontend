---
name: create-feature
description: Implementa uma funcionalidade nova na extensão (WXT + React + TanStack + Tailwind) de ponta a ponta — do requisito em docs/product.md até código tipado, testado e registrado no roadmap. Use sempre que o usuário pedir para criar, adicionar ou implementar uma feature, tela, fluxo ou requisito do desafio, ou digitar /create-feature. Para só criar uma rota ou só uma tabela, prefira /create-route ou /create-table.
---

# Criar feature

O objetivo é entregar uma funcionalidade pequena, completa e verificável, no lugar
certo da arquitetura. Feature "pronta" significa: atende ao requisito escrito,
compila, tem teste da lógica e funciona no popup de verdade — não só no teste.

## 1. Partir do requisito

Leia `docs/product.md`. Se o que foi pedido não estiver lá, adicione o requisito
(em uma ou duas linhas, com critério de aceite) antes de codar — assim a próxima
sessão sabe por que esse código existe. Se o pedido for ambíguo, pergunte em vez de
adivinhar.

Leia também `docs/architecture.md` para saber onde cada parte deve ficar.

## 2. Implementar de dentro para fora

Comece pelo que é mais fácil de testar e menos acoplado:

1. **Tipos** em `src/types/` — só se forem usados por mais de um arquivo; senão,
   deixe ao lado de quem usa.
2. **Lógica pura** em `src/lib/` (cálculo, filtro, formatação, dados mock), com
   teste ao lado. Lógica fora do JSX é o que mantém os componentes simples.
3. **Componentes** em `src/components/`. Eles não importam nada de `src/routes/`.
4. **Tela nova** → siga a skill `create-route`.
5. **Tabela** → siga a skill `create-table`.

Não crie abstrações, props ou opções que o requisito não pede (YAGNI).

## 3. Verificar

1. `npm run compile` e `npm test -- --run`.
2. `npm run dev` e teste o fluxo no popup. Lembre que o popup tem ~400px de largura.
3. Informe o resultado real, inclusive falhas.

## 4. Registrar

- Marque o item em `docs/roadmap.md`.
- Registre em `docs/decisions.md` qualquer escolha não óbvia (biblioteca nova,
  permissão nova, desvio da arquitetura).
