# TIAN_OS_ARCHITECTURE.md — Shared Data Model & Platform Architecture

> One learning operating system with shared data — **not** many apps with separate databases.
> This document defines the core that every Tian OS module (MathPath, Fluency, Mistake-to-Mastery,
> Spelling, Science, LifeLab, Assignments, Progress, Parent/Tutor/Teacher dashboards) reads from
> and writes to.

It is the platform-level companion to the module-level specs already in the repo:
[`SKILL.md`](./SKILL.md) (skill graph), [`QUESTION_TAGGING.md`](./QUESTION_TAGGING.md) (question
contract), [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) (MathPath MVP collections).

---

## 1. The architecture in plain English

Think of Tian OS as a **kernel + apps**, like an operating system:

- **The kernel is the data + three engines** that every app shares:
  1. **Identity** — who the user is, what role they hold, which students they can see.
  2. **Curriculum** — the single Singapore-aligned map of subjects → skills, shared by all apps.
  3. **The Mastery Engine** — the truth about what each *student* knows, tracked **by skill, not by app**.
- **Apps are thin.** MathPath, Spelling, Science, LifeLab, the worksheet generator — each one
  *produces practice* and *reports outcomes against skills*. They do not own the learner. They are
  interchangeable lenses onto the same profile.

The pivotal design decision: **everything is keyed to a `skill_id` from one curriculum map.**
A spelling attempt, a MathPath fluency drill, and a science explanation all resolve to skills in
the same tree. That is what makes "one profile" real rather than marketing — the parent dashboard
can say "fractions are weak" because MathPath *and* the worksheet generator *and* an assignment all
wrote mastery signals against the same `frac-add` node.

Data flows in one direction into the core and fans back out to dashboards:

```
   ┌─────────── APPS (produce practice, emit outcomes) ───────────┐
   MathPath   Fluency   Mistake→Mastery   Spelling   Science   LifeLab
        │         │            │             │          │         │
        └────────────────── emit Practice Sessions + Mistakes ────┘
                                   │
                                   ▼
        ┌──────────────── TIAN OS CORE (the kernel) ───────────────┐
        │  Identity   Curriculum Map   Question Bank                │
        │                    │                                      │
        │            ┌───────▼────────┐                             │
        │            │ MASTERY ENGINE │  (per student × skill)      │
        │            └───────┬────────┘                             │
        │     Assignments ───┼─── Recommendation Engine             │
        └────────────────────┼─────────────────────────────────────┘
                             ▼
   ┌──────────── DASHBOARDS (read-only views over the core) ───────┐
   Student      Parent        Tutor (later)      Teacher (later)
```

Three rules keep it coherent:

1. **Apps never write mastery directly.** They write a `practice_session` (and any `mistakes`).
   The Mastery Engine is the *only* writer of `mastery_states`. This prevents six apps from
   computing "mastered" six different ways.
2. **The curriculum map is read-only at runtime.** It is authored/seeded, versioned, and
   referenced by `skill_id` everywhere — never copied into learner records.
3. **Dashboards are queries, not tables.** Parent/student/tutor/teacher views are *projections*
   over the same core entities, gated by the permissions on the user↔student link.

---

## 2. Database schema proposal

Naming follows the existing repo convention (`snake_case`, `skill_id`, `student_id`). Types are
written Postgres-leaning with a `jsonb` note where content is schema-flexible; the same model maps
cleanly to MongoDB collections (see §3).

### 2.1 Identity & access

> **One person = one account, many roles.** A user may hold several roles at once (a school
> teacher who also tutors privately). We never create duplicate accounts for the same person. Roles
> are **not** a column on `users` — they are separate **role profiles** (`user_roles`), each with its
> own **workspaces** (`workspaces`). **Role controls available *features*; workspace controls visible
> *students and records*.**

