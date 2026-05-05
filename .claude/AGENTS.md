# AGENTS.md — Instruções para Modelos de IA neste Projeto

> Este documento é a **fonte de verdade** sobre como qualquer LLM (Claude, Cursor, Codex, Copilot, etc.) deve agir ao gerar, revisar ou modificar código neste repositório. Leia-o antes de qualquer alteração. Se uma instrução aqui conflitar com algo que você "acha que é melhor", **a instrução aqui vence**.

---

## 0. Princípios fundamentais (leia antes de tudo)

1. **Você não é o dono do código.** Eu (o desenvolvedor humano) sou. Seu papel é executar com excelência dentro dos contornos que eu defino, não redesenhar o sistema porque você acha que tem uma ideia melhor.
2. **Quando em dúvida, pergunte.** É infinitamente melhor pedir esclarecimento do que assumir e errar. Não invente requisitos.
3. **Pequeno e correto vence grande e impressionante.** Prefira mudanças cirúrgicas a refatorações amplas. Não toque em código que não foi pedido.
4. **Não escreva código que você não entende.** Se você não consegue explicar por que cada linha existe, não escreva. Sem cargo cult, sem padrões aplicados "porque é boa prática".
5. **Toda mudança precisa de justificativa rastreável.** Comentário no PR, mensagem de commit, ou explicação no chat — algo que me permita entender *por que*, não só *o que*.
6. **Se você quebrar algo que estava funcionando, é seu erro.** Não relativize com "o teste estava frágil" ou "o comportamento anterior era ambíguo". Restaure ou conserte.

---

## 1. Antes de escrever qualquer código

Antes de gerar uma única linha, você **deve**:

1. **Ler os arquivos existentes** que tocam no domínio da mudança. Não assuma estrutura — verifique.
2. **Identificar os padrões já estabelecidos** no projeto: como erros são tratados? Como camadas se comunicam? Como testes são escritos? Siga o que já existe.
3. **Listar as dependências afetadas pela mudança**: que módulos chamam o código que você vai mexer? Que módulos ele chama?
4. **Verificar se a mudança quebra contratos públicos** (APIs HTTP, assinaturas de método usadas por outros módulos, schemas de banco).
5. **Confirmar comigo o plano** se a mudança envolver: novo módulo, mudança de schema, alteração de contrato público, introdução de nova dependência, ou refatoração que toca mais de 3 arquivos.

Se você pular essas etapas e gerar código quebrado ou desalinhado com o projeto, é considerado falha grave.

---

## 2. Arquitetura e separação de responsabilidades

### 2.1. Camadas obrigatórias (backend Spring Boot)

Toda funcionalidade segue esta separação. **Nunca** misture responsabilidades entre camadas.

```
Controller  →  Service  →  Repository  →  Database
     ↓            ↓
    DTO        Domain
```

- **Controller**: recebe HTTP, valida formato (não regra de negócio), delega ao Service, formata resposta. **Nunca** acessa repositório direto. **Nunca** contém lógica de negócio. **Nunca** tem mais de 80 linhas — se passar disso, está fazendo coisa demais.
- **Service**: orquestra regras de negócio. Recebe e retorna objetos de domínio (não DTOs do controller, não entidades do banco diretamente, salvo casos justificados). Lança exceções de domínio, não exceções HTTP.
- **Repository**: acesso a dados. Apenas isso. Sem lógica de negócio, sem transformação além do mapeamento entidade ↔ tabela.
- **DTO**: objeto de transporte entre o mundo externo e o serviço. Imutável (record em Java 17+). Tem validação de formato (`@NotBlank`, `@Email`, `@Size`).
- **Mapper**: conversão DTO ↔ Domain ↔ Entity. Centralizada, nunca espalhada em controllers ou services.

### 2.2. Limites de tamanho

Se você está escrevendo um arquivo que vai passar destes limites, **pare e divida**:

- **Classe**: 300 linhas é o teto razoável. Acima disso, há mais de uma responsabilidade ali dentro.
- **Método**: 30 linhas. Se passar, extraia métodos privados com nomes descritivos.
- **Parâmetros de método**: 4. Acima disso, crie um objeto de parâmetros (record).
- **Profundidade de aninhamento**: 3 níveis. Acima disso, extraia ou inverta condições com early return.
- **Componente React**: 200 linhas. Acima disso, divida em subcomponentes ou extraia hooks.

