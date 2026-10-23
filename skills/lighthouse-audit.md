---
name: lighthouse-audit
description: Roda e analisa a auditoria Lighthouse do CN Toon Vault exigida pelo spec §10 — home e detalhe de NFT, perfis mobile e desktop, 3 execuções com mediana, LCP/CLS/TBT, relatórios HTML/JSON versionados. Use sempre que o usuário pedir Lighthouse, auditoria de performance, Core Web Vitals, melhorar nota de performance/acessibilidade/SEO, ou digitar /lighthouse-audit.
---

# Auditoria Lighthouse

O spec pede medição honesta: build otimizado, cenário padrão dos mocks, imagens, fontes e
funcionalidades reais. Desligar features ou carregar uma versão "leve" só para a
auditoria é proibido. O objetivo é atingir as metas melhorando a app, e justificar por
escrito o que ficar abaixo.

| Categoria | Meta |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |

## 1. Preparar

1. `npm run build:web` e sirva com `vite preview` (ou o comando do `npm run lighthouse`).
2. Garanta o cenário padrão do MSW e estado resetado.
3. Páginas: `/` e `/nfts/<id de um NFT fixo das fixtures>`.

## 2. Rodar

- `npm run lighthouse` executa o LHCI com as configs de `lighthouse/` (mobile e desktop),
  `numberOfRuns: 3` por página e perfil.
- Relatórios HTML/JSON vão para `lighthouse/reports/` e são versionados.

## 3. Reportar

Para cada página × perfil, registre a **mediana** das 3 execuções por categoria e os
valores de LCP, CLS e TBT. Mantenha a tabela de resultados no `README.md` (ou em
`docs/lighthouse.md`, linkado no README), com a data e o commit medido.

## 4. Melhorar (quando abaixo da meta)

Investigue pelos diagnósticos do relatório, nesta ordem de impacto típico:

- **LCP:** imagem do destaque/detalhe com `fetchpriority="high"`, dimensões explícitas,
  formatos WebP/AVIF; fontes com `font-display: swap` e preload da principal.
- **CLS:** skeletons com as mesmas dimensões do conteúdo; `width`/`height` em imagens.
- **TBT:** code splitting por rota (`autoCodeSplitting` do router), evitar trabalho pesado
  no render, adiar o que não é crítico.
- **SEO:** `<title>` e `<meta name="description">` por rota, `lang`, links rastreáveis.
- **Acessibilidade:** contraste, labels, nomes acessíveis.

Depois de cada mudança, rode de novo e compare medianas, não execuções isoladas.
