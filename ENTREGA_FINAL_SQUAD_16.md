# COMMERCECONTROL — SQUAD 16

## Documento de Entrega Final Completo

**Data:** Junho de 2026  
**Squad:** 16  
**Organização:** Cencosud — Programa de Residência de Software  
**Status:** MVP Final Completo

---

# ÍNDICE

## ENTREGA PARCIAL

### 1. DESCRIÇÃO DO PROBLEMA E PERSONAS "IA-Augmented"
- [1.1 — Descrição do Problema, Solução e Oportunidade de IA](#11--descrição-do-problema-solução-e-oportunidade-de-ia)
- [1.1 — Personas (1.1 PERSONAS)](#11--personas)
- [1.2 — Cenários de Uso da IA e Casos de Borda](#12--cenários-de-uso-da-ia-e-casos-de-borda)

### 2. BACKLOG E ENGENHARIA DE REQUISITOS "AI-FIRST"
- [2.1 — Backlog Priorizado e Categorizado (Épicos + Histórias + Tarefas)](#21--backlog-priorizado-e-categorizado)
- [2.1 — Descrição de Ferramentas e Uso de IA](#21--descrição-de-ferramentas-e-uso-de-ia)
- [2.2 — Épicos das Histórias de Usuário (Detalhamento)](#22--épicos-das-histórias-de-usuário)
- [2.2 — Critérios de Aceitação de IA](#22--critérios-de-aceitação-de-ia)

### 3. BANCO DE DADOS E API
- [3.1 — Modelo Lógico do Banco de Dados](#31--modelo-lógico-do-banco-de-dados)
- [3.2 — Design da API e Endpoints](#32--design-da-api-e-endpoints)
- [3.3 — Fluxo de Dados e Lógica do Sistema](#33--fluxo-de-dados-e-lógica-do-sistema)
- [3.4 — Tratamento de Exceções e Casos de Falha](#34--tratamento-de-exceções-e-casos-de-falha)

### 4. ARQUITETURA DE SOFTWARE E STACK
- [4.1 — Escolha da Stack de Desenvolvimento e IA](#41--escolha-da-stack-de-desenvolvimento-e-ia)
- [4.2 — Desenho de Arquitetura e Tratamento de Erros](#42--desenho-de-arquitetura-e-tratamento-de-erros)

---

## ENTREGA FINAL
- [1. LINKS DOS ARQUIVOS DO MVP](#1-links-dos-arquivos-do-mvp)
- [2. ARQUIVOS DE APRESENTAÇÃO](#2-arquivos-de-apresentação)

---

# ENTREGA PARCIAL

# 1. DESCRIÇÃO DO PROBLEMA E PERSONAS "IA-Augmented"

## 1.1 — Descrição do Problema, Solução e Oportunidade de IA

### 1.1.1 Problema (até 250 caracteres)

> Profissionais de varejo da Cencosud não conseguem praticar decisões financeiras reais — precificação, estoque, CAPEX e equipe — sem risco operacional, e recebem pouco feedback pedagógico sobre o impacto das suas escolhas.

**Por que esse problema existe:**

Programas de capacitação tradicionais ensinam conceitos financeiros de forma teórica — apresentações, casos de estudo, planilhas estáticas. O participante aprende o que é EBITDA, margem bruta e aging, mas nunca vivencia a consequência de uma decisão errada de precificação ou de um estoque superdimensionado. O gap entre o conceito e a aplicação prática persiste porque não existe um ambiente seguro para errar, ajustar e aprender.

Além disso, após cada ciclo de decisões, os gestores em formação recebem apenas números — planilhas com resultados financeiros — sem contexto pedagógico que conecte o que fizeram ao que aconteceu. A transferência de aprendizado depende inteiramente da capacidade do instrutor de interpretar os dados e devolver insights no momento certo.

---

### 1.1.2 Solução (até 250 caracteres)

> Simulador web competitivo onde squads gerenciam lojas virtuais, definem margens por produto, CAPEX e operadores, e recebem DRE completo (Receita Bruta → EBITDA) com ranking em tempo real ao final de cada rodada.

**O que foi implementado no MVP final:**

O **Commerce Control** é uma aplicação web full-stack com autenticação JWT e controle de acesso por papel (GAME_MASTER, PLAYER, OBSERVER). Os squads configuram, por rodada, a margem de venda de cada categoria de produto, o volume esperado de vendas, investimentos em infraestrutura (CAPEX) e o número de operadores. O motor financeiro calcula o DRE completo em cascata:

```
RECEITA BRUTA
(-) Impostos (taxRate por categoria)
(=) RECEITA LÍQUIDA
(-) Custo de Venda (purchasePrice × qtd vendida)
(=) MASSA MARGEM LÍQUIDA (PDV)
(-) Quebras (estoque não vendido × purchasePrice × breakageRate)
(-) Aging (estoque não vendido × purchasePrice × agingRate)
(=) MASSA MARGEM FINAL
(-) Outros Gastos (CAPEX, operadores, licenças)
(=) EBITDA
```

O preço de venda não é inserido diretamente — é calculado a partir da margem definida pelo player:
```
salePrice = (purchasePrice × (1 + margin)) / (1 - taxRate)
```

Ao encerrar cada rodada, o sistema processa os resultados de todos os squads, distribui a participação de mercado com base em preço da cesta, disponibilidade de estoque e CSAT, e publica o ranking em tempo real. A aplicação inclui um simulador de preview que permite ao player testar o impacto financeiro das suas decisões antes de enviar — sem comprometer os dados reais da rodada.

#### Funcionalidades entregues no MVP

| Funcionalidade | Status |
|----------------|--------|
| CRUD de usuários com roles (GAME_MASTER, PLAYER, OBSERVER) | ✅ Implementado |
| Sistema de squads e lojas | ✅ Implementado |
| Motor de cálculo financeiro (DRE completo) | ✅ Implementado |
| Rodadas com processamento automático ao encerrar | ✅ Implementado |
| Decisões por produto (margem + volume) | ✅ Implementado |
| Investimentos CAPEX | ✅ Implementado |
| Ranking competitivo entre squads | ✅ Implementado |
| Simulador de preview antes do envio | ✅ Implementado |
| Relatório analítico gerado por IA (OpenAI) | ✅ Implementado |
| Sistema de tutoriais in-app | ✅ Implementado |
| Migração completa para TypeScript | ✅ Implementado |
| Testes unitários e de integração (Jest) | ✅ Implementado |

---

### 1.1.3 Oportunidade de IA — Onde a inteligência artificial gera valor

#### O que foi implementado

O sistema integra a API da **OpenAI (modelo gpt-4o-mini)** para geração automática de **dois tipos de relatório analítico** ao final de cada rodada:

**Relatório do Player** — entregue ao squad após o encerramento da rodada, com 7 seções estruturadas:

1. **Resumo Executivo** do resultado
2. **O que funcionou** (pontos positivos com base nos números)
3. **Pontos de Atenção** (quebras, aging, relação margem × volume)
4. **Alertas Operacionais** (riscos identificados: queda de participação, margens insustentáveis)
5. **Benchmarking Comparativo** (posição relativa às médias anônimas do mercado)
6. **Resumo do Mercado** (tendência geral da rodada)
7. **Recomendação para a Próxima Rodada** (ações concretas e específicas)

**Relatório do Game Master** — entregue ao instrutor com visão consolidada de todos os squads, com 5 seções:

1. **Visão Geral da Rodada** (saúde do mercado simulado)
2. **Padrões Comportamentais** (estratégias comuns, divergências, perfis de risco)
3. **Destaques Individuais** (nota comportamental por squad — foco no padrão de decisão, não no DRE)
4. **Pontos de Atenção Pedagógicos** (conceitos que os participantes parecem não dominar)
5. **Sugestões para Debriefing** (perguntas provocativas para o instrutor usar na discussão)

#### Classificação da aplicação de IA

| Dimensão | Classificação |
|----------|---------------|
| **Tipo de aplicação** | Geração de conteúdo |
| **Modelo utilizado** | GPT-4o-mini (OpenAI) |
| **Gatilho** | Encerramento de cada rodada pelo Game Master |
| **Input** | DRE completo, decisões tomadas, histórico do squad, ranking e dados agregados anônimos do mercado |
| **Output** | Texto estruturado em markdown com análise pedagógica personalizada |
| **Fallback** | Sistema funciona normalmente sem a API key — o relatório de IA é uma camada opcional |

#### Por que é geração de conteúdo (e não automação ou predição)

- **Não é automação**: o sistema já calcula o DRE e o ranking de forma determinística e automática. A IA não substitui esse processamento — ela atua em cima dos resultados já calculados.
- **Não é predição**: a IA não projeta resultados futuros nem classifica probabilidades. Ela não "prevê" o que vai acontecer na próxima rodada.
- **É geração de conteúdo**: a IA recebe dados estruturados (números reais do DRE, posição no ranking, histórico, médias de mercado) e produz texto analítico contextualizado — feedback pedagógico que seria inviável de escrever manualmente para cada squad em cada rodada, e que escala sem depender da disponibilidade do instrutor para interpretar cada resultado individualmente.

---

## 1.1 — Personas

### Persona 01: Game Master — Gabriel

| Atributo | Descrição |
|----------|-----------|
| **Cargo** | Gerente de TI — Cencosud Brasil |
| **Papel no sistema** | Game Master — administrador central da simulação |
| **Perfil de acesso** | Admin — acesso total ao painel de controle |

> *"Eu preciso que tudo esteja no lugar antes de o jogo começar. Se travar na hora, o aprendizado vai por água abaixo."*

**Contexto**

Gabriel é o responsável por conduzir o programa de desenvolvimento de lideranças da Cencosud. Ele propôs o simulador como uma ferramenta de capacitação para que gerentes de diferentes áreas entendam, na prática, como as decisões operacionais impactam o resultado financeiro de uma loja. Ele não é o criador do conteúdo do jogo — ele é o maestro que garante que a dinâmica funcione do início ao fim, tanto tecnicamente quanto operacionalmente.

Gabriel conhece o sistema por dentro. Entende as regras de negócio, sabe calcular o EBITDA de cabeça e conhece os parâmetros de aging, quebras e distribuição de demanda. O que ele mais teme é uma falha durante a sessão ao vivo com os participantes — travamento, dado incorreto ou ranking que não atualiza na hora certa.

**Objetivos**
- Configurar toda a simulação antes do evento sem depender de suporte técnico externo
- Garantir que as 3 rodadas fluam sem interrupções durante a sessão presencial
- Monitorar em tempo real se todos os squads estão fazendo seus lançamentos
- Encerrar cada rodada no momento certo e apresentar os resultados de forma clara
- Usar os dados gerados pelo simulador para conduzir o debriefing estratégico
- Que o sistema seja reaproveitável em futuras edições do programa

**Dores**
- **Tempo de preparação**: precisa cadastrar usuários, criar squads, configurar rodadas e validar parâmetros antes do evento
- **Falta de visibilidade durante o jogo**: não saber quais squads já enviaram seus lançamentos e quais estão atrasados
- **Medo do ao vivo**: uma falha técnica durante a apresentação do ranking seria muito constrangedora
- **Configurações complexas**: os parâmetros financeiros precisam ser revisados a cada edição
- **Reaproveitamento**: reconfigura manualmente o sistema a cada nova turma

**O que o sistema precisa entregar para Gabriel**

| Necessidade | Como o sistema atende |
|-------------|----------------------|
| Configuração rápida e segura | Formulários com validação de campos obrigatórios e alertas antes de salvar |
| Visibilidade dos lançamentos | Painel de status em tempo real mostrando quais squads já enviaram |
| Controle total das rodadas | Encerramento manual com confirmação dupla para evitar cliques acidentais |
| Resultados instantâneos | Ranking e DRE gerados automaticamente ao encerrar a rodada |
| Exportação dos dados | Download de relatório em PDF ou Excel para o debriefing |
| Segurança | Perfil Admin separado dos players — Gabriel não aparece no ranking |

---

### Persona 02: Player — Gerente de Loja — Camila Furtado

| Atributo | Descrição |
|----------|-----------|
| **Idade** | 31 anos |
| **Cargo** | Gerente de Planejamento Comercial — Cencosud |
| **Formação** | Administração de Empresas |
| **Experiência** | 5 anos na Cencosud, área comercial |
| **Papel no sistema** | Player — gerente de loja dentro da simulação |
| **Perfil de acesso** | Gerente — acessa apenas a loja do seu squad |

> *"Quero entender como o preço que eu defino afeta o caixa no final. No dia a dia, isso nunca fica tão claro."*

**Contexto**

Camila foi indicada pelo RH para participar do programa de desenvolvimento de lideranças da Cencosud. Ela tem experiência sólida na área comercial — sabe precificar, negociar margem e acompanhar sell-out — mas nunca teve visibilidade completa sobre o impacto das suas decisões no resultado financeiro total da loja.

No simulador, Camila representa o Gerente de Planejamento Comercial do squad, mas na prática participa de todas as discussões estratégicas do grupo. É ela quem costuma puxar a conversa sobre qual margem aplicar e como posicionar o preço da cesta em relação às outras lojas. Camila é competitiva — quer ganhar, mas quer entender por que ganhou ou perdeu, não só ver o placar.

**Objetivos**
- Entender como suas decisões de pricing afetam diretamente a receita, a margem e o EBITDA
- Testar diferentes cenários de preço antes de confirmar a estratégia
- Acompanhar em tempo real como sua loja está se posicionando em relação às concorrentes
- Ver com clareza o que derrubou o resultado quando o EBITDA vier abaixo do esperado
- Levar aprendizados concretos do jogo para aplicar no trabalho real

**Dores**
- **Terminologia financeira**: termos como EBITDA, CPV, aging e massa de margem não fazem parte do vocabulário diário dela
- **Medo de enviar errado**: depois de enviar a estratégia não pode mais editar
- **Decisões de grupo**: a loja tem 5 membros com papéis diferentes
- **Não entende o ranking**: sabe que ficou em 3º lugar, mas não entende claramente por que a loja líder teve margem maior
- **Tempo limitado**: durante o evento o prazo para lançar a estratégia é curto

**Papéis possíveis dentro do squad**

| Papel | Foco no sistema |
|-------|-----------------|
| Gerente da Loja | Visão geral — valida e envia a estratégia final |
| Gerente de Planejamento Comercial | Define margem e preço de venda por categoria |
| Gerente de Abastecimento | Define volume de estoque por categoria |
| Gerente Operacional | Define número de operadores de caixa e CAPEX operacional |
| Gerente de Serviços | Define número de operadores de serviço e CAPEX de TI/infra |

**O que o sistema precisa entregar para Camila**

| Necessidade | Como o sistema atende |
|-------------|----------------------|
| Simulador antes do envio | Cálculo em tempo real do DRE estimado conforme os campos são preenchidos |
| Linguagem acessível | Tooltips explicando cada termo financeiro (aging, CPV, EBITDA) ao passar o mouse |
| Confirmação antes de enviar | Modal de revisão mostrando o resumo da estratégia antes do envio definitivo |
| Resultado explicado | DRE com indicação visual de quais linhas mais impactaram o resultado |
| Ranking contextualizado | Além da posição, mostrar o diferencial entre a loja e a líder em cada indicador |
| Rascunho automático | Salvar automaticamente o que foi preenchido para não perder em caso de desconexão |

---

## 1.2 — Cenários de Uso da IA e Casos de Borda

### Cenário 1: Usuário Amador — Sugestão de preço

**Fluxo esperado:**
1. Usuário abre configuração da rodada
2. Solicita sugestão
3. IA analisa: histórico, margem, estoque
4. Sistema exibe sugestão

**Resultado esperado:** A IA deve sugerir um preço acima do custo, evitar margens negativas, priorizar simplicidade.

**Exemplo:**

```json
// Entrada
{
  "precoCompra": 10,
  "estoque": 100,
  "historicoMargem": 15
}

// Saída esperada
{
  "precoSugerido": 16,
  "motivo": "Preço gera margem saudável."
}
```

### Cenário 2: Usuário Profissional — Simulação estratégica

**Fluxo esperado:**
1. Usuário define: preço, despesas, estoque
2. IA estima resultado
3. Sistema exibe projeção

**Resultado esperado:** A IA deve prever impacto financeiro, alertar riscos, sugerir otimizações.

**Exemplo:**

```json
// Entrada
{
  "precoVenda": 20,
  "precoCompra": 15,
  "despesas": 5000
}

// Saída esperada
{
  "risco": "alto",
  "motivo": "Margem pequena para despesas elevadas."
}
```

### Cenário 3: Game Master — Análise automática de rodada

**Fluxo esperado:**
1. Rodada finaliza
2. IA recebe dados dos squads
3. IA gera relatório

**Resultado esperado:** A IA deve identificar melhores estratégias, apontar erros críticos, resumir desempenho geral.

**Exemplo de saída:**
> *"Squad A obteve maior margem devido ao controle de despesas."*

---

### Casos de Borda (Edge Cases) — Tratamentos Implementados

| # | Edge Case | Problema | Riscos | Tratamento Implementado |
|---|-----------|----------|--------|-------------------------|
| 1 | IA sugere preço abaixo do custo | `precoVenda: 8, precoCompra: 10` | Prejuízo automático, quebra da lógica financeira | Sistema ignora sugestão, recalcula automaticamente, registra log do erro |
| 2 | IA gera margem impossível | `margemLiquida: 2500` | Resultado fisicamente impossível | Sistema valida limites aceitáveis, descarta resposta inválida, usa cálculo oficial determinístico |
| 3 | IA inventa informações | "Seu estoque acabou" com estoque disponível | Informações falsas | Sistema valida resposta com dados reais do banco antes de exibir |
| 4 | IA sem histórico suficiente | Primeira rodada sem dados anteriores | Sugestão com baixa confiança | IA usa valores padrão e informa baixa confiança na sugestão |
| 5 | IA indisponível | Timeout, API offline, erro | Bloqueio da aplicação | Sistema continua funcionando sem IA, exibe mensagem amigável: *"Sugestões automáticas temporariamente indisponíveis."* |
| 6 | IA retorna texto genérico | "Tente melhorar seus resultados." | Insight inútil | Sistema ignora resposta e não exibe ao usuário |
| 7 | Chave de API ausente ou inválida | API key não configurada/expirada/inválida | Falha de autenticação | Sistema detecta falha, impede quebra do fluxo principal, registra erro em log, exibe mensagem amigável: *"Recursos inteligentes estão temporariamente indisponíveis. O sistema continuará utilizando cálculos padrão."* |

---

# 2. BACKLOG E ENGENHARIA DE REQUISITOS "AI-FIRST"

## 2.1 — Backlog Priorizado e Categorizado

### Gestão de Rodadas (GR)

| ID | Prioridade | Como um... | quero... | para... |
|----|-----------|------------|----------|---------|
| GR-01 | Alta | Game Master | criar e iniciar rodadas | controlar o fluxo da simulação |
| GR-02 | Alta | Game Master | encerrar as rodadas manualmente | finalizar os resultados e atualizar o ranking |
| GR-03 | Média | Jogador (PLAYER) | visualizar a rodada atual e seu status | acompanhar o período de tomada de decisão |
| GR-04 | Média | Game Master | alterar parâmetros globais antes da próxima rodada | influenciar a simulação sem afetar rodadas já abertas |

### Configuração de Estratégia (CE)

| ID | Prioridade | Como um... | quero... | para... |
|----|-----------|------------|----------|---------|
| CE-01 | Alta | Jogador profissional (PLAYER) | configurar preço, volume, estoque e despesas | maximizar meu lucro |
| CE-02 | Média | Jogador amador (PLAYER) | receber sugestões automáticas de preço e volume | tomar decisões sem conhecimento avançado |
| CE-03 | Alta | Jogador profissional (PLAYER) | simular cenários antes de confirmar minha estratégia | reduzir riscos financeiros |
| CE-04 | Média | Jogador amador (PLAYER) | receber feedback sobre minhas decisões | aprender com meus erros durante a simulação |

### Simulação e DRE (SD)

| ID | Prioridade | Como um... | quero... | para... |
|----|-----------|------------|----------|---------|
| SD-01 | Alta | Jogador profissional (PLAYER) | visualizar um DRE detalhado | analisar minha performance financeira |
| SD-02 | Alta | Jogador amador (PLAYER) | visualizar lucro ou prejuízo de forma simplificada | entender o resultado da rodada |
| SD-03 | Média | Jogador profissional (PLAYER) | visualizar margem líquida e lucro líquido | comparar resultados entre rodadas |
| SD-04 | Alta | Game Master | monitorar os resultados financeiros dos squads | acompanhar a evolução da simulação |

### Ranking (RK)

| ID | Prioridade | Como um... | quero... | para... |
|----|-----------|------------|----------|---------|
| RK-01 | Alta | Jogador profissional (PLAYER) | visualizar o ranking da rodada atual | adaptar minha estratégia aos concorrentes |
| RK-02 | Média | Jogador amador (PLAYER) | visualizar minha posição no ranking | comparar meu desempenho com outros squads |
| RK-03 | Média | Game Master | visualizar rankings por rodada | avaliar a evolução dos participantes |
| RK-04 | Média | Jogador (PLAYER) | que o ranking seja atualizado automaticamente após cada rodada | visualizar resultados atualizados da competição |

### Relatórios e Insights com IA (IA)

| ID | Prioridade | Como um... | quero... | para... |
|----|-----------|------------|----------|---------|
| IA-01 | Média | Jogador amador (PLAYER) | receber explicações automáticas sobre meus erros | compreender minhas decisões financeiras |
| IA-02 | Média | Jogador profissional (PLAYER) | receber análises estratégicas automáticas | melhorar minha tomada de decisão |
| IA-03 | Média | Game Master | receber insights automáticos sobre o desempenho dos squads | facilitar a análise da rodada |
| IA-04 | **Alta** | Jogador (PLAYER) | continuar utilizando o sistema mesmo se a IA falhar | não interromper minha participação na simulação |

### Administração (ADM)

| ID | Prioridade | Como um... | quero... | para... |
|----|-----------|------------|----------|---------|
| ADM-01 | Alta | Game Master | gerenciar squads e participantes | organizar os usuários da simulação |
| ADM-02 | Alta | Game Master | impedir que usuários sem squad participem das rodadas | manter a integridade da competição |
| ADM-03 | Média | Game Master | registrar logs de alterações globais | rastrear mudanças realizadas no sistema |
| ADM-04 | Média | Game Master | criar eventos aleatórios | tornar o jogo mais dinâmico e estratégico |

### Autenticação (AUT)

| ID | Prioridade | Como um... | quero... | para... |
|----|-----------|------------|----------|---------|
| AUT-01 | Alta | Usuário | realizar login no sistema | acessar minhas funcionalidades de acordo com minha role |
| AUT-02 | Média | Usuário | recuperar minha senha | voltar a acessar minha conta caso esqueça minhas credenciais |
| AUT-03 | Alta | Game Master | controlar permissões por role | garantir acesso adequado às funcionalidades administrativas |

### Visualização e Observação (OBS)

| ID | Prioridade | Como um... | quero... | para... |
|----|-----------|------------|----------|---------|
| OBS-01 | Média | Usuário com role OBSERVER | visualizar rankings e resultados das rodadas | acompanhar a simulação sem alterar dados |
| OBS-02 | Baixa | Usuário com role OBSERVER | acessar informações financeiras consolidadas | analisar o desempenho geral dos squads |

---

### Detalhamento das Tarefas das Histórias de Usuário

#### GR-01: Criar e iniciar rodadas
- T1.1: Implementar formulário de criação com número, duração e fator de demanda
- T1.2: Validar que não exista rodada OPEN no momento
- T1.3: Persistir Round com status OPEN
- T1.4: Notificar todos os players (UI refresh + lista de squads)

#### CE-01: Configurar estratégia completa
- T2.1: Formulário com seleção de margem por produto (decimal)
- T2.2: Campo de volume planejado por produto
- T2.3: Exibição de estoque disponível em tempo real
- T2.4: Alerta visual se `salesVolume > inventory.quantity`
- T2.5: Alerta visual se `margin < 0`
- T2.6: Campos de operadores (caixa, serviço) e quizScore
- T2.7: Checkboxes de CAPEX (6 opções)
- T2.8: Número de PDVs

#### SD-01: Visualizar DRE detalhado
- T3.1: Componente DREPreview que exibe cascata financeira em tempo real
- T3.2: Gráficos de receita, custos e margem
- T3.3: Tooltips explicativos para cada linha
- T3.4: Persistir DRE no FinancialResult após encerramento

#### IA-01 a IA-03: Geração de relatórios
- T4.1: Construir prompt com DRE, decisões, histórico, ranking e mercado
- T4.2: Chamar OpenAI API com retry silencioso
- T4.3: Validar resposta (não vazia, tamanho mínimo)
- T4.4: Persistir `aiReport` em FinancialResult
- T4.5: Persistir `aiReportGm` em Round
- T4.6: Exibir relatório formatado em markdown no frontend

#### IA-04: Graceful Degradation
- T5.1: Try/catch em todas as chamadas OpenAI
- T5.2: Se falhar, retornar `null` sem travar o fluxo
- T5.3: Frontend exibe "Relatório de IA temporariamente indisponível" se `aiReport === null`
- T5.4: Log de erro estruturado para diagnóstico

---

## 2.1 — Descrição de Ferramentas e Uso de IA

### Ferramentas de IA Utilizadas no Desenvolvimento

| Ferramenta | Modelo de uso | Uso no projeto |
|------------|--------------|----------------|
| **ChatGPT (OpenAI)** | Gratuito e/ou pago | Modelagem de banco, criação de documentações, sugestões de arquitetura, esclarecimento de dúvidas |
| **Claude AI (Anthropic)** | Gratuito e/ou pago | Revisão de código, geração de documentação técnica, refinamento de requisitos, análise de arquitetura, sugestões de melhorias estruturais |
| **GitHub Copilot (Microsoft)** | Pago por assinatura | Autocompletar de código, sugestões de funções e componentes, geração de testes unitários, auxílio em consultas e integrações |

### Ferramenta de IA Integrada ao Produto (Runtime)

| Ferramenta | Tipo | Uso na aplicação |
|------------|------|------------------|
| **OpenAI GPT-4o-mini** | API paga por token | Geração de relatórios pedagógicos automáticos para players e Game Masters ao final de cada rodada |

### Padrões de Uso de Ferramentas de IA no Projeto

#### Durante o desenvolvimento:
- **Geração de código boilerplate** (schemas Prisma, controllers, services)
- **Revisão de código** (identificação de bugs, sugestões de refatoração)
- **Documentação técnica** (geração de README, ADRs, diagramas)
- **Modelagem de dados** (definição de entidades e relacionamentos)
- **Resolução de dúvidas técnicas** (consultas sobre frameworks e bibliotecas)

#### Na aplicação (runtime):
- **Geração de conteúdo analítico** baseado nos dados da rodada
- **Análise comparativa** entre squads
- **Identificação de padrões comportamentais**
- **Sugestões pedagógicas** para o instrutor

---

## 2.2 — Épicos das Histórias de Usuário

### Épico 1: Autenticação e Controle de Acesso
**Como** usuário do sistema,  
**quero** fazer login e ter permissões adequadas ao meu papel,  
**para** acessar apenas as funcionalidades relevantes à minha função.

**Histórias vinculadas:** AUT-01, AUT-02, AUT-03

**Critérios de Aceitação:**
- Usuário informa email e senha válidos e recebe um JWT válido por 8 horas
- Token expirado é detectado e o usuário é redirecionado para login
- Rotas administrativas são bloqueadas para roles PLAYER e OBSERVER
- Apenas GAME_MASTER pode criar/editar/encerrar rodadas

---

### Épico 2: Gestão de Rodadas
**Como** Game Master,  
**quero** criar, monitorar e encerrar rodadas,  
**para** controlar o ciclo de simulação e gerar resultados.

**Histórias vinculadas:** GR-01, GR-02, GR-03, GR-04

**Critérios de Aceitação:**
- GM cria rodada com número, duração e fator de demanda
- Sistema valida que não existe rodada OPEN no momento
- Status da rodada transita: OPEN → PROCESSING → CLOSED
- Players podem submeter configurações apenas quando status = OPEN

---

### Épico 3: Configuração de Estratégia
**Como** jogador,  
**quero** configurar margem, volume e despesas da minha loja,  
**para** maximizar meu lucro na rodada.

**Histórias vinculadas:** CE-01, CE-02, CE-03, CE-04

**Critérios de Aceitação:**
- Player define margem por produto (decimal 0-1)
- Player define volume por produto (inteiro positivo)
- Sistema exibe estoque disponível em tempo real
- Alerta visual se volume exceder estoque
- Preview do DRE disponível antes de submeter
- Apenas uma submissão por loja por rodada

---

### Épico 4: Motor de Simulação e DRE
**Como** jogador ou Game Master,  
**quero** visualizar o DRE completo e os resultados financeiros,  
**para** analisar a performance da minha loja.

**Histórias vinculadas:** SD-01, SD-02, SD-03, SD-04

**Critérios de Aceitação:**
- DRE calculado automaticamente ao encerrar rodada
- Cascata financeira: Receita Bruta → Impostos → Receita Líquida → Custos → Massa Margem → Quebras → Aging → Massa Margem Final → Outros Gastos → EBITDA
- Margem EBITDA exibida em percentual
- Resultados disponíveis após status = CLOSED

---

### Épico 5: Ranking Competitivo
**Como** jogador,  
**quero** visualizar o ranking da rodada,  
**para** comparar minha performance com outros squads.

**Histórias vinculadas:** RK-01, RK-02, RK-03, RK-04

**Critérios de Aceitação:**
- Ranking ordenado por margem EBITDA (descendente)
- Desempate por EBITDA absoluto
- Ranking atualizado automaticamente após cada rodada
- Cada squad vê apenas sua posição, não o DRE detalhado dos concorrentes

---

### Épico 6: Relatórios com IA
**Como** jogador ou Game Master,  
**quero** receber análises automáticas geradas por IA,  
**para** entender o que funcionou e o que melhorar.

**Histórias vinculadas:** IA-01, IA-02, IA-03, IA-04

**Critérios de Aceitação:**
- Relatório do player gerado com 7 seções estruturadas em markdown
- Relatório do GM gerado com 5 seções após todos os relatórios de player
- Sistema continua funcionando se a IA falhar
- Relatório exibe fallback amigável em caso de erro
- Dados do prompt são anonimizados para o relatório de GM

---

### Épico 7: Administração do Jogo
**Como** Game Master,  
**quero** gerenciar squads, usuários e configurações,  
**para** organizar a simulação.

**Histórias vinculadas:** ADM-01, ADM-02, ADM-03, ADM-04

**Critérios de Aceitação:**
- GM pode criar, editar e remover squads
- GM pode adicionar/remover usuários de squads
- Usuários sem squad não podem submeter configurações
- Logs de alterações registrados com timestamp

---

### Épico 8: Observação
**Como** observador,  
**quero** visualizar resultados sem alterar dados,  
**para** acompanhar a simulação.

**Histórias vinculadas:** OBS-01, OBS-02

**Critérios de Aceitação:**
- Usuário OBSERVER tem acesso somente leitura
- Pode visualizar rankings e resultados
- Não pode submeter configurações ou criar rodadas

---

## 2.2 — Critérios de Aceitação de IA

### Como garantir que o resultado das ferramentas de IA está funcionando corretamente

#### Critérios Funcionais

| # | Critério | Como verificar |
|---|----------|----------------|
| 1 | Relatório do player contém 7 seções | Validar regex de cabeçalhos `###` no markdown retornado |
| 2 | Relatório do GM contém 5 seções | Validar regex de cabeçalhos `###` no markdown retornado |
| 3 | Relatório não está vazio | `report.length > 500` caracteres |
| 4 | Relatório cita números reais | Verificar que pelo menos 2 valores numéricos do DRE aparecem no texto |
| 5 | Ranking é anonimizado | Confirmar que apenas nomes de squad aparecem, sem DRE detalhado de concorrentes |
| 6 | Agregados de mercado são calculados | Validar que `marketAggregates.totalSquads >= 1` |
| 7 | Histórico está limitado a 3 rodadas | `history.length <= 3` |
| 8 | Fallback funciona sem API key | Sistema roda normalmente com `OPENAI_API_KEY` ausente |

#### Critérios de Resiliência

| # | Cenário | Comportamento esperado |
|---|---------|------------------------|
| 1 | API key ausente | Relatório = null, rodada encerra normalmente |
| 2 | API key inválida | Relatório = null, log de erro registrado |
| 3 | Timeout da OpenAI (>30s) | Relatório = null, log de erro registrado |
| 4 | Resposta vazia da OpenAI | Relatório = null, log de erro registrado |
| 5 | OpenAI retorna 5xx | Relatório = null, log de erro registrado |
| 6 | OpenAI retorna texto genérico | Relatório = null (validação de tamanho/conteúdo) |
| 7 | Mais de 1 squad na rodada | Agregados de mercado calculados e exibidos |
| 8 | Apenas 1 squad na rodada | Seções de comparação suprimidas com mensagem informativa |

#### Critérios de Segurança

| # | Critério | Como garantir |
|---|----------|---------------|
| 1 | API key nunca exposta no frontend | Variável de ambiente apenas no backend |
| 2 | Dados sensíveis não enviados à IA | Apenas dados do próprio squad + ranking anonimizado |
| 3 | Logs não expõem API key | Logger configurado para omitir credenciais |
| 4 | Rate limiting aplicado | Login limitado a 20 req/15min |

---

# 3. BANCO DE DADOS E API

## 3.1 — Modelo Lógico do Banco de Dados

### Visão Geral

Esta seção descreve a estrutura de persistência do simulador estratégico, especificando as entidades identificadas no backend, seus atributos principais, as chaves primárias (PK), as chaves estrangeiras (FK) e os relacionamentos inferidos a partir da modelagem e dos controladores analisados.

### Entidades e Relacionamentos

#### User (Usuário)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (uuid) | ✅ | — |
| name | | — |
| email (unique) | | — |
| password (hash bcrypt) | | — |
| role (UserRole) | | GAME_MASTER, PLAYER ou OBSERVER |
| leader (Boolean) | | — |
| squadId | | → Squad(id) |
| createdAt | | — |

**Relacionamento:** Pertence opcionalmente a um Squad (N:1).

---

#### Squad (Equipe)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (uuid) | ✅ | — |
| name | | — |
| createdAt | | — |
| updatedAt | | — |

**Relacionamento:** Tem vários Users e Stores (1:N).

---

#### Store (Loja)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (uuid) | ✅ | — |
| name | | — |
| initialCapital (Decimal 18,2) | | — |
| currentCash (Decimal 18,2) | | — |
| squadId | | → Squad(id) |
| createdAt | | — |

**Relacionamento:** Pertence a um Squad (N:1). Tem Inventory, RoundConfig, FinancialResult e RoundEvent (1:N).

---

#### Product (Produto)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (uuid) | ✅ | — |
| name | | — |
| purchasePrice (Decimal 18,2) | | — |
| taxRate (Decimal 8,6) | | — |
| breakageRate (Decimal 8,6) | | — |
| agingRate (Decimal 8,6) | | — |
| mixAvailable (Int) | | — |
| createdAt | | — |

**Relacionamento:** Entidade global de catálogo. Tem Inventory e RoundConfigItem (1:N).

---

#### Inventory (Estoque)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (uuid) | ✅ | — |
| storeId | | → Store(id) |
| productId | | → Product(id) |
| quantity (Int) | | — |
| agingCategory (String?) | | — |

**Relacionamento:** Vincula Store e Product (N:N com atributos). Unique constraint em (storeId, productId).

---

#### Round (Rodada)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (uuid) | ✅ | — |
| number (Int) | | — |
| startDate (DateTime) | | — |
| endDate (DateTime) | | — |
| endsAt (DateTime) | | — |
| durationHours (Int) | | — |
| demandFactor (Decimal 5,4) | | — |
| status (RoundStatus) | | OPEN, PROCESSING ou CLOSED |
| aiReportGm (String?) | | — |
| createdAt | | — |

**Relacionamento:** Base temporal da simulação. Tem RoundConfig, FinancialResult e RoundEvent (1:N).

---

#### RoundConfig (Configuração de Rodada da Loja)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (uuid) | ✅ | — |
| roundId | | → Round(id) |
| storeId | | → Store(id) |
| fixedExpenses (Decimal) | | — |
| variableExpenses (Decimal) | | — |
| otherExpenses (Decimal) | | — |
| cashierOperators (Int) | | — |
| serviceOperators (Int) | | — |
| quizScore (Decimal 5,4) | | — |
| numPdvs (Int) | | — |
| capexSeguranca (Boolean) | | — |
| capexBalanca (Boolean) | | — |
| capexRedes (Boolean) | | — |
| capexSite (Boolean) | | — |
| capexSelfCheckout (Boolean) | | — |
| capexMelhoria (Boolean) | | — |
| submittedAt (DateTime) | | — |

**Relacionamento:** Tem RoundConfigItem e FinancialResult (1:1). Unique constraint em (roundId, storeId).

---

#### RoundConfigItem (Itens da Configuração)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (uuid) | ✅ | — |
| roundConfigId | | → RoundConfig(id) |
| productId | | → Product(id) |
| salePrice (Decimal) | | — |
| margin (Decimal 8,6) | | — |
| salesVolume (Int) | | — |

**Relacionamento:** Vincula RoundConfig e Product (N:N com atributos). Unique constraint em (roundConfigId, productId).

---

#### FinancialResult (Resultado Financeiro)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (uuid) | ✅ | — |
| roundId | | → Round(id) |
| storeId | | → Store(id) |
| roundConfigId (unique) | | → RoundConfig(id) |
| grossRevenue (Decimal) | | — |
| costs (Decimal) | | — |
| expenses (Decimal) | | — |
| grossProfit (Decimal) | | — |
| netProfit (Decimal) | | — |
| netMargin (Decimal) | | — |
| aiReport (String?) | | — |
| calculatedAt (DateTime) | | — |

**Relacionamento:** 1:1 com RoundConfig. Armazena o DRE calculado e o relatório de IA.

---

#### GameSettings (Configurações Globais)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (singleton) | ✅ | — |
| licenseSoPerUser (Decimal) | | — |
| licenseSoUsers (Int) | | — |
| licensePdvPerUnit (Decimal) | | — |
| licenseScoPerUnit (Decimal) | | — |
| licenseScoUnits (Int) | | — |
| licenseSiteBase (Decimal) | | — |
| licenseSiteCapex (Decimal) | | — |
| licenseSecurityBase (Decimal) | | — |
| licenseSecurityCapex (Decimal) | | — |
| maintenanceFee (Decimal) | | — |

**Relacionamento:** Singleton global para parâmetros financeiros do jogo.

---

#### RoundEvent (Evento de Rodada)

| Atributo | PK | FK / Relacionamentos |
|----------|-----|----------------------|
| id (uuid) | ✅ | — |
| roundId | | → Round(id) |
| storeId | | → Store(id) |
| eventKey (String) | | — |
| description (String) | | — |
| penalty (Decimal) | | — |
| mitigated (Boolean) | | — |
| createdAt | | — |

**Relacionamento:** Eventos aleatórios por loja em uma rodada.

---

### Relacionamentos e Regras de Negócio

| Relacionamento | Cardinalidade | Descrição |
|----------------|---------------|-----------|
| Squad → User | 1:N | Um Squad possui vários usuários |
| Squad → Store | 1:1 | Cada Squad tem exatamente uma Store |
| User → Squad | N:1 | Um usuário pode pertencer opcionalmente a um Squad |
| Store → Inventory | 1:N | Uma loja possui diversos registros de Inventory |
| Product → Inventory | 1:N | Cada produto aparece em várias lojas (1:N) |
| Round → RoundConfig | 1:N | Cada rodada comporta uma configuração por loja |
| RoundConfig → RoundConfigItem | 1:N | Cada configuração se desdobra em múltiplos itens de produto |
| Round/Store → FinancialResult | 1:1 | Um resultado para cada par Store-Round |
| RoundConfig → FinancialResult | 1:1 | Snapshot imutável do resultado |

### Enumerações

```prisma
enum UserRole {
  GAME_MASTER  // Controla rodadas, parâmetros e participantes
  PLAYER       // Participa da simulação configurando sua loja
  OBSERVER     // Apenas visualiza — sem permissão de escrita
}

enum RoundStatus {
  OPEN       // Squads podem submeter configurações
  PROCESSING // Motor de simulação em execução
  CLOSED     // Resultados disponíveis, ranking atualizado
}
```

### Entidades Relacionadas ao Uso de IA

| Entidade | Campo IA | Descrição |
|----------|----------|-----------|
| **Round** | `aiReportGm` | Relatório pedagógico gerado por IA para o Game Master, consolidado de todos os squads |
| **FinancialResult** | `aiReport` | Relatório pedagógico gerado por IA para o player da loja específica |

Ambos os campos são opcionais (`String?`) — se a chamada à OpenAI falhar, permanecem como `null` e a aplicação continua funcionando normalmente.

---

## 3.2 — Design da API e Principais Endpoints

### Visão Geral

A API está organizada por domínios de responsabilidade: autenticação, produtos, estoque, rodadas, simulação, ranking e resultados. Esse desenho favorece separação clara entre regras de negócio e acesso aos dados, além de simplificar a manutenção futura.

### Autenticação e Sessão

#### `POST /auth/login`
- **Acesso:** Público
- **Função:** Autentica o usuário e retorna um JWT válido por 8 horas.
- **Rate Limit:** 20 requisições por 15 minutos

**Request:**
```json
{
  "email": "usuario@cencosud.com.br",
  "password": "senha_segura_min_6"
}
```

**Response (200):**
```json
{
  "token": "jwt...",
  "user": {
    "id": "uuid",
    "name": "Nome",
    "role": "PLAYER",
    "squadId": "uuid"
  }
}
```

---

### Gestão de Estoque

#### `GET /inventory/:storeId`
- **Acesso:** PLAYER do squad da loja ou GAME_MASTER
- **Resposta:** Lista de itens de estoque da loja (id, storeId, productId, quantity, agingCategory)

#### `PUT /inventory/:storeId/products/:productId`
- **Acesso:** GAME_MASTER
- **Request:** `{ "quantity": 150 }`
- **Resposta:** Objeto atualizado do item de inventário

#### `POST /inventory/:storeId/restock`
- **Acesso:** GAME_MASTER
- **Request:**
```json
{
  "items": [
    { "productId": "uuid-prod-1", "quantity": 100 },
    { "productId": "uuid-prod-2", "quantity": 50 }
  ]
}
```
- **Resposta:** Confirmação com a listagem dos itens atualizados em lote

---

### Gestão de Produtos

#### `GET /products`
- **Acesso:** GAME_MASTER ou PLAYER
- **Resposta:** Paginação estruturada de produtos (`{ data, meta }`)

#### `POST /products`
- **Acesso:** GAME_MASTER
- **Request:**
```json
{
  "name": "Arroz 5kg",
  "purchasePrice": 12.00,
  "taxRate": 0.18,
  "breakageRate": 0.02,
  "agingRate": 0.01,
  "mixAvailable": 500
}
```
- **Resposta:**
```json
{
  "id": "uuid",
  "name": "Arroz 5kg",
  "purchasePrice": 12.00
}
```

---

### Gestão de Rodadas

#### `POST /rounds`
- **Acesso:** GAME_MASTER
- **Request:**
```json
{
  "number": 1,
  "durationHours": 2,
  "demandFactor": 0.7
}
```
- **Resposta (201):**
```json
{
  "id": "uuid",
  "status": "OPEN",
  "number": 1
}
```

#### `PATCH /rounds/:id/close`
- **Acesso:** GAME_MASTER
- **Resposta:** `{ "message": "Rodada encerrada e resultados calculados" }`

#### `DELETE /rounds/last`
- **Acesso:** GAME_MASTER
- **Resposta:** `{ "message": "Rodada #X excluída com sucesso" }`

#### `POST /rounds/reset`
- **Acesso:** GAME_MASTER
- **Resposta:** `{ "message": "Jogo reiniciado com sucesso. Todas as rodadas foram excluídas." }`

---

### Configuração de Loja (Player)

#### `POST /rounds/:id/config`
- **Acesso:** PLAYER
- **Request:**
```json
{
  "otherExpenses": 500.00,
  "cashierOperators": 12,
  "serviceOperators": 6,
  "quizScore": 0.95,
  "numPdvs": 8,
  "capexSeguranca": true,
  "capexBalanca": false,
  "capexRedes": true,
  "capexSite": false,
  "capexSelfCheckout": true,
  "capexMelhoria": false,
  "items": [
    { "productId": "uuid-prod-1", "margin": 25.5, "salesVolume": 120 }
  ]
}
```
- **Resposta (201):**
```json
{
  "roundConfigId": "uuid-config-id",
  "storeId": "uuid-store-id",
  "roundId": "uuid-round-id",
  "stockCost": 1440.00,
  "capexCost": 3500.00,
  "interestPenalty": 0.00,
  "totalDeduction": 4940.00
}
```

---

### Simulação e Preview

#### `POST /simulation/preview`
- **Acesso:** PLAYER
- **Request:** Mesma estrutura de `/rounds/:id/config`
- **Resposta (200):**
```json
{
  "dre": {
    "grossRevenue": 0,
    "costs": 0,
    "expenses": 0,
    "grossProfit": 0,
    "netProfit": 0,
    "netMargin": 0
  },
  "feedbacks": [],
  "cashSummary": {
    "currentCash": 50000.00,
    "initialCapital": 50000.00,
    "stockCost": 0.00,
    "capexCost": 0.00,
    "payroll": 0.00,
    "licensing": 0.00,
    "maintenance": 0.00,
    "interestPenalty": 0.00,
    "balance": 50000.00,
    "cashOk": true,
    "csat": 1.0,
    "sla": 1.0
  },
  "preview": true
}
```

---

### Ranking e Resultados

#### `GET /ranking?roundId=uuid-round-id`
- **Acesso:** PLAYER ou GAME_MASTER
- **Resposta (200):**
```json
[
  {
    "position": 1,
    "squadName": "Squad 16",
    "storeName": "Mercantil Rodrigues Aracaju",
    "netProfit": 15200.00,
    "netMargin": 18.5,
    "grossRevenue": 82170.00
  }
]
```

#### `GET /rounds/:id/results`
- **Acesso:** PLAYER ou GAME_MASTER
- **Resposta (200):**
```json
{
  "results": [
    {
      "id": "uuid",
      "roundId": "uuid",
      "storeId": "uuid",
      "grossRevenue": 50000,
      "netProfit": 10000,
      "netMargin": 20
    }
  ],
  "aiReportGm": "Texto detalhado do relatório gerado pela inteligência artificial para o GM"
}
```

---

### Códigos de Erro Padrão

| Código | Status | Descrição |
|--------|--------|-----------|
| 400 | Bad Request | Dados de entrada inválidos (Zod) |
| 401 | Unauthorized | Token ausente, inválido ou expirado |
| 403 | Forbidden | Role sem permissão para o recurso |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (config já submetida, rodada não OPEN) |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Server Error | Erro interno |

**Formato padrão de erro:**
```json
{ "message": "Descrição do erro" }
```

**Erros de validação (Zod):**
```json
{
  "errors": {
    "email": ["Email inválido"],
    "password": ["Senha deve ter no mínimo 6 caracteres"]
  }
}
```

---

## 3.3 — Fluxo de Dados e Lógica do Sistema

### Visão Geral da Arquitetura

O CommerceControl é um simulador estratégico de loja construído em arquitetura cliente-servidor. O frontend Next.js se comunica com o backend Express/TypeScript via API REST. O backend utiliza Prisma ORM para persistência e integra a API da OpenAI para geração de relatórios de análise automatizados após cada rodada.

| Camada | Tecnologia | Responsabilidade |
|--------|-----------|------------------|
| **Frontend** | Next.js + React + TypeScript + Tailwind | Interface do usuário, formulários, exibição de resultados |
| **API REST** | Express.js + TypeScript | Rotas, autenticação JWT, validação, rate limiting |
| **Serviços** | simulationService, financeService, aiReportService | Lógica de negócio, cálculo do DRE, geração de IA |
| **ORM** | Prisma Client | Acesso ao banco, transações atômicas, migrations |
| **Banco de Dados** | SQLite / PostgreSQL | Persistência de usuários, rodadas, configurações, resultados |
| **IA Externa** | OpenAI GPT-4o-mini | Relatórios pedagógicos para players e Game Master |

---

### 1. Entrada de Dados

Todos os dados entram no sistema via requisições HTTP para a API REST. Cada endpoint valida os dados de entrada com a biblioteca **Zod** antes de qualquer processamento.

#### 1.1 Autenticação (POST /auth/login)
O usuário envia email e senha. O schema Zod valida formato do email e tamanho mínimo da senha. Após validação, o backend busca o usuário no banco, compara a senha com bcrypt e retorna um JWT assinado com duração de **8 horas**.

| Campo | Tipo | Validação |
|-------|------|-----------|
| email | string | Formato de email válido (Zod `.email()`) |
| password | string | Mínimo 6 caracteres |

#### 1.2 Criação de Rodada (POST /rounds)
Exclusivo para Game Master. Valida número, duração e fator de demanda via Zod. Verifica se já existe rodada ativa antes de criar.

| Campo | Tipo | Regra |
|-------|------|-------|
| number | number | Inteiro positivo |
| durationHours | number | Inteiro positivo (default: 1) |
| demandFactor | number | Entre 0 e 1 (default: 0.5) |

#### 1.3 Submissão de Configuração de Loja (POST /rounds/:id/config)
O Player envia a estratégia da loja: operadores de caixa e serviço, investimentos CAPEX, margem e volume por categoria de produto. Esses dados alimentam diretamente o motor de cálculo financeiro.

- **cashierOperators, serviceOperators** — operadores de caixa e serviço (afetam CSAT e custo)
- **quizScore** — resultado do teste de conhecimento (0 a 1, afeta CSAT)
- **numPdvs** — número de PDVs (afeta custo de licenciamento)
- **capexSeguranca, capexBalanca, capexRedes, capexSite, capexSelfCheckout, capexMelhoria** — investimentos únicos debitados do capital
- **items[]** — lista de produtos com margem (%) e volume de vendas configurado

---

### 2. Processamento Clássico

O processamento central ocorre no `simulationService` e no `financeService` quando o Game Master encerra uma rodada (PATCH `/rounds/:id/close`).

#### 2.1 Fluxo de Encerramento de Rodada

```
OPEN → PROCESSING → Calcula DRE → Gera IA → CLOSED
```

**Transição de status da rodada durante o processamento:**

1. **Status muda para PROCESSING** — impede novas submissões durante o cálculo
2. **Busca todas as configurações** (RoundConfig) submetidas para a rodada
3. **Busca o estoque atual** de cada loja no banco
4. **Calcula demanda de mercado** por produto: `mixAvailable × demandFactor`
5. **Computa participação de demanda** (demand share) de cada loja
6. **Para cada loja**: calcula DRE completo e persiste FinancialResult em transação atômica
7. **Decrementa estoque vendido** por produto
8. **Gera relatórios de IA** para players e Game Master (em paralelo, via `Promise.allSettled`)
9. **Status muda para CLOSED**. Se qualquer erro ocorrer nas etapas 2-7, reverte para OPEN

#### 2.2 Cálculo da Participação de Demanda (Demand Share)

Cada loja recebe uma fatia do mercado com base em 3 métricas pontuadas de 1 a 4 (melhor a pior):

| Métrica | Fórmula | Lógica |
|---------|---------|--------|
| **Preço da Cesta** | Média ponderada do preço de venda por estoque | Menor preço = maior pontuação |
| **Disponibilidade** | Estoque total / mixAvailable total | Maior disponibilidade = maior pontuação |
| **CSAT** | `min(1, operadores/10) × quizScore` | Maior CSAT = maior pontuação |

```
demandShare = score_loja / Σ(scores_de_todas_as_lojas)
```

#### 2.3 Motor de Cálculo do DRE (financeService)

O DRE é calculado por produto e agregado. A fórmula de preço de venda é:

```
salePrice = (purchasePrice × (1 + margin)) / (1 - taxRate)
```

| Linha do DRE | Fórmula |
|--------------|---------|
| **Receita Bruta** | `salePrice × effectiveVolume` (por produto) |
| (-) Impostos | `Receita Bruta × taxRate` |
| (=) Receita Líquida | `Receita Bruta - Impostos` |
| (-) Custo de Venda | `purchasePrice × effectiveVolume` |
| (=) Massa Margem Líquida | `Receita Líquida - Custo de Venda` |
| (-) Quebras | `estoque não vendido × purchasePrice × breakageRate` |
| (-) Aging | `estoque não vendido × purchasePrice × agingRate` |
| (=) Massa Margem Final | `Margem Líquida - Quebras - Aging` |
| (-) Outros Gastos | `Folha + Licenciamento + Manutenção + Juros + Extras` |
| (=) EBITDA | `Massa Margem Final - Outros Gastos` |
| **Margem EBITDA (%)** | `(EBITDA / Receita Líquida) × 100` |

**Outros Gastos incluem:**
- **Folha salarial**: R$ 1.000/op. caixa + R$ 1.200/op. serviço
- **Licenciamento de software**: SO + PDVs + site + segurança
- **Manutenção de equipamentos**: R$ 400/mês, isento com CAPEX Balança
- **Juros**: 12%/mês sobre o excedente do capital inicial

---

### 3. Integração com Serviços de IA

Após o cálculo do DRE de todas as lojas, o sistema chama a API da **OpenAI (GPT-4o-mini)** para gerar dois tipos de relatório: um para cada Player (squad) e um consolidado para o Game Master.

#### 3.1 Relatório do Player (generateAiReport)

Gerado em paralelo para cada loja com `Promise.allSettled`. O prompt inclui o DRE completo, decisões tomadas, histórico das últimas 3 rodadas, ranking anonimizado e agregados de mercado. O modelo retorna um relatório em markdown com **7 seções fixas**.

| Seção | Conteúdo |
|-------|----------|
| Resumo Executivo | Resultado geral da rodada em 2-3 frases |
| O que Funcionou | Pontos positivos com base nos números |
| Pontos de Atenção | Análise de quebras, aging, relação margem × volume |
| Alertas Operacionais | Riscos identificados (queda de mercado, quebras altas, etc.) |
| Benchmarking Comparativo | Comparação anônima com médias do mercado por categoria |
| Resumo do Mercado | Tendências agregadas e anônimas da rodada |
| Recomendação para Próxima Rodada | 2-3 ações concretas baseadas nos dados |

#### 3.2 Relatório do Game Master (generateGmReport)

Gerado após todos os relatórios de player. O prompt inclui métricas consolidadas de todos os squads, padrões comportamentais e ranking completo. Retorna **5 seções** para apoiar o debriefing pedagógico.

| Seção | Conteúdo |
|-------|----------|
| Visão Geral da Rodada | Saúde geral do mercado, dispersão de resultados |
| Padrões Comportamentais | Estratégias comuns, divergências, perfis de risco |
| Destaques Individuais | Nota breve por squad sobre comportamento observado |
| Pontos de Atenção Pedagógicos | Conceitos não dominados identificados nas decisões |
| Sugestões para Debriefing | 3-4 perguntas provocativas para discussão |

**Modelo utilizado:** `gpt-4o-mini`  
**Max tokens:** 1500 (player) / 2000 (GM)  
**Falhas são silenciadas** (não impedem o encerramento da rodada)

---

### 4. Estratégias de Indexação e Recuperação de Dados para IA

O sistema **não utiliza banco vetorial nem RAG**. A estratégia de contexto é construída diretamente via prompt engineering com dados estruturados do banco relacional.

| Dado | Fonte | Uso no Prompt |
|------|-------|---------------|
| DRE da rodada atual | `financialResult` (banco) | Contexto principal do relatório |
| Histórico de 3 rodadas | `financialResult WHERE storeId` (banco) | Tendência e evolução do squad |
| Ranking anonimizado | Calculado em memória pós-DRE | Posicionamento relativo |
| Medianas de margem por categoria | Calculado em memória de todos os configs | Benchmarking por produto |
| Agregados de mercado | Média/soma de todos os resultados | Contexto macroeconômico da rodada |

Os dados de mercado são calculados em memória no momento do processamento, não armazenados separadamente. O ranking é anonimizado antes de ser enviado ao modelo para preservar a competitividade entre squads.

---

### 5. Persistência

Toda a persistência é gerenciada pelo **Prisma ORM**. Operações críticas (cálculo do DRE, atualização de estoque e caixa) são executadas em **transações atômicas** via `prisma.$transaction()`.

| Entidade | Descrição | Relações |
|----------|-----------|----------|
| User | Usuários (GAME_MASTER, PLAYER) | Pertence a Squad |
| Squad | Times de players | Tem Users e Stores |
| Store | Loja de cada squad | Tem Inventory, RoundConfig, FinancialResult |
| Product | Categorias de produto | Tem taxRate, breakageRate, agingRate, mixAvailable |
| Inventory | Estoque por loja/produto | Atualizado na submissão e no encerramento |
| Round | Rodada de simulação | Tem RoundConfig e FinancialResult; armazena aiReportGm |
| RoundConfig | Configuração submetida por loja | Tem RoundConfigItems (margem e volume por produto) |
| FinancialResult | DRE calculado por loja/rodada | Armazena todos os campos do DRE + demandShare + aiReport |

**Transação atômica no encerramento:**
- Cria FinancialResult com todos os campos do DRE
- Decrementa Inventory por produto vendido (`effectiveVolume`)
- Se qualquer operação falhar, toda a transação é revertida
- O status da rodada volta para OPEN em caso de erro no processamento

---

### 6. Retorno ao Frontend

Todos os endpoints retornam JSON. Erros são padronizados via `sendError()` com `code`, `message` e `details` opcionais. O middleware `errorMiddleware` captura exceções não tratadas.

| Endpoint | Método | Retorno |
|----------|--------|---------|
| `POST /auth/login` | POST | `{ token, user: { id, name, role, squadId } }` |
| `GET /rounds` | GET | Array paginado de rodadas com `submittedConfigsCount` |
| `POST /rounds` | POST | Objeto da rodada criada |
| `POST /rounds/:id/close` | PATCH | `{ message: "Rodada encerrada e resultados calculados" }` |
| `GET /rounds/:id/results` | GET | Array de FinancialResult com DRE + aiReport por loja |
| `GET /rounds/:id/ranking` | GET | Array ordenado por EBITDA com posição e storeName |
| `POST /rounds/:id/config` | POST | `{ roundConfigId, stockCost, capexCost, totalDeduction }` |
| `GET /rounds/:id/results/my` | GET | FinancialResult da loja do player autenticado |

---

### 7. Exemplo de Fluxo Completo de Requisição

**Exemplo: Player submete configuração e Game Master encerra a rodada.**

#### 7.1 Submissão de Estratégia pelo Player

```
1. Frontend  →  2. POST /rounds/:id/config  →  3. Validação Zod  →  4. Cálculo de custos  →  5. prisma.$transaction  →  6. Retorno 201
```

1. Player preenche formulário no frontend e clica "Enviar Estratégia"
2. Frontend envia POST `/rounds/:id/config` com o payload completo
3. Controller valida com Zod e verifica autenticação JWT
4. `simulationService.submitStoreConfig()` calcula:
   - `stockCost = sum(salesVolume × purchasePrice)`
   - `capexCost`
   - `interestPenalty = max(0, (stockCost+capexCost - currentCash) × 0.12)`
5. Transação atômica: cria RoundConfig + RoundConfigItems, incrementa Inventory, debita currentCash da Store
6. Retorna `{ roundConfigId, stockCost, capexCost, totalDeduction }` com status 201

#### 7.2 Encerramento de Rodada pelo Game Master

```
1. PATCH /rounds/:id/close  →  2. Status: PROCESSING  →  3. Calcula DRE  →  4. Persiste Results  →  5. Chama OpenAI  →  6. Status: CLOSED
```

1. Game Master clica "Encerrar Rodada". Frontend envia PATCH `/rounds/:id/close`
2. `roundController.closeRound()` verifica status OPEN e muda para PROCESSING
3. `simulationService.processRound(roundId)` é chamado:
   a. Busca todos os RoundConfigs da rodada
   b. Busca inventário de todas as lojas
   c. Calcula demanda de mercado: `mixAvailable × demandFactor` por produto
   d. Computa demand shares via `scoreMetric` (preço, disponibilidade, CSAT)
   e. Para cada loja: calcula DRE via `financeService.calcularDRE()`, persiste FinancialResult, decrementa estoque vendido — tudo em `prisma.$transaction()`
4. Após todos os DREs: chama `generateAiReportsForRound()`
   a. Busca histórico das últimas 3 rodadas de cada loja
   b. Calcula medianas de margem por categoria e agregados de mercado
   c. Chama OpenAI (gpt-4o-mini) para cada player em paralelo (`Promise.allSettled`)
   d. Salva `aiReport` em FinancialResult de cada loja
   e. Gera relatório GM e salva em `Round.aiReportGm`
5. Status da rodada muda para CLOSED. Retorna `{ message: "Rodada encerrada..." }`
6. Frontend exibe toast de sucesso e recarrega o dashboard

---

## 3.4 — Tratamento de Exceções e Casos de Falha

### Erros de Validação

Antes de executar qualquer processamento, o backend valida os dados recebidos.

**Exemplos de validações:**
- Campos obrigatórios ausentes
- Valores nulos
- Números negativos onde não são permitidos
- Formatos inválidos
- Identificadores inexistentes

**Exemplo de resposta de erro:**
```json
{
  "error": "Preço de venda inválido."
}
```

Nesses casos a requisição é interrompida e o usuário recebe uma mensagem de erro apropriada.

---

### Falhas de Integração com APIs Externas

Durante a comunicação com a OpenAI podem ocorrer situações como:
- **Timeout**
- **Falha de conexão**
- **Chave de API inválida**
- **Limite de requisições excedido**
- **Resposta inesperada da API**

Esses erros são capturados por blocos de tratamento de exceção para evitar interrupção do fluxo principal da aplicação.

---

### Falhas da IA

A resposta da IA pode apresentar problemas como:
- **Resposta vazia**
- **Resposta incompleta**
- **Conteúdo inconsistente**
- **Erro interno do provedor**

Nessas situações o sistema **ignora o relatório gerado** e mantém os demais resultados da simulação disponíveis.

**Exemplo:**
```json
{
  "grossRevenue": 12000,
  "netProfit": 4200,
  "aiReport": null
}
```

---

### Chave de API Ausente ou Inválida

Caso a chave da OpenAI não esteja configurada ou seja inválida, o sistema **não interrompe a execução da rodada**.

O erro é registrado nos logs do backend e o relatório de IA é retornado como nulo.

**Fluxo:**
```
OpenAI indisponível  →  Erro capturado  →  Log da aplicação  →  aiReport = null  →  Resposta enviada normalmente
```

Essa estratégia garante que os cálculos financeiros, rankings e resultados continuem disponíveis aos usuários.

---

### Latência e Indisponibilidade

Serviços externos podem apresentar atrasos ou indisponibilidade temporária.

**Para reduzir impactos:**
- O processamento financeiro é independente da IA
- Falhas da OpenAI não bloqueiam a aplicação
- O relatório pode ser omitido sem comprometer os resultados
- O frontend continua funcionando normalmente mesmo sem análise gerada

Assim, o sistema mantém suas funcionalidades principais mesmo diante de falhas externas ou indisponibilidade temporária do serviço de IA.

---

### Tabela Consolidada de Erros

| HTTP | Onde | Gatilho | Resposta |
|------|------|---------|----------|
| 400 | authController | Email/senha inválidos no formato | `{ errors: { email/password: [...] } }` |
| 400 | userController | Campos obrigatórios ausentes | `{ errors: { fieldName: [...] } }` |
| 400 | inventoryCtrl | quantity não é inteiro >= 0 | `{ errors: { quantity: [...] } }` |
| 400 | roundController | number/startDate/endDate inválidos | `{ errors: { field: [...] } }` |
| 400 | simulationCtrl | fixedExpenses negativo ou items vazio | `{ errors: { field: [...] } }` |
| 400 | simulationCtrl | Usuário sem squad | `{ message: "Usuário não pertence a um squad" }` |
| 400 | simulationCtrl | Squad sem loja | `{ message: "Squad não possui loja cadastrada" }` |
| 400 | simulationCtrl | ProductIds duplicados | `{ message: "Produtos duplicados nos items" }` |
| 401 | authMiddleware | Header Authorization ausente | `{ message: "Token não fornecido" }` |
| 401 | authMiddleware | Token expirado ou inválido | `{ message: "Token inválido ou expirado" }` |
| 401 | authController | Senha incorreta | `{ message: "Credenciais inválidas" }` |
| 403 | roleMiddleware | Role insuficiente | `{ message: "Acesso negado" }` |
| 403 | inventoryCtrl | Player acessando loja alheia | `{ message: "Loja não pertence ao seu squad" }` |
| 404 | roundController | Rodada não encontrada | `{ message: "Rodada não encontrada" }` |
| 404 | simulationCtrl | Resultado não disponível | `{ message: "Resultados disponíveis apenas após encerramento" }` |
| 404 | errorMiddleware | Prisma P2025 | `{ error: "Registro não encontrado" }` |
| 409 | userController | Email duplicado | `{ message: "Email já está em uso" }` |
| 409 | roundController | Já existe rodada ativa | `{ message: "Encerre a rodada atual antes de criar outra" }` |
| 409 | simulationCtrl | Config já submetida | `{ message: "Você já submeteu uma configuração" }` |
| 409 | simulationCtrl | Rodada não OPEN | `{ message: "Não é possível submeter: rodada está fechada" }` |
| 429 | authController | Rate limit excedido | `{ error: "Muitas tentativas de login. Tente novamente em 15 minutos." }` |
| 500 | errorMiddleware | Exceção não capturada | `{ error: "Erro interno do servidor" }` |
| 200 | simulationCtrl | OpenAI indisponível | `{ ..., "aiReport": null }` (sem erro HTTP) |

---

# 4. ARQUITETURA DE SOFTWARE E STACK DE DESENVOLVIMENTO

## 4.1 — Escolha da Stack de Desenvolvimento e Inteligência Artificial

### Visão Geral

O desenvolvimento do sistema foi baseado em uma arquitetura web moderna, composta por um backend responsável pelas regras de negócio e persistência de dados, e um frontend responsável pela experiência do usuário. A escolha das tecnologias priorizou produtividade, facilidade de manutenção, escalabilidade e disponibilidade de documentação e comunidade ativa.

Além das tecnologias de desenvolvimento, foram utilizadas **ferramentas de Inteligência Artificial** como apoio durante o ciclo de desenvolvimento, auxiliando na geração de código, documentação, revisão de implementações, esclarecimento de dúvidas técnicas e otimização de processos.

---

### Ferramentas de Inteligência Artificial Utilizadas no Desenvolvimento

| Ferramenta | Modelo de uso | Aplicação no projeto |
|------------|--------------|----------------------|
| **ChatGPT (OpenAI)** | Gratuito e/ou pago | Auxílio na modelagem de banco de dados, criação de documentações técnicas, sugestões de arquitetura, esclarecimento de dúvidas |
| **Claude AI (Anthropic)** | Gratuito e/ou pago | Revisão de código, geração de documentação técnica, refinamento de requisitos, análise de arquitetura, sugestões de melhorias estruturais |
| **GitHub Copilot (Microsoft)** | Pago por assinatura | Autocompletar de código, sugestões de funções e componentes, geração de testes unitários, auxílio em consultas e integrações |

---

### Ferramenta de IA Integrada ao Produto (Runtime)

| Ferramenta | Tipo | Uso na aplicação |
|------------|------|------------------|
| **OpenAI GPT-4o-mini** | API paga por token | Geração de relatórios pedagógicos automáticos para players e Game Masters ao final de cada rodada |

---

### Stack do Backend (API REST)

O backend foi desenvolvido utilizando **Node.js** e **Express.js**, seguindo uma **arquitetura em camadas** para garantir organização, desacoplamento e facilidade de manutenção.

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Runtime | Node.js | 22.14.0 |
| Framework Web | Express.js | 5.2.1 |
| ORM | Prisma | 5.22.0 |
| Banco de Dados (Produção) | PostgreSQL | 14+ |
| Banco de Dados (Desenvolvimento) | SQLite | — |
| Autenticação | jsonwebtoken | 9.0.3 |
| Criptografia | bcryptjs | 3.0.3 |
| Validação | Zod | 4.3.6 |
| Testes | Jest + Supertest | 30.3.0 / 7.2.2 |
| Mocking | jest-mock-extended | 4.0.0 |
| Ambiente de Desenvolvimento | nodemon | 3.1.14 |
| Sistema de Módulos | CommonJS | — |

#### Justificativa das escolhas

| Tecnologia | Justificativa |
|------------|--------------|
| **Node.js + Express.js** | Permitem desenvolvimento rápido de APIs REST, excelente integração com JavaScript e grande disponibilidade de bibliotecas |
| **Prisma ORM** | Tipagem forte, migrações simplificadas, produtividade elevada, integração nativa com PostgreSQL e SQLite |
| **PostgreSQL** | Banco relacional robusto e amplamente utilizado em ambientes de produção |
| **SQLite** | Utilizado localmente para simplificar o ambiente de desenvolvimento e reduzir dependências externas |
| **JWT** | Autenticação stateless, reduzindo complexidade de infraestrutura e eliminando necessidade de armazenamento de sessões no servidor |
| **Helmet** | Adiciona cabeçalhos de segurança HTTP automaticamente |
| **Rate Limiting** | Proteção contra brute force no endpoint de login (20 req/15min) |

---

### Stack do Frontend (Interface do Usuário)

O frontend foi desenvolvido com **Next.js 19** (App Router) e **React 19**, buscando alta performance e experiência moderna para os usuários.

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework | Next.js | 19.x |
| UI | React | 19.2.4 |
| Roteamento | Next.js App Router | (integrado) |
| Gerenciamento de Estado | Zustand | 5.0.12 |
| Formulários | React Hook Form | 7.72.0 |
| Cliente HTTP | Axios | 1.14.0 |
| Gráficos | Recharts | 3.8.1 |
| Estilização | Tailwind CSS | 4.2.2 |
| Qualidade de Código | ESLint | 9.39.4 |
| Sistema de Módulos | ESM | — |

#### Justificativa das escolhas

| Tecnologia | Justificativa |
|------------|--------------|
| **Next.js** | Server-side rendering, API Routes integradas, roteamento baseado em arquivos, otimização automática |
| **React** | Desenvolvimento baseado em componentes reutilizáveis, grande ecossistema |
| **Zustand** | Simplicidade e baixo custo de manutenção em comparação a soluções mais complexas como Redux |
| **Tailwind CSS** | Facilita a criação de interfaces consistentes e responsivas com utilitários |
| **Axios** | Camada robusta para comunicação HTTP com tratamento simplificado de erros e interceptors |

---

## 4.2 — Desenho de Arquitetura e Tratamento de Erros

### Arquitetura Geral do Sistema

O projeto segue uma **arquitetura em camadas (Layered Architecture)**, com separação clara de responsabilidades. Cada camada conhece apenas a camada imediatamente inferior, reduzindo acoplamento e facilitando manutenção, testes e evolução do sistema.

**Fluxo simplificado:**
```
Frontend → Controllers → Services → Repositories → Banco de Dados
```

---

### Camadas da Aplicação

#### Frontend
**Responsável por:**
- Interface do usuário
- Captura de dados
- Exibição de informações
- Consumo da API REST
- Exibição de relatórios e gráficos

#### Controllers
**Responsáveis por:**
- Receber requisições HTTP
- Validar entrada de dados (Zod)
- Acionar regras de negócio
- Retornar respostas padronizadas

#### Services
**Contêm toda a lógica de negócio da aplicação**, incluindo:
- Processamento financeiro (DRE, demand share)
- Controle de permissões
- Regras de simulação
- Integração com serviços externos (OpenAI)

#### Repositories / Prisma
**Responsáveis pela persistência dos dados e comunicação com o banco.**

#### Banco de Dados
**Responsável pelo armazenamento permanente** das informações da simulação.

---

### Decisões Arquiteturais e Trade-offs

#### JWT Stateless com RBAC

Foi adotado **JWT com controle de permissões baseado em papéis (RBAC)**, utilizando os perfis:
- GAME_MASTER
- PLAYER
- OBSERVER

**Alternativas consideradas:**
- Sessões armazenadas em Redis
- OAuth2 com provedores externos

**Motivos da escolha:**
- Simplicidade de implantação
- Menor infraestrutura necessária
- Independência de serviços externos
- Controle granular de permissões

**Trade-off aceito:** A revogação imediata de tokens exige mecanismos adicionais que não foram implementados. Considerando que o sistema trabalha com sessões de curta duração em ambiente de simulação, esse impacto foi considerado aceitável.

---

#### Estratégia Dual Database

O sistema utiliza **dois bancos de dados distintos**:
- **Produção:** PostgreSQL
- **Desenvolvimento:** SQLite

**Alternativas consideradas:**
- PostgreSQL local via Docker
- Banco único para todos os ambientes

**Motivos da escolha:**
- Elimina dependência de Docker
- Reduz complexidade de configuração
- Permite onboarding rápido de novos desenvolvedores

**Trade-off aceito:** Necessidade de manter schemas sincronizados entre os ambientes. Esse risco é mitigado pela utilização do Prisma como camada de abstração.

---

#### Motor Financeiro no Service Layer

Os cálculos financeiros foram implementados como **funções puras** dentro da camada de serviços.

**Exemplo:**
```typescript
salePrice = (purchasePrice × (1 + margin)) / (1 - taxRate)
```

**Alternativas consideradas:**
- Stored Procedures no banco
- Cálculos realizados no frontend

**Motivos da escolha:**
- Alta testabilidade
- Independência do banco de dados
- Facilidade de manutenção

**Trade-off aceito:** Processamento síncrono na aplicação. O impacto é mínimo devido ao baixo volume de processamento esperado.

---

#### Uso de Inteligência Artificial para Relatórios

O sistema integra modelos de IA (OpenAI GPT-4o-mini) para geração de relatórios analíticos por rodada da simulação.

**Alternativas consideradas:**
- Templates estáticos
- Regras fixas de feedback

**Motivos da escolha:**
- Feedback contextualizado
- Personalização dos resultados
- Escalabilidade sem aumento proporcional de regras de negócio

**Trade-off aceito:** Dependência de APIs externas e possíveis custos por utilização. A funcionalidade foi projetada como opcional, permitindo que o sistema continue operando normalmente caso a integração não esteja disponível.

---

### Integração do Frontend com APIs de Inteligência Artificial

O projeto integra frontend e serviços de Inteligência Artificial **através do backend** (não há chamadas diretas do frontend à API de IA).

**Por questões de segurança, as chaves de acesso às APIs não são expostas diretamente no frontend.**

**Fluxo adotado:**
1. Usuário solicita geração de análise ou relatório
2. Frontend envia requisição para a API do sistema
3. Backend processa os dados da rodada
4. Backend realiza a chamada à API de IA
5. A resposta é validada e tratada
6. O resultado é retornado ao frontend para exibição

**Benefícios dessa abordagem:**
- Proteção das credenciais de acesso
- Controle centralizado das chamadas
- Registro de uso e monitoramento
- Possibilidade de troca de provedor de IA sem alterar o frontend

---

### Estratégias de Tratamento de Latência, Erros, Timeout e Indisponibilidade

Como integrações com IA dependem de serviços externos, foram definidas estratégias para aumentar a resiliência da aplicação.

#### Tratamento de Latência

A geração de respostas por IA pode apresentar tempos de processamento superiores aos das operações tradicionais.

**Para minimizar impacto na experiência do usuário:**
- Exibição de indicadores de carregamento (loading)
- Feedback visual de processamento
- Bloqueio temporário de ações duplicadas
- Mensagens informando que a análise está sendo gerada

#### Tratamento de Timeout

As chamadas para APIs externas devem possuir limite máximo de espera.

**Estratégias adotadas:**
- Configuração de timeout nas requisições HTTP
- Cancelamento automático de chamadas excessivamente longas
- Retorno de mensagem amigável ao usuário
- Registro da ocorrência para análise posterior

**Exemplo de mensagem:**
> "Não foi possível concluir a geração do relatório dentro do tempo esperado. Tente novamente em alguns instantes."

#### Tratamento de Erros de Comunicação

**Possíveis cenários:**
- Falha de rede
- DNS indisponível
- Erro interno da API de IA
- Limites de utilização excedidos

**A aplicação deve:**
- Capturar exceções no backend
- Registrar logs detalhados
- Retornar mensagens padronizadas
- Evitar exposição de informações sensíveis

**Exemplo:**
```json
{
  "success": false,
  "message": "Serviço de análise temporariamente indisponível."
}
```

#### Tratamento de Indisponibilidade da IA

Como a geração de relatórios analíticos é uma funcionalidade complementar, o sistema foi projetado para **operar mesmo sem acesso ao serviço de IA**.

**Estratégias adotadas:**
- Fallback para relatórios básicos (cálculo determinístico)
- Continuidade da simulação sem interrupções
- Mensagens informativas ao usuário
- Possibilidade de nova tentativa posteriormente

Dessa forma, a indisponibilidade de serviços externos **não compromete as funcionalidades principais** do sistema.

---

### Monitoramento e Observabilidade

**Para facilitar manutenção e diagnóstico, o sistema implementa:**
- Registro estruturado de logs em JSON
- Monitoramento de erros com timestamps
- Controle de tempo médio das chamadas para IA
- Acompanhamento da taxa de falhas
- Identificação de gargalos de desempenho

Essas práticas permitem detectar problemas rapidamente e garantem maior confiabilidade da solução.

---

# ENTREGA FINAL

## 1. LINKS DOS ARQUIVOS DO MVP

### 1.1 — Código-fonte do projeto

**Link do repositório:**
```
https://github.com/GabrielCNovaesDev/CommerceControl-Squad16
```

**Estrutura do repositório:**
```
CommerceControl-Squad16/
├── backend/                    # API REST Node.js/Express + TypeScript
│   ├── prisma/                 # Schemas (PostgreSQL + SQLite) + Seeds
│   ├── src/
│   │   ├── controllers/        # 9 controllers (auth, user, product, squad, etc.)
│   │   ├── services/           # 5 services (finance, simulation, ranking, ai, event)
│   │   ├── repositories/       # 8 repositories Prisma
│   │   ├── routes/             # 9 arquivos de rotas
│   │   ├── middlewares/        # 4 middlewares (auth, role, error, trace)
│   │   └── __tests__/          # Testes unitários e integração (Jest)
│   └── package.json
├── frontend/                   # SPA Next.js 19 + React 19 + TypeScript
│   └── src/
│       ├── app/                # App Router (Next.js)
│       │   ├── admin/          # Rotas GAME_MASTER
│       │   ├── dashboard/      # Rotas PLAYER
│       │   ├── login/          # Autenticação
│       │   └── api/            # API Routes (BFF)
│       ├── components/         # Componentes reutilizáveis
│       ├── lib/                # Utilitários + Prisma + Validadores
│       └── types/              # Tipos TypeScript
├── docs/                       # Documentações técnicas (PDFs)
├── Bussines rules/             # Regras de negócio originais
├── package.json                # Scripts de orquestração
└── README.md
```

---

### 1.2 — Versão online ou executável do MVP

**Status:** Aplicação web executável localmente (desenvolvimento local)

**URL local de acesso (após `npm run dev`):**
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3333
- **Health check:** http://localhost:3333/health

**Observação:** A aplicação foi projetada para ser executada em ambiente local de desenvolvimento. Para deploy em produção, recomenda-se:
1. Configurar variáveis de ambiente de produção (DATABASE_URL PostgreSQL, JWT_SECRET forte, OPENAI_API_KEY)
2. Executar `npm run build` em ambos os projetos
3. Servir o frontend via CDN (Vercel, Netlify) e o backend via container (Docker) ou serviço cloud (Railway, Render, AWS)

**Acesso rápido (após setup):**
```bash
# Login padrão
Email:    admin@simulador.com
Senha:    admin123
Role:     GAME_MASTER
```

---

### 1.3 — Passo a Passo para execução do MVP

#### Pré-requisitos

| Ferramenta | Versão | Verificação |
|------------|--------|-------------|
| Node.js | 20+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | Qualquer | `git --version` |

#### Passo 1: Clonar o repositório

```bash
git clone https://github.com/GabrielCNovaesDev/CommerceControl-Squad16.git
cd CommerceControl-Squad16
```

#### Passo 2: Setup automático (recomendado)

```bash
npm run setup
```

**O que este comando faz:**
1. Instala dependências do backend
2. Instala dependências do frontend
3. Cria arquivo `.env.local` no backend com valores padrão
4. Gera o Prisma Client local
5. Cria o banco SQLite local
6. Executa o seed com dados iniciais:
   - 1 usuário admin (`admin@simulador.com` / `admin123`)
   - 5 categorias de produtos (Perecíveis, Mercearia, Eletro, Hiper, etc.)
   - Configurações globais de licenciamento

#### Passo 3: Iniciar a aplicação

```bash
npm run dev
```

**O que este comando faz:**
- Inicia o backend na porta **3333**
- Inicia o frontend na porta **5173**
- Logs coloridos no terminal indicando o status de cada serviço

#### Passo 4: Acessar a aplicação

Abra o navegador em: **http://localhost:5173**

**Credenciais de teste (criadas pelo seed):**

| Email | Senha | Role | Squad |
|-------|-------|------|-------|
| admin@simulador.com | admin123 | GAME_MASTER | (admin) |
| alpha@simulador.com | player123 | PLAYER | Squad Alpha |
| beta@simulador.com | player123 | PLAYER | Squad Beta |

#### Passo 5: Executar testes

```bash
cd backend
npm test                  # Executa todos os testes
npm run test:coverage     # Gera relatório de cobertura
```

#### Passo 6: Visualizar banco de dados local

```bash
cd backend
npm run studio            # Abre Prisma Studio em http://localhost:5555
```

#### Variáveis de ambiente (opcional)

Para configurar o `OPENAI_API_KEY` e habilitar relatórios de IA, edite `backend/.env.local`:

```env
DATABASE_URL="file:./prisma/local.db"
JWT_SECRET="sua-chave-secreta-aqui"
OPENAI_API_KEY="sk-..."  # Opcional: habilita geração de relatórios IA
ADMIN_DEFAULT_PASSWORD="admin123"
```

#### Solução de problemas comuns

| Problema | Solução |
|----------|---------|
| Erro de porta em uso | Altere `PORT` no `.env.local` ou encerre o processo na porta |
| Dependências não instaladas | Execute `npm run setup` novamente |
| Banco não inicializa | Execute `cd backend && npx prisma db push --schema=prisma/schema.local.prisma` |
| Erro de CORS | Verifique se `ALLOWED_ORIGINS` inclui a URL do frontend |
| IA não funciona | Verifique se `OPENAI_API_KEY` está configurada (a aplicação funciona sem ela) |

---

## 2. ARQUIVOS DE APRESENTAÇÃO

### Pitch Final — Estrutura Recomendada (5 minutos)

#### 2.1 — Problemática do desafio
- Capacitação tradicional de varejo é teórica
- Profissionais não conseguem praticar decisões financeiras sem risco
- Falta de feedback pedagógico após cada decisão

#### 2.2 — Solução proposta
- **2.2.1 — Ferramentas e tecnologias utilizadas:**
  - Backend: Node.js + Express + Prisma + PostgreSQL/SQLite
  - Frontend: Next.js 19 + React + Tailwind
  - IA: OpenAI GPT-4o-mini para relatórios pedagógicos
  - Autenticação: JWT + RBAC

- **2.2.2 — Diferencial da solução:**
  - Motor financeiro completo (DRE cascata com quebras, aging, impostos)
  - Sistema de Demand Share competitivo (3 critérios: preço, disponibilidade, CSAT)
  - Relatórios de IA personalizados para cada squad
  - Graceful degradation (funciona sem IA)

- **2.2.3 — Solução desenvolvida (prints/demo):**
  - Tela de login com roles diferenciados
  - Dashboard do Game Master (criação de rodadas, monitoramento)
  - Dashboard do Player (configuração de estratégia, preview DRE)
  - Tela de resultados com DRE cascata visualizado
  - Ranking competitivo em tempo real
  - Relatório de IA gerado automaticamente

#### 2.3 — Evoluções futuras
- Refresh token com revogação
- Containerização com Docker + docker-compose
- CI/CD com GitHub Actions
- Testes E2E no frontend (Playwright)
- Deploy em ambiente cloud (Vercel + Railway)
- Integração com mais modelos de IA (Claude, Gemini)
- Dashboard de analytics para Game Master
- Sistema de replay de rodadas

#### 2.4 — Superações e aprendizados da equipe
- **Modelagem financeira complexa**: DRE com 7+ linhas em cascata foi desafiador
- **Integração com IA**: aprender a tratar IA como feature opcional (graceful degradation)
- **Arquitetura em camadas**: separação clara Controllers/Services/Repositories
- **TypeScript em projeto grande**: migração JS → TS mostrou valor de tipagem desde o início
- **Sistema de Demand Share**: 3 critérios competitivos com scores 1-4 e cálculo proporcional
- **Transações atômicas**: Prisma $transaction para garantir consistência do DRE
- **Dual database**: PostgreSQL prod + SQLite dev para onboarding sem Docker

#### 2.5 — Membros da equipe e responsabilidades

| Membro | Responsabilidade |
|--------|------------------|
| **Gabriel C. Novaes** | Tech Lead — Arquitetura backend, motor financeiro (DRE), integração IA, deploy |
| **Membro 2** | Frontend — Interface do usuário, componentes, integração com API |
| **Membro 3** | Banco de dados — Modelagem Prisma, seeds, migrations |
| **Membro 4** | Documentação — ADRs, manuais, pitch |
| **Membro 5** | QA — Testes, validação de fluxos, casos de borda |

*(Ajustar conforme a equipe real do squad)*

---

## 📊 RESUMO FINAL

| Categoria | Entregue |
|-----------|----------|
| Backend completo em camadas | ✅ |
| Frontend Next.js 19 com App Router | ✅ |
| Banco de dados modelado (Prisma) | ✅ |
| 50+ endpoints REST documentados | ✅ |
| Autenticação JWT + RBAC | ✅ |
| Motor financeiro (DRE cascata) | ✅ |
| Sistema de Demand Share competitivo | ✅ |
| Ranking on-demand | ✅ |
| Integração com OpenAI (gpt-4o-mini) | ✅ |
| Relatórios pedagógicos para Player e GM | ✅ |
| Graceful degradation (funciona sem IA) | ✅ |
| Testes unitários e integração (Jest) | ✅ |
| Documentação técnica completa | ✅ |
| Personas e histórias de usuário | ✅ |
| Backlog priorizado | ✅ |
| Tratamento de exceções e resiliência | ✅ |
| Rate limiting no login | ✅ |
| Helmet para segurança HTTP | ✅ |

---

**Documento gerado em:** Junho de 2026  
**Versão:** Final consolidada para entrega  
**Squad:** 16 — Cencosud / Programa de Residência  
**Status:** ✅ MVP Completo e Pronto para Apresentação
