/**
 * Script para consultar o banco de dados Neon
 * Uso: node scripts/query-db.js "SELECT * FROM User"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function queryDatabase(sql) {
  try {
    const result = await prisma.$queryRawUnsafe(sql);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Erro:', error.message);
    throw error;
  }
}

async function listTables() {
  return queryDatabase(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
}

async function describeTable(tableName) {
  return queryDatabase(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = '${tableName}'
    ORDER BY ordinal_position
  `);
}

async function countRows(tableName) {
  return queryDatabase(`SELECT COUNT(*) as count FROM "${tableName}"`);
}

// Main
const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  switch (command) {
    case 'tables':
      console.log('📋 Tabelas do banco:\n');
      await listTables();
      break;
    case 'describe':
      if (!arg) {
        console.log('Uso: node scripts/query-db.js describe <tabela>');
        process.exit(1);
      }
      console.log(`📊 Estrutura da tabela "${arg}":\n`);
      await describeTable(arg);
      break;
    case 'count':
      if (!arg) {
        console.log('Uso: node scripts/query-db.js count <tabela>');
        process.exit(1);
      }
      console.log(`📈 Total de registros em "${arg}":\n`);
      await countRows(arg);
      break;
    case 'query':
      if (!arg) {
        console.log('Uso: node scripts/query-db.js query "<SQL>"');
        process.exit(1);
      }
      console.log(`🔍 Resultado:\n`);
      await queryDatabase(arg);
      break;
    default:
      console.log(`
🔧 Script de consulta ao banco Neon

Uso:
  node scripts/query-db.js tables              - Listar todas as tabelas
  node scripts/query-db.js describe <tabela>   - Ver estrutura de uma tabela
  node scripts/query-db.js count <tabela>      - Contar registros
  node scripts/query-db.js query "<SQL>"       - Executar SQL customizado
      `);
  }
}

main()
  .finally(() => prisma.$disconnect());
