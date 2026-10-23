# Desafio Frontend — CN Toon Vault: Marketplace de NFTs do Cartoon Network

Implemente o **CN Toon Vault**, um marketplace de NFTs temático de desenhos animados clássicos e modernos do Cartoon Network (*Hora de Aventura*, *O Incrível Mundo de Gumball*, *Apenas um Show*, *Clarêncio, o Otimista*, *As Meninas Superpoderosas*, *O Laboratório de Dexter*, etc.), em React e TypeScript, seguindo o [layout no Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

O desafio avalia fidelidade visual, qualidade das interações, integração com APIs, gerenciamento de estado assíncrono, tempo real, acessibilidade e performance, envelopado em uma experiência vibrante e divertida no universo Cartoon Network.

---

## 1. Escopo

Entregue os fluxos de descoberta de Relíquias e Cards Colecionáveis de Animação, compra e conta do Toon Collector, com versões desktop e mobile. APIs, autenticação, carteiras (*Toon Wallets*) e pagamentos em criptomoeda fictícia (*ToonCoins / TC* ou *ETH*) devem funcionar com dados simulados. Integrações reais com blockchain, extensões de carteira e gateways de pagamento estão fora do escopo.

O Figma define a identidade visual e a composição das telas (adaptando elementos visuais para um estilo cartunesco/pop). Este enunciado define os comportamentos e os cenários de avaliação. Estados não desenhados devem seguir o mesmo padrão visual.

---

## 2. Stack obrigatória

| Responsabilidade | Tecnologia |
| --- | --- |
| Interface | React |
| Linguagem | TypeScript |
| Roteamento | TanStack Router |
| Estado remoto | TanStack Query |
| Cliente HTTP | Axios |
| Integração de dados | REST APIs |
| Tempo real | Socket.IO |
| Estilização | Tailwind CSS |
| Componentes | shadcn/ui |
| Mocking | MSW |
| Testes E2E e regressão visual | Playwright |
| Auditoria de performance e qualidade | Lighthouse |

As tecnologias devem participar efetivamente da solução. A ferramenta de build, a organização do projeto e as bibliotecas complementares ficam a critério do candidato.

---

## 3. Telas e fluxos

| Tela | Funcionalidades obrigatórias |
| --- | --- |
| **Toon Vault (Início)** | Destaques da semana (*Ex: Espada de Sangue de Demônio, Enchiridion, Fita de Vídeo do Mordecai*), catálogo de desenhos, busca por show/personagem, filtros por raridade (*Comum, Raro, Épico, Lendário, Mítico*), ordenação e navegação para o NFT |
| **Detalhes do Toon NFT** | Galeria visual do card/item, lore do episódio/série, atributos do personagem (*Força, Caos, Nostalgia*), edição/mídia de exibição, quantidade, favoritos (*Toon Star*) e compra |
| **Cofre / Carrinho de NFTs** | Edição de quantidades, remoção, cupom promocional (*Ex: BUBBLEGUM10, RIGBYFAIL*) e resumo de valores em TC/ETH |
| **Checkout de Autógrafos / Pagamento** | Dados do Toon Collector, seleção de carteira temática e rede (*Ooo Network, Elmore Net, Park Grid*), revisão e envio do pedido |
| **Confirmação de Resgate** | Resultado da transação, identificação da hash do bloco fictício, itens adqueridos, taxas de rede (*Gas Fee*) e total |
| **Toon Pass Login** | Autenticação do colecionador, validação e retorno ao fluxo anterior |
| **Toon Pass Cadastro** | Criação de perfil de colecionador, seleção de avatar padrão do Cartoon Network, validação e tratamento de conflito |
| **Perfil do Toon Collector** | Edição de dados, escolha do avatar do desenho favorito e alteração de senha |
| **Cofre de Carteiras** | Cadastro e edição de carteiras principal e secundária |

Implemente os frames desktop e mobile disponíveis. Perfil, carteiras e confirmação também devem funcionar em mobile, mesmo sem um frame específico.

Páginas editoriais, suporte, atividade, ofertas e downloads não fazem parte da entrega. Links externos e ações auxiliares devem ter comportamento coerente; ações fora do escopo não devem aparentar sucesso funcional.

---

### Catálogo e detalhe

- Busca por nome do desenho (ex: *"Apenas um Show"*), nome do item (ex: *"Carro de Golfe do Parque"*), filtros por Raridade, Show de Origem, ordenação e paginação devem compor o estado da URL e sobreviver a refresh e navegação pelo histórico.
- Filtros devem ser combináveis (Ex: *Hora de Aventura* + *Lendário*); mudança de filtro deve reiniciar a paginação.
- As consultas devem refletir os parâmetros enviados à API, com tratamento de resultados vazios (*"Nenhum NFT encontrado nesta dimensão"*), falhas e respostas fora de ordem.
- O detalhe deve suportar acesso direto, NFT inexistente/queimado, edição indisponível e limite de tiragem/quantidade.
- Favoritos (*Toon Stars*) devem persistir para o usuário autenticado.

---

### Carrinho (Cofre Temporário)

- Adicionar, alterar e remover itens colecionáveis, respeitando a disponibilidade da tiragem de cada desenho.
- Manter o carrinho após refresh e preservar os itens do visitante ao autenticar com o *Toon Pass*.
- Aplicar e remover cupom de desconto, com tratamento de código inválido ou expirado.
- Exibir subtotal, desconto, taxa de rede (*Gas Fee do Reino Doce*) e total coerentes com a resposta da API.
- Refletir alterações de preço e disponibilidade de tiragem recebidas via Socket em tempo real enquanto o carrinho estiver aberto.

Valores de cripto (TC/ETH) devem trafegar como strings decimais e manter precisão nos cálculos e na apresentação. Quantidades são inteiras. A cotação da API é a referência para finalizar o pedido.

---

### Pagamento e confirmação

- Validar os campos do layout e permitir revisão antes de assinar a transação.
- Utilizar as carteiras cadastradas, com seleção de rede temática (*Ooo Net, Elmore Chain*) e simulação de conexão, recusa e desconexão.
- Revalidar preço, disponibilidade de tiragem, cupom e taxas antes de confirmar a compra. Mudanças exigem nova confirmação do usuário.
- Impedir pedidos duplicados em cliques repetidos ou reenvios após timeout.
- Representar pedido pendente (*"Minerando Bloco..."*), confirmado e recusado, com recuperação após refresh ou reconexão.
- Exibir a confirmação somente para pedido efetivamente confirmado na simulação.
- Preservar os itens em falhas; após confirmação, remover do carrinho apenas os itens e quantidades comprados.

O recibo deve reproduzir o snapshot do pedido do colecionador. Alterações posteriores no catálogo de desenhos não podem modificar seus valores. Referências de transação (*TxHash*) e links de exploração são simulados.

---

### Conta e sessão (*Toon Pass*)

Cadastro, login, logout e sessão são obrigatórios, integrados à API simulada. Checkout, perfil, carteiras, favoritos e histórico do colecionador exigem autenticação.

A sessão deve ser recuperável após refresh. Trate expiração durante a navegação e durante o checkout, preservando o contexto para retomada. Logout e troca de usuário devem limpar dados privados em cache e subscriptions da sessão anterior.

Valide os formulários de cadastro, perfil, senha e carteiras, incluindo erros retornados pela API. Alterações confirmadas devem permanecer após refresh. Use credenciais fictícias e não armazene senhas em claro.

---

## 4. Integração e estado

Use TanStack Router nas rotas, parâmetros de busca e proteção dos fluxos privados. Use TanStack Query nas consultas, mutations e sincronização do cache. As chamadas REST devem passar pelo Axios.

A solução deve garantir:

- Contratos tipados entre transporte, estado e interface;
- Estados de carregamento, vazio, erro, sucesso e atualização em segundo plano;
- Invalidação coerente após mutations e eventos;
- Cancelamento ou descarte de respostas obsoletas;
- Isolamento dos dados por usuário e pelos parâmetros da consulta;
- Recuperação de falhas sem duplicar operações;
- Tratamento de rotas inexistentes e acesso direto a qualquer tela prevista.

Aplique atualização otimista em pelo menos uma interação (ex: favoritar um card do Gumball com *Toon Star*), com rollback em caso de falha. A política de cache, retries e sincronização deve ser documentada.

---

## 5. Contratos REST

Defina e documente os contratos utilizados. Os recursos mínimos são:

| Recurso | Operações |
| --- | --- |
| **Sessão e Toon Pass** | Cadastro, login, consulta da sessão, logout e expiração |
| **CN NFTs** | Listagem com busca por show/item, filtros por raridade, ordenação, paginação e detalhe por ID |
| **Favoritos (Toon Stars)** | Consulta, inclusão e remoção |
| **Cofre / Carrinho** | Consulta, inclusão, alteração e remoção de itens |
| **Cotação & Gas Fee** | Validação de cupom, disponibilidade de tiragem, descontos, taxas de rede e total |
| **Pedidos / Transações** | Criação idempotente e consulta do estado e recibo da transação |
| **Perfil do Collector** | Consulta, atualização de dados/avatar de desenho e alteração de senha |
| **Carteiras Cripto** | Consulta, cadastro e atualização de endereços fictícios |

As respostas devem representar erros de validação, sessão inválida, falta de permissão, NFT esgotado/inexistente, conflito de tiragem e falha transitória de rede.

As mutations de pedido devem aceitar uma chave de idempotência (*Idempotency Key*). Na simulação, a mesma tentativa deve recuperar o mesmo recibo; reutilizar a chave com conteúdo diferente deve gerar conflito.

---

## 6. Mocking com MSW

Implemente os mocks na camada de rede, reutilizando contratos e cenários entre desenvolvimento, demonstração e testes. Componentes, hooks e cliente Axios não devem conter respostas fictícias ou caminhos alternativos de negócio.

Os mocks devem manter estado consistente entre catálogo de desenhos, favoritos, carrinho, perfil, carteiras e histórico de compras. Persistência local é permitida para sustentar refresh; o reset deve restaurar integralmente o universo do Cartoon Network a um cenário padrão conhecido.

---

### Simulação de Condições de Rede e Falhas

Simule condições de rede e falhas com MSW, incluindo lentidão, latência variável, timeouts, indisponibilidade da rede blockchain simulada e respostas HTTP de erro. Os cenários devem ser configuráveis e reproduzíveis.

Disponibilize fixtures com variedade de NFTs do CN (mínimo de 12 a 20 NFTs variando entre *Hora de Aventura, Gumball, Apenas um Show, Clarêncio, Meninas Superpoderosas, O Laboratório de Dexter, Coragem o Cão Covarde*), pelo menos dois usuários e cenários determinísticos de:

- Sucesso e resultado vazio (ex: busca por *"Scooby-Doo"* sem resultados);
- Latência variável e respostas fora de ordem;
- Falhas de conexão e respostas HTTP 4xx/5xx;
- Sessão expirada no *Toon Pass* e acesso não autorizado;
- Conflito de cadastro ou de validação de formulário;
- Cupom inválido ou expirado (ex: *"CUPOM_REINO_DOCE_EXPIRADO"*);
- Preço alterado em ETH/TC ou tiragem esgotada durante a compra;
- Timeout após criação da transação, com recuperação por idempotência;
- Pagamento/transação confirmada no bloco e transação recusada/rejeitada.

Use MSW também na simulação dos eventos em tempo real com `@mswjs/socket.io-binding`. Documente o transporte utilizado e suas limitações no ambiente de mocks.

Os cenários devem exercitar `socket.io-client`. Substituir o socket por chamadas diretas a setters ou ao cache não atende ao requisito.

---

## 7. Tempo real com Socket.IO

Implemente, no mínimo, os seguintes eventos:

| Evento | Comportamento esperado |
| --- | --- |
| `nft.updated` | Atualizar preço (TC/ETH) e tiragem disponível no catálogo de desenhos, detalhe e carrinho |
| `order.updated` | Atualizar o estado da transação no bloco e apresentar confirmação ou recusa |

Os eventos devem carregar identidade estável, NFT afetado e versão. O cliente deve tolerar duplicatas e eventos antigos.

Após reconexão, reconcilie os recursos ativos com a API REST. Eventos de uma sessão anterior não podem atualizar dados de outro colecionador. Listeners e subscriptions devem ser liberados ao encerrar seu ciclo de vida.

Implemente o cenário:

1. A *Espada de Sangue de Demônio* está no carrinho.
2. Seu preço em TC ou sua quantidade disponível muda durante a navegação.
3. A interface informa a alteração e atualiza o resumo de cotação.
4. O checkout impede a confirmação com uma cotação desatualizada.

Também deve funcionar uma interrupção de conexão enquanto a transação está pendente. Após reconectar ou recarregar a página, o usuário deve recuperar o estado da transação sem duplicar a compra.

---

## 8. Interface, responsividade e acessibilidade

Preserve tipografia, cores vibrantes inspiradas no estilo Cartoon Network, espaçamentos, hierarquia e composição adaptada do Figma. Adapte os componentes shadcn/ui para harmonizar com a estética do projeto.

Todas as telas devem funcionar em desktop, tablet e mobile. Avalie, no mínimo, larguras de 390, 768 e 1440 pixels.

Use **skeletons com shimmer effect** estilizados nos componentes dependentes de dados durante o carregamento (cards de NFT, detalhe do desenho e resumo do carrinho). Preserve as dimensões do conteúdo para evitar deslocamentos de layout (*CLS*) e respeite a preferência por movimento reduzido (`prefers-reduced-motion`).

São obrigatórios:

- Navegação por teclado e foco visível;
- Controle de foco em diálogos e drawers;
- Semantics adequada, labels e mensagens de erro associadas aos campos;
- Alternativas textuais (`alt`) para os cards e imagens dos episódios;
- Contraste legível e estados não dependentes apenas de cor;
- Feedback acessível para mutations e alterações em tempo real;
- Ausência de overflow horizontal indevido e perda de conteúdo com zoom.

---

## 9. Testes com Playwright

Entregue testes E2E executáveis com os mocks, cobrindo:

1. Busca por show/personagem, filtros de raridade combinados, ordenação, paginação e restauração pelo histórico.
2. Acesso direto ao detalhe de uma relíquia (ex: *Enchiridion*) e tratamento de item inexistente.
3. Cadastro no *Toon Pass*, login, expiração de sessão, logout e troca de colecionador.
4. Favoritos (*Toon Stars*), incluindo falha de mutation e recuperação do estado.
5. Carrinho/Cofre, quantidades, remoção de itens, cupom e persistência após refresh/login.
6. Compra completa, do catálogo ao recibo da transação confirmada.
7. Falha de pagamento/transação, clique repetido e timeout com recuperação do mesmo pedido.
8. Edição de perfil, avatar de desenho, senha e carteiras cripto, com erros de validação.
9. Alteração de preço em tempo real/disponibilidade via Socket.IO durante o checkout.
10. Eventos duplicados ou antigos, desconexão e retomada de transação pendente.
11. Navegação por teclado, foco de diálogos e validação de formulários.
12. Skeletons durante carregamento lento, feedback de falha e recuperação após nova tentativa.

Execute os fluxos principais em Chromium, nos viewports desktop e mobile. Inclua regressão visual do catálogo, detalhe, carrinho e checkout, com baselines versionadas.

---

## 10. Performance e Lighthouse

Audite a página inicial do *Toon Vault* e o detalhe de um NFT com Lighthouse em perfis mobile e desktop, usando build otimizado e o cenário padrão dos mocks.

| Categoria | Meta |
| --- | ---: |
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |

Execute três medições por página e perfil e reporte a mediana de cada categoria. Versione a configuração da auditoria e entregue relatórios HTML/JSON.

Registre LCP, CLS e TBT. Justifique resultados abaixo das metas. A auditoria deve carregar as imagens das animações, fontes e funcionalidades da entrega, sem simplificações exclusivas para burlar a pontuação.

---

## 11. Critérios de avaliação

| Critério | Pontos | Evidência esperada |
| --- | ---: | --- |
| **Fidelidade visual, tema Cartoon Network e responsividade** | 20 | Aderência ao Figma, estilo visual animado e consistência entre breakpoints |
| **Fluxos e experiência de uso** | 20 | Compra de NFTs e conta de colecionador completas, validações e tratamento de erros |
| **Integração e estado** | 15 | Router, Query, Axios, contratos tipados e cache coerentes |
| **Tempo real** | 10 | Eventos via Socket.IO, reconexão, ordenação e sincronização com REST |
| **Mocking** | 10 | MSW, cenários determinísticos com fixtures CN, persistência e reset |
| **Testes** | 10 | Cobertura E2E dos fluxos e falhas com Playwright |
| **Acessibilidade** | 5 | Operação por teclado, semântica, foco e feedback |
| **Performance** | 5 | Resultados e análise das auditorias Lighthouse |
| **Arquitetura e documentação** | 5 | Tipagem, organização limpa e execução reproduzível |
| **Total** | **100** | |

São eliminatórios: ausência de uso efetivo da stack obrigatória, fluxos principais apenas visuais, compra confirmada sem resposta da simulação, exposição de dados entre usuários, eventos simulados diretamente na UI sem passar por Socket.IO ou ausência de testes E2E executáveis.

---

## 12. Entrega

Entregue código-fonte, lockfile, assets de desenho animado, mocks, fixtures, testes e configurações de auditoria.

O **deploy é obrigatório**. Envie o link do repositório e uma URL pública da aplicação (Vercel, Netlify ou Cloudflare Pages).

O `README.md` da solução deve conter setup, variáveis de ambiente, credenciais fictícias de teste (ex: `finchin@ooo.com` / `gumball@elmore.com`), seleção e reset dos cenários do MSW, comandos de execução e instruções para reproduzir os fluxos de falha.

Documente a arquitetura e decisões de design em `ARCHITECTURE.md`.