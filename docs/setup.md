# Setup

## Requisitos
- Node.js 20+
- Google Chrome

## Comandos
| Comando | O que faz |
|---|---|
| `npm install` | Instala dependências (roda `wxt prepare` no postinstall) |
| `npm run dev` | Abre o Chrome com a extensão carregada e hot reload |
| `npm run build` | Gera `.output/chrome-mv3/` |
| `npm run zip` | Gera o `.zip` para publicar/entregar |
| `npm test` | Roda os testes (Vitest) |
| `npm run compile` | Checagem de tipos (`tsc --noEmit`) |

## Carregar o build manualmente
1. `npm run build`
2. Chrome → `chrome://extensions` → ativar **Modo do desenvolvedor**
3. **Carregar sem compactação** → selecionar `.output/chrome-mv3`
