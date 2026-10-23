---
name: debug
description: Investiga e corrige bugs no CN Toon Vault — extensão (WXT) ou web (Vite), MSW que não intercepta, Socket.IO que não entrega eventos, cache do TanStack Query desatualizado ou vazando entre usuários, rotas e search params, layout quebrado em algum viewport. Use sempre que o usuário relatar erro, comportamento inesperado, tela em branco, algo "não funciona", ou digitar /debug.
---

# Debug

O projeto tem várias camadas entre o clique e o dado (UI → Query → Axios → MSW → db) e
dois alvos de build. A maior parte do tempo perdido vem de corrigir a camada errada.
Reproduza, localize a camada, e só então corrija.

## 1. Reproduzir

- Descreva o passo a passo exato, o alvo (extensão ou web), o viewport, o usuário e o
  cenário do MSW ativo.
- Faça o reset do MSW e tente de novo: estado persistido antigo é causa comum.
- Se só acontece num alvo, o problema provavelmente está no bootstrap, na config ou no
  history (agente `extension`).

## 2. Localizar a camada

| Onde olhar | O que procurar |
|---|---|
| Aba Network | O request saiu? Com os params e headers certos? A resposta segue o contrato? |
| Console | Logs do MSW (`[MSW]`), erros de validação zod, erros do Router |
| React Query Devtools | Query key correta? Dados velhos? Query de outro usuário no cache? |
| TanStack Router Devtools | Search params validados? Rota casou? `beforeLoad` redirecionou? |
| Socket | Conectou? Evento chegou? Foi descartado por `eventId`/`version`? |

Na extensão, o DevTools da app é o da própria aba `app.html`; o do background fica em
`chrome://extensions` → *service worker*.

## 3. Causas comuns

| Sintoma | Verifique |
|---|---|
| Request não interceptado | MSW iniciou antes do render? Handler registrado? Na extensão, ver `ARCHITECTURE.md` §10 |
| Dado de outro usuário aparece | Query key sem `['user', userId]`; cache não limpo no logout; socket não desconectado |
| Lista "pisca" ou volta resultado antigo | Search params fora da query key; `signal` não repassado ao Axios |
| Valor monetário errado | Conta feita com `number` em vez de `lib/money` |
| Pedido duplicado | Nova `Idempotency-Key` gerada no retry |
| Evento ignorado | `version` não incrementada no mock; `eventId` repetido |
| 404 ao recarregar na web | Falta fallback SPA no host |
| Rota em branco na extensão | History errado no bootstrap (precisa de hash) |
| Erro de tipo após mudar config/rotas | Regenerar `routeTree.gen.ts` (rodar o dev) e `npx wxt prepare` |

## 4. Corrigir e travar

1. Faça a menor correção que resolve a causa, não o sintoma.
2. Adicione um teste que falharia sem a correção (unitário ou E2E com o cenário do MSW).
3. Rode tipos, testes e o build do alvo afetado, e informe o resultado.
