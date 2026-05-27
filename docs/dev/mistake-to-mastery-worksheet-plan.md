# Mistake-to-Mastery + Worksheet Generator — Implementation Plan

> **Planning/documentation only.** This document does not change any app code. No models, routes,
> migrations, components, or dashboards are edited here. It is the build plan for the
> **Mistake-to-Mastery (M2M)** loop and the **Mastery Worksheet Generator** foundation.

**Sources of truth**
- [`docs/tian-os-master-product-spec.md`](../tian-os-master-product-spec.md) — primary (§9 shared
  core, §10 data model, §13 build order, §15 guardrails).
- `docs/dev/mathpath-mvp-notes.md` — **referenced but does not exist** in the repo. Substituted with
  the actual MathPath MVP code (`mathpath-mvp/src/lib/*`), [`MATHPATH_ROADMAP.md`](../../MATHPATH_ROADMAP.md),
  [`DATABASE_SCHEMA.md`](../../DATABASE_SCHEMA.md), and [`QUESTION_TAGGING.md`](../../QUESTION_TAGGING.md).
  *(If that notes file is meant to exist, create it and this plan can cite it directly.)*

**Grounding facts established by inspecting the codebase (2026-05-27):**
1. **No PDF library exists** in any `package.json` (root, `frontend/`, `mathpath-mvp/`). → PDF export
   is **planned, not implemented** (§16), per the task constraint.
2. Of the master-spec §10 tables, **only `Worksheet` is implemented** as a backend model
   (`models/Worksheet.js`). `Mistake`, `MasteryRecord`, `PracticeSession`, `PracticeAttempt`,
   `Assignment`, `Topic`, `Skill`, `Question`, `Student` are **not yet** backend models — they exist
   today only as the master-spec target schema and as the standalone `mathpath-mvp` collections.
3. A working **AI worksheet generator already exists** (`routes/worksheets.js`, 346 LOC +
   `models/Worksheet.js`): photo of marked work → diagnose misconceptions (Anthropic Haiku→Sonnet
   escalation) → spaced practice sessions of targeted questions → auto-mark → `/reinforce`. It is
   **mistake-driven but self-contained** (per-`Worksheet` document); it does **not** yet read the
   shared mastery/skill core.
4. The MathPath MVP exposes the reusable remediation primitives: `diagnose(skillId, params, given)`,
   `siblingParams(...)`, `generateQuestion/buildSession`, and `chooseRecommendation(...)`
   (`mathpath-mvp/src/lib/questions.js`, `remediation.js`, `recommend.js`).

**The central design tension (and the resolution this plan adopts):** the task says "use existing
tables, do not create a separate learning system," but most of those tables are not built yet, and
the one shipping worksheet feature is a separate silo. **Resolution:** M2M and the Worksheet
generator are **consumers of the shared core, not owners of data.** Where a shared table does not
yet exist, this plan treats building it as a **foundation dependency** (master-spec Phase 1–2), and
explicitly **bridges the existing photo-based `Worksheet` feature into the shared core** rather than
forking a second one. No parallel mastery/skill/mistake store is introduced.

**Scope correction (non-negotiable):** No English Reading, Reading Practice, Comprehension, Writing
Practice, or Comprehension Cloze — anywhere. **English = Spelling Practice only.** The Worksheet
generator MVP is **Math-first**; Spelling worksheets are a later, separate type. Science worksheets
are near-term/secondary.

---

## 1. Product purpose

**Mistake-to-Mastery** turns a student's *errors* into a closed remediation loop: every wrong answer
is diagnosed to a named misconception, logged centrally, and converted into targeted re-practice
until the underlying skill is mastered — then marked resolved. It is the **backward, error-driven**
counterpart to MathPath's forward progression.

**The Worksheet Generator** assembles a structured practice set (digital first) from a student's
**weak skills + recent mistakes + similar questions**, calibrated to their **mastery level** and a
chosen **difficulty**. It is the *delivery vehicle* parents/tutors/teachers use to act on what M2M
surfaces.

