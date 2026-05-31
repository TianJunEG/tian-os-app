import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__tianOsPrisma
  || new PrismaClient({
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
