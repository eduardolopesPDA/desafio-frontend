---
name: create-route
description: Cria uma nova tela/rota do CN Toon Vault com TanStack Router file-based — search params validados, rotas privadas sob _authenticated, loaders com TanStack Query e tratamento de não encontrado. Use sempre que o usuário pedir uma nova página, tela, rota, filtro na URL, proteção de rota ou navegação entre telas, ou digitar /create-route.
---

# Criar rota (TanStack Router, file-based)

As rotas ficam em `src/routes/` e o plugin `@tanstack/router-plugin/vite` gera
`src/routeTree.gen.ts` (não edite esse arquivo). A mesma árvore roda na extensão (hash
history) e na web (browser history), então **nunca** monte URLs à mão nem dependa de
`window.location` — use sempre as APIs do router, que funcionam nos dois.

## 1. Escolher o arquivo

| Tipo | Arquivo |
|---|---|
| Pública | `src/routes/cart.tsx` → `/cart` |
| Com parâmetro | `src/routes/nfts.$nftId.tsx` → `/nfts/:nftId` |
| Privada | `src/routes/_authenticated/profile.tsx` → `/profile` (o layout `_authenticated.tsx` faz o guard) |

O mapa de rotas oficial está em `ARCHITECTURE.md` §3; atualize-o se criar rota nova.

## 2. Declarar a rota

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/nfts/$nftId')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(nftQueries.detail(params.nftId)),
  pendingComponent: NftDetailSkeleton,
  errorComponent: NftDetailError,
  notFoundComponent: NftNotFound,
  component: NftDetailPage,
});
```

- Dados vêm das `queryOptions` da feature; a página usa `useSuspenseQuery`/`useQuery`
  com as mesmas options, para o cache ser compartilhado.
- `pendingComponent` é um skeleton com as dimensões finais (evita CLS).

## 3. Search params (estado da URL)

Busca, filtros, ordenação e paginação moram na URL para sobreviver a refresh e ao
histórico (spec, Catálogo e detalhe):

- Declare com `validateSearch` usando um schema zod com valores padrão.
- Ao mudar filtro, navegue com `page: 1`.
- Inclua os search params na query key (via `loaderDeps`) para isolar o cache por consulta.

## 4. Rotas privadas

Coloque a rota sob `_authenticated/`. O `beforeLoad` do layout verifica a sessão e
redireciona para `/login` com `search: { redirect: location.href }`. Após o login,
navegue de volta para `redirect`.

## 5. Navegar

Use `<Link to="/nfts/$nftId" params={{ nftId }}>` ou `useNavigate()`. Nunca `<a href>`
para rotas internas.

## 6. Testar

- Acesso direto à URL (inclusive com search params) e refresh.
- Voltar/avançar no histórico restaura o estado.
- Rota inexistente e recurso inexistente mostram a tela de não encontrado.
- Cubra no E2E (skill `e2e-test`).