Estes números **não são sugestão**. Se você tem motivo pra exceder, justifique no comentário do PR.

### 2.3. Acoplamento

- **Sempre injete dependências via construtor.** Nunca `new SomeService()` dentro de um método. Nunca `@Autowired` em campo (use construtor). Em React, nunca instancie clientes HTTP dentro de componentes — use hooks ou contextos.
- **Programe contra interfaces, não implementações concretas**, quando há mais de uma implementação possível ou plausível no futuro próximo (gateways de pagamento, provedores de email, etc.). Não crie interface só pra ter — interface com uma implementação só é ruído.
- **Não vaze tipos de uma camada para outra.** Service não retorna `ResponseEntity`. Controller não recebe `Entity`. Repository não conhece DTOs.
- **Não acople por nome de campo.** O nome no banco, no domínio, no DTO de request e no DTO de response são independentes. Use o mapper.

---

## 3. Tratamento de erros

### 3.1. Hierarquia de exceções

Todo erro pertence a uma destas categorias. Trate cada uma de forma diferente:

| Categoria | Exemplo | Quem é responsável | Status HTTP típico |
|-----------|---------|--------------------|--------------------|
| **Validação** | CPF mal formatado, campo obrigatório vazio | Cliente | 400 |
| **Autenticação** | Token inválido ou expirado | Cliente | 401 |
| **Autorização** | Usuário autenticado sem permissão | Cliente | 403 |
| **Recurso não encontrado** | ID inexistente | Cliente | 404 |
| **Conflito de negócio** | Email já cadastrado, saldo insuficiente | Cliente | 409 ou 422 |
| **Infraestrutura** | Banco fora, timeout em API externa | Servidor | 503 |
| **Bug inesperado** | NullPointer, divisão por zero | Servidor | 500 |

Cada categoria tem sua exceção customizada. Trate-as no `@ControllerAdvice` central.

### 3.2. Regras absolutas

- **`catch (Exception e) {}` vazio é proibido.** Sem exceções. Se você precisa ignorar um erro, comente explicitamente *por quê* e logue em nível debug.
- **Nunca relance como `RuntimeException` genérica.** Preserve o tipo original ou converta para uma exceção de domínio que adicione contexto.
- **Logs de erro devem incluir contexto:** ID da entidade, ID da requisição, parâmetros relevantes (sem dados sensíveis). "Erro ao processar pedido" sem ID é inútil.
- **Não exponha stack traces ou mensagens internas para o cliente.** A resposta HTTP de erro deve ter formato padronizado (vide seção 7) e mensagem segura.
- **Não retorne `null` para indicar erro.** Use `Optional`, exceção apropriada, ou um tipo de resultado explícito (`Result<T, E>`).
- **Erros de negócio não são exceções de infraestrutura.** Saldo insuficiente é um resultado esperado do domínio, não uma falha do sistema. Modele apropriadamente.

---

## 4. Validação

### 4.1. Camadas de validação

Validação acontece em **três níveis**, cada um com responsabilidade clara:

1. **Formato (DTO de entrada)**: tipo correto, presença, tamanho, regex. Anotações Bean Validation.
2. **Negócio (Service/Domain)**: invariantes do domínio. "Não pode transferir mais que o saldo." "CPF deve ser válido pelo dígito verificador, não só pelo formato."
3. **Banco (constraints)**: última linha de defesa. UNIQUE, NOT NULL, FOREIGN KEY, CHECK. Se a aplicação falhar em validar, o banco não deixa passar.

**Não confie só em uma camada.** As três precisam existir.

### 4.2. Casos de borda obrigatórios

Para todo campo de string, considere e trate:

- `null`
- string vazia `""`
- string com apenas espaços `"   "`
- string com a palavra literal `"null"` ou `"undefined"`
- tamanho excessivo (proteção contra DoS por payload gigante)
- caracteres especiais e Unicode (emojis, RTL, zero-width)
- injeção (SQL, HTML, comando)

Para todo campo numérico:

- zero
- negativo
- limites do tipo (Integer.MAX_VALUE, overflow)
- precisão decimal (use `BigDecimal` para dinheiro, **nunca** `double` ou `float`)