#### `users` — every human account (identity only, role-agnostic)
| Field | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid (PK) | |
| `name` | text | |
| `email` | text, unique nullable | email **or** phone required |
| `phone` | text, unique nullable | |
| `auth_provider` | text | `password \| google \| phone_otp` |
| `account_status` | enum | `pending \| active \| suspended \| deactivated` |
| `locale` | text | `en-SG` default |
| `created_at` / `last_active_at` | timestamptz | |

> No `role` here. A student *login* (when one exists) is just a `user` with a `student` role profile;
> their learning data lives in `student_profiles`. Young children may have **no** `users` row at all —
> a parent owns the profile — so identity and learner record stay separate (a child can later get a
> login without migrating progress).

#### `user_roles` — a role the person holds (one per role, never duplicated)
The set of roles a single account carries. Each row is a **role profile** holding role-specific data.
| Field | Type | Notes |
| --- | --- | --- |
| `role_id` | uuid (PK) | |
| `user_id` | uuid → users | |
| `role` | enum | `student \| parent \| tutor \| teacher \| admin` |
| `status` | enum | `pending \| active \| suspended \| revoked` (e.g. tutor not yet certified) |
| `role_profile` | jsonb | role-specific fields — **teacher:** `{ school_id, staff_id, subjects_taught }`; **tutor:** `{ certification_status, qualifications, bio, rate, availability }`; **parent:** `{}` (children via `account_links`); **student:** `{ student_id }` |
| `granted_at` | timestamptz | |
| unique | `(user_id, role)` | one role profile per role per person |

> **Role ⇒ features.** The set of `active` roles determines which feature surfaces a user can open
> (a `teacher` role unlocks classes/reports; a `tutor` role unlocks lesson prep/availability). This
> is a capability map keyed by `role`, **not** a data-visibility grant — see workspaces.

#### `workspaces` — a switchable context that scopes visible students + records
Each role profile has one or more workspaces. The teacher-tutor switches between a **Teacher
workspace** and a **Tutor workspace**; each shows a *different* set of students and records.
| Field | Type | Notes |
| --- | --- | --- |
| `workspace_id` | uuid (PK) | |
| `user_id` | uuid → users | owner |
| `role` | enum | the role this workspace operates under (must be an active `user_roles.role`) |
| `org_id` | uuid → orgs, nullable | the school/centre this workspace belongs to; null ⇒ private practice / home |
| `type` | enum | `school \| tutoring \| home \| self` |
| `name` | text | "Tian Jun Primary — P5 Math", "Private tutoring" |
| `is_active` | bool | |
| `created_at` | timestamptz | |

> **Workspace ⇒ data.** Every student link and every workspace-generated record is scoped to a
> `workspace_id`. Switching workspace switches the visible student list and record set — that is how
> the same person sees school students in the Teacher workspace and private students in the Tutor
> workspace, with no bleed between them.

#### `student_profiles` — the learner record (the thing every app tracks)
| Field | Type | Notes |
| --- | --- | --- |
| `student_id` | uuid (PK) | |
| `user_id` | uuid → users, nullable | set only when the student has their own login |
| `name` | text | |
| `school_level` | text | `P5`, `S2` … (Singapore) |
| `level_band` | text | engine-facing band, may differ from school level after diagnostic |
| `subjects` | text[] | enrolled subjects, e.g. `{math, science, english}` |
| `learning_preferences` | jsonb | pace, reduced-motion, language support, reward style |
| `support_notes` | jsonb, nullable | SEN / accommodations — access-restricted (see permissions) |
| `baseline_diagnostic` | jsonb | placement results per subject (skill → initial estimate) |
| `mastery_summary` | jsonb | **denormalised cache** of the engine (overall %, per-subject %, weak skills) for fast dashboard reads; rebuilt by the engine, never authoritative |
| `created_at` / `updated_at` | timestamptz | |

