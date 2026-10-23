---
name: create-route
description: Cria uma nova tela/rota no popup da extensão usando TanStack Router code-based com hash history. Use sempre que o usuário pedir uma nova página, tela, rota ou navegação entre telas, quiser adicionar search params tipados (filtro, página, ordenação), ou digitar /create-route.
---

# Criar rota (TanStack Router, code-based)

O projeto declara as rotas em código (`src/router.tsx`), sem o plugin de geração de
rotas, e usa **hash history**: o popup é servido em `chrome-extension://<id>/popup.html`,
não há servidor para resolver paths, então sem hash a tela quebraria ao recarregar.
Tudo abaixo existe para preservar essas duas decisões (ver `docs/decisions.md`).

## 1. Criar o arquivo da rota

Uma tela por arquivo em `src/routes/<nome>.tsx`:

```tsx
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';

export const <nome>Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/<nome>',
  component: <Nome>Page,
});

function <Nome>Page() {
  // orquestra dados (lib/) e componentes (components/); sem lógica pesada aqui
}
```

## 2. Registrar na árvore

Adicione a rota em `rootRoute.addChildren([...])` em `src/router.tsx`. Rota criada e
não registrada é a causa mais comum de "tela em branco".

## 3. Search params (se o requisito pedir)

Estado que faz sentido na URL — filtro, página, ordenação — vai em search params
com `validateSearch`, para ficar tipado e sobreviver ao fechar/abrir o popup no
mesmo hash. Não use search params para estado puramente visual (ex.: hover).

## 4. Navegar

Use `<Link to="/<nome>">` ou `useNavigate()`. Nunca `<a href="/...">`: ignora o hash
history e o tipo das rotas.

## 5. Testar

Renderize o router com `createMemoryHistory({ initialEntries: ['/<nome>'] })` e
verifique o que o usuário vê (`getByRole`, `getByText`). Para navegação, clique no
link com `userEvent` e confira a tela de destino.
