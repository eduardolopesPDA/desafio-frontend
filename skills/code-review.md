---
name: code-review
description: Revisa as mudanças do projeto antes de considerá-las prontas — roda verificações (tipos, testes, build), aplica o checklist de agents/reviewer.md e entrega um relatório priorizado com arquivo e linha. Use sempre que o usuário pedir revisão, "está pronto?", conferir antes de entregar o desafio, ou digitar /code-review.
---

# Code review

O objetivo é pegar o que impediria a entrega do desafio — requisito faltando, bug,
build quebrado — e depois o que deixaria o código mais difícil de avaliar. Revise,
não reescreva: aponte o problema e a correção sugerida, e só edite com aprovação.

## 1. Delimitar o escopo

Revise só o que mudou: `git status` e `git diff HEAD` (fora de git, os arquivos
editados na sessão). Ignore `.output/`, `.wxt/`, lockfiles e arquivos gerados.

## 2. Rodar as verificações

`npm run compile`, `npm test -- --run` e `npm run build`. Se algum falhar, isso é o
primeiro achado — reporte a saída real antes de qualquer outra coisa.

## 3. Aplicar o checklist

Use `agents/reviewer.md`. Leia os arquivos alterados inteiros, não só o diff, e
confira o requisito em `docs/product.md`. Para cada candidato a achado, pergunte
qual o custo concreto de deixar como está; se não souber dizer, descarte.

## 4. Relatório

Ordene por severidade e prefira poucos achados certeiros:

- **Bloqueante:** bug, requisito faltando, verificação falhando.
- **Importante:** arquivo no lugar errado, duplicação real, permissão desnecessária.
- **Sugestão:** melhoria pequena de leitura.

Formato:

```markdown
### 1. [Bloqueante] <título curto>
`src/caminho/arquivo.tsx:42`
<o que acontece e por que importa, em 1–2 frases>
**Sugestão:** <correção específica>
```

Se não houver nada relevante, diga isso em uma linha. Não invente achados.

## 5. Perguntar antes de corrigir

Pergunte quais itens aplicar. Depois de aplicar, rode as verificações de novo e
informe o resultado.
