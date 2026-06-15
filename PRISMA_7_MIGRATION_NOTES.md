# Prisma 7 migration — implemented (option 1: esbuild bundle)

The Prisma 5/6 → **7** migration is implemented end-to-end at the code/build
level. The earlier blocker (the v7 generator emits TypeScript-only client source,
and this backend runs raw ESM JS with no build step) is resolved by **option 1**:
bundle the generated client to JS with esbuild.

**Still required before production use:** validate real queries against a
**staging Postgres** (there is no Prisma test coverage and no local DB, so only
generate/bundle/import/construct are verified here — not live queries).

## What changed

- **`prisma` + `@prisma/client` → 7.8.0**, added **`@prisma/adapter-pg` 7.8.0**
  and **`esbuild`** (devDep). `pg` was already present.
- **`prisma/schema.prisma`**
  - Generator: `prisma-client-js` → **`prisma-client`** with required
    `output = "../generated/prisma"`, `runtime = "nodejs"`, `moduleFormat = "esm"`.
  - Datasource reduced to **`provider` only** (v7 disallows `url`/`directUrl`).
- **`prisma.config.mjs`** (new) — holds the connection config the schema used to
  carry (`DATABASE_URL` / `DATABASE_DIRECT_URL`), loaded via `dotenv`. Used by the
  CLI (generate / migrate / studio).
- **`package.json` → `postgres:prisma:generate`** now runs
  `prisma generate` **then** bundles the TS client to `generated/prisma/client.js`
  with esbuild (`--packages=external` keeps `@prisma/client/runtime` external).
- **`services/db/prismaClient.js`** — imports the bundled client and connects
  through the **`PrismaPg`** driver adapter (`DATABASE_URL`).
- **`.gitignore`** — ignores `generated/` (built by `prisma generate`, not committed).

## How the build works

`@prisma/client/runtime` stays external (resolved from `node_modules`); the
relative generated `.ts` files are bundled into a single
`generated/prisma/client.js` (~51 kb) that plain Node ESM imports directly. No
TypeScript toolchain is added to the rest of the backend — only Prisma's
generated vendor code is transpiled.

## Deploy / CI requirement

`generated/` is gitignored, so the build step **must** run before the server
starts (it already had to, for `prisma generate`):

```
npm run postgres:prisma:generate   # prisma generate + esbuild bundle
```

`esbuild` and `prisma` are devDependencies (consistent with the pre-existing
reliance on the `prisma` CLI at build time) — ensure the deploy installs dev
deps before building, then prunes if desired.

## Validation done here

- `npm run postgres:prisma:generate` → generate + bundle succeed (`client.js` 51 kb)
- `services/db/prismaClient.js` imports, constructs with the adapter, exposes
  models, attempts a real `$queryRaw` (fails only because there's no local
  Postgres), and `checkPrismaHealth()` degrades gracefully
- `npx vitest run` → **964 passed (158 files)**

## Not validated here (needs a staging Postgres)

- Real queries through the adapter (the MathPath reference-data reads/writes in
  `scripts/postgres/*` and any runtime Postgres paths)
- Migrations via `prisma.config.mjs` (incl. `directUrl` for pooled connections)

## Recommendation

Merge the safe **Prisma 5→6** PR (#209) if you want to de-risk incrementally, or
review/validate this v7 PR against a staging DB and merge it directly. If both
are open, pick one — they're alternative paths to the same upgrade.