#### `account_links` — who can see/act on which student, **within a workspace**
The source of truth for "linked student profiles" **and** permissions. Scoped to a workspace, so a
student appears only in the workspace(s) they are linked through.
| Field | Type | Notes |
| --- | --- | --- |
| `link_id` | uuid (PK) | |
| `workspace_id` | uuid → workspaces | **the context this link lives in** (was: bare `user_id`) |
| `user_id` | uuid → users | denormalised owner (= `workspaces.user_id`) for fast filtering |
| `student_id` | uuid → student_profiles | |
| `relationship` | enum | `parent \| tutor \| teacher \| guardian \| self` |
| `permissions` | text[] | e.g. `{view_progress, assign_work, view_mistakes, view_support_notes, book_consult, manage_account}` |
| `class_id` | uuid, nullable | set for teacher links (see `classes`, future) |
| `status` | enum | `pending \| active \| revoked` |
| `created_at` | timestamptz | |

> Permissions live **on the link**, not the user — a tutor may assign work for student A but only
> view progress for student B. `view_support_notes` is opt-in per link. Because the link is
> workspace-scoped, the *same* teacher-tutor can be linked to student A in their Teacher workspace
> (via a class) and to student B in their Tutor workspace, and the two never mix.

#### Privacy: workspace isolation & cross-workspace consent
**Rule: school data and private-tutoring data stay separate unless explicitly linked with
permission.** Two mechanisms enforce it:

1. **Workspace-scoped records.** Workspace-generated records — `assignments`, lesson/session notes,
   `interventions`, reports, tutor homework — carry an `origin_workspace_id` (and `org_id` where a
   school owns them). A query in workspace W returns only records owned by W plus the student's
   *own* core learning data (mastery/sessions the student generated), and only for students linked
   into W. A teacher cannot see the child's private-tutoring notes, and a tutor cannot see the
   child's school interventions — even though both act on the same `student_profile`.
2. **`data_share_consents` — explicit, revocable cross-context grants.**

| Field | Type | Notes |
| --- | --- | --- |
| `consent_id` | uuid (PK) | |
| `student_id` | uuid → student_profiles | whose data is shared |
| `granted_by_user_id` | uuid → users | a guardian with `manage_account` (or the adult student) |
| `from_scope` | jsonb | source `{ workspace_id? , org_id? }` |
| `to_scope` | jsonb | recipient `{ workspace_id? , user_id? , org_id? }` |
| `data_scope` | text[] | what is shared, e.g. `{mastery_summary, weak_skills, assignments}` |
| `status` | enum | `pending \| active \| revoked \| expired` |
| `expires_at` | timestamptz, nullable | |

> Example: a parent explicitly authorises the private tutor to see the school's mastery summary so
> lessons target the right gaps. Until that consent exists and is `active`, the tutor workspace sees
> only what the tutor's own sessions produced. The **student's unified profile still exists** (the
> child sees all their own progress) — isolation governs *which adult, in which workspace,* may see
> *which slice*.

#### `orgs` (future) — schools / tuition centres
`org_id`, `name`, `type` (`school \| centre`), `country`. Stub now so `workspaces.org_id` and
school-owned records have a home; build org admin later.

### 2.2 Curriculum (shared, read-only at runtime)

#### `subjects`
`subject_id` (text PK, e.g. `math`), `name`, `display_order`.

#### `curriculum_nodes` — the subject→level→strand→topic→skill→subskill tree
One self-referential table; `node_type` distinguishes the level. This models the Singapore
structure without six rigid tables.
| Field | Type | Notes |
| --- | --- | --- |
| `node_id` | text (PK) | natural key, e.g. `frac-add` |
| `parent_id` | text → curriculum_nodes, nullable | builds the tree |
| `subject_id` | text → subjects | |
| `node_type` | enum | `level \| strand \| topic \| skill \| subskill` |
| `name` | text | "Addition of unlike fractions" |
| `level` | text | `P5` (denormalised for fast filtering) |
| `difficulty_band` | int | 1–5 |
| `mastery_type` | enum, nullable | `fluency \| concept` (skills only) |
| `expected_time_seconds` | int, nullable | fluency skills |
| `mastery_threshold` | jsonb, nullable | `{ accuracy, speed_grace }` |
| `syllabus_tags` | text[] | MOE syllabus codes / strand tags |
| `is_active` | bool | curriculum versioning |

