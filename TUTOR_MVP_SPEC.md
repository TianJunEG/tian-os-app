# Tian OS — Tutor MVP Product Spec

> **Tian OS — built by teachers, powered for parents.**
> Continues the Tutor MVP where Claude Design stopped. This is a written product
> spec for later implementation, not finished code.

This document specifies the **Tutor Dashboard** as a module inside Tian OS. It
follows the Tian OS Design System (navy + gold, calm intelligence, Fraunces /
Inter / JetBrains Mono, Lucide outline icons, restrained motion). The tutor
surface is **data-rich but calm** — more information density than the student
app, but the same quiet hierarchy, white space, and single-primary-action rule.

---

## 0. Scope guardrails (read first)

**Active / near-term Tian OS modules** referenced by the Tutor MVP:

1. MathPath
2. Fluency Practice
3. Mistake-to-Mastery
4. Mastery Worksheet Generator
5. Skill Graph / Progress
6. Assignments
7. Spelling Practice
8. Science Adaptive Revision
9. LifeLab
10. Parent Dashboard
11. Tutor Dashboard
12. Teacher Dashboard

**Subject / module labels** allowed anywhere a lesson, homework, or focus area
names a subject. Use **only** these exact strings:

- `MathPath`
- `Fluency Practice`
- `Mistake-to-Mastery`
- `Spelling Practice`
- `Science Adaptive Revision`
- `LifeLab`

**English scope correction — do NOT include** as MVP modules: English Reading,
Reading Practice, Comprehension, Writing Practice, Comprehension Cloze. For
English, **only Spelling Practice** exists right now. Do not surface the others
in any dropdown, filter, or card.

**One primary CTA per screen.** Everything else is a link, smaller button, or
item inside a `…` overflow menu.

---

## Role & workspace model (account architecture)

**One person = one account.** A user may hold multiple roles (e.g. a school
teacher who is also a private tutor). **Never create duplicate accounts** for the
same person. Roles and data are layered on top of a single identity.

```
User (one identity, one login)
 ├─ roles[]                 // e.g. ['teacher', 'tutor', 'parent']
 ├─ RoleProfile (per role)  // role-specific profile + settings
 └─ Workspace (per context) // the data boundary the user is working in
```

Two orthogonal concepts — keep them distinct:

- **Role controls available *features*.** What capabilities/screens the account
  may use at all (a tutor gets Lesson Prep; a teacher gets Intervention Groups).
- **Workspace controls *visible students and records*.** Which students,
  classes, lessons, notes, and reports are in scope right now.

A user switches **workspace** to change context; the visible role-features follow
the active workspace's role.

### Workspaces

A teacher-tutor user can switch between two workspaces from the topbar
**workspace switcher** (see §2):

| Workspace | Role | Shows |
| --- | --- | --- |
| **Teacher** | teacher | School classes · class mastery · intervention groups · LifeLab class assignments · school reports |
| **Tutor** | tutor | Private students · lesson prep · lesson notes · homework · parent updates · tutor availability · certification status |

Each workspace has its **own navigation, students, and records**. Switching
workspace swaps the entire data scope and the available feature set — it is not a
filter layered over a shared list.

### Privacy boundary (non-negotiable)

> **School data and private-tutoring data must remain separate** unless
> explicitly linked, with permission.

- A student in the Teacher workspace (school class) and a student in the Tutor
  workspace (private booking) are **separate records by default**, even if they
  are the same child.
- No screen, search, report, or recommendation may surface school records inside
  the Tutor workspace or private records inside the Teacher workspace.
- Linking the two (e.g. so a tutor sees school mastery for a student they also
  teach privately) requires an **explicit, consented link**. Until that link
  exists, treat the datasets as fully isolated.
- Every data query is scoped by the **active `workspaceId`**, never by user
  identity alone. A missing/ambiguous workspace = deny, not "show everything".

### Implementation notes (carry into §6)

- Add `activeWorkspaceId` to auth/session context. The app shell reads it; the
  workspace switcher sets it; all `/api/tutor/*` (and future `/api/teacher/*`)
  calls send it and the backend enforces it server-side.
- Guard routes by **both** role (feature access) **and** workspace (data scope).
  The tutor routes in this spec require an active **tutor workspace**.
