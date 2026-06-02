# Commerce Control

**Simulador estratégico de gestão de loja que treina equipes a tomar decisões financeiras reais (margens, CAPEX, staffing) e mede impacto via DRE automatizado com ranking competitivo.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Express](https://img.shields.io/badge/Express-5.x-black?logo=express)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)
![License](https://img.shields.io/badge/License-ISC-green)

---

## 🎯 Sobre o projeto

Commerce Control é um simulador de negócios onde squads competem gerenciando lojas virtuais inspiradas na operação real da Cencosud. A cada rodada, jogadores definem margens de venda por produto, investimentos em infraestrutura (CAPEX), quantidade de operadores e despesas — o sistema calcula automaticamente um DRE completo (Receita Bruta → EBITDA) e ranqueia as equipes.

O projeto foi construído durante o programa de Residência de Software, consolidando fundamentos de arquitetura backend em camadas, autenticação JWT com RBAC, modelagem financeira e integração com IA generativa (OpenAI) para análise automatizada de resultados.

A aplicação resolve um problema concreto de treinamento: permitir que profissionais de varejo experimentem decisões de pricing e investimento sem risco financeiro real, recebendo feedback quantitativo imediato sobre o impacto de cada escolha.

---

## 🏗️ Arquitetura e decisões técnicas

```mermaid
graph LR
    subgraph Frontend
        A[React SPA] -->|Axios| B[API REST]
    end
    subgraph Backend
        B --> C[Express Routes]
        C --> D[Middlewares - Auth/RBAC]
        D --> E[Controllers]
        E --> F[Services]
        F --> G[Repositories]
        G --> H[(PostgreSQL / SQLite)]
        F --> I[OpenAI API]
    end
```

**Padrão:** Arquitetura em camadas com separação clara de responsabilidades — cada camada só conhece a imediatamente abaixo.

### Decisões técnicas com trade-offs

> **Decisão:** JWT stateless com RBAC (GAME_MASTER, PLAYER, OBSERVER)
> **Alternativas consideradas:** Sessão server-side com Redis; OAuth2 com provider externo
> **Por quê:** Simplicidade de deploy (sem estado no servidor) e controle granular de permissões por role sem dependência externa
> **Trade-off aceito:** Revogação de token exige lógica adicional (não implementada) — aceitável para contexto de simulação com sessões curtas

> **Decisão:** Dual database — PostgreSQL em produção, SQLite local via Prisma multi-schema
> **Alternativas consideradas:** PostgreSQL local via Docker; banco único com seed condicional
> **Por quê:** Elimina dependência de Docker para onboarding — `npm run setup` cria banco local funcional em segundos
> **Trade-off aceito:** Manter dois schemas Prisma sincronizados manualmente; mitigado pelo fato de ambos serem gerados pelo mesmo modelo de dados

> **Decisão:** Motor financeiro (DRE) como pure function no service layer
> **Alternativas consideradas:** Stored procedures no banco; cálculo no frontend
> **Por quê:** Testabilidade — o cálculo de DRE é coberto por testes unitários sem dependência de banco. Fórmula de preço: `salePrice = (purchasePrice × (1 + margin)) / (1 - taxRate)`
> **Trade-off aceito:** Processamento síncrono no Node — aceitável para o volume atual (dezenas de squads, não milhares)

> **Decisão:** OpenAI para geração de relatórios analíticos por rodada
> **Alternativas consideradas:** Templates estáticos; regras hardcoded de feedback
> **Por quê:** Feedback personalizado e contextual que escala sem escrever centenas de regras de negócio
> **Trade-off aceito:** Dependência de API externa e custo por chamada — feature é opcional (funciona sem API key)

---

## 🛠️ Stack

| Camada | Tecnologia | Por que escolhi |
|--------|-----------|-----------------|
| Runtime | Node.js + TypeScript 5.8 | Type safety end-to-end no monorepo |
| API | Express 5 | Framework maduro, middleware ecosystem rico |
| ORM | Prisma 5.22 | Schema declarativo, migrations type-safe, multi-provider |
| Banco (prod) | PostgreSQL (Supabase) | ACID, suporte a Decimal para cálculos financeiros |
| Banco (local) | SQLite | Zero-config para desenvolvimento local |
| Auth | JWT + bcryptjs | Stateless, sem infraestrutura adicional |
| Validação | Zod 4 | Schema validation com inferência de tipos |
| Frontend | React 19 + Vite 8 | HMR rápido, bundle otimizado |
| Estado | Zustand | Minimal boilerplate vs Redux, stores isoladas |
| Estilo | Tailwind CSS 4 | Utility-first, sem CSS custom para manter consistência |
| IA | OpenAI SDK | Geração de relatórios analíticos contextuais |

---

## 📁 Estrutura de pastas

```
├── backend/
│   ├── prisma/              # Schemas (prod + local), seeds, migrations
│   ├── scripts/             # Helpers de setup automatizado
│   └── src/
│       ├── controllers/     # Camada HTTP — parse de request, delegação ao service
│       ├── services/        # Regras de negócio — DRE, ranking, simulação, IA
│       ├── repositories/    # Acesso a dados via Prisma — queries isoladas
│       ├── routes/          # Definição de rotas e binding de middlewares
│       ├── middlewares/     # Auth JWT, verificação de role, error handler, tracing
│       ├── types/           # Interfaces e tipos compartilhados
│       ├── utils/           # Helpers puros (formatação, cálculos auxiliares)
│       └── __tests__/       # Testes unitários e de integração
├── frontend/
│   └── src/
│       ├── pages/           # 13 páginas (admin + player + auth)
│       ├── components/      # UI reutilizável + componentes de domínio
│       ├── services/        # Camada HTTP (Axios) — espelha rotas do backend
│       ├── store/           # Zustand stores (auth, theme)
│       ├── hooks/           # Custom hooks
│       └── utils/           # Helpers do frontend
└── docs/                    # Documentação complementar
```

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js 20+
- npm 9+
- Git

### Setup (uma vez)

```bash
# 1. Clone o repositório
git clone https://github.com/GabrielCNovaesDev/CommerceControl-Squad16.git
cd CommerceControl-Squad16

# 2. Instale dependências e configure banco local (SQLite)
npm run setup
```

O comando `setup` executa automaticamente:
- Instalação de dependências (backend + frontend)
- Criação do `.env.local` com valores padrão
- Geração do Prisma Client local
- Push do schema para SQLite
- Seed com dados iniciais (admin + produtos)

### Rodar a aplicação

```bash
# Sobe backend (porta 3333) e frontend (porta 5173) simultaneamente
npm run dev
```

### Verificar que está funcionando

- Frontend: http://localhost:5173
- Backend: http://localhost:3333
- Login padrão: `admin@admin.com` / `admin123`

### Comandos úteis

```bash
# Rodar testes
cd backend && npm test

# Testes com cobertura
cd backend && npm run test:coverage

# Visualizar banco local
cd backend && npm run studio

# Build de produção
cd backend && npm run build
cd frontend && npm run build
```

---

## 🔐 Variáveis de ambiente

| Variável | Descrição | Exemplo | Obrigatória |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | Connection string do banco | `postgresql://user:pass@host:5432/db` | Sim |
| `DIRECT_URL` | URL direta para Prisma (Supabase) | `postgresql://...` | Apenas prod |
| `JWT_SECRET` | Chave de assinatura JWT | `minha-chave-secreta-forte` | Sim |
| `PORT` | Porta do servidor Express | `3333` | Não (default: 3333) |
| `ALLOWED_ORIGINS` | Origens CORS permitidas | `http://localhost:5173` | Não |
| `NODE_ENV` | Ambiente de execução | `development` | Não |
| `OPENAI_API_KEY` | Chave da API OpenAI | `sk-...` | Apenas para IA |
| `ADMIN_DEFAULT_PASSWORD` | Senha do admin no seed | `admin123` | Não |

Para desenvolvimento local, o `npm run setup` gera automaticamente um `.env.local` funcional com SQLite — nenhuma configuração manual necessária.

---

## 📡 Endpoints principais

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/login` | Autenticação (retorna JWT) | Público |
| GET | `/users` | Listar usuários | GAME_MASTER |
| POST | `/users` | Criar usuário | GAME_MASTER |
| POST | `/users/bulk` | Criação em lote | GAME_MASTER |
| GET | `/rounds` | Listar rodadas | GAME_MASTER, PLAYER |
| POST | `/rounds` | Criar nova rodada | GAME_MASTER |
| PATCH | `/rounds/:id/close` | Fechar e processar rodada | GAME_MASTER |
| POST | `/rounds/:id/config` | Submeter decisões da rodada | PLAYER |
| GET | `/rounds/:id/results` | Resultados financeiros | GAME_MASTER, PLAYER |
| GET | `/simulation/ranking` | Ranking geral | GAME_MASTER, PLAYER |
| POST | `/simulation/preview` | Preview de impacto financeiro | PLAYER |
| GET | `/stores/my` | Loja do jogador | PLAYER |

---

## 🧪 Testes

```bash
cd backend && npm test
```

**Estratégia:**
- **Unitários:** Motor financeiro (DRE), middlewares de auth/role, serviço de ranking — testam lógica pura sem banco
- **Integração:** Fluxo completo de rodadas e simulação via supertest — validam controllers + services + banco em memória

**Framework:** Jest 30 + ts-jest + supertest + jest-mock-extended

---

## 🗺️ Roadmap

- [x] CRUD de usuários com roles (GAME_MASTER, PLAYER, OBSERVER)
- [x] Sistema de squads e lojas
- [x] Motor de cálculo financeiro (DRE completo)
- [x] Rodadas com timer e processamento automático
- [x] Decisões por produto (margem + volume)
- [x] Investimentos CAPEX (PDVs, segurança, self-checkout)
- [x] Ranking competitivo entre squads
- [x] Integração OpenAI para relatórios analíticos
- [x] Sistema de tutoriais in-app
- [x] Migração completa JS → TypeScript
- [ ] Refresh token com revogação
- [ ] Dockerfile + docker-compose para deploy containerizado
- [ ] CI/CD com GitHub Actions
- [ ] Testes E2E no frontend
- [ ] Deploy em ambiente cloud com URL pública

---

## 📚 Aprendizados

- Aprendi que separar o motor financeiro como pure function no service layer paga dividendos enormes em testabilidade — consegui cobrir 100% dos cenários de DRE sem subir banco.

- Entendi na prática o custo de manter dois schemas Prisma (prod/local): funciona bem para onboarding rápido, mas exige disciplina para manter sincronizados. Em um próximo projeto, usaria Docker Compose com PostgreSQL local.

- Implementar RBAC com middleware chain no Express me ensinou a pensar em autorização como composição — `authenticate → authorize(['GAME_MASTER']) → controller` é legível e extensível.

- A migração de JavaScript para TypeScript no meio do projeto mostrou por que começar tipado desde o dia zero é mais barato. Refatorei controllers inteiros por causa de tipos implícitos que escondiam bugs.

- Integrar OpenAI para relatórios me forçou a tratar a feature como opcional (graceful degradation) — se a API key não existe ou a chamada falha, o sistema continua funcionando sem o relatório de IA.

- Modelar o DRE com Decimal no Prisma (18,2) em vez de Float evitou erros de arredondamento que apareceriam em cálculos financeiros acumulados ao longo de múltiplas rodadas.

---

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👤 Autor

**Gabriel C. Novaes**

- [LinkedIn](https://www.linkedin.com/in/gabrielhcnovaes/)
- [GitHub](https://github.com/GabrielCNovaesDev)
