# Simulador Estratégico de Loja — Backend

API REST do simulador web da Cencosud onde squads configuram variáveis financeiras de uma loja por rodada, gerando um DRE automático e competindo em ranking.

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [PostgreSQL](https://www.postgresql.org/) v14 ou superior

## Instalação

```bash
npm install
```

## Configuração do ambiente

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |
| `PORT` | Porta do servidor (padrão: 3333) |
| `NODE_ENV` | Ambiente: `development` ou `production` |

## Banco de dados

### Aplicar migrations

```bash
npm run migrate
```

### Popular com dados iniciais

```bash
npm run seed
```

O seed cria:
- 5 produtos base (Arroz, Feijão, Macarrão, Leite, Óleo)
- 1 usuário GAME_MASTER — `admin@simulador.com` / `admin123`
- 2 squads — Squad Alpha e Squad Beta
- 2 usuários PLAYER — `alpha@simulador.com` e `beta@simulador.com` / `player123`
- 2 lojas com estoque inicial de 100 unidades por produto

## Desenvolvimento

```bash
npm run dev
```

O servidor sobe em `http://localhost:3333` com hot-reload via nodemon.

Para visualizar o banco pelo Prisma Studio:

```bash
npm run studio
```

## Testes

```bash
npm test
```

## Endpoints

### Autenticação

| Método | Rota | Role | Descrição |
|---|---|---|---|
| POST | `/auth/login` | Pública | Login — retorna JWT |

### Usuários

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/users` | GAME_MASTER | Lista todos os usuários |
| POST | `/users` | GAME_MASTER | Cria usuário |
| PUT | `/users/:id` | GAME_MASTER | Atualiza usuário |
| DELETE | `/users/:id` | GAME_MASTER | Remove usuário (bloqueia se leader) |

### Produtos

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/products` | GAME_MASTER, PLAYER | Lista todos os produtos |
| POST | `/products` | GAME_MASTER | Cria produto |
| PUT | `/products/:id` | GAME_MASTER | Atualiza produto |
| DELETE | `/products/:id` | GAME_MASTER | Remove produto (bloqueia se em uso) |

### Squads

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/squads` | GAME_MASTER | Lista squads com membros e loja |
| POST | `/squads` | GAME_MASTER | Cria squad |
| PUT | `/squads/:id` | GAME_MASTER | Atualiza nome do squad |
| DELETE | `/squads/:id` | GAME_MASTER | Remove squad (bloqueia se rodada ativa) |
| POST | `/squads/:id/users` | GAME_MASTER | Adiciona usuário ao squad |
| DELETE | `/squads/:id/users/:userId` | GAME_MASTER | Remove usuário do squad (bloqueia se leader) |

### Lojas

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/stores` | GAME_MASTER | Lista todas as lojas |
| POST | `/stores` | PLAYER | Cria loja para o próprio squad |
| GET | `/stores/my` | PLAYER | Retorna loja do squad do usuário logado |

### Estoque

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/stores/:storeId/inventory` | GAME_MASTER, PLAYER | Lista estoque (PLAYER só vê o próprio) |
| PUT | `/stores/:storeId/inventory/:productId` | GAME_MASTER | Atualiza quantidade de um produto |
| POST | `/stores/:storeId/inventory/restock` | GAME_MASTER | Atualiza múltiplos produtos em transação |

### Rodadas

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/rounds` | GAME_MASTER, PLAYER | Lista rodadas ordenadas por número |
| GET | `/rounds/:id` | GAME_MASTER, PLAYER | Detalhe da rodada com contagem de configs |
| POST | `/rounds` | GAME_MASTER | Cria rodada (bloqueia se há rodada ativa) |
| PATCH | `/rounds/:id/close` | GAME_MASTER | Encerra rodada e processa DRE de todas as lojas |
| POST | `/rounds/:id/config` | PLAYER | Submete configuração da rodada (preço, volume, despesas) |
| GET | `/rounds/:id/results` | GAME_MASTER, PLAYER | Retorna resultados (PLAYER só vê o próprio) |

### Simulação

| Método | Rota | Role | Descrição |
|---|---|---|---|
| POST | `/simulation/preview` | PLAYER | Simula DRE sem persistir — retorna resultado e feedbacks |
| GET | `/simulation/ranking?roundId=` | GAME_MASTER, PLAYER | Ranking da rodada por margem líquida |

## Roles

| Role | Acesso |
|---|---|
| `GAME_MASTER` | Administração total — CRUD de usuários, produtos, squads, lojas, estoque e rodadas |
| `PLAYER` | Operação da loja — submeter config, visualizar estoque/resultados do próprio squad |
| `OBSERVER` | Somente leitura (ranking público — futuro) |