Together: **mistakes in → diagnosis → targeted worksheet → practice → mastery update → mistake
resolved.** Both feed and read the one shared mastery profile — no separate learning system.

---

## 2. User flow (the core loop, role-agnostic)

```
A mistake is made            (any module: MathPath, Fluency, Spelling, Science)
  → diagnosed to a misconception + logged to `mistakes` (skillId, misconceptionTag, workspaceId)
    → surfaced as a "weak skill / recent mistake" on the relevant dashboard
      → someone acts: review the mistake  OR  generate a targeted worksheet
        → student practises (digital worksheet = a practice_session of similar questions)
          → attempts marked → mastery_records updated → mistakes re-checked
            → if the skill clears the mastery bar, related mistakes flip to `resolved`
              → recommendation engine surfaces the next weak skill
```

Every arrow reads/writes the shared core. The worksheet is just a *named, persisted bundle* of the
same questions/attempts the practice engine already handles.

---

## 3. Student flow

1. **See it:** Mistake Review screen lists recent mistakes grouped by skill, with the named
   misconception and a calm one-line explanation. Progress/Skill-graph flags weak skills.
2. **Practise it:** "Practise this" launches a short session of **similar questions** (same skill,
   targeting the misconception) — the existing MathPath practice/remediation flow, not a new screen.
3. **Worksheet (assigned):** if a parent/tutor assigned a worksheet, it appears under Assignments;
   opening it runs the same question flow over the worksheet's question set.
4. **Resolve it:** on mastering the skill, mistakes for it move to `resolved`; the student sees the
   weak-skill flag clear. Calm, competence-affirming copy — no celebration noise.

*(No reading/comprehension/writing surfaces. Spelling mistakes flow through the same loop once
Spelling emits `mistakes`.)*

---

## 4. Parent flow

1. **Weak topics** screen → tap a weak skill → see the child's recent mistakes for it.
2. **Two actions, one screen each:** *Review mistakes* (read-only insight) or **Generate worksheet**.
3. **Worksheet generator (digital):** choose subject (Math / Science / Spelling) → topic/skill
   (pre-filled from weak skills) → difficulty → length → *Generate*. Produces a digital worksheet +
   creates an **assignment** to the child.
