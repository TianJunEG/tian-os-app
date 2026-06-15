// Prisma 7: the client is generated as TypeScript into ../../generated/prisma
// and bundled to client.js by `npm run postgres:prisma:generate`
// (prisma generate + esbuild). The DB connection now comes from a driver
// adapter rather than the schema datasource URL.
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.__tianOsPrisma
  || new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__tianOsPrisma = prisma;
}

export async function checkPrismaHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  }
}

export default prisma;
