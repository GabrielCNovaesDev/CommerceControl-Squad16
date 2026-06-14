# Tutorial de Inicialização — CommerceControl Squad 16

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) versão 18 ou superior
- [Git](https://git-scm.com/)

---

## Primeira vez (setup inicial)

Execute estes passos apenas uma vez por máquina.

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd CommerceControl-Squad16
```

### 2. Execute o setup completo

```bash
npm run setup
```

Este comando faz tudo automaticamente:
- Instala as dependências do backend
- Instala as dependências do frontend
- Cria o banco de dados SQLite local (`backend/prisma/local.db`)
- Popula o banco com as credenciais de teste

> **Atenção:** se o comando falhar com erro de política de execução no PowerShell (Windows), abra o terminal como **Administrador** e execute:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> Depois rode `npm run setup` novamente.

---

## Iniciando a aplicação (uso diário)

Com o setup já feito, basta rodar na raiz do projeto:

```bash
npm run dev
```

Isso sobe **backend e frontend simultaneamente** em um único terminal.

| Serviço  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:3333    |

Para encerrar, pressione `Ctrl + C` no terminal.

---

## Credenciais de teste

Estas credenciais são criadas automaticamente pelo setup e **sempre estarão disponíveis**:

| Perfil      | Email                    | Senha       | Role        |
|-------------|--------------------------|-------------|-------------|
| Administrador | `admin@simulador.com`  | `admin123`  | GAME_MASTER |
| Squad Alpha | `alpha@simulador.com`    | `player123` | PLAYER      |
| Squad Beta  | `beta@simulador.com`     | `player123` | PLAYER      |

---

## Sobre o banco de dados local

A aplicação usa **SQLite** em desenvolvimento local e **Neon PostgreSQL** em produção, sem necessidade de Supabase ou qualquer outro serviço externo.

- O arquivo do banco fica em `backend/prisma/local.db`
- Os dados **persistem** entre reinicializações da aplicação
- Em um computador novo, basta rodar `npm run setup` — as credenciais de teste são recriadas automaticamente (sem duplicatas)
- O arquivo `local.db` está no `.gitignore` e **não é versionado** — cada desenvolvedor tem seu próprio banco local

---

## Resetando o banco de dados

Se precisar limpar todos os dados e recomeçar do zero:

```bash
# 1. Delete o arquivo do banco
rm backend/prisma/local.db        # Linux/Mac
del backend\prisma\local.db       # Windows (cmd)

# 2. Recrie o banco com o seed
npm run setup:local --prefix backend
```

---

## Estrutura de scripts disponíveis

| Comando                                    | O que faz                                              |
|--------------------------------------------|--------------------------------------------------------|
| `npm run setup` (raiz)                     | Setup completo: instala deps + cria banco + seed       |
| `npm run dev` (raiz)                       | Sobe backend e frontend juntos                         |
| `npm run dev:local` (backend)              | Sobe apenas o backend com SQLite local                 |
| `npm run dev` (frontend)                   | Sobe apenas o frontend                                 |
| `npm run setup:local` (backend)            | Recria o banco SQLite e roda o seed                    |
| `npm run test` (backend)                   | Roda os testes unitários e de integração               |

---

## Problemas comuns

**Porta já em uso**

Se o backend ou frontend não subirem por conflito de porta, verifique se há outro processo usando as portas 3333 ou 5173:

```bash
# Windows
netstat -ano | findstr :3333
netstat -ano | findstr :5173
```

**Erro "Cannot find module @prisma/client"**

O Prisma Client precisa ser gerado. Rode:

```bash
npm run setup:local --prefix backend
```

**Banco desatualizado após pull de novas features**

Se o schema do banco mudou após um `git pull`, rode novamente:

```bash
npm run setup:local --prefix backend
```
