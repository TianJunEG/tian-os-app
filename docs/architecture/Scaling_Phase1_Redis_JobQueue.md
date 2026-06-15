# Scaling Phase 1 — Redis + Background Job Queue

**Status:** In progress — WS1 (Redis client), WS2 (distributed rate limiter), WS3 (queue + worker, `paper-analysis` job type), WS5 (web graceful shutdown), and WS6 (managed Redis + worker wiring in `render.yaml`) landed. WS3 `worksheet-generate` job type also landed (photo → worker via 202 + poll; image passed as base64 in the job, decoupled from worksheet-photo storage; frontend polls `generationStatus`). Remaining: WS3 `mark-answers`. **Render note:** the worker's disk blocker for paper-analysis is now RESOLVED — Phase 2 moved those uploads to R2, so the worker can be enabled in production once R2 is configured (see [Scaling_Phase2_ObjectStorage.md](Scaling_Phase2_ObjectStorage.md)). The WS4 caveat below is superseded for paper-analysis.
**Author:** generated with Claude Code
**Date:** 2026-06-15
**Depends on:** Phase 0 (PR #176 — practice-session persistence + AI retry/backoff)
**Precedes:** Phase 2 (object storage for `/uploads`, Mongo pool tuning, web-tier horizontal scaling)

---

## 1. Why

TianOS today is a **single-process, single-instance Express monolith**. A concurrency audit found it is solid for one classroom but cannot scale to school-wide concurrent load. Two classes of problem:

1. **Process-memory state that breaks across instances** — the rate limiter is a per-process `Map`, so adding instances makes limits ineffective. (Phase 0 already fixed the equivalent bug for practice sessions.)
2. **Event-loop-blocking work on the request path** — OCR (Tesseract), PDF/DOCX parsing, and multi-second AI calls all run inline in the single Node process. A handful of concurrent heavy requests stall *every* other in-flight request.

Phase 1 removes both: it introduces **Redis** as shared state, and a **background worker** that runs the heavy operations off the web process.

### What breaks first today (from the audit)

1. The Node event loop, via in-process OCR/PDF/DOCX ([`services/mathpath/ocrService.js:43`](../../services/mathpath/ocrService.js)) — bites at low tens of concurrent heavy ops.
2. AI provider latency stacking on the request path ([`utils/aiService.js`](../../utils/aiService.js)).
3. The in-memory rate limiter ([`middleware/rateLimiter.js:8`](../../middleware/rateLimiter.js)) becoming ineffective across instances.

---

## 2. Goal & boundary

**Goal:** make the app horizontally scalable to school-wide load by (a) moving scale-blocking state into Redis and (b) moving event-loop-blocking operations into a background worker, behind a feature flag so the synchronous path remains a fallback.

**In scope**
- Redis client module + managed Redis in deployment.
- Distributed rate limiter (replaces the in-memory `Map`).
- BullMQ job queue + a separate worker process.
- Three job types: `paper-analysis`, `worksheet-generate`, `mark-answers`.
- **Async `202 + poll`** API contract for those three endpoints.
- Graceful shutdown on web and worker.
- Deployment: worker service + Redis on Render/Railway.

**Out of scope (→ Phase 2)**
- Object storage (S3/R2) for `/uploads`. **Note:** the local upload disk still pins the *web* tier to one instance. Phase 1 makes the heavy work scale (via the worker) and makes shared state correct (via Redis), but multi-replica *web* requires Phase 2. The worker absorbing all heavy CPU is itself a large stability win at one web replica.
- Mongo connection-pool tuning and read replicas.
- Migrating session/auth to Redis (already stateless JWT — no change needed).

---

## 3. Decisions (agreed)

| Decision | Choice | Rationale |
|---|---|---|
| Offloaded-endpoint contract | **Async `202 Accepted` + client polls a status endpoint** | Biggest concurrency win — the web process holds no long-lived connections during 5–60s jobs. |
| Rollout | **Feature-flagged** (`JOB_QUEUE_ENABLED`) | Ship infra without forcing cutover; enable per-environment; instant rollback. |
| Queue library | **BullMQ** (Redis-backed) | Mature, supports concurrency limits, retries/backoff, delayed jobs, graceful close. |
| Redis client | **ioredis** | BullMQ's recommended client; also drives the rate limiter. |

---

## 4. Architecture

```
                 ┌─────────────────────────────┐
   HTTP clients  │   WEB process (Express)      │
  ───────────────▶  - routes, auth, fast reads  │
                 │  - rate limiter (Redis)       │
                 │  - ENQUEUE heavy jobs ────────┼───┐
                 │  - return 202 + jobId/resId   │   │
                 └──────────────┬────────────────┘   │
                                │ status reads        │ enqueue
                                ▼                     ▼
                       ┌──────────────┐      ┌──────────────────┐
                       │   MongoDB    │◀─────│  Redis (BullMQ +  │
                       │ job/resource │      │  rate-limit keys) │
                       │ status docs  │      └─────────┬────────┘
                       └──────▲───────┘                │ dequeue
                              │ write status           ▼
                              │            ┌───────────────────────────┐
                              └────────────│  WORKER process            │
                                           │  - OCR / paper pipeline    │
                                           │  - AI worksheet gen        │
                                           │  - AI marking              │
                                           │  - concurrency-capped      │
                                           └───────────────────────────┘
```

- The **web** process never runs OCR/AI; it enqueues and returns immediately.
- The **worker** imports the *same* service functions — no business-logic duplication.
- **Job/result status lives in MongoDB** (the existing pattern for paper analysis), so clients poll a normal REST endpoint; Redis holds only the queue and rate-limit counters.

---

## 5. Workstreams

### WS1 — Redis client (keystone) · S
- **New:** `config/redis.js` — single `ioredis` instance from `REDIS_URL` (default `redis://localhost:6379`), with `connect`/`error`/`reconnecting` logging.
- Add `ioredis` + `bullmq` to `package.json` (Node already `>=22.3.0`).
- Reused by WS2 and WS3.

### WS2 — Distributed rate limiter · S
- Rewrite the counting in [`middleware/rateLimiter.js`](../../middleware/rateLimiter.js) to use Redis (`INCR`+`EXPIRE` fixed-window, or a sliding-window Lua script) keyed `ratelimit:{ip}:{path}`.
- **Preserve the export shape** (`rateLimit(max, windowMs)`, `authRateLimit`, `apiRateLimit`, `strictRateLimit`) and all env knobs (`API_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`, `*_WINDOW_MS`, `QA_DISABLE_RATE_LIMIT`) so [`server.js:141`](../../server.js) is untouched.
- **Graceful degradation:** if Redis is unavailable, fall back to the current in-memory behavior — the limiter must never take the site down.
- Keep the `X-RateLimit-*` response headers.

### WS3 — Queue + worker · L
- **New:** `config/queue.js` — BullMQ `Queue` per job type, sharing the WS1 connection.
- **New:** `workers/index.js` — worker entrypoint; one BullMQ `Worker` per queue; concurrency from `WORKER_CONCURRENCY` (default 2). Connects to Mongo (reuse [`config/db.js`](../../config/db.js)).
- **New:** `workers/paperAnalysisWorker.js`, `workers/worksheetGenerateWorker.js`, `workers/markAnswersWorker.js` — thin handlers that call existing services:
  - `paper-analysis` → [`runPaperAnalysisPipeline`](../../services/mathpath/paperAnalysisPipeline.js)
  - `worksheet-generate` → [`analyzeAndGenerateWorksheet`](../../utils/aiService.js)
  - `mark-answers` → [`markAnswers`](../../utils/aiService.js)
- Job options: `attempts: 3`, exponential backoff, `removeOnComplete`/`removeOnFail` retention caps. (BullMQ retry complements the Phase 0 in-call AI retry: in-call handles brief 429s within one attempt; queue-level handles a whole job failing.)
- **New script:** `"worker": "node workers/index.js"` in `package.json`.

### WS4 — Async API contract · M
For each offloaded endpoint, gate on `JOB_QUEUE_ENABLED`:
- **`paper-analysis`** — *easiest*; [`routes/mathpathPaperAnalysis.js`](../../routes/mathpathPaperAnalysis.js) already has a DB status machine (`uploaded→processing→ocr_complete→…→needs_review`) and the client already polls. Change: enqueue instead of awaiting the pipeline; return `202 { analysisId }`.
- **`worksheet-generate`** — [`routes/worksheets.js:51`](../../routes/worksheets.js): create the worksheet doc in a `pending` state, enqueue, return `202 { worksheetId }`. Worker fills it in and flips status to `ready`/`failed`. **Add a polling endpoint** `GET /api/worksheets/:id/status` (+ frontend polling).
- **`mark-answers`** — same pattern: `202` + status flip + poll.
- When the flag is **off**, the existing synchronous code path runs unchanged.
- **Payload note:** enqueue job data by **reference, not value** where possible — store the uploaded file via the existing `saveUpload`/disk path and pass the `storageKey`, not the raw buffer/base64, to keep Redis payloads small. (This is also why Phase 2 object storage matters: a separate worker service must read uploads from shared storage. On Render that means Phase 2 must land before the worker can be enabled — see the corrected caveat below.)

> ⚠️ **Cross-instance file access caveat (corrected).** The worker reads uploaded files from their on-disk `storageKey`. **Render persistent disks attach to exactly one service**, so a separate `tian-os-worker` service *cannot* mount the web service's `uploads` disk — there is no "co-locate two services on one disk" option on Render. Consequences:
> - **Locally** (`npm start` + `npm run worker` + local Redis on one machine) the queue path works end-to-end because both processes share the filesystem. This is how WS3 is tested.
> - **On Render**, the worker has no access to uploads, so `JOB_QUEUE_ENABLED` must stay **off** there (web runs the pipeline inline) **until Phase 2 moves uploads to object storage (S3/R2)**. After Phase 2 the worker reads from object storage and the flag can be switched on.
>
> The worker service + managed Redis are defined in `render.yaml` now so the wiring is ready; only the flag flip waits on Phase 2. The distributed rate limiter (WS2) needs no disk and is deployable immediately.

### WS5 — Graceful shutdown · S
- [`server.js`](../../server.js) has no signal handler. Add `process.on('SIGTERM'|'SIGINT')` → `server.close()` to drain in-flight HTTP requests, then close Mongo/Redis.
- `workers/index.js` → `worker.close()` to let in-flight jobs finish before exit.
- Required so rolling deploys and scale-down don't drop work.
- (Optional polish) add connection retry/backoff to [`config/db.js`](../../config/db.js).

### WS6 — Deployment · S
- Add a **managed Redis** instance (Render Key Value / Railway Redis plugin).
- **Render** ([`render.yaml`](../../render.yaml)): added a managed `redis` service, wired `REDIS_URL` into both web and worker, and added a `worker` service (`startCommand: npm run worker`, no disk, no ingress). `JOB_QUEUE_ENABLED` is dashboard-set and stays off on Render until Phase 2 (per the WS4 caveat).
- **Railway** ([`railway.json`](../../railway.json)): `railway.json` describes a single service and supports no comments, so it is left as the web service. Add the Redis plugin and a second service with `startCommand: npm run worker` via the Railway dashboard (same `JOB_QUEUE_ENABLED`/object-storage caveat applies).
- New env vars (below) added to both blueprints; `JOB_QUEUE_ENABLED` defaults to `false` so deploying the infra does not change behavior until explicitly switched on per environment.

---

## 6. New environment variables

| Var | Default | Used by |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | redis client (rate limiter, queue) |
| `JOB_QUEUE_ENABLED` | `false` | web routes (enqueue vs. synchronous) |
| `WORKER_CONCURRENCY` | `2` | worker process |

(Phase 0's `WORKSHEET_AI_MAX_RETRIES` and existing `*_RATE_LIMIT_*` knobs are unchanged.)

---

## 7. New / changed files

**New**
- `config/redis.js`
- `config/queue.js`
- `workers/index.js`
- `workers/paperAnalysisWorker.js`
- `workers/worksheetGenerateWorker.js`
- `workers/markAnswersWorker.js`

**Changed**
- `middleware/rateLimiter.js` (Redis-backed counting; same exports)
- `routes/mathpathPaperAnalysis.js`, `routes/worksheets.js` (+ marking route) — `202` enqueue path under flag
- `server.js` (graceful shutdown)
- `config/db.js` (optional retry)
- `package.json` (`ioredis`, `bullmq`, `worker` script)
- `render.yaml`, `railway.json` (worker service + Redis + env)

---

## 8. Sequencing

1. **WS1** Redis client + deps (nothing depends on flag yet).
2. **WS2** Distributed rate limiter (independently shippable, immediate multi-instance benefit, low risk).
3. **WS3** Queue + worker scaffold with `paper-analysis` first (it already has status + polling).
4. **WS4** Flip `paper-analysis` to `202` under flag; validate end-to-end with Redis up.
5. Repeat WS3/WS4 for `worksheet-generate`, then `mark-answers` (these need new status endpoints + frontend polling).
6. **WS5** Graceful shutdown.
7. **WS6** Deployment blueprints + managed Redis; enable flag in staging, then production.

Each step is a separate PR; the app stays releasable throughout (flag off = today's behavior).

---

## 9. Testing

- **Rate limiter:** unit-test the Redis path with a mocked/ephemeral Redis; assert the in-memory fallback triggers when the client is down. Assert `X-RateLimit-*` headers unchanged.
- **Queue:** unit-test each worker handler by invoking it with a fake job and a connected test Mongo (mirror the existing `aiService`/`questionPatternTrainer` test style — provider SDK already mocked).
- **Contract:** integration test that `JOB_QUEUE_ENABLED=1` returns `202` + a pollable id, and the status doc reaches `ready`/`failed`.
- **Regression:** with the flag **off**, all existing route/service tests must pass unchanged.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Redis outage breaks limiter/queue | Limiter degrades to in-memory; enqueue failure falls back to synchronous path (flag-guarded) so requests still succeed, just slower. |
| Worker can't read uploads (separate host) | Phase 1 co-locates worker with web disk; full split deferred to Phase 2 object storage. Documented in WS4 caveat. |
| Frontend not ready for polling on worksheet/marking | Land `paper-analysis` first (already polls); add polling UI before enabling the flag for the other two. |
| Redis payload bloat from base64 images | Pass `storageKey` references, not raw buffers, in job data. |
| Lost jobs on deploy | Graceful shutdown (WS5) + BullMQ retries/attempts. |

---

## 11. Definition of done

- Redis-backed rate limiter live, with verified in-memory fallback.
- Worker process running the three job types with concurrency caps and retries.
- The three endpoints return `202 + poll` when `JOB_QUEUE_ENABLED=1`, and behave exactly as today when off.
- Graceful shutdown on web and worker.
- Worker + Redis defined in Render/Railway blueprints; flag enabled in staging then production.
- Web process no longer runs OCR/PDF/DOCX/AI on its event loop under the flag.

**After Phase 1, the remaining blocker to multi-replica *web* is Phase 2: move `/uploads` to object storage.**
