/**
 * Script para consultar o banco de dados Neon
 * Uso: npx tsx scripts/query-db.ts tables
 *      npx tsx scripts/query-db.ts describe User
 *      npx tsx scripts/query-db.ts count User
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function queryDatabase(sql: string): Promise<unknown> {
  try {
    const result = await prisma.$queryRawUnsafe(sql);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Erro:', error instanceof Error ? error.message : error);
    throw error;
  }
}

async function listTables(): Promise<unknown> {
  return queryDatabase(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
}

async function describeTable(tableName: string): Promise<unknown> {
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

async function countRows(tableName: string): Promise<unknown> {
  return queryDatabase(`SELECT COUNT(*) as count FROM "${tableName}"`);
}

// Main
const command = process.argv[2];
const arg = process.argv[3];

async function main(): Promise<void> {
  switch (command) {
    case 'tables':
      console.log('📋 Tabelas do banco:\n');
      await listTables();
      break;
    case 'describe':
      if (!arg) {
        console.log('Uso: npx tsx scripts/query-db.ts describe <tabela>');
        process.exit(1);
      }
      console.log(`📊 Estrutura da tabela "${arg}":\n`);
      await describeTable(arg);
      break;
    case 'count':
      if (!arg) {
        console.log('Uso: npx tsx scripts/query-db.ts count <tabela>');
        process.exit(1);
      }
      console.log(`📈 Total de registros em "${arg}":\n`);
      await countRows(arg);
      break;
    case 'query':
      if (!arg) {
        console.log('Uso: npx tsx scripts/query-db.ts query "<SQL>"');
        process.exit(1);
      }
      console.log(`🔍 Resultado:\n`);
      await queryDatabase(arg);
      break;
    default:
      console.log(`
🔧 Script de consulta ao banco Neon

Uso:
  npx tsx scripts/query-db.ts tables              - Listar todas as tabelas
  npx tsx scripts/query-db.ts describe <tabela>   - Ver estrutura de uma tabela
  npx tsx scripts/query-db.ts count <tabela>      - Contar registros
  npx tsx scripts/query-db.ts query "<SQL>"        - Executar SQL customizado
      `);
  }
}

main()
  .finally(() => prisma.$disconnect());