- The shared shell renders the workspace switcher whenever the user has >1
  workspace; single-workspace users see no switcher (no clutter).
- Tutor screens in §4 are implicitly scoped to the tutor workspace. "Assigned
  students" = private students in that workspace only.

---

## 1. Design-system contract

The Tutor MVP reuses the shared Tian OS kit. Do not invent new tokens or a
parallel style.

**Tokens** (from `colors_and_type.css` / `tokens.jsx`):

- Surfaces: `--paper` cards on `--ivory` page wash; `--hairline` 1px borders.
- Primary navy `#1A2A4F`; gold `#C9A23C` used sparingly (focus halo, "near
  mastery", premium accents). No rainbow, no per-module rainbow.
- Semantic: success `#2F8F6F`, warning/gold `#C9A23C`, error `#B4453C`.
- Mastery heatmap scale `--mastery-0..5` (ivory → navy) for skill grids/cells.
- Module accents used **only** on that module's own surface, never two in one
  view: MathPath navy, Science teal `#2F6B7E`, Spelling aubergine `#6B4F7E`,
  LifeLab moss `#2F7E5A`.
- Type: Fraunces (display/headlines), Inter (body/UI), JetBrains Mono +
  `tabular-nums` for all numerics (times, scores, counts, percentages).
- Radii `--r-s…--r-xl`; shadows `--shadow-resting/active/overlay`; motion
  `--ease-calm`, fades + short translates only.

**Components to reuse** (from `primitives.jsx`): `Card`, `Button`
(primary/secondary/ghost/gold; sizes s/m/l), `Chip` (neutral/navy/gold/
success/error/outline), `Stat`, `ProgressBar`, `Ring`, `Section`, `BottomNav`,
`ScreenHeader`, `MasteryCell`, `Hint`.

**Voice:** calm coach. Sentence case. No emoji. Math glyphs as Unicode (×, ÷, ½,
→). "3 students need attention today." not "You've got students to crush! 🎉".

**New shared components the Tutor MVP introduces** (add to the kit, reuse across
roles where sensible):

- `StatusBadge` — wraps `Chip` with fixed tones: `prepared` (success),
  `not-prepared` (neutral/outline), `overdue` (error), `due-soon` (gold),
  `complete` (success), `in-progress` (navy).
- `StudentCard` — avatar/initials, name, level, focus, mastery `Ring`, weakest
  topic chip, homework completion `ProgressBar`, View action.
- `LessonRow` — time, student, module chip, mode chip, prep `StatusBadge`,
  primary action.
- `EmptyState` — Lucide outline icon, one-line calm message, single CTA.
- `WeakTopicList` — topic + mastery cell + last-seen + "address in lesson"
  toggle.

---

## 2. Navigation

**Mobile (primary, bottom nav — 5 items max):**

```
Home  |  Students  |  Lessons  |  Homework  |  More
```

`More` opens a sheet with: Progress, Availability, Training, Settings, Sign out.

**Desktop / tablet (left sidebar):**

```
Home
Students
Lessons
Homework
Progress
Availability
Training
```

Top bar carries the workspace context: tutor name + avatar, current date, and a
student/role context switcher (so the same shell serves Student/Parent/Tutor/
Teacher/Admin). Active item uses navy text on `--navy-050` pill (matches
`BottomNav` active state). Icons: Lucide outline, 1.75px stroke.

---

## 3. Data model (MVP shapes)

Minimal entities the screens read/write. Names are indicative; align to existing
backend models where they already exist.

```
Tutor        { id, name, avatar, certificationStatus, approvedLevels[],
               approvedModules[], availability }
Student      { id, name, avatar, level, mainFocus, modulesUsed[],
               overallMastery, weakTopics[], homeworkCompletionPct,
               lastLessonId, parentUpdateStatus }
WeakTopic    { skillId, label, module, masteryLevel(0–5), lastSeenAt }
Mistake      { id, skillId, label, module, question, studentAnswer,
               correctAnswer, misconceptionTag, occurredAt }
Lesson       { id, studentId, tutorId, module, level, startAt, durationMin,
               mode('online'|'home'|'centre'|'consult'), prepStatus,
               lessonPlanId, status }
LessonPlan   { id, lessonId, objective, warmUp, mainTeaching, guidedPractice,
               independentPractice, mistakeReview, homeworkId, materials[] }
LessonNote   { id, lessonId, covered, didWell, struggledWith, misconceptions[],
               homeworkId, nextRecommendation, parentSummary, sentToParentAt }
Homework     { id, studentId, module, topicSkillId, difficulty, questionCount,
               dueDate, type, status('assigned'|'in-progress'|'complete'|
               'overdue'), completionPct }
Availability { tutorId, weekly[{day,slots[]}], consultSlots[], homeSlots[],
               onlineSlots[], unavailableDates[] }
Certification{ status, trainingModules[{id,title,status}], assessmentStatus,
               interviewStatus, approvedLevels[], approvedModules[],
               trainingFeeStatus }
```

`Homework.type` enum (the **only** allowed values):
`digital-practice | mastery-worksheet | mistake-review | fluency-drill |
spelling-practice | science-revision | lifelab-activity`.

---

## 4. Screens

Each screen lists **Purpose · Main content · Primary CTA (exactly one) ·
Data needed · Empty state**.

### 4.1 Tutor Home Dashboard
**Route:** `/tutor` (bottom nav: Home)

- **Purpose:** Quick overview of the tutor's day and which students need
  attention.
- **Main content:**
  - Greeting line (Fraunces): "Good morning, {firstName}." + today's date.
  - **Today's lessons** — compact list of `LessonRow` (next 3, link "See all →"
    to Lessons).
  - **Students needing attention** — alert cards for students with weak topics
    flagged or missed/overdue homework (error/gold `StatusBadge`).
  - **Pending lesson notes** — count + list of lessons ended without notes
    saved.
  - **Assigned students summary** — `Stat` row: total students, lessons today,
    homework overdue, notes pending (JetBrains Mono numerals).
  - **Certification banner** — only if incomplete: slim gold `Hint`-style strip
    "Finish certification to unlock {module}" → links to Training.