Worked examples:
```
math   → P5 → Fractions → Addition of unlike fractions   (skill: frac-add-unlike)
science→ P5 → Cycles    → Reproduction in plants          (skill: sci-plant-repro)
english→ P5 → Grammar   → Subject–verb agreement          (skill: eng-sva)
```

#### `skill_edges` — typed prerequisites (already specced)
Reuse [`DATABASE_SCHEMA.md §2`](./DATABASE_SCHEMA.md): `source_skill_id`, `target_skill_id`,
`relationship_type` (`prerequisite \| fluency_gate \| extends`), `reason`. Kept separate from nodes
so the graph is traversable both directions.

### 2.3 Question bank (shared content)

#### `questions` — one structure, all apps
Extends the existing MathPath question contract ([`QUESTION_TAGGING.md`](./QUESTION_TAGGING.md)) to
every subject.
| Field | Type | Notes |
| --- | --- | --- |
| `question_id` | text (PK) | |
| `subject_id` | text → subjects | |
| `skill_id` | text → curriculum_nodes | primary skill assessed |
| `level` | text | |
| `topic_id` | text → curriculum_nodes | |
| `difficulty` | int | 1–5 |
| `question_type` | enum | `mcq \| short_answer \| open_ended \| word_problem \| spelling \| fluency \| science_explanation \| lifelab_prompt` |
| `prompt` | jsonb | text + optional latex / audio / image refs |
| `answer` | jsonb | `{ value, accepted[], unit, rubric? }` — rubric for open-ended/science |
| `worked_solution` | jsonb | ordered steps |
| `hints` | jsonb | escalating hint sequence |
| `common_mistakes` | jsonb | `[{ pattern, mistake_type, misconception_tag }]` → feeds diagnosis |
| `tags` | text[] | |
| `source` | text | `generated \| authored \| imported:<set>` |
| `estimated_time_seconds` | int | |
| `needs_diagram` | bool | |
| `is_active` | bool | |

> Procedural apps (MathPath fluency) may **generate** items at runtime from a skill spec rather
> than store them; those still conform to this shape when emitted, so sessions/mistakes reference a
> stable `question_id` (generated ids are fine).

### 2.4 Mastery engine (the hub — keyed by skill, not app)

#### `mastery_states` — one row per `(student_id, skill_id)`
| Field | Type | Notes |
| --- | --- | --- |
| `student_id` | uuid → student_profiles | |
| `skill_id` | text → curriculum_nodes | |
| `mastery_score` | numeric(4,3) | 0–1 composite |
| `confidence_level` | enum | `building \| steady \| confident` |
| `status` | enum | `not_started \| learning \| needs_review \| mastered` |
| `attempts` | int | |
| `accuracy` | numeric(4,3) | first-try, un-hinted |
| `median_time_seconds` | numeric, nullable | fluency skills only |
| `mistake_count` | int | |
| `last_practised_at` | timestamptz | drives spaced review / `needs_review` |
| `mastered_at` | timestamptz, nullable | |
| `updated_at` | timestamptz | |
| PK | `(student_id, skill_id)` | |

> **Only the Mastery Engine writes here.** Apps emit sessions; the engine recomputes status from
> `accuracy` + (where relevant) speed against the skill's `mastery_threshold`, and demotes mastered
> skills to `needs_review` after a decay window. This is the same rule already implemented in the
> MathPath MVP (`mastery.js`), generalised platform-wide.

### 2.5 Activity records (what apps write)