### 4.3. Pontos de entrada

Toda entrada externa é hostil até prova em contrário. Isso inclui:

- Requests HTTP
- Mensagens de fila
- Webhooks
- Uploads de arquivo
- Variáveis de ambiente em runtime
- Dados vindos de APIs externas
- Dados vindos do banco (sim, paranoia justificada — corrupção acontece)

---

## 5. Segurança

Security não é feature, é requisito não-funcional permanente. Toda mudança passa pelo checklist abaixo.

### 5.1. Checklist obrigatório

- [ ] Todas as queries usam **prepared statements / parametrização**. Concatenação de string em SQL é proibida sem exceção.
- [ ] Inputs do usuário não são renderizados como HTML sem **escape**. No React, evitar `dangerouslySetInnerHTML`. Se for inevitável, sanitizar com lib confiável.
- [ ] **Autorização é validada explicitamente** em cada endpoint protegido. Autenticado ≠ autorizado. Verificar que o usuário tem permissão para o recurso específico (não só que tem token válido).
- [ ] Nenhum **secret** está no código, no `.env` versionado, ou em logs. Use variáveis de ambiente carregadas em runtime, vault, ou secret manager.
- [ ] **Logs não registram dados sensíveis**: senhas, tokens, CPF completo, número de cartão, dados de saúde. Mascarar ou omitir.
- [ ] **CORS** é restritivo em produção. Nunca `*`. Liste origens explicitamente.
- [ ] **Rate limiting** aplicado em endpoints públicos (login, signup, recuperação de senha, qualquer coisa que mande email/SMS).
- [ ] **Senhas** são armazenadas com hash adaptativo (bcrypt, argon2). MD5 e SHA-1 são proibidos para senhas.
- [ ] **JWT** tem expiração curta (≤ 1h para access token), rotação de refresh token, e algoritmo explicitamente declarado (não aceitar `alg: none`).
- [ ] **Headers de segurança** configurados: `Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`.
- [ ] **Mensagens de erro genéricas** em endpoints de autenticação. "Email ou senha inválidos" — nunca "email não existe" vs "senha errada", isso vaza enumeração.
- [ ] **Uploads** validam tipo real (magic bytes), tamanho máximo, e armazenam fora do diretório web. Nunca confiar no `Content-Type` do cliente.
- [ ] **IDOR** (Insecure Direct Object Reference): todo `GET /resource/:id` valida que o usuário atual tem acesso ao recurso `:id`.

### 5.2. Boundaries de confiança

Marque mentalmente cada dado pela origem:

- **Não confiável**: tudo vindo do cliente (request body, query, headers, cookies).
- **Semi-confiável**: dados do banco, dados de APIs externas. Validar se for usado em contexto sensível.
- **Confiável**: configuração interna, constantes de código.

Nunca trate input não confiável como confiável só porque "passou pelo controller".

---

## 6. Performance

### 6.1. Padrões a evitar

- **N+1 query**: o sintoma é um loop com chamada ao banco dentro. Use `JOIN FETCH`, `@EntityGraph`, ou DataLoader. Antes de fazer merge, **olhe os logs SQL** da operação que você acabou de implementar.
- **Carregar tudo quando precisa de pouco**: se a tela mostra 5 campos, a query traz 5 campos. Não `SELECT *`.
- **Falta de paginação**: todo endpoint que retorna lista deve ter paginação. Sem exceção, mesmo que "hoje só tem 10 registros".
- **Operações em memória que o banco faz melhor**: filtrar, ordenar, agregar, paginar. Faça no SQL.
- **Ausência de índice em coluna de busca**: toda coluna usada em `WHERE`, `JOIN` ou `ORDER BY` frequente precisa de índice. Justifique no PR ao adicionar.
- **Sem timeout em chamadas externas**: toda chamada HTTP, todo statement de banco, tem timeout configurado. Default infinito é um bug esperando pra acontecer.

### 6.2. Otimização prematura também é problema

Não introduza cache, fila assíncrona, ou processamento paralelo sem evidência de gargalo. Meça antes. Complexidade tem custo.

---

## 7. Concorrência

Em Spring Boot, cada request é uma thread. Não escreva código assumindo execução serial.

