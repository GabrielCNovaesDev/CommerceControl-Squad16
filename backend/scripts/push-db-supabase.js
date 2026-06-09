// Script para criar banco no Supabase
require('dotenv/config');

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Carrega variáveis do .env.supabase
require('dotenv').config({ path: '.env.supabase' });

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DIRECT_URL:', process.env.DIRECT_URL);

// Roda o prisma db push
try {
  console.log('\nCriando banco no Supabase...');
  execSync('npx prisma db push --schema=prisma/schema.prisma', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
    }
  });
  console.log('\n✅ Banco criado com sucesso!');
} catch (error) {
  console.error('\n❌ Erro ao criar banco:', error.message);
  process.exit(1);
}
