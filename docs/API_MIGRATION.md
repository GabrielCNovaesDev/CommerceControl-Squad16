# Documentação da API - CommerceControl

## Rotas da API

### Base URL
- **Desenvolvimento:** `http://localhost:3333`
- **Produção:** `https://commercecontrol.vercel.app` (após migração)

### Autenticação
Todas as rotas (exceto `/auth/login`) requerem header:
```
Authorization: Bearer <token_jwt>
```

---

## Rotas Públicas

### POST /auth/login
- **Descrição:** Autentica usuário e retorna token JWT
- **Autenticação:** Não requer
- **Rate Limit:** 20 tentativas por 15 minutos
- **Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Resposta:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "GAME_MASTER | PLAYER",
    "squadId": "string | null"
  }
}
```

---

## Rotas Protegidas (Requerem JWT)

### /users (GAME_MASTER)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/users` | Listar todos os usuários |
| POST | `/users` | Criar usuário |
| POST | `/users/bulk` | Criar múltiplos usuários |
| PUT | `/users/:id` | Atualizar usuário |
| DELETE | `/users/:id` | Deletar usuário |

### /products (GAME_MASTER + PLAYER)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/products` | Listar produtos |
| POST | `/products` | Criar produto |
| PUT | `/products/:id` | Atualizar produto |
| DELETE | `/products/:id` | Deletar produto |

### /squads (GAME_MASTER)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/squads` | Listar squads |
| POST | `/squads` | Criar squad |
| PUT | `/squads/:id` | Atualizar squad |
| DELETE | `/squads/:id` | Deletar squad |
| POST | `/squads/:id/users` | Adicionar usuário ao squad |
| DELETE | `/squads/:id/users/:userId` | Remover usuário do squad |

### /stores (PLAYER + GAME_MASTER)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/stores/my` | Obter loja do jogador atual |
| GET | `/stores/my/previous-capex` | Obter CAPEX anterior do jogador |
| POST | `/stores` | Criar loja |
| GET | `/stores` | Listar todas as lojas (GAME_MASTER) |

### /stores/:storeId/inventory (GAME_MASTER + PLAYER)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/stores/:storeId/inventory` | Obter inventário da loja |
| PUT | `/stores/:storeId/inventory/:productId` | Atualizar item do inventário |
| POST | `/stores/:storeId/inventory/restock` | Repor estoque |

### /rounds (GAME_MASTER + PLAYER)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/rounds` | Listar rodadas |
| GET | `/rounds/:id` | Obter detalhes da rodada |
| POST | `/rounds` | Criar nova rodada |
| PATCH | `/rounds/:id/close` | Encerrar rodada |
| PATCH | `/rounds/:id/extend` | Estender prazo da rodada |
| DELETE | `/rounds/last` | Deletar última rodada |
| POST | `/rounds/reset` | Resetar jogo |
| GET | `/rounds/:id/my-config` | Obter configuração do jogador |
| GET | `/rounds/:id/events` | Obter eventos da rodada |
| POST | `/rounds/:id/config` | Enviar configuração do jogador |
| GET | `/rounds/:id/results` | Obter resultados |

### /simulation (GAME_MASTER + PLAYER)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/simulation/preview` | Pré-visualizar configuração |
| GET | `/simulation/ranking` | Obter ranking |

### /settings (GAME_MASTER + PLAYER)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/settings` | Obter configurações do jogo |
| PUT | `/settings` | Atualizar configurações (GAME_MASTER) |

---

## Roles

| Role | Descrição | Permissões |
|------|-----------|------------|
| `GAME_MASTER` | Administrador do jogo | Todas as rotas |
| `PLAYER` | Jogador/Participante | Rotas limitadas |

---

## Códigos de Erro

| Status | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou expirado |
| 403 | Forbidden - Sem permissão para acessar recurso |
| 404 | Not Found - Recurso não encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Erro no servidor |