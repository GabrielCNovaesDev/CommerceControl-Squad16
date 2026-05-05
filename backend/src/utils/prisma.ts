import path from 'path';

const dbUrl = process.env.DATABASE_URL ?? '';
const isLocal = dbUrl.startsWith('file:');
const clientPath = isLocal
  ? path.join(process.cwd(), 'node_modules', '.prisma', 'client-local')
  : '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require(clientPath);

const prisma = new PrismaClient();

export default prisma;

/** Converts a Prisma Decimal or plain number to a JS number. */
export function toNum(value: { toNumber(): number } | number): number {
  if (typeof value === 'number') return value;
  return value.toNumber();
}
