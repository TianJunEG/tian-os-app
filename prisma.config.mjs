// Prisma 7 configuration (replaces the `url`/`directUrl` that used to live in
// the schema's datasource block). Used by the Prisma CLI (generate, migrate,
// studio). The application's *runtime* connection comes from the driver adapter
// in services/db/prismaClient.js, not from here.
//
// ESM (.mjs) so it loads in this plain-JS project without a TypeScript step.
// dotenv is imported explicitly because Prisma 7 does not auto-load .env.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
    // Direct (non-pooled) connection for migrations when DATABASE_URL is pooled.
    // Optional — omit if not set (e.g. in CI where generate needs no real DB).
    ...(process.env.DATABASE_DIRECT_URL ? { directUrl: process.env.DATABASE_DIRECT_URL } : {}),
  },
});
