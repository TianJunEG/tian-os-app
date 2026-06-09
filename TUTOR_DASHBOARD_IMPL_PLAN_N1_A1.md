# Implementation Plan — Notifications N1 + Lesson Recording A1

**Status:** Ready to build · **Date:** 2026-06-09 · **Companion to:** `TUTOR_DASHBOARD_ARCHITECTURE.md`

This plan turns two spec sections into concrete, ticketed work grounded in the repo's actual conventions:

- **N1** — in-app notification feed + `notify()` primitive (baseline; unblocks "share to parent").
- **A1** — timed ink + audio lesson capture to R2 and a basic parent replay surface.

It is sequenced so N1 lands first (A1's "recording ready" notification depends on it).

---

## 0. What already exists (reuse, don't rebuild)

The exploration of the codebase found that the hard part of A1 — timed vector ink — is **already implemented**:

- `frontend/src/components/learning/drawingUtils.js` exports `drawStroke(ctx, stroke, opts)`, `drawMathStamp(ctx, stroke, opts)`, `pointFromEvent(event, canvas, w, h)`, `beginStrokeData(...)`, `finalizeStroke(stroke)`.
- Stroke objects **already carry timing**: each stroke has an ISO `timestamp` and `pointerType`; each point has `{x, y, t, p?, tx?, ty?}` where `t` is a relative-ms offset. So ink is already a timed stream.
- `frontend/src/components/learning/StrokeReplayPlayer.jsx` already replays strokes sequentially — the basis for the replay surface.
- `WorkingCanvas.jsx` / `FullScreenWorkingMode.jsx` provide the capture surface (pointer events → strokes).

So A1's net-new work is narrow: (1) capture **audio** on the same clock, (2) **persist** strokes+audio as a recording to the backend/R2, (3) a **parent** replay that syncs ink to audio playback. There is currently **no** MediaRecorder/audio usage anywhere.

### Conventions this plan follows (verified)

- **Models:** `import mongoose from 'mongoose'`, `{ timestamps: true, collection: '...' }`, enums exported as `export const X = [...]`, indexes declared, `export default mongoose.model(...)`.
- **Routes:** `const router = express.Router(); router.use(protect, requireWorkspace);` then handlers reading `req.user.id`, `req.workspaceId`, `req.workspaceRole`. Mount in `server.js` via `app.use('/api/...', routes)`.
- **Auth:** `protect` sets `req.user = { id, role }`; `requireWorkspace` requires `X-Workspace-Id` header and sets `req.workspaceId`, `req.workspaceRole`.
- **Frontend API:** named export objects in `frontend/src/services/api.js` (e.g. `tutorAPI`); axios auto-attaches `Authorization` + `X-Workspace-Id`; pass `FormData` for uploads (interceptor strips Content-Type).
- **Frontend routes:** lazy-loaded pages in `frontend/src/App.jsx`, wrapped in `<FeatureGuard feature="...">`.
- **Tests:** `vitest` + `vi.mock()` of `middleware/auth.js`, `middleware/workspace.js`, and models; manual `req/res` helper (no supertest). Pattern in `routes/tutorLessonPrepRoute.test.js`.

---

## Part A — Notifications N1

Goal: a parent in-app notification feed + a reusable `notify()` that tutors' actions can call. N1 writes **in-app only**; weekly email (N2) and premium WhatsApp (N3) layer on later over the same records.

### N1-1 · `Notification` model
**Create:** `models/Notification.js`
```js
import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'lesson_summary', 'recording_ready', 'trial_ending', 'link_request', 'generic',
];
export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'whatsapp'];

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, default: '', trim: true, maxlength: 2000 },
    linkPath: { type: String, default: '', trim: true },     // deep link, e.g. /parent/recordings/:rid
    sourceType: { type: String, default: '', trim: true },   // 'LessonNote' | 'LessonRecording' | ...
    sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    channels: { type: [String], default: ['in_app'] },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'notifications' }
);
notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
```
**Acceptance:** model compiles; index on `(recipientUserId, readAt, createdAt)` present.

### N1-2 · `notify()` service (in-app fan-out only for N1)
**Create:** `services/notifications/notificationService.js`
```js
import Notification from '../../models/Notification.js';

// N1: writes the in-app record. N2/N3 extend this to queue email + push WhatsApp.
export async function notify({ recipientUserId, type, title, body = '', linkPath = '',
  sourceType = '', sourceId = null, channels = ['in_app'] }) {
  if (!recipientUserId || !type || !title) throw new Error('notify: missing required fields');
  return Notification.create({ recipientUserId, type, title, body, linkPath, sourceType, sourceId, channels });
}
```
**Note:** keep the signature stable — N2 (weekly email) and N3 (WhatsApp) add channel dispatch *inside* this function, callers don't change.
**Acceptance:** `notify(...)` creates exactly one document; throws on missing required fields.

### N1-3 · Notifications API routes
**Create:** `routes/notifications.js`
```js
import express from 'express';
import { protect } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();
router.use(protect);   // user-scoped, NOT workspace-scoped (parent feed spans children)

router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const items = await Notification.find({ recipientUserId: req.user.id })
    .sort({ createdAt: -1 }).limit(limit);
  res.json({ notifications: items });
});

router.get('/unread-count', async (req, res) => {
  const count = await Notification.countDocuments({ recipientUserId: req.user.id, readAt: null });
  res.json({ count });
});

router.post('/:id/read', async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientUserId: req.user.id },
    { $set: { readAt: new Date() } }, { new: true });
  if (!n) return res.status(404).json({ error: 'Notification not found.' });
  res.json({ notification: n });
});

export default router;
```
**Modify:** `server.js` — import and `app.use('/api/notifications', notificationsRoutes);`
**Acceptance:** GET returns only the caller's notifications; `:id/read` rejects another user's id with 404 (no leak); unread-count accurate.

### N1-4 · Wire "send lesson summary to parent"
The model already stores `LessonNote.parentSummary` + `parentUpdateStatus ('draft'|'sent')`; today it's never sent.
**Modify:** `routes/tutor.js` — add:
```js
router.post('/students/:id/lesson-notes/:noteId/send', async (req, res) => {
  const student = await requireLinkedStudent(req, res); if (!student) return;
  const note = await LessonNote.findOne({ _id: req.params.noteId, studentId: student._id });
  if (!note) return res.status(404).json({ error: 'Lesson note not found.' });
  const guardians = await StudentGuardian.find({ studentId: student._id });
  await Promise.all(guardians.map((g) => notify({
    recipientUserId: g.guardianUserId, type: 'lesson_summary',
    title: `New lesson update for ${student.name}`,
    body: note.parentSummary || note.covered || 'Your tutor shared a lesson update.',
    linkPath: `/parent/children/${student._id}/progress`,
    sourceType: 'LessonNote', sourceId: note._id,
  })));
  note.parentUpdateStatus = 'sent'; await note.save();
  res.json({ lessonNote: note, notified: guardians.length });
});
```
Imports to add at top of `routes/tutor.js`: `StudentGuardian` model + `notify` from the service.
**Acceptance:** calling send creates one notification per guardian and flips `parentUpdateStatus` to `sent`; idempotent re-send doesn't duplicate (guard: if already `sent`, return without re-notifying — add this check).

### N1-5 · Frontend: parent feed + badge
**Modify:** `frontend/src/services/api.js` — add:
```js
export const notificationsAPI = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
};
```
**Create:** `frontend/src/pages/parent/Notifications.jsx` — list of `Card`s (title, body, relative time, unread dot), clicking marks read + navigates to `linkPath`. Reuse `Card`, `Badge`, `Spinner`, `EmptyState` from `../../components/ui`.
**Modify:** top bar / parent nav — a bell with unread count (poll `unreadCount()` on mount + interval, or fetch on route change).
**Modify:** `frontend/src/App.jsx` — lazy route `"/parent/notifications"` under `<FeatureGuard feature="parent" comingSoonAllowed={true}>`.
**Modify:** `frontend/src/pages/tutor/LessonNotes.jsx` — add a "Send to parent" button on saved notes calling `tutorAPI.sendLessonNote(studentId, noteId)` (add this method to `tutorAPI`); show the `sent` badge from `parentUpdateStatus`.
**Acceptance:** tutor clicks "Send to parent" → parent sees a notification in-app and the badge increments; clicking it marks read and routes to the child's progress.

### N1-6 · Tests
**Create:** `routes/notifications.test.js` — vitest, mock `middleware/auth.js` + `models/Notification.js`; cover: list returns only caller's, unread-count, `:id/read` 404 for other user, mark-read sets `readAt`.
**Create/extend:** `services/notifications/notificationService.test.js` — `notify()` creates one doc; throws on missing fields.
**Extend:** a `routes/tutor.js` test for the new send endpoint (mock `StudentGuardian.find` + `notify`): asserts one notify per guardian, `parentUpdateStatus → sent`, and no re-notify when already sent.
**Acceptance:** `npm test` green for the new files.

---

## Part B — Lesson Recording A1

Goal: tutor captures timed ink + audio on a tablet; it persists to R2; a parent can open a replay that plays audio with ink redrawing in sync. 1-month auto-expiry.

### A1-1 · Models: `LessonRecording` + `LessonInkEvent`
**Create:** `models/LessonRecording.js`
```js
import mongoose from 'mongoose';
export const RECORDING_STATUSES = ['recording', 'processing', 'ready', 'failed'];
export const RECORDING_VISIBILITY = ['private', 'shared_parent'];

const lessonRecordingSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  tutorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  lessonNoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'LessonNote', default: null },
  subjectId: { type: String, default: 'math' },
  domainId: { type: String, default: 'fractions' },
  status: { type: String, enum: RECORDING_STATUSES, default: 'recording', index: true },
  durationMs: { type: Number, default: 0 },
  audioStorageKey: { type: String, default: '' },      // opaque R2 key, never a public URL
  audioMimeType: { type: String, default: 'audio/webm;codecs=opus' },
  canvasWidth: { type: Number, default: 1400 },
  canvasHeight: { type: Number, default: 900 },
  pageCount: { type: Number, default: 1 },
  visibility: { type: String, enum: RECORDING_VISIBILITY, default: 'private' },
  expiresAt: { type: Date, index: true },              // createdAt + 1 month; cron purges
}, { timestamps: true, collection: 'lesson_recordings' });
lessonRecordingSchema.index({ studentId: 1, createdAt: -1 });
export default mongoose.model('LessonRecording', lessonRecordingSchema);
```
**Create:** `models/LessonInkEvent.js` (one doc per stroke; append-only)
```js
import mongoose from 'mongoose';
const lessonInkEventSchema = new mongoose.Schema({
  recordingId: { type: mongoose.Schema.Types.ObjectId, ref: 'LessonRecording', required: true, index: true },
  page: { type: Number, default: 0 },
  tStartMs: { type: Number, required: true },          // ms from recording start
  tEndMs: { type: Number, default: 0 },
  seq: { type: Number, required: true },
  stroke: { type: mongoose.Schema.Types.Mixed, required: true },  // existing stroke shape from drawingUtils
}, { timestamps: true, collection: 'lesson_ink_events' });
lessonInkEventSchema.index({ recordingId: 1, seq: 1 });
export default mongoose.model('LessonInkEvent', lessonInkEventSchema);
```
**Acceptance:** both compile; `expiresAt` and `(recordingId, seq)` indexes present.

### A1-2 · R2 storage helper
**Create:** `services/storage/r2.js` — thin wrapper over the AWS S3 SDK pointed at R2's S3-compatible endpoint. Functions: `putAudioObject(key, buffer, contentType)`, `getSignedDownloadUrl(key, ttlSeconds)`, `deleteObject(key)`, `createMultipartUpload`/`uploadPart`/`complete` for resumable audio (or accept a single finalised blob in A1 and defer true resumable chunks to A2).
**Modify:** `.env.example` — add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`.
**Package:** `npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` (S3-compatible client works with R2).
**Acceptance:** unit test with the SDK mocked verifies a presigned URL is requested with the given key + TTL; no public URLs are persisted.
**A1 simplification:** audio uploads as **one finalised blob** on Stop (multipart/resumable deferred to A2). Keeps the first cut small.

### A1-3 · Recording API routes
**Create:** `routes/recordings.js`
```
POST   /api/tutor/students/:id/recordings        → create LessonRecording(status=recording); returns recordingId
POST   /api/tutor/recordings/:rid/ink            → append LessonInkEvent[] (batch; {page,tStartMs,tEndMs,seq,stroke}[])
POST   /api/tutor/recordings/:rid/audio          → multipart: final audio blob → putAudioObject → set audioStorageKey
POST   /api/tutor/recordings/:rid/finalise       → set durationMs, status=ready, expiresAt = now + 30d
PATCH  /api/tutor/recordings/:rid                → { visibility } share/unshare
DELETE /api/tutor/recordings/:rid                → soft-delete (or hard delete + R2 object)
GET    /api/tutor/recordings/:rid                → manifest: meta + signed audio URL + ink events
```
Tutor routes: `router.use(protect, requireWorkspace)` + the `requireLinkedStudent` guard (import from a shared helper or replicate the pattern in `routes/tutor.js`). Parent routes live in `routes/family.js` (user-scoped):
```
GET    /api/family/children/:studentId/recordings   → list visibility=shared_parent for a child the caller guards
GET    /api/family/recordings/:rid                  → manifest IF visibility=shared_parent AND caller is a StudentGuardian
POST   /api/family/recordings/:rid/export           → A2: render MP4 (stub/501 in A1)
```
**Modify:** `server.js` — mount `routes/recordings.js`. (Tutor sub-paths can also be folded into the existing `/api/tutor` mount; keep a separate file for clarity.)
**Access rules:** tutor manifest requires the recording's `studentId` be linked to the tutor in `req.workspaceId`; parent manifest requires a `StudentGuardian{ studentId, guardianUserId: req.user.id }` AND `visibility==='shared_parent'`. Audio is only ever a **short-TTL signed URL** minted at manifest time.
**Acceptance:** a tutor can create→append ink→upload audio→finalise→fetch manifest; a parent can fetch a *shared* recording but gets 403 on a `private` one or a child they don't guard.

### A1-4 · Frontend capture surface (add audio to existing canvas)
**Create:** `frontend/src/pages/tutor/LessonRecorder.jsx` (route `/tutor/students/:id/record`). Compose the existing fullscreen canvas with audio + persistence:
- On **Start**: `navigator.mediaDevices.getUserMedia({ audio: true })` → `new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })`; record `t0 = performance.now()`; `POST /recordings` to get `rid`.
- Reuse the canvas's stroke pipeline (`beginStrokeData`/`pointFromEvent`/`finalizeStroke` from `drawingUtils.js`). On each finalised stroke compute `tStartMs = Date.parse(stroke.timestamp) - t0Wall` (capture `t0Wall = Date.now()` alongside `t0`), buffer, and flush every ~5s / N strokes via `POST /recordings/:rid/ink`.
- On **Stop**: `mediaRecorder.stop()` → assemble Blob → `POST /recordings/:rid/audio` (FormData) → `POST /recordings/:rid/finalise` with `durationMs`.
- Graceful: if mic denied, proceed ink-only (silent replay); show a clear indicator.
**Modify:** `frontend/src/services/api.js` — add `recordingsAPI` (create, appendInk, uploadAudio[FormData], finalise, setVisibility, get, del) and parent methods (listForChild, get).
**Modify:** `frontend/src/App.jsx` — lazy route for `LessonRecorder` under `<FeatureGuard feature="tutor">`.
**Acceptance:** a recorded lesson produces a `ready` `LessonRecording` with audio in R2 and ordered `LessonInkEvent`s; works on an iPad/stylus (pointer events already handle pen).

### A1-5 · Frontend parent replay
**Create:** `frontend/src/pages/parent/LessonReplay.jsx` (route `/parent/recordings/:rid`). Reuse `StrokeReplayPlayer.jsx` + `drawStroke`/`drawMathStamp`:
- Fetch manifest (`recordingsAPI` parent get) → signed audio URL + ink events (sorted by `seq`).
- An `<audio src={signedUrl}>` is the clock. On `timeupdate`, draw all ink events with `tStartMs <= audio.currentTime*1000`. Seeking the audio re-renders ink up to the new time (clear canvas, redraw events ≤ t). Canvas sized to `canvasWidth/Height` from the manifest.
- Transport: play/pause (A1). Scrub-to-stroke is A2.
**Modify:** `frontend/src/App.jsx` — lazy route under parent `FeatureGuard`. Link to it from `ChildProgress.jsx` / the new Notifications feed (`linkPath`).
**Acceptance:** parent presses play → hears audio while ink redraws in time; pausing freezes both; opening a `private` recording is blocked.

### A1-6 · Wire "recording ready" notification (depends on N1-2)
**Modify:** the `finalise` handler in `routes/recordings.js` — after `status=ready`, if `visibility==='shared_parent'` (or when later shared via PATCH), call `notify()` for each `StudentGuardian` of the recording's student: `type='recording_ready'`, `linkPath=/parent/recordings/:rid`.
**Acceptance:** finalising a shared recording produces a `recording_ready` notification per guardian; a `private` one produces none until shared.

### A1-7 · Retention cron
**Create:** `scripts/purgeExpiredRecordings.js` — find `LessonRecording` with `expiresAt < now`, delete their R2 audio objects + `LessonInkEvent`s + the recording. Add an npm script (mirror existing `scripts/` style) and document the schedule (daily). (Wire to the platform scheduler/cron separately.)
**Acceptance:** dry-run logs what would be purged; real run removes expired recordings and their R2 objects.

### A1-8 · Tests
- `routes/recordings.test.js` (vitest, mock auth/workspace/models + `services/storage/r2.js`): create→ink→audio→finalise happy path; tutor access guard (unlinked student → 403); parent manifest access (shared vs private → 200/403; non-guardian → 403); signed URL requested, never a public URL.
- `services/storage/r2.test.js`: presigned URL + delete with mocked SDK.
- Frontend (if a test setup exists for components): a small unit on the replay time-filter (events with `tStartMs <= t` are drawn).
**Acceptance:** `npm test` green.

---

## Sequencing & estimate (rough)

| Order | Ticket(s) | Notes |
|---|---|---|
| 1 | N1-1, N1-2, N1-3, N1-6 | Model + service + routes + tests. Self-contained. |
| 2 | N1-4, N1-5 | Wire tutor "send" + parent feed/badge. Delivers visible value. |
| 3 | A1-1, A1-2 | Recording models + R2 helper + env. |
| 4 | A1-3, A1-8(partial) | Recording routes + access tests. |
| 5 | A1-4 | Tutor capture surface (audio + persistence) — the meatiest UI ticket. |
| 6 | A1-5 | Parent replay surface. |
| 7 | A1-6, A1-7 | Ready-notification + retention cron. |

Dependencies: A1-6 needs N1-2. A1-4/5 need A1-3. Everything else is parallelizable.

## Risks / watch-items

- **Clock sync.** Strokes carry wall-clock `timestamp`; audio uses `MediaRecorder`. Anchor both to a single `t0Wall = Date.now()` captured at record start so `tStartMs` and `audio.currentTime` share an origin. Validate replay drift on a 30-min recording.
- **iPad Safari MediaRecorder.** `audio/webm;codecs=opus` support varies on iOS Safari; may need `audio/mp4`/AAC fallback. Feature-detect `MediaRecorder.isTypeSupported(...)` and store the actual `audioMimeType`.
- **Mic permission denial / interruptions** (calls, backgrounding). Handle `onerror`/`onstop`; persist ink regardless so a silent replay still works.
- **R2 multipart deferred.** A1 uploads one finalised blob; a long lesson + flaky network risks losing audio on crash. A2 adds resumable chunks. Acceptable for the first cut; call it out to stakeholders.
- **FeatureGuard/featureGate.** New tutor routes are under the `tutor` feature gate and pages under `<FeatureGuard feature="tutor">`; confirm the gate version matches (`server.js` mounts `/api/tutor` with `featureGate({ feature: 'tutor', minVersion: 'v0.4' })`).

---

*Grounded in the repo as of 2026-06-09. File paths are real; code blocks are starting points to match existing style, not final implementations.*