#### `practice_sessions` — every attempt block, from any module
| Field | Type | Notes |
| --- | --- | --- |
| `session_id` | uuid (PK) | |
| `student_id` | uuid → student_profiles | |
| `module` | enum | `mathpath \| fluency \| mistake_mastery \| spelling \| science \| lifelab \| worksheet \| assignment` |
| `subject_id` | text | |
| `topic_id` | text, nullable | |
| `skill_ids` | text[] | skills touched |
| `mode` | text | `timed_fluency \| independent \| remediate \| review …` |
| `items` | jsonb | per-question: `question_id, given, correct, first_try, hint_used, time_seconds, misconception_tag` |
| `item_count` / `correct_count` | int | |
| `score` | numeric | |
| `time_taken_seconds` | int | |
| `hints_used` | int | |
| `status` | enum | `in_progress \| completed \| abandoned` |
| `assignment_id` | uuid, nullable | set when the session fulfils an assignment |
| `recommendations_generated` | jsonb | snapshot of what the engine suggested at completion |
| `started_at` / `ended_at` | timestamptz | |

#### `mistakes` — centralised mistake history (all modules)
| Field | Type | Notes |
| --- | --- | --- |
| `mistake_id` | uuid (PK) | |
| `student_id` | uuid → student_profiles | |
| `session_id` | uuid → practice_sessions, nullable | |
| `question_id` | text → questions | |
| `skill_id` | text → curriculum_nodes | |
| `module` | enum | which app surfaced it |
| `incorrect_answer` | text | |
| `correct_answer` | text | |
| `mistake_type` | enum | `careless \| concept_gap \| calculation_error \| misread \| method_error \| incomplete_explanation \| spelling_error \| science_keyword_missing` |
| `misconception_tag` | text, nullable | links to the catalog (`SKILL.md §6`) |
| `explanation_shown` | jsonb, nullable | the remediation served |
| `similar_practice_assigned` | uuid, nullable | → assignments |
| `reviewed_status` | enum | `unreviewed \| revisited \| resolved` |
| `created_at` | timestamptz | |

> This is the spine of **Mistake-to-Mastery** and the worksheet generator: query
> `mistakes where student_id = ? and reviewed_status != 'resolved'`, cluster by `skill_id`, generate
> targeted practice, flip to `resolved` when the student later masters the skill.

### 2.6 Direction & delivery

#### `assignments` — work given by a parent/tutor/teacher/AI
| Field | Type | Notes |
| --- | --- | --- |
| `assignment_id` | uuid (PK) | |
| `assigned_by_user_id` | uuid → users, nullable | null ⇒ AI-generated |
| `assigned_by_role` | enum | `parent \| tutor \| teacher \| ai \| system` |
| `student_id` | uuid → student_profiles | (or `class_id` for class assignments, future) |
| `module` | enum | which app fulfils it |
| `subject_id` / `topic_id` | text | |
| `skill_ids` | text[] | |
| `question_set` | jsonb | explicit `question_id`s **or** a generation spec |
| `due_date` | date, nullable | |
| `status` | enum | `assigned \| in_progress \| completed \| overdue \| cancelled` |
| `completed_at` | timestamptz, nullable | |
| `score` | numeric, nullable | |
| `feedback` | jsonb, nullable | from the assigner or auto-marking |
| `created_at` | timestamptz | |

#### `recommendations` — next-best actions, per target role
Generalises the MathPath `recommendations` collection to cross-module, multi-audience.
| Field | Type | Notes |
| --- | --- | --- |
| `recommendation_id` | uuid (PK) | |
| `student_id` | uuid → student_profiles | |
| `target_role` | enum | `student \| parent \| tutor \| teacher` |
| `reason` | text | human-readable rationale |
| `action_type` | enum | `continue_practice \| review_mistakes \| assign_worksheet \| fluency_drill \| book_consult \| try_lifelab \| advance_skill` |
| `action_payload` | jsonb | deep-link target: module, skill_ids, count, etc. |
| `priority` | int | 1 (highest) … 5 |
| `related_skill_id` / `related_topic_id` | text, nullable | |
| `action_button` | jsonb | `{ label, route }` |
| `status` | enum | `active \| actioned \| dismissed \| expired` |
| `generated_at` | timestamptz | |

Examples: *Continue MathPath fractions* (student), *Review 3 recent mistakes* (student),
*Assign a mastery worksheet* (parent/tutor), *10-minute fluency drill* (student),
*Book a consult — topic still weak* (parent), *Try a LifeLab activity* (student).

