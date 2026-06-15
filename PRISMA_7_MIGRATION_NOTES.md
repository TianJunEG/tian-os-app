# Prisma 7 migration — DRAFT / NOT MERGEABLE YET

This branch drafts the Prisma 5/6 → **7** migration. The Prisma-layer changes
are done and `prisma generate` succeeds, but there is **one open architectural
decision that blocks completion** (see "Blocker" below). Do not merge until that
is resolved and the runtime is validated against a real Postgres.

## What's done (unambiguous v7 changes)

- **`prisma` + `@prisma/client` → 7.8.0**, added **`@prisma/adapter-pg` 7.8.0**
  (`pg` was already a dependency).
- **`prisma/schema.prisma`**
  - Generator: `prisma-client-js` → **`prisma-client`** with required
    `output = "../generated/prisma"`, plus `runtime = "nodejs"` /
    `moduleFormat = "esm"`.
  - Datasource: `url` / `directUrl` removed — only `provider` is allowed in v7.
- **`prisma.config.mjs`** (new) — holds the connection config the schema used to
  carry (`DATABASE_URL` / `DATABASE_DIRECT_URL`), loaded via `dotenv`. Used by the
  CLI (generate / migrate / studio). `.mjs` so it works in this plain-ESM project.
- **`.gitignore`** — ignores `generated/` (the client is produced by
  `prisma generate`, not committed).
- `prisma generate` → **succeeds**, emitting the client to `generated/prisma`.

## Blocker — the generated client is TypeScript; this backend has no build step

The v7 `prisma-client` generator emits **TypeScript source only** (`client.ts`,
`enums.ts`, … — no `.js`), even with `runtime="nodejs"` / `moduleFormat="esm"`.
This backend runs raw `.js` via Node ESM (`node server.js`) with **no transpile
step**, so it cannot `import` the generated `.ts` client:

```
import('./generated/prisma/client.ts') → ERR_UNKNOWN_FILE_EXTENSION
```

`node --experimental-strip-types` isn't a reliable option: it lands in Node
22.6+, but `package.json` engines pin `>=22.3.0` (and it's experimental).

**So adopting Prisma 7 requires introducing a build/loader step for the backend.**
This is an infrastructure decision, deliberately left to the maintainers rather
than bolted on as part of a dependency bump. Options:

1. **Transpile the generated client** as part of `prisma generate`
   (e.g. an `esbuild`/`tsc` pass over `generated/prisma/**/*.ts` → `.js`), then
   import the compiled output. Smallest blast radius; the rest of the backend
   stays plain JS.
2. **Runtime TS loader** — run the backend under `tsx` (or Node
   `--experimental-strip-types` once on Node ≥22.6). Simplest to wire, adds a
   runtime dependency / Node-version floor.
3. **Adopt a bundler/TS build** for the backend (largest change).

## Remaining work once a build approach is chosen

- Rewire `services/db/prismaClient.js` to the v7 shape:

  ```js
  import { PrismaClient } from '../generated/prisma/client.js'; // compiled output
  import { PrismaPg } from '@prisma/adapter-pg';

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  export const prisma = globalForPrisma.__tianOsPrisma
    || new PrismaClient({ adapter, log: [...] });
  ```

- Ensure `prisma generate` (+ the transpile step) runs in CI/deploy before the
  server starts, since `generated/` is gitignored.
- If `DATABASE_URL` is a pooled connection, confirm migrations use
  `DATABASE_DIRECT_URL` via `prisma.config.mjs`.
- **Validate against a real Postgres**: there is no Prisma test coverage and no
  local DB, so actual queries through the adapter are unverified here.

## Recommendation

Merge the safe **Prisma 5→6** PR (#209) now to clear the maintenance gap, and
schedule this v7 migration as a deliberate piece of work once the backend
build-step decision is made and a staging Postgres is available to validate it.