### 7.1. Regras

- **Variáveis estáticas mutáveis são proibidas**, exceto `final` ou tipos thread-safe (`AtomicInteger`, `ConcurrentHashMap`).
- **Operações leitura-modifica-escrita** em dados compartilhados (banco, cache, contador) precisam de:
  - Transação com nível de isolamento adequado, ou
  - Lock pessimista (`SELECT ... FOR UPDATE`), ou
  - Lock otimista (`@Version`), ou
  - Operação atômica do banco (`UPDATE ... SET x = x + 1`).
- **Idempotência**: webhooks, jobs e endpoints que podem ser retried devem produzir o mesmo resultado se executados N vezes com os mesmos parâmetros. Use chave de idempotência quando aplicável.
- **Não compartilhe `@Autowired` de beans com estado mutável** entre threads. Se o bean é `@Singleton` (default), ele é thread-safe ou não tem estado.

---

## 8. Testes

### 8.1. O que testar

Testes existem para dar **confiança em mudar o código**. Se um teste não tem esse propósito, ele é ruído.

- **Lógica de negócio**: sempre. Toda regra de domínio tem teste.
- **Casos de borda**: nulo, vazio, limite, negativo, overflow.
- **Caminhos de erro**: o que acontece quando dá errado é tão importante quanto o caminho feliz.
- **Contratos de API**: testes de integração que validam request/response reais.
- **Queries não triviais**: teste com banco real (Testcontainers), não mock de repository.

### 8.2. O que NÃO fazer

- **Não mocke o que você está testando.** Mock é pra dependências externas, não pro objeto sob teste.
- **Não escreva testes triviais pra inflar cobertura.** `assertNotNull(service)` não testa nada.
- **Não acople testes a detalhes de implementação.** Teste comportamento, não estrutura. Se renomear um método privado quebra o teste, o teste está errado.
- **Não use `Thread.sleep`** para sincronização. Use awaitility ou primitivas adequadas.
- **Não dependa de estado global**: data atual, timezone, ordem de execução, dados deixados por outro teste.

### 8.3. Estrutura

Padrão **Arrange-Act-Assert**, claramente separado. Nome do teste descreve o cenário e o resultado esperado:

```java
// Bom
void deveRetornarErroQuandoEmailJaCadastrado() { ... }

// Ruim
void testCreateUser2() { ... }
```

---

## 9. Observabilidade

Código que vai pra produção precisa ser observável. Sem isso, debug é adivinhação.

### 9.1. Logs

- **Estruturados** (JSON), não texto livre.
- **Níveis corretos**: `ERROR` para falhas que requerem atenção, `WARN` para situações suspeitas mas tratáveis, `INFO` para eventos de negócio relevantes, `DEBUG` para detalhes técnicos. Não use `INFO` pra tudo.
- **Trace ID / Correlation ID** propagado em toda requisição e log. MDC no Spring.
- **Sem dados sensíveis** (vide seção 5).
- **Mensagens acionáveis**: "Falha ao processar pagamento do pedido %s: timeout após %dms" é útil. "Erro" não é.

### 9.2. Métricas e health

- Endpoint `/actuator/health` configurado e monitorado.
- Métricas de latência, throughput e erro nos endpoints críticos.
- Alertas configurados para anomalias antes que o usuário reclame.

---

## 10. Configuração e ambiente

- **Nada hardcoded** que muda entre ambientes: URLs, credenciais, tamanhos de pool, timeouts, feature flags.
- **`application.yml`** por perfil (`dev`, `staging`, `prod`), com override por variáveis de ambiente.
- **Validação de configuração no startup**: se uma variável obrigatória está ausente, a aplicação não sobe. Falha cedo, falha alto.
- **Migrações de banco** via Flyway ou Liquibase. **Nunca** confie em `ddl-auto=update` em produção. Toda mudança de schema é uma migração versionada.

---

## 11. Frontend (React/TypeScript)

### 11.1. Estrutura

- **Componentes pequenos e focados.** Se um componente faz fetch, gerencia estado complexo, e renderiza UI, divida.
- **Hooks customizados** para lógica reutilizável. `useUser`, `useOrderForm`, etc.
- **Camada de API isolada**: nenhum componente faz `fetch` direto. Tudo passa por uma função em `/api/` ou `/services/`.
- **Tipos rigorosos**: `any` é proibido salvo casos justificados. Prefira `unknown` e narrow.
- **Sem estado global desnecessário.** Context e Redux só pra estado realmente compartilhado. Estado de formulário é local.

