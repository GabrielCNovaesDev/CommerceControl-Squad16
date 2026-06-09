# Variáveis de Ambiente - CommerceControl

## Variáveis Atuais (Supabase + Render)

### DATABASE_URL
- **Descrição:** Connection string do PostgreSQL
- **Formato:** `postgresql://USUARIO:SENHA@HOST:PORTA/BANCO`
- **Valores atuais:**
  - Produção (Supabase): `postgresql://postgres:V7kP9xLm%232nQ8wZr%245tB3jK6yA1cF0eH4d@db.rwhuydthwlufgshuwgot.supabase.co:6543/postgres`

### DIRECT_URL
- **Descrição:** Connection string direta (sem pooling) para migrations
- **Formato:** `postgresql://USUARIO:SENHA@HOST:5432/BANCO`
- **Valores atuais:**
  - Produção (Supabase): `postgresql://postgres:V7kP9xLm%232nQ8wZr%245tB3jK6yA1cF0eH4d@db.rwhuydthwlufgshuwgot.supabase.co:5432/postgres`

### JWT_SECRET
- **Descrição:** Chave secreta para assinar tokens JWT (64 caracteres)
- **Valor atual (produção):**
  ```
  79a4aa055f12c61058035353258187bfb20030c6a320044e489af21157f557e42653f71d67f16731061d50de0d41695f284fadacb34a1a3cae11a825b819c61a
  ```
- **⚠️ IMPORTANTE:** Gerar nova chave para produção

### PORT
- **Descrição:** Porta do servidor Express
- **Valor padrão:** `3333`

### NODE_ENV
- **Descrição:** Ambiente de execução
- **Valores:** `development` | `production` | `test`

### ALLOWED_ORIGINS
- **Descrição:** URLs permitidas pelo CORS (separadas por vírgula)
- **Valor produção:** `https://commercecontrol.vercel.app,http://localhost:5173`

### ADMIN_DEFAULT_PASSWORD
- **Descrição:** Senha do admin padrão criado automaticamente
- **Valor produção:** `Adm1n#S1mul@dor2024!`

### OPENAI_API_KEY
- **Descrição:** Chave da API OpenAI para relatórios de IA
- **Valor atual:** `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`

---

## Variáveis para Migração (Neon + Next.js)

### Variáveis Obrigatórias (Next.js)
```
DATABASE_URL=postgresql://usuario:senha@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/neon_db?sslmode=require
JWT_SECRET=<gerar nova chave>
NEXTAUTH_SECRET=<gerar nova chave>
NEXTAUTH_URL=https://seu-dominio.vercel.app
OPENAI_API_KEY=<sua chave openai>
```

### Variáveis Opcionais
```
NODE_ENV=production
ADMIN_DEFAULT_PASSWORD=<sua senha admin>
ALLOWED_ORIGINS=https://seu-dominio.vercel.app,https://seu-dominio-git-branch.vercel.app
```

---

## Como gerar novas chaves

### JWT_SECRET ou NEXTAUTH_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Para Neon (Connection String)
1. Acesse https://neon.tech
2. Crie novo projeto
3. Copie a connection string da dashboard
4. Adicione `?sslmode=require` no final

---

## Arquivos .env do projeto atual

| Arquivo | Uso |
|---------|-----|
| `.env.example` | Template base |
| `.env.local` | Desenvolvimento local |
| `.env.production` | Configurações de produção |
| `.env.remote` | Configurações remotas (Supabase) |
| `.env.supabase` | Configurações Supabase |