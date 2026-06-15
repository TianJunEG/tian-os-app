# Scaling Phase 2 — Object Storage for Uploads

**Status:** In progress — the **critical path (paper-analysis uploads → R2)** has landed, which unblocks the background worker in production. Remaining: migrate the other upload categories so the *web* tier can run multiple replicas.
**Depends on:** Phase 1 (Redis + job queue + worker), PR #176.
**Goal:** move uploaded files off the per-instance local disk into shared object storage (Cloudflare R2) so (a) the background worker can read uploads it never received, and (b) the web tier can scale to multiple replicas without a single-instance disk.

---

## Why this is the real unlock

Phase 1 added a separate worker process, but on Render a persistent disk attaches to exactly one service, so the worker couldn't read the web service's `uploads/` disk. Putting uploads in R2 removes that coupling: web and worker both reach the same bytes by opaque key.

---

## What landed (critical path)

A storage facade that writes/reads to R2 when configured, else local disk — same optional-dependency pattern as Redis/queue.

- **`services/storage/r2.js`** — generalized from audio-only: added `isConfigured()`, `putObject(key, body, contentType)`, `getObjectBuffer(key)`; `putAudioObject` is now a thin alias. Still lazy-loads the AWS SDK.
- **`services/storage/objectStore.js`** — facade:
  - `putUpload({ namespace, filename, buffer, contentType })` → `{ storageKey, storageProvider, fileUrl }`. R2: opaque key, `fileUrl: ''`. Disk: absolute path, `/uploads/...` URL.
  - `getUploadBuffer({ storageKey, storageProvider })` → `Buffer | null`. Provider is authoritative; legacy rows without it are inferred (absolute path → disk; relative key + R2 configured → R2). Errors resolve to `null`.
- **`routes/mathpathPaperAnalysis.js`** — `saveUpload` now calls `putUpload` (namespace `mathpath-paper-analysis`). No other route logic changed; the worker job payload was already references-only.
- **`services/mathpath/paperAnalysisPipeline.js`** — `readBufferFromAnalysis` now calls `getUploadBuffer`, so OCR reads from R2 or disk per the stored provider.
- **`models/mathpath/PaperAnalysis.js`** — added `storageProvider` (`'disk'` default, `'r2'` when stored in object storage).
- **`render.yaml`** — R2 vars wired to web + worker; worker no longer needs the uploads disk; `JOB_QUEUE_ENABLED` safe to enable once R2 is set.

Tests: `utils/objectStore.test.js` (R2 path, disk path, legacy inference, missing-key). Full suite green (809).

### Why the frontend didn't break
The frontend does not consume the paper-analysis `fileUrl` (only Resources and working-session images use `fileUrl`), so moving paper bytes to private R2 (no public URL) changes nothing the UI renders.

---

## Enablement (production)

1. Provision R2 + bucket; set `R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET/ENDPOINT` on **both** web and worker.
2. New uploads now go to R2 automatically. (Existing disk rows keep working via provider inference / absolute paths — see migration below if you need them in R2.)
3. Set `JOB_QUEUE_ENABLED=1` to route paper analysis through the worker.

---

## Remaining work (other categories → multi-replica web)

These still write to the local disk and are served via `express.static('/uploads')`. Each keeps the **web** tier pinned to one replica until migrated. Migrate by routing their save/read through the facade (same pattern):

| Category | Write site | DB field | Frontend reads it? | Serving change needed |
|---|---|---|---|---|
| Worksheet source photos | `middleware/uploadWorksheet.js` + `routes/worksheets.js` (`fs.readFile`) | `Worksheet.sourceImageUrl` | yes (history view) | signed-URL endpoint |
| Resources (PDF/img) | `middleware/uploadResource.js` | `Resource.fileUrl` | yes (download) | signed-URL or public bucket |
| Tutor credentials | `middleware/upload.js` | `TutorProfile.credentialsUrl` | admin view | signed-URL (private) |
| Working-session images | `routes/mathpathWorking.js` (`writeWorkingFiles`) | `MathPathWorkingSession.fileUrls` | yes | signed-URL endpoint |
| LifeLab evidence | `routes/lifelab.js` (diskStorage) | `LifeLabSubmission.evidenceUrl` | yes (gallery) | signed-URL or public |
| User avatars | (inferred) | `User.avatar` | yes | signed-URL or public |

**Serving model decision (for categories the UI displays):** R2 objects are private. Either (a) add a small authenticated endpoint per category that 302-redirects to a short-lived signed URL (mirrors how recordings already work), or (b) use a public R2 bucket + CDN for non-sensitive assets (resources, lifelab) and signed URLs for sensitive ones (credentials). Recommend signed-URL endpoints for parity and access control.

**Data migration (existing disk rows):** optional one-off script to copy current `uploads/**` to R2 and flip `storageProvider`/keys. Until run, legacy rows are still readable from disk (so don't delete the disk until migrated). Not required to enable the worker for *new* paper-analysis uploads.

**Once all categories are migrated:** drop the `disk:` mount from the web service in `render.yaml` and raise web replicas.