### 11.2. UX

- **Loading states explícitos.** Toda operação assíncrona tem indicador.
- **Erros visíveis e acionáveis.** Não engula erro de fetch — mostre ao usuário com opção de retry quando apropriado.
- **Validação otimista no cliente, autoritativa no servidor.** Cliente valida pra UX, servidor valida pra segurança.
- **Acessibilidade básica**: `alt` em imagens, labels em inputs, contraste adequado, navegação por teclado.

### 11.3. Performance

- **Memoização criteriosa**: `useMemo` e `useCallback` só quando há evidência de problema. Memoizar tudo é overhead.
- **Code splitting** em rotas grandes.
- **Imagens otimizadas**: tamanho adequado, formato moderno (WebP/AVIF), lazy loading.

---

## 12. Coerência cross-cutting

Estas decisões são tomadas **uma vez** e seguidas em todo o projeto. Não invente alternativas locais.

- **IDs**: UUID v7 (ordenável) para entidades de domínio. Long autoincrement apenas em tabelas de log/auditoria de alto volume.
- **Datas**: ISO 8601 em strings (`2026-05-04T14:30:00Z`), sempre UTC na API. Conversão para timezone local só na apresentação.
- **Dinheiro**: `BigDecimal` no backend, string no JSON (evita perda de precisão). Centavos como inteiros em casos específicos, documentado.
- **Booleans**: nomes positivos. `isActive`, não `isNotInactive`.
- **Naming**: `camelCase` em JSON e TypeScript, `snake_case` em colunas de banco. Mapeamento centralizado.
- **Erros HTTP**: formato `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] }, "traceId": "..." }`.
- **Paginação**: `?page=0&size=20`, resposta com `{ "content": [...], "page": 0, "size": 20, "totalElements": N, "totalPages": M }`.

---

## 13. Quando você (LLM) deve recusar ou pedir confirmação

Pare e me consulte antes de:

- Mudar schema de banco (migração).
- Adicionar nova dependência (npm, maven).
- Mudar contrato de API pública (endpoint, formato de request/response).
- Refatorar mais de 3 arquivos.
- Mexer em código de autenticação, autorização ou criptografia.
- Tocar em arquivo de configuração de produção.
- Apagar arquivos.
- Reescrever testes existentes (a menos que o teste tenha sido pedido pra ser reescrito).

Pra essas situações, **proponha primeiro, execute depois**.

---

## 14. Estilo de comunicação comigo

- **Direto.** Sem preâmbulo do tipo "ótima pergunta!". Vá ao ponto.
- **Honesto sobre incerteza.** "Não sei se essa biblioteca aceita esse parâmetro, preciso verificar" é melhor que chutar.
- **Crítico quando necessário.** Se eu peço algo que vai quebrar o sistema, me diga. Não execute em silêncio.
- **Português** como padrão. Nomes de variáveis, classes e código em inglês (convenção). Comentários e mensagens de commit podem ser em português.
- **Mostre o diff, não o arquivo inteiro**, quando a mudança é pequena.

---

## 15. Checklist final antes de entregar qualquer código

Antes de me responder com código, verifique mentalmente:

- [ ] Segui as camadas e limites de tamanho?
- [ ] Tratei erros adequadamente, com categoria correta?
- [ ] Validei input em todos os níveis aplicáveis?
- [ ] Considerei segurança (SQL injection, autorização, secrets, logs)?
- [ ] Pensei em concorrência e idempotência?
- [ ] Existe teste cobrindo o comportamento (não só linhas)?
- [ ] Logs e observabilidade adequados?
- [ ] Configuração externalizada?
- [ ] Coerência com padrões do projeto (naming, formato de erro, paginação)?
- [ ] Nenhuma mudança fora do escopo do que foi pedido?

Se a resposta a qualquer item for "não" ou "não sei", **pare e revise antes de entregar**.

---

*Última atualização: mantida pelo desenvolvedor responsável. Modelos de IA não devem editar este arquivo sem instrução explícita.*
