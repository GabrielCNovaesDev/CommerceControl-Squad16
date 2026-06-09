const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  console.log('.env.local ja existe, pulando criacao.');
  process.exit(0);
}

const content = [
  '# Caminho relativo ao diretório do schema (prisma/)',
  'DATABASE_URL="file:./local.db"',
  'JWT_SECRET="local_dev_secret_key_insecure_do_not_use_in_production"',
  'PORT=3333',
  'NODE_ENV=development',
  'ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174"',
  ''
].join('\n');

fs.writeFileSync(envPath, content);
console.log('.env.local criado com valores padrao para desenvolvimento local.');
