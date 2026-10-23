# Decisões (ADR resumido)

Formato: **Decisão** — motivo. Registre aqui toda escolha não óbvia.

1. **WXT como framework de extensão** — gera o manifest, faz hot reload e abstrai a API `browser`.
2. **Apenas Chrome (MV3)** — escopo do desafio; o WXT permite adicionar Firefox depois sem reestruturar.
3. **`srcDir: 'src'`** — separa o código da aplicação de `agents/`, `skills/` e `docs/` na raiz.
4. **Roteamento code-based no TanStack Router** — poucas telas; evita o plugin de geração de rotas
   (`routeTree.gen.ts`) e a configuração extra dele com o WXT. Reavaliar se passar de ~8 rotas.
5. **Hash history** — o popup não tem servidor para resolver paths; com hash, recarregar não quebra.
6. **Sem gerenciador de estado global** — estado local + URL (search params do Router) bastam. YAGNI.
7. **Tailwind v4 sem biblioteca de componentes** — menos dependências e controle total do visual.
8. **happy-dom nos testes** — mais rápido que jsdom e suficiente para componentes React.