- **Primary CTA:** **Prepare Next Lesson** (jumps to Lesson Prep for the next
  unprepared lesson today).
- **Data needed:** today's `Lesson[]`, `Student[]` with weakTopics +
  homeworkCompletion, `LessonNote` pending count, `Certification.status`.
- **Empty state:** No lessons today → calm card "No lessons scheduled today. A
  good day to review student progress." CTA → Students.

### 4.2 Today's Lessons
**Route:** `/tutor/lessons` (bottom nav: Lessons)

- **Purpose:** See all lessons for the day (default) with a date switcher.
- **Main content:** list of `LessonRow`, each showing:
  - Student name + level
  - Subject/module chip (allowed labels only)
  - Lesson time (Mono) + duration
  - **Mode** chip: online / home tuition / centre / consult
  - Preparation status `StatusBadge` (prepared / not prepared)
  - Per-row button: **Prepare Lesson** (secondary if prepared → "Review Plan")
  - Date pills across the top (Today / tomorrow / pick date).
- **Primary CTA (screen-level):** **Prepare Next Lesson** (first unprepared).
- **Data needed:** `Lesson[]` for selected date joined to `Student` basics +
  `prepStatus`.
- **Empty state:** "No lessons on {date}." CTA → Availability ("Open more
  slots").

### 4.3 Assigned Students
**Route:** `/tutor/students` (bottom nav: Students)

- **Purpose:** The tutor's student list at a glance.
- **Main content:** grid/stack of `StudentCard`:
  - Name + avatar/initials
  - Level
  - Main focus area
  - Current mastery status (`Ring`, value = overallMastery)
  - Weakest topic (chip)
  - Homework completion (`ProgressBar` + % Mono)
  - Per-card button: **View Student**
  - Top: search + filter chips (by level, by module, "needs attention").
- **Primary CTA:** per-card **View Student** (no competing screen-level CTA;
  search is the main affordance).
- **Data needed:** `Student[]` for this tutor with mastery, weakestTopic,
  homeworkCompletionPct.
- **Empty state:** "No students assigned yet. Students appear here once a parent
  books you or an admin assigns them." CTA → Availability.

### 4.4 Student Profile
**Route:** `/tutor/students/:studentId`

- **Purpose:** Understand one student quickly before planning.
- **Main content:**
  - Header: name, level, avatar, parent update status badge.
  - **Overview** stats row (Mono): overall mastery, current level, homework
    completion, lessons completed.
  - **Main modules used** — chips (allowed labels).
  - **Recent progress** — small mastery trend sparkline / `ProgressBar` history.
  - **Weak topics** — `WeakTopicList` with mastery cells.
  - **Recent mistakes** — list (skill, question, misconception tag, date).
  - **Assigned homework** — items with `StatusBadge`.
  - **Last lesson summary** — pulled from latest `LessonNote.parentSummary`.
  - **Parent update status** — sent / pending.
- **Primary CTA:** **Plan Lesson** (→ Lesson Prep for this student).
- **Data needed:** full `Student` join: weakTopics, recent `Mistake[]`,
  `Homework[]`, latest `LessonNote`, mastery trend.
- **Empty state (new student):** "No activity yet. Plan a first lesson to start
  building {name}'s pathway." CTA → Plan Lesson.

### 4.5 Lesson Prep
**Route:** `/tutor/lessons/:lessonId/prep`

- **Purpose:** Help the tutor prepare using the student's mastery + mistake
  data.
- **Main content:**
  - **AI-suggested lesson focus** — gold `Hint` card, calm coach tone:
    "Suggested focus: equivalent fractions. {Name} has 3 recent slips and this
    unlocks ratio."
  - **Weak topics to address** — `WeakTopicList` with toggles (select which to
    include).
  - **Recent mistakes** — selectable list.
  - **Recommended questions** — generated set, count adjustable.
  - **Suggested teaching sequence** — ordered steps (Worked → Guided →
    Independent → Fluency), editable.
  - **Suggested homework** — pre-filled, editable.
  - **Tutor editable focus** — free-text objective override.
- **Primary CTA:** **Create Lesson Plan** (carries selections into 4.6).
- **Data needed:** `Lesson`, `Student` weakTopics + mistakes, recommendation
  engine output (reuse MathPath recommendation engine where possible).
- **Empty state:** thin data → "Not enough data yet. Start from a diagnostic or
  pick topics manually." Manual topic picker shown.

### 4.6 Lesson Plan
**Route:** `/tutor/lessons/:lessonId/plan`

- **Purpose:** Create a structured lesson.
- **Main content (editable sections, each a `Card`):**
  - Lesson objective
  - Warm-up
  - Main teaching section
  - Guided practice
  - Independent practice
  - Mistake review
  - Homework assignment (links to / opens 4.9 inline)
  - Materials needed (chips/list)
- **Primary CTA:** **Save Lesson Plan**.
- **Data needed:** prefilled from 4.5; writes `LessonPlan`.
- **Empty state:** blank template with section placeholders ("Add an objective…
  ").

### 4.7 During Lesson
**Route:** `/tutor/lessons/:lessonId/live`

- **Purpose:** Support the tutor during the live lesson; minimal, focused, large
  touch targets.
- **Main content:**
  - **Lesson checklist** — plan sections as checkable items; mark parts
    completed (calm check, no celebration).
  - **Quick notes** — always-visible text field, autosaves.
  - **Student confidence rating** — 1–5 calm scale (no stars/emoji).
  - **Misconceptions noticed** — quick-add chips.
  - **Questions to revisit** — quick-add list.
  - Running timer (Mono), unobtrusive.
- **Primary CTA:** **End Lesson** (→ pre-fills Lesson Notes).
- **Data needed:** `LessonPlan`, live scratch state (notes, checklist, confidence
  rating, misconceptions, revisit list).
- **Empty state:** N/A (always launched from a plan); if no plan → prompt to
  create one first.

### 4.8 Lesson Notes
**Route:** `/tutor/lessons/:lessonId/notes`

- **Purpose:** Record what happened after the lesson and send the parent update.
- **Main content:**
  - What was covered
  - What the student did well
  - What the student struggled with
  - Mistakes / misconceptions (carried from During Lesson)
  - Homework assigned (summary, link to 4.9)
  - Next lesson recommendation
  - **Parent-friendly summary** — calm, plain-English, auto-drafted from the
    above, tutor-editable. (Built by teachers, powered for parents.)
- **Primary CTA:** **Save and Send Parent Update**.
- **Data needed:** `LessonNote` write; updates `Student.parentUpdateStatus`;
  notifies parent dashboard.
- **Empty state:** prefilled from During Lesson scratch; if launched cold, blank
  fields with helper text.

### 4.9 Assign Homework
**Route:** `/tutor/homework/new` (bottom nav: Homework → New)

- **Purpose:** Assign targeted work.
- **Main content (form, calm steppers/selects):**
  - Choose student
  - Choose module (allowed labels only)
  - Choose subject / topic / skill (filtered by module + student weak topics)
  - Choose difficulty
  - Choose question count
  - Choose due date
  - **Homework type** (segmented control, allowed enum only): Digital practice ·
    Mastery worksheet · Mistake review · Fluency drill · Spelling practice ·
    Science revision · LifeLab activity
- **Primary CTA:** **Assign Homework**.
- **Data needed:** `Student[]`, module → topic catalog, student weakTopics for
  smart defaults; writes `Homework`.
- **Empty state:** Homework list (when arriving at `/tutor/homework`) empty →
  "No homework assigned yet." CTA → Assign Homework.

### 4.10 Student Progress
**Route:** `/tutor/students/:studentId/progress` (sidebar: Progress)

- **Purpose:** Track improvement over time.
- **Main content:**
  - **Mastery trend** — line/area over time (Mono axis labels).
  - **Weak topics** — `WeakTopicList`, trending up/down indicators.
  - **Recent mistakes** — list.
  - **Homework completion** — `ProgressBar` + streak.
  - **Practice consistency** — calm activity grid (mastery-scale colours, not
    GitHub-rainbow).
  - **Lesson notes history** — collapsible timeline.
  - **Next recommended action** — single gold `Hint`.
- **Primary CTA:** **Update Next Steps** (writes a recommendation / flags focus).
- **Data needed:** mastery time series, `Homework[]`, `Mistake[]`,
  `LessonNote[]`, consistency log.
- **Empty state:** "Not enough history yet. Progress charts appear after the
  first few sessions." CTA → Plan Lesson.

### 4.11 Tutor Availability
**Route:** `/tutor/availability` (sidebar: Availability; mobile via More)

- **Purpose:** Manage lesson slots.
- **Main content:**
  - Weekly availability grid (days × slots, tap to toggle).
  - Consult slots
  - Home tuition slots
  - Online lesson slots
  - Unavailable dates (date picker / list)
- **Primary CTA:** **Update Availability**.
- **Data needed:** `Availability`; writes same.
- **Empty state:** "You haven't set any availability. Add slots so parents can
  book you." CTA opens the weekly grid.

### 4.12 Tutor Training / Certification
**Route:** `/tutor/training` (sidebar: Training; mobile via More)

- **Purpose:** Support the certified-tutor route.
- **Main content:**
  - Certification status (overall `StatusBadge` + `ProgressBar`).
  - Training modules — list with per-module status (complete / in progress /
    locked).
  - Assessment status
  - Interview status
  - Approved teaching levels (chips)
  - Approved modules (chips, allowed labels)
  - Payment / training fee status (only if applicable).
- **Primary CTA:** **Continue Training** (resumes next incomplete module).
- **Data needed:** `Certification`.
- **Empty state:** "Your certification path starts here." CTA → Continue
  Training (first module).

---

## 5. Tutor user flow

The core daily loop, end to end:

```
Today's Lessons (4.2)
   → Student Profile (4.4)        // understand the student
   → Lesson Prep (4.5)            // data-driven focus
   → Lesson Plan (4.6)            // structure it
   → During Lesson (4.7)          // run it, capture live
   → Lesson Notes (4.8)           // record + Send Parent Update
   → Assign Homework (4.9)        // targeted follow-up
   → Parent update sent           // Parent Dashboard notified
   → Student Progress (4.10)      // track improvement, set next steps
```

Secondary loops: Availability (4.11) keeps the schedule full; Training (4.12)
unlocks more approved modules/levels over time. Home (4.1) is the daily entry
point that routes into this flow via **Prepare Next Lesson**.

State hand-offs to preserve:
- Lesson Prep selections (weak topics, mistakes, questions, draft homework) flow
  into Lesson Plan.
- Lesson Plan sections become the During-Lesson checklist.
- During-Lesson scratch (notes, confidence, misconceptions, revisit) prefills
  Lesson Notes.
- Lesson Notes' parent summary + Assign Homework feed the Parent Dashboard and
  Student Progress.

---

## 6. Implementation notes for Claude Code

**Where it lives.** Build inside the React app (`frontend/`). Add a tutor
section under `frontend/src/pages/tutor/` and route under `/tutor/*` in
`App.jsx`, all behind `ProtectedRoute` + a `role === 'tutor'` guard.

**Shell.** Render the tutor screens inside the shared Tian OS app shell
(sidebar + topbar on desktop, `BottomNav` on mobile) once the shell exists.
Until then, lift `BottomNav` from the design kit's `primitives.jsx` and the
sidebar from the navigation spec in §2. Do not hand-roll a new header per page —
that is the existing app's main inconsistency to avoid repeating.

**Design tokens.** Import the design system's `colors_and_type.css` as the source
of truth (or fold its `:root` variables into `frontend/src/index.css` and map
the Tailwind theme to them). Reuse the navy/gold palette already in
`tailwind.config.js`; add `ink`, `ivory`, `bone`, `hairline`, mastery, and
module-accent values from the spec. Numerics use JetBrains Mono +
`tabular-nums`.

**Components.** Port `Card`, `Button`, `Chip`, `Stat`, `ProgressBar`, `Ring`,
`Section` from `ui_kits/student-app/primitives.jsx` into
`frontend/src/components/ui/` as real React components (props, not `window`
globals). Then build the tutor-specific `StatusBadge`, `StudentCard`,
`LessonRow`, `WeakTopicList`, `EmptyState` on top of them. Icons: `lucide-react`
(already a dependency), outline, ~1.75 stroke.

**Reuse existing engines.** Lesson Prep recommendations and weak-topic detection
should call the existing MathPath recommendation/diagnostic logic
(`mathpath/src/`) and the unified learning profile (`utils/learningProfile.js`)
rather than a new engine. Mistakes feed from the Mistake-to-Mastery / worksheet
flow.

**API surface (indicative, MVP):**
```
GET  /api/tutor/me/lessons?date=
GET  /api/tutor/me/students
GET  /api/tutor/students/:id
GET  /api/tutor/students/:id/progress
POST /api/tutor/lessons/:id/plan
POST /api/tutor/lessons/:id/notes        // also triggers parent update
POST /api/tutor/homework
GET/PUT /api/tutor/availability
GET/PUT /api/tutor/certification
```

**Build order (realistic MVP phasing):**
1. Tokens + ported primitives + `StatusBadge`/`StudentCard`/`LessonRow`/
   `EmptyState`, behind the shell + bottom nav.
2. Read-only core: Home (4.1), Today's Lessons (4.2), Assigned Students (4.3),
   Student Profile (4.4). Wire real data.
3. Lesson loop: Lesson Prep (4.5) → Lesson Plan (4.6) → During Lesson (4.7) →
   Lesson Notes (4.8) with parent update.
4. Assign Homework (4.9) + Student Progress (4.10).
5. Availability (4.11) + Training (4.12).

**Cut lines for MVP (defer, don't block):** AI auto-draft quality can start as
template-filled text; mastery trend can start as a simple line from stored
snapshots; practice-consistency grid can be a placeholder until activity logging
is in place; payment/training-fee status hidden unless the backend provides it.

**Non-negotiables:** one primary CTA per screen; allowed module/subject labels
only; no unsupported English modules; calm voice, no emoji, Unicode math glyphs;
mobile-first; don't break existing routes or auth.

---

## 7. Open questions to confirm before build

1. Does the backend already have `Lesson`, `LessonPlan`, `LessonNote`,
   `Homework`, `Availability`, `Certification` models, or are these new?
2. Is "Teacher Dashboard" a separate role/surface from "Tutor Dashboard", or a
   superset that reuses these screens? (Spec assumes tutor-specific routes.)
3. Source of truth for student↔tutor assignment: parent booking, admin
   assignment, or both?
4. For "centre" mode lessons — is there a centre/location entity to reference?