4. **Loop closes:** next morning the same weak-topic card shows the mastery gain ("practised 8 min ·
   mastery 38→67%"). Matches the Parent MVP "the loop is the product" narrative.
5. **PDF:** "Download PDF" is shown as **planned/disabled** until PDF support lands (§16).

---

## 5. Tutor flow (later — near-term, after core)

- In the **tutor workspace** only (private students). Lesson prep surfaces each student's weak skills
  + recent mistakes; tutor generates a worksheet as homework (creates an assignment), reviews marked
  results next lesson, and the parent-update loop reports the mastery change.
- Reuses the same generator + M2M core; **workspace-scoped** — never sees school-context mistakes.

## 6. Teacher flow (later — future)

- In the **teacher/school workspace** only. Class mastery map → group students by shared weak
  skill/misconception → assign one worksheet to a **group/class** → intervention tracker watches the
  group's mastery move. Same generator, `target.type = group|class`.
- **Privacy:** teacher never sees a child's private-tutoring mistakes/worksheets and vice versa
  (master-spec §4). Every query scoped by active `workspaceId`.

---

## 7. Required data

To run the loop, the system needs, per student (all workspace-scoped where learner data):
- **Skills + topics** (the knowledge graph) — to name/group weak skills and gate mastery.
- **Questions** tagged by skill + MOE level + difficulty + misconception — to assemble worksheets.
- **Mistakes** — questionId, skillId, misconceptionTag, module, occurredAt — the M2M spine.
- **Mastery records** — level (0–5) + confidence per skill — to pick targets and detect resolution.
- **Practice sessions + attempts** — to deliver/mark worksheet questions and update mastery.
- **Assignments** — to deliver a worksheet to a student/group/class with a due date + status.
- **Worksheets** — the persisted generated bundle (skills, source, question set, status).

---

## 8. Existing tables to reuse (and their real status)

Per the master-spec §10 names. **Reuse these canonical shapes; do not invent parallels.**

| Table (spec §10) | Status today | Reuse plan |
| --- | --- | --- |
| `skills`, `topics`, `subjects` | **Not yet a backend model** (graph lives in `mathpath-mvp/src/lib/graph.js` + `SKILL.md`) | Build/seed as the shared graph in Phase 1; M2M reads it. |
| `questions` | **Not yet** (generated in `mathpath-mvp`; authored shape in `QUESTION_TAGGING.md`) | Worksheet pulls from the shared bank once seeded; until then, generate via the MVP engine. |
| `mistakes` | **Not yet a model** | The M2M spine — first new collection to build (§9). |
| `mastery_records` | **Not yet** (MVP has `mastery_profiles`) | Reuse the MVP mastery engine; persist as `mastery_records` per spec. |
| `practice_sessions`, `practice_attempts` | **Not yet** (MVP has its own `practice_sessions`) | A digital worksheet *is* a `practice_session`; attempts update mastery. |
| `assignments` | **Not yet** | Worksheet delivery = an assignment (`target`, `module`, `status`). |
| `worksheets` | **EXISTS** — `models/Worksheet.js` (+ `routes/worksheets.js`) | **Bridge, don't fork** (§9). Keep the photo→spaced-practice flow; add skill/mistake linkage + workspace scope. |

> **Engine reuse (master-spec §14):** `mathpath-mvp/src/lib/{questions,remediation,recommend}.js`
> already implement `diagnose`, `siblingParams`, `buildSession`, and `chooseRecommendation`. M2M and
> the generator call these — **do not write a parallel mastery/diagnosis engine.**

---

## 9. New fields / tables needed

Additive only; aligns to spec §10. (Implementation deferred — this is the spec for the build phase.)

**New collections (build as shared core, not M2M-private):**
- `mistakes` — `{ studentId, questionId, skillId, module, misconceptionTag, incorrectAnswer,
  correctAnswer, mistakeType, reviewedStatus('unreviewed'|'revisited'|'resolved'),
  similarPracticeAssignmentId?, sessionId?, occurredAt, workspaceId }`.
  *(`mistakeType` enum per architecture doc: careless | concept_gap | calculation_error | misread |
  method_error | incomplete_explanation | spelling_error | science_keyword_missing.)*
- `assignments` — spec §10 shape; add `worksheetId?` to link a worksheet-backed assignment.
- `practice_sessions` / `practice_attempts`, `mastery_records`, `skills`/`topics`/`questions` — per
  spec §10 (foundation dependency; see §17 build order).

**Additive fields on the existing `Worksheet` model (bridge to the core — no rewrite):**
- `workspaceId` (scope — currently absent; **required** for the privacy boundary).
- `skillIds: [ObjectId→Skill]` (currently free-text `skillsToReinforce[]` only).
- `source: enum('photo'|'weak_skills'|'recent_mistakes'|'mixed')` (today it's implicitly photo-only).
- `sourceMistakeIds: [ObjectId→Mistake]` (provenance when generated from logged mistakes).
- `assignmentId: ObjectId→Assignment` (link to delivery).
- `difficultyBand`, `masterySnapshot{}` (the level the set was calibrated to).

> Keep the existing embedded `misconceptions[]` / `practiceSessions[].questions[]` structure — it is
> a good worksheet bundle. The change is **linking it to shared `skills`/`mistakes` + a workspace**,
> so a non-photo (weak-skill/mistake-driven) worksheet reuses the same model and marking pipeline.

---

## 10. Routes / pages needed

**Backend (workspace-scoped; extend existing `routes/worksheets.js` where possible):**
- `POST /api/worksheets/generate` — **new, non-photo path**: body `{ studentId, subject, skillIds[],
  source, difficulty, questionCount }` → assembles from weak skills/mistakes/similar questions →
  persists a `Worksheet` (+ optional `Assignment`). (Existing photo `POST /` stays.)
- `GET /api/worksheets?studentId=&workspaceId=` — list (exists; add scope).
- `GET /api/worksheets/:id` — detail (exists).
- `POST /api/worksheets/:id/sessions/:n/mark` — mark a session (exists) → **also** write
  `practice_attempts` + update `mastery_records` + re-check related `mistakes`.
- `POST /api/worksheets/:id/reinforce` — re-target misconceptions (exists).
- `GET /api/mistakes?studentId=&skillId=&reviewedStatus=` — **new**: the M2M list/grouping feed.
- `POST /api/mistakes/:id/review` — **new**: mark reviewed/resolved.
- `GET /api/worksheets/:id/pdf` — **planned, returns 501/disabled** until §16.

**Frontend pages (no English-beyond-Spelling anywhere):**
- Student: **Mistake Review** (exists as `frontend/src/pages/.../` target — reuse, link to skill),
  worksheet runner reuses the practice flow.
- Parent: **Weak topics → Generate worksheet** (the existing `WorksheetGeneratorPage.jsx`, 993 LOC,
  is the base — extend with the non-photo, weak-skill-driven entry).
- Tutor/Teacher pages: later phases.

---

## 11. Components needed

Reuse the design-system primitives (`mathpath-mvp/src/components/ui.jsx` /
`docs/design/.../primitives.jsx`): `Card`, `Button`, `Chip` (misconception/status tones),
`ProgressBar`, `Ring`, `Section`, `MasteryCell`, `Hint`.

New/composed components (spec, not built here):
- `MistakeCard` — question, child's answer vs correct, named misconception (gold `Hint`), "Practise".
- `WeakSkillList` — skills grouped by domain with mastery bar + mistake count + select-to-target.
- `WorksheetBuilder` — subject → skill (prefilled) → difficulty → length → preview → Generate.
- `WorksheetPreview` — the assembled set (KaTeX via existing `Math.jsx`/`FractionBar.jsx`), per
  question its target misconception + difficulty tag.
- `WorksheetRunner` — wraps the existing practice/question flow over a worksheet's question set.
- `DifficultySelector` — easier / similar / harder (matches `Worksheet.questionSchema.difficulty`).

---

## 12. Worksheet generation logic

Input: `{ studentId, subject, skillIds[], source, difficulty, questionCount }`.

1. **Resolve targets.** If `skillIds` empty, derive from `source`:
   - `weak_skills` → lowest `mastery_records.level` skills (with prerequisites met) for the subject.
   - `recent_mistakes` → skills behind recent unresolved `mistakes`, weighted by misconception
     frequency (reuse the `chooseRecommendation` weighting).
   - `mixed` → union, capped.
2. **Set difficulty band** from `difficulty` × the student's `mastery_records.level` for each skill
   (low mastery → bias `easier`/`similar`; high → allow `harder`). Honour each skill's
   `mastery_threshold`.
3. **Select questions per skill** (§13) until `questionCount`, balancing skills and ensuring each
   targeted misconception is represented.
4. **Assemble + persist** a `Worksheet` (with new `skillIds`, `source`, `sourceMistakeIds`,
   `workspaceId`, `difficultyBand`, `masterySnapshot`). Optionally create an `Assignment`.
5. **Worked solutions + misconception tags** come from the question bank / MVP generator
   (`workedSolution`, `targetsMisconception` already in the schema).
6. **Spacing (optional, reuse existing):** the existing model already supports multi-session spaced
   plans (`practiceSessions[]`, `nextDueAt`); a generated worksheet may schedule 1–N sessions.

Deterministic + reusable: generation calls the MVP engine; **AI is used only** for the photo-diagnosis
path and reteach copy (Haiku→Sonnet escalation already in place) — never blocks set assembly.

---

## 13. Similar-question selection logic

Goal: questions that train the **same skill + same misconception** at the right difficulty.

1. **Primary key:** `questions` where `skillId == target` (the canonical "same skill" set).
2. **Misconception match:** prefer questions whose `targetsMisconception` / misconception tag matches
   the student's logged tag for that skill (the M2M signal).
3. **Difficulty filter:** within the resolved band (easier/similar/harder vs mastery level).
4. **Procedural fallback (today's reality):** where the bank is thin, generate siblings via
   `siblingParams(skillId, params)` + `generateQuestion(skill, seed)` from the MVP engine — same
   structure, fresh numbers. This is how "similar questions" works before a large authored bank
   exists.
5. **Variety guard:** de-duplicate stems, vary surface parameters, cap per-misconception repeats so a
   set reinforces without becoming rote-identical.
6. **No cross-subject leakage:** selection is scoped to the chosen subject (Math / Science / Spelling
   only).

---

## 14. Mistake review logic

1. **Capture:** any module marking an attempt wrong calls the shared diagnosis
   (`diagnose(skillId, params, given)`) and writes a `mistakes` row (skillId, misconceptionTag,
   module, answers, `reviewedStatus: 'unreviewed'`, `workspaceId`). Never store mistakes per-app.
2. **Group:** the review feed groups unresolved mistakes by `skillId`, then by `misconceptionTag`,
   ordered by recency × frequency (most-repeated misconception first).
3. **Explain:** each mistake shows the named misconception + a calm one-line fix (templated; AI reteach
   reused from `remediation.js` when available).
4. **Act:** "Practise this" → similar-question session; or roll into a generated worksheet.
5. **Resolve:** when `mastery_records.level` for the skill crosses the mastery bar (or N consecutive
   first-try-correct on the misconception), flip related mistakes to `resolved`. `revisited` is the
   interim state once practised but not yet mastered.
6. **Idempotent + honest:** resolution is derived from mastery, not from "did a worksheet" — doing a
   worksheet without improving mastery does **not** resolve the mistake.

---

## 15. Assignment integration

- A generated worksheet **may** create an `assignment` (`target{type:'student'|'group'|'class'}`,
  `module`, `topicSkillId`/`skillIds`, `difficulty`, `questionCount`, `dueDate`, `status`,
  `worksheetId`).
- **Who assigns:** parent (own child), tutor (private student, tutor workspace), teacher
  (group/class, school workspace), or the AI recommendation engine (`assigned_by_role: 'ai'`).
- **Student side:** assignments appear on the Assignments screen; opening runs the `WorksheetRunner`.
- **Completion:** marking the worksheet's sessions updates `assignment.status` →
  `completed` + `score`; mastery updates flow back; M2M re-checks mistakes.
- **Workspace scope:** the assignment carries `workspaceId`; a teacher-tutor's two workspaces produce
  two isolated assignment streams.

---

## 16. PDF generation options

**Current state: no PDF library is installed anywhere.** Per the task, PDF is **planned, not built**.
The `GET /api/worksheets/:id/pdf` route and any "Download PDF" button ship **disabled/"coming soon"**.

Options to evaluate when PDF is scheduled (do not add yet):
| Option | Where | Pros | Cons |
| --- | --- | --- | --- |
| **Server HTML→PDF (Puppeteer/Playwright)** | backend | Pixel-faithful to the web worksheet (KaTeX, design system) | Heavy dep (headless Chromium), memory/cold-start cost on Render |
| **`pdfkit` / `pdfmake`** | backend | Lightweight, no browser | Manual layout; KaTeX/fraction rendering is hard |
| **`@react-pdf/renderer`** | backend/Node | React-component PDFs, reuses design tokens | Re-implement worksheet layout in its primitives; math rendering still manual |
| **Client `jspdf` + `html2canvas`** | frontend | No server load; "print to PDF" feel | Rasterised (not selectable text), quality/scaling issues on mobile |
| **Browser print stylesheet (`@media print`)** | frontend | Zero deps; ships now | "Save as PDF" via print dialog only; not a true API artifact |

**Recommendation when scheduled:** start with a **print stylesheet** (zero-dependency, immediate),
then graduate to **server HTML→PDF** for a durable `pdfUrl` artifact. Decide based on hosting
headroom. **Security note:** any HTML→PDF path must sanitise/escape student-authored content (no
arbitrary HTML/JS into the renderer).

---

## 17. MVP build steps (sequenced; depends on master-spec Phase 1–2 foundation)

> Foundation prerequisite (master-spec §13 Phase 1–2): shared `skills/topics/questions`,
> `practice_sessions/attempts`, `mastery_records` must exist. M2M + generator are **Phase 3**.

1. **`mistakes` collection + capture hook.** Add the model; have the marking path write a `mistakes`
   row via shared `diagnose`. *Done when:* a wrong MathPath attempt logs a tagged, workspace-scoped
   mistake.
2. **Mistake Review feed.** `GET /api/mistakes` (grouped) + the student Mistake Review screen reading
   real data. *Done when:* recent mistakes group by skill/misconception with a fix line.
3. **Bridge the Worksheet model to the core.** Add `workspaceId`, `skillIds`, `source`,
   `sourceMistakeIds`, `assignmentId` (additive). *Done when:* existing photo worksheets still work,
   now carrying skill links + workspace scope.
4. **Non-photo generation.** `POST /api/worksheets/generate` from weak skills/mistakes using
   §12–§13 logic + the MVP engine. *Done when:* a parent generates a targeted digital worksheet with
   no photo.
5. **Worksheet runner + marking → mastery.** Run the set through the practice flow; marking writes
   `practice_attempts`, updates `mastery_records`, re-checks `mistakes`. *Done when:* completing a
   worksheet moves mastery and resolves the targeted mistakes.
6. **Assignment integration.** Generated worksheet → assignment → appears for the student → completion
   updates status. *Done when:* the parent→assign→practise→update loop closes end to end.
7. **PDF placeholder.** Disabled `pdf` route + "coming soon" button. *(No PDF dep added.)*

Later phases (out of this foundation): tutor homework flow (Phase 4), teacher group/class worksheets
+ intervention tracker (Phase 5), Spelling/Science worksheet types (Phase 6).

---

## 18. Risks and guardrails

- **No parallel learning system.** M2M/generator are consumers of the shared core
  (`skills/mistakes/mastery_records/...`). The single biggest risk is the existing photo `Worksheet`
  silo drifting further — **bridge it (§9), do not fork it.**
- **Foundation dependency is real.** Most spec §10 tables aren't built yet. Don't implement M2M
  against ad-hoc local stores; build/seed the shared models first (or this becomes the silo we're
  trying to avoid).
- **Resolution must be mastery-derived, not activity-derived** (§14.6) — doing a worksheet ≠ resolved.
- **Workspace isolation (master-spec §4).** Every mistake/worksheet/assignment query is scoped by
  active `workspaceId`; school and private-tutoring data never mix without consent.
- **Scope discipline.** Math-first; Science/Spelling worksheets are later types. **No English Reading,
  Reading Practice, Comprehension, Writing Practice, or Comprehension Cloze — ever.** English =
  Spelling only.
- **AI cost/latency.** AI stays on the photo-diagnosis + reteach path (Haiku→Sonnet escalation
  already implemented); deterministic generation must never block on a model call.
- **PDF safety.** No PDF dependency until scheduled; when added, sanitise student content before any
  HTML→PDF render.
- **Don't break existing worksheet routes/auth** — extend `routes/worksheets.js` additively; the
  current photo flow must keep working throughout.
```
