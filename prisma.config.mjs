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
    // Direct (non-pooled) connection for migrations, if DATABASE_URL is pooled.
    directUrl: env('DATABASE_DIRECT_URL'),
  },
});
