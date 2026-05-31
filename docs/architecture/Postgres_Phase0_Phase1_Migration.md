# Tian OS MongoDB → PostgreSQL Migration (Phase 0 + Phase 1)

## Scope

This implementation covers only:

- **Phase 0**: PostgreSQL/Prisma scaffolding, env flags, no behavior change.
- **Phase 1**: Reference/static MathPath data model + backfill + parity checks.

Out of scope in this phase:

- Runtime read switch to Postgres
- Live attempts/sessions/mastery migration
- Worksheet runtime migration
- Dashboard query migration
- MongoDB removal

## Runtime Safety

Mongo remains authoritative at runtime.

Use:

- `DB_READ_SOURCE=mongo`
- `DB_DUAL_WRITE=false`
- `DB_PARITY_LOG=false`

## Added Prisma Schema (Phase 1 tables)

- `subjects`
- `topics`
- `skills`
- `curriculum_skill_mappings`
- `skill_prerequisites`
- `question_families`

The schema supports:

- universal skills (`frameworkSkillId` and `universalSkillSlug`)
- country/curriculum-specific mappings
- prerequisites as edges
- question families with metadata JSON

## Commands

From repo root:

```bash
npm install
npm run postgres:prisma:generate
npm run postgres:health
npm run postgres:phase1:backfill
npm run postgres:phase1:parity
```

Optional migration command (once DB is prepared):

```bash
npx prisma migrate dev --name phase1_reference_schema
```

## Backfill Script

`scripts/postgres/backfillMathPathReferenceData.js`

Backfills idempotently:

- math subject / fractions topic
- universal Fractions skills (F001–F026)
- SG curriculum mappings (Primary + available Sec 1 G1 rows)
- skill prerequisites
- fraction question families

Sources:

- `frontend/src/mathpath/curriculum/fractionUniversalSkills.js`
- `frontend/src/mathpath/curriculum/fractionCurriculumMappings.js`
- `frontend/src/mathpath/fractions/fractionQuestionFamilies.js`
- optional Mongo enrichment (`Subject`, `Topic`, `Skill`) when Mongo is reachable

## Parity Check Script

`scripts/postgres/checkMathPathReferenceParity.js`

Checks:

- F001–F026 skill existence
- `frameworkSkillId` + `universalSkillSlug`
- pathway order parity
- prerequisite edge parity
- SG Primary mapping parity expectations
- question family parity and valid skill links

Outputs JSON with totals, missing references, and `parityPass`.

## Notes

- This phase intentionally does **not** alter existing routes/services to read Postgres.
- Existing Mongo tests/flows remain unchanged.