#### `worksheets` — worksheet-generator records
`worksheet_id`, `student_id`, `generated_by_user_id` (null ⇒ AI), `subject_id`, `topic_id`,
`skill_ids[]`, `difficulty`, `question_count`, `includes_answers` (bool), `pdf_url`, `question_set`
(jsonb), `assignment_id` (nullable → links to delivery), `generated_at`.

#### `lifelab_activities` (content) + `lifelab_submissions` (runtime)
Split content from the student's work, like questions vs. sessions.

`lifelab_activities`: `activity_id`, `title`, `subject_id`, `topic_id`, `skill_ids[]`,
`real_life_context`, `materials_needed` (jsonb), `instructions` (jsonb), `data_recording_fields`
(jsonb schema), `reflection_questions` (jsonb), `is_active`.

`lifelab_submissions`: `submission_id`, `activity_id`, `student_id`, `assigned_by_user_id`,
`recorded_data` (jsonb), `reflection_answers` (jsonb), `evidence` (jsonb — photo/file refs),
`status` (`assigned \| submitted \| reviewed`), `feedback` (jsonb), `submitted_at`, `reviewed_at`.

### 2.7 Future (stub now, build later)

`classes` (`class_id`, `org_id`, `workspace_id`, `name`, `level`, `student_ids[]`),
`session_notes` (tutor lesson notes), `interventions` (teacher intervention tracking),
`reports` (generated PDF/cohort reports). All reference the same core and **carry an
`origin_workspace_id`/`org_id`** so they obey the workspace-isolation rule (§2.1). No migration
needed — they are new tables + new permissions on `account_links` + new workspace types.

> The **Tutor workspace** (near-term) reads: private students, lesson prep, lesson notes, homework,
> parent updates, availability, certification status (`user_roles.role_profile` for the tutor role).
> The **Teacher workspace** (future) reads: school classes, class mastery, intervention groups,
> LifeLab class assignments, school reports — all scoped to the teacher's `org_id`. Both are the
> *same person's* account when they hold both roles; switching workspace swaps the visible data set.

---

## 3. PostgreSQL, MongoDB, or hybrid?

**Recommendation: PostgreSQL as the system of record, with `jsonb` columns for the flexible
content — i.e. "hybrid inside one engine," not two databases.**

Why Postgres for the core:
- The data is **fundamentally relational and multi-role**: users ↔ links ↔ students ↔ sessions ↔
  mastery ↔ assignments. Parent/tutor/teacher dashboards are *joins with permission filters* —
  exactly Postgres's strength. Doing this in Mongo means hand-rolling joins (`$lookup`) and
  enforcing referential integrity in app code.
- **One writer to `mastery_states`** + cross-app aggregation wants transactions and constraints
  (unique `(student_id, skill_id)`, foreign keys). Postgres gives these for free.
- Reporting (class mastery maps, cohort weaknesses) is SQL/`GROUP BY` territory.

Why not pure Mongo: the value proposition is *shared, joined, consistent* data. Mongo shines for
self-contained documents; here the documents are heavily cross-referenced.

Where `jsonb` (the "document" half) earns its place — store these flexibly, query them rarely by
inner field: `questions.prompt/answer/hints`, `practice_sessions.items`, `learning_preferences`,
`baseline_diagnostic`, `mastery_summary` cache, `lifelab_*` content, `worksheets.question_set`.

**Pragmatic path given today's repo (Mongo + Mongoose).** Do not stop the world to migrate. The
honest sequence:
1. **MVP now:** keep building on **MongoDB**, but adopt the *shared collections + skill-keyed*
   schema above (this doc is engine-neutral). Enforce the "apps never write mastery" rule in code.
2. **Dashboard phase:** when parent/tutor/teacher reporting arrives and the `$lookup`/consistency
   pain shows up, migrate the **relational core** (`users`, `account_links`, `student_profiles`,
   `mastery_states`, `assignments`, `practice_sessions`, `mistakes`, `recommendations`) to Postgres.
   Keep the question bank / LifeLab / worksheet **content** wherever is cheapest (Mongo or `jsonb`).

