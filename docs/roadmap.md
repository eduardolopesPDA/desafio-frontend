# Roadmap

Cada fase termina com tipos, testes e build passando. Referências entre parênteses apontam para seções de `docs/spec.md`.

## Fase 0 — Fundação
- [x] Scaffold WXT + React + TS com `srcDir: 'src'` e entrypoints `app/` e `background.ts`
- [x] Alvo web com Vite (`index.html`, `src/web/main.tsx`, `vite.config.ts`) e `bootstrap({ history })` compartilhado
- [ ] Tailwind v4 + shadcn/ui (`components.json`, tema CN em `globals.css`)
- [x] TanStack Router file-based nos dois alvos; TanStack Query; Axios em `lib/http`
- [ ] MSW funcionando na web **e** na extensão (validar service worker vs. `msw/native`)
- [ ] Vitest, Playwright (Chromium, 390 e 1440) e LHCI configurados com um teste/auditoria de fumaça
- [ ] Deploy web com fallback SPA publicado

## Fase 1 — Contratos e mocks (§5, §6)
- [x] Schemas zod de todos os recursos, erros e eventos em `src/contracts/`
- [ ] Fixtures: 12–20 NFTs de todos os shows listados, ≥ 2 usuários, cupons, carteiras — dados prontos (16 NFTs); faltam as imagens em `public/nfts/`
- [x] `mocks/db` com persistência local e reset
- [x] Handlers REST de todos os recursos
- [x] Cenários de rede/falha selecionáveis e reproduzíveis
- [x] Socket via `@mswjs/socket.io-binding` emitindo `nft.updated` e `order.updated`

## Fase 2 — Catálogo e detalhe (§3, Catálogo e detalhe)
- [ ] Toon Vault: destaques, busca, filtros combináveis, ordenação, paginação no estado da URL
- [ ] Estados de carregamento (skeleton shimmer), vazio, erro e atualização em background
- [ ] Detalhe: galeria, lore, atributos, edições, quantidade, acesso direto, inexistente/queimado, limite de tiragem

## Fase 3 — Toon Pass e favoritos (§3 Conta e sessão)
- [ ] Cadastro (avatar, conflito), login com retorno ao fluxo, logout, sessão após refresh
- [ ] Expiração de sessão na navegação e no checkout preservando contexto
- [ ] Rotas privadas; limpeza de cache e socket no logout/troca de usuário
- [ ] Toon Stars com atualização otimista e rollback

## Fase 4 — Carrinho, cotação e tempo real (§3 Carrinho, §7)
- [ ] Adicionar/alterar/remover respeitando tiragem; persistência e merge visitante → usuário
- [ ] Cupom (válido, inválido, expirado) e resumo TC/ETH com precisão decimal
- [ ] `nft.updated` no catálogo, detalhe e carrinho, com dedupe, versão e reconciliação após reconexão
- [ ] Cenário da *Espada de Sangue de Demônio* (§7)

## Fase 5 — Checkout, pedido e confirmação (§3 Pagamento e confirmação)
- [ ] Formulário validado, seleção de carteira e rede, simulação de conexão/recusa/desconexão
- [ ] Revalidação da cotação antes de confirmar; nova confirmação quando mudar
- [ ] Pedido idempotente: clique repetido, timeout e recuperação do mesmo recibo
- [ ] `order.updated`: pendente ("Minerando Bloco..."), confirmado, recusado; recuperação após refresh/reconexão
- [ ] Recibo com snapshot imutável; carrinho remove só o que foi comprado

## Fase 6 — Perfil e carteiras
- [ ] Perfil: dados, avatar, senha, com erros da API
- [ ] Cofre de Carteiras: principal e secundária, cadastro e edição

## Fase 7 — Qualidade e entrega (§8–§12)
- [ ] Acessibilidade: teclado, foco em diálogos/drawers, labels, `alt`, contraste, feedback acessível
- [ ] Responsividade em 390, 768 e 1440; `prefers-reduced-motion`
- [ ] 12 cenários E2E do §9 + regressão visual com baselines versionadas
- [ ] Lighthouse: home e detalhe, mobile e desktop, 3 execuções, mediana, LCP/CLS/TBT, reports
- [ ] `README.md` e `ARCHITECTURE.md` completos; deploy final
