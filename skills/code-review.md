---
name: code-review
description: Revisa as mudanças do CN Toon Vault antes de considerá-las prontas — roda verificações (tipos, unitários, E2E, builds da extensão e da web), aplica os critérios eliminatórios do spec e o checklist de agents/reviewer.md, e entrega um relatório priorizado com arquivo e linha. Use sempre que o usuário pedir revisão, "está pronto?", conferir antes de concluir uma fase ou entregar o desafio, ou digitar /code-review.
---

# Code review

O objetivo é pegar primeiro o que **elimina** a entrega (spec §11), depois o que tira
pontos (requisito faltando, falha não tratada) e por último o que deixa o código mais
difícil de avaliar. Revise, não reescreva: aponte o problema e a correção sugerida, e só
edite com aprovação.

## 1. Delimitar o escopo

Revise só o que mudou: `git status` e `git diff HEAD`. Ignore `.output/`, `.wxt/`,
`dist/`, `routeTree.gen.ts`, `lighthouse/reports/`, lockfiles e componentes gerados pelo
shadcn que não foram editados.

## 2. Rodar as verificações

`npm run compile`, `npm test -- --run`, `npm run build`, `npm run build:web` e, se a
mudança tocar um fluxo, `npm run test:e2e`. Se algum falhar, isso é o primeiro achado —
reporte a saída real antes de qualquer outra coisa.

## 3. Aplicar os critérios

Use `agents/reviewer.md` (eliminatórios + checklist). Leia os arquivos alterados
inteiros, confira o requisito em `docs/spec.md` e o contrato em `docs/contracts.md`.
Atenção especial a:

- dados fictícios ou ramos de mock fora de `src/mocks/`;
- eventos de tempo real que não passam pelo Socket.IO;
- dados privados sem isolamento por usuário;
- dinheiro com `number`;
- estados de carregamento/erro/vazio ausentes.

Para cada candidato a achado, pergunte qual o custo concreto de deixar como está; se não
souber dizer, descarte.

## 4. Relatório

Ordene por severidade e prefira poucos achados certeiros:

- **Eliminatório:** viola um critério do spec §11.
- **Bloqueante:** bug, requisito do spec faltando, verificação falhando.
- **Importante:** arquivo no lugar errado, duplicação real, acessibilidade, responsividade.
- **Sugestão:** melhoria pequena de leitura.

```markdown
### 1. [Bloqueante] <título curto>
`src/caminho/arquivo.tsx:42`
<o que acontece e por que importa, em 1–2 frases>
**Sugestão:** <correção específica>
```

Se não houver nada relevante, diga isso em uma linha. Não invente achados.

## 5. Perguntar antes de corrigir

Pergunte quais itens aplicar. Depois de aplicar, rode as verificações de novo e informe
o resultado.