So: **target = Postgres (+jsonb); MVP = Mongo with the same schema; migrate the core at the
reporting boundary.** Avoid running two live databases unless/until scale forces it.

---

## 4. What data is shared across all apps

The **core**, owned by Tian OS and never duplicated per app:

| Shared (the kernel) | App-local (each module's own concern) |
| --- | --- |
| `users`, `account_links` | UI state, app-specific settings |
| `student_profiles` (incl. mastery_summary cache) | rendering/animation prefs |
| `subjects`, `curriculum_nodes`, `skill_edges` | item *generation* internals |
| `questions` (the bank) | per-app question templates |
| **`mastery_states`** (the hub) | — |
| `practice_sessions`, `mistakes` | raw UI telemetry |
| `assignments`, `recommendations` | — |

Rule of thumb: **if two modules could ever disagree about it, it belongs in the core.** A student's
mastery of `frac-add` must be one number, not MathPath's number and the worksheet generator's
number. App-local data is anything that, if lost, affects only that one app's presentation.

---

## 5. How a new app plugs into the Tian OS core

A new module (say a **future** "English: Comprehension" — not an MVP module, see
[`docs/tian-os-mvp-scope.md`](./docs/tian-os-mvp-scope.md)) is **additive** — no core migration:

1. **Map its content to the curriculum.** Add/reuse `curriculum_nodes` (skills) + `skill_edges`.
   If the skills already exist, reuse them — that is how progress unifies.
2. **Author questions** in the shared `questions` shape with its `question_type` (add a new enum
   value if needed) — the only schema change a new app typically needs.
3. **Emit, don't compute.** On completion, POST a `practice_session` (and `mistakes`) to the core.
   The Mastery Engine updates `mastery_states`; the Recommendation Engine reacts. The app writes
   **zero** mastery logic.
4. **Register a module id** (`module` enum) + a deep-link route so recommendations/assignments can
   target it.
5. **Read back via the core APIs** (§6) for its own in-app dashboard.

This is the contract that makes Tian OS an OS: apps depend on the kernel's interfaces
(`POST /sessions`, the curriculum map, `mastery_states`), never on each other.

---

## 6. Example API routes

REST, all under `/api`. Every request resolves to a `(user, active_workspace)` pair: **role** gates
the feature/endpoint; **workspace** scopes which students and records the query may return — all
checked against `account_links` (and `data_share_consents` for cross-workspace reads).

### Identity, roles & workspace switching
```
GET  /api/me
→ { user, roles: [{ role, status }], workspaces: [{ workspace_id, role, type, org_id, name }] }

POST /api/me/workspace        { workspace_id }     // switch active workspace
→ { active_workspace, features: [...] }            // features derived from workspace.role
// All subsequent reads are scoped to active_workspace; a teacher-tutor sees school students in the
// Teacher workspace and private students in the Tutor workspace — never both at once.
```

### Student dashboard
```
GET /api/students/:studentId/dashboard
→ {
    today_assignments: [...],          // assignments due/active
    recommended_next: [...],           // recommendations target_role=student, by priority
    progress_summary: { overall, by_subject },   // from mastery_summary cache
    streak: { current, best },
    modules: [{ id, available, mastery_pct, next_skill }],
    skill_graph: { domains: [...] }    // curriculum + per-skill mastery_states
  }
```

### Parent dashboard
```
GET /api/parents/:userId/students/:studentId/overview
→ {
    student: { name, level },
    mastery: { overall, by_subject, weak_skills },   // mastery_states aggregate
    assignments: { active, overdue, completed },
    recent_mistakes: [...],            // mistakes, reviewed_status != resolved
    recommendations: [...],            // target_role=parent
    worksheets: [...],
    recent_sessions: [...]
  }
// 403 unless an active account_link (relationship=parent, permission=view_progress) exists
```

### Practice session (lifecycle — used by every app)
```
POST /api/sessions/start
  { student_id, module, skill_ids?, assignment_id? }
  → { session_id, skill, items[], mode }

POST /api/sessions/:sessionId/attempt          // optional live diagnosis/remediation
  { question_id, given, time_seconds }
  → { correct, misconception_tag?, remediation? }

POST /api/sessions/:sessionId/complete
  { items: [...] }
  → { session, mastery_update, next_recommendation }   // triggers the mastery + rec engines
```

### Mastery update (engine-internal; not called by apps directly)
```
POST /api/internal/mastery/recompute
  { student_id, skill_id, session_id }
  → { skill_id, status, mastery_score, confidence_level, changed: bool }
// Invoked by sessions/:id/complete. The ONLY writer of mastery_states.
```

### Assignment creation
```
POST /api/assignments
  { assigned_by_user_id, student_id, module, subject_id, topic_id?,
    skill_ids[], question_set | generation_spec, due_date? }
  → { assignment_id, status: "assigned" }
// permission check: link.permissions includes "assign_work" for this student
```

### Recommendation generation
```
POST /api/recommendations/generate
  { student_id, target_role }
  → { recommendations: [{ id, reason, action_type, action_button, priority, related_skill_id }] }
// Reads mastery_states + recent mistakes + spaced-review timers; idempotent (supersedes active set).
// Usually run on session completion and on a nightly job, not by clients ad hoc.
```

---

## 7. What to build first (MVP)

Build the **kernel and one vertical proving it**, in this order:

1. **Identity + linking** — `users`, `student_profiles`, `account_links` (parent↔student), auth.
   *This is the load-bearing wall; everything checks permissions against it.*
2. **Curriculum map + question bank** — `subjects`, `curriculum_nodes`, `skill_edges`, `questions`,
   seeded for the subjects you already have content for (Math first — MathPath is furthest along).
3. **The Mastery Engine + `practice_sessions` + `mastery_states`** — generalise MathPath's existing
   `mastery.js`/`recommend.js` into the shared service. *This is the heart; get it right once.*
4. **`mistakes` + Recommendation Engine** — centralise mistakes, generate student recommendations.
5. **Two dashboards as read-only views** — Student dashboard, then Parent dashboard (you already
   have both 10-screen prototypes; wire them to §6 read endpoints).
6. **`assignments`** (parent→student, AI→student) and **`worksheets`** — once the core is proven.

Defer: tutor/teacher dashboards, `classes`, `interventions`, `reports`, LifeLab review workflows.
They are new tables + permissions on the existing core — explicitly designed to bolt on without
migration (§2.7).

**The MVP is done when:** a parent account links a child, the child practises in *two* different
modules (e.g. MathPath + Spelling), both write skill-keyed sessions, the Mastery Engine produces
**one** unified profile, and both the student and parent dashboards read it.

---

## 8. Scalable but not over-engineered — guardrails

- **One curriculum map, not per-app taxonomies.** The single most important decision; everything
  unifies on `skill_id`. Resist letting any app invent its own skill list.
- **Cache, don't denormalise prematurely.** `student_profiles.mastery_summary` is a rebuildable
  cache for dashboard speed — the authoritative data stays in `mastery_states`. One cache, clearly
  labelled, is fine; scattering derived numbers everywhere is not.
- **One engine writes mastery.** No per-app mastery math. This is a *rule*, not a table.
- **`jsonb` for content, columns for relationships.** Don't model `hints` as a child table; don't
  model `account_links` as a blob. Match the storage to how you query it.
- **Enums + a `module` field beat a table-per-app.** New apps add an enum value and emit sessions —
  not a new schema. (`question_type`, `module`, `mistake_type`, `action_type` are the extension
  points.)
- **Don't build tutor/teacher/class/report tables until those dashboards are funded work.** The
  schema reserves space for them (§2.7); leave them as a paragraph, not migrations.
- **Don't run two databases for MVP.** Postgres + `jsonb` covers both shapes; add Mongo/a second
  store only when a concrete scale or access pattern demands it.
```
