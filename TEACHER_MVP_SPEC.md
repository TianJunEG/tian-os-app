# Tian OS — Teacher MVP Product Spec

> **Tian OS — built by teachers, powered for parents.**
> Written product spec for later implementation. Companion to
> `TUTOR_MVP_SPEC.md`; shares its design-system contract and role/workspace
> model. Read those sections there — this doc references them rather than
> repeating.

The **Teacher Dashboard** is a Tian OS module that should feel like a **smart
teaching assistant for intervention, remediation, and applied learning** — *not*
a heavy school admin system. It is data-rich but calm: fast to scan during
school hours, clean, professional, Singapore-classroom appropriate, not childish
and not corporate. Same navy + gold visual direction as Student, Parent, and
Tutor.

---

## 0. Scope guardrails (read first)

**Active / near-term Tian OS modules:** MathPath · Fluency Practice ·
Mistake-to-Mastery · Mastery Worksheet Generator · Skill Graph / Progress ·
Assignments · Spelling Practice · Science Adaptive Revision · LifeLab · Parent
Dashboard · Tutor Dashboard · Teacher Dashboard.

**Allowed subject / module labels** (use these exact strings only):
`MathPath` · `Fluency Practice` · `Mistake-to-Mastery` · `Spelling Practice` ·
`Science Adaptive Revision` · `LifeLab`. (Mastery Worksheet is a practice *type*
under Assign Practice, not a module chip.)

**English scope correction — do NOT include** English Reading, Reading Practice,
Comprehension, Writing Practice, or Comprehension Cloze. For English, **only
Spelling Practice** exists. Keep them out of every dropdown, filter, and card.

**MVP emphasis.** Prioritise **Math remediation, assignments, grouping, and
intervention tracking**. Primary teacher use cases: Primary **Foundation Math**,
Secondary **G1/G2 Math**, remediation students, mixed-ability classes,
small-group intervention, holiday practice, LifeLab applied learning, simple
reporting. **LifeLab is a secondary assignment feature.** Spelling Practice and
Science Adaptive Revision are *available* modules but must **not dominate** the
first Teacher MVP.

**One primary CTA per screen.** Everything else is a link, smaller button, or an
item in a `…` overflow menu. Avoid clutter and excessive charts — cards, status
badges, and simple heatmaps over dense dashboards.

---

## 1. Design system & role/workspace model

**Design system:** identical contract to `TUTOR_MVP_SPEC.md §1` — navy/gold
tokens from `colors_and_type.css`, Fraunces / Inter / JetBrains Mono (`tabular-
nums` for all numerics), Lucide outline icons (~1.75 stroke), calm-coach voice
(sentence case, no emoji, Unicode math glyphs), restrained motion. Reuse the kit
primitives `Card`, `Button`, `Chip`, `Stat`, `ProgressBar`, `Ring`, `Section`,
`BottomNav`, `MasteryCell` and the shared `StatusBadge` / `EmptyState`.

**Mastery status → visual mapping** (used on the mastery map, student lists,
class cards):

| Status | Meaning | Colour source | Badge tone |
| --- | --- | --- | --- |
| **Mastered** | secure | `--mastery-5` navy (gold overlay = distinction) | success |
| **Learning** | in progress | `--mastery-2/3` | navy / in-progress |
| **Needs Support** | at risk | `--error-500` terra | error |
| **Not Started** | no data | `--mastery-0` ivory | neutral / outline |

**Role / workspace:** governed by `TUTOR_MVP_SPEC.md → "Role & workspace model"`.
The Teacher Dashboard runs inside the **Teacher workspace** (role `teacher`).

> **Privacy boundary (non-negotiable):** school data and private-tutoring data
> stay separate. A teacher-tutor user switches workspace to move between them.
> The Teacher workspace shows **school classes and records only** — never a
> student's private-tutoring records — unless an explicit, consented link
> exists. Every query is scoped by the active **teacher `workspaceId`**.

**Teacher-specific shared components to add:** `ClassCard`, `MasteryMap` (topic ×
status heatmap built from `MasteryCell`), `GroupBuilder` (editable student
chips), `InterventionRow`, `ReportCard`.

---

## 2. Navigation

**Mobile (bottom nav — 5 items):**
```
Home  |  Classes  |  Groups  |  Assign  |  More
```
`More` sheet: Students, Intervention, LifeLab, Reports, Settings, switch
workspace, sign out.

**Desktop / tablet (left sidebar):**
```
Home
Classes
Students
Groups
Assignments
Intervention
LifeLab
Reports
Settings
```
Topbar carries teacher name + avatar, current date, and the **workspace
switcher** (Teacher ⇄ Tutor) when the user has more than one workspace. Active
item = navy text on `--navy-050` pill.

---

## 3. Data model (MVP shapes)

Teacher MVP **reuses shared Tian OS core data** — do not build a teacher-only
data system. New/teacher-scoped shapes:

```
Class        { id, name, level, modules[], studentCount, overallMastery,
               completionRate, weakestTopic, workspaceId }
Enrollment   { classId, studentId }                 // school roster only
TopicMastery { classId, topicId, label, module, statusCounts{mastered,learning,
               needsSupport,notStarted}, classAvgMastery }
Group        { id, classId, label, basis('weak-topic'|'skill-gap'|'completion'),
               studentIds[], source('ai'|'teacher') }
Assignment   { id, target{type:'class'|'group'|'student', id}, module,
               topicSkillId, difficulty, questionCount, dueDate, status,
               completionPct }
Intervention { id, studentId, targetSkillId, startedAt, assignmentIds[],
               progressTrend, teacherNotes, nextAction,
               status('needs-support'|'improving'|'stable'|'mastered') }
LifeLabActivity   { id, type, subject('Math'|'Science'), topic, instructions,
                    materials[], dataRecording, reflectionQuestions[] }
LifeLabSubmission { id, activityId, studentId, dataRecorded, reflection,
                    evidenceUrl, status, teacherFeedback }
Report       { type, range, moduleFilter, generatedAt, payload }
```

Shared reads (same sources as Student/Parent/Tutor): user accounts, student
profiles, class roster, subject/topic/skill map, **mastery records (same mastery
engine)**, assignments, practice sessions, mistake history, LifeLab records,
intervention records, reports.

`Assignment.module` enum: `MathPath | Fluency Practice | Mistake-to-Mastery |
Mastery Worksheet | Spelling Practice | Science Adaptive Revision | LifeLab`.
`LifeLabActivity.type` enum: `home | group | holiday | math-journal |
parent-home`.

---

## 4. Screens

Each screen: **Purpose · Main content · Primary CTA (exactly one) · Data needed ·
Empty state.**

### 4.1 Teacher Home Dashboard
**Route:** `/teacher` · bottom nav: Home

- **Purpose:** Quick overview of classes, alerts, and what needs attention
  today.
- **Main content:** greeting (Fraunces) + date · **Today's classes** (compact
  rows, "See all →") · **Intervention alerts** (students slipping, error tone) ·
  **Classes needing attention** (low mastery / low completion) · **Recently
  completed assignments** · **Pending LifeLab submissions** count · `Stat` row
  (classes, students, interventions active, submissions to review).
- **Primary CTA:** **Review Class Needs** (→ the class with the most pressing
  alerts, lands on Class Mastery Map).
- **Data needed:** teacher profile, assigned classes, class mastery summary,
  assignment completion, intervention alerts, LifeLab submissions.
- **Empty state:** "No urgent class needs today." CTA → **View Classes**.

### 4.2 Classes
**Route:** `/teacher/classes` · bottom nav: Classes

- **Purpose:** All classes assigned to the teacher.
- **Main content:** `ClassCard` grid — class name · level · subject/module chips
  (allowed labels) · student count · overall mastery (`Ring`) · completion rate
  (`ProgressBar` + % Mono) · weakest topic chip · per-card **View Class**. Filter
  chips by level/module.
- **Primary CTA:** per-card **View Class** (search is the screen-level
  affordance; no competing CTA).
- **Data needed:** class list, class-level mastery, assignment completion, weak
  topic summary.
- **Empty state:** "No classes assigned yet."

### 4.3 Class Overview
**Route:** `/teacher/classes/:classId`

- **Purpose:** Understand one class quickly.
- **Main content:** class name · level · subject/module focus chips · student
  count · overall mastery (`Ring`) · recent completion rate · **top weak
  topics** (chips/list) · **students needing support** (mini list, error tone).
- **Primary CTA:** **View Mastery Map**.
- **Data needed:** class profile, student count, mastery summary, weak topics,
  assignment data.
- **Empty state:** "No practice data yet. Assign a diagnostic or starter
  practice." CTA → Assign Practice.

### 4.4 Class Mastery Map
**Route:** `/teacher/classes/:classId/mastery`

- **Purpose:** Class mastery by topic and skill at a glance.
- **Main content:** `MasteryMap` — simple topic × status heatmap using the
  mastery scale. Status legend: **Mastered · Learning · Needs Support · Not
  Started**. **Tap a topic → sheet listing affected students.** Keep it a clean
  heatmap, not a chart wall.
- **Primary CTA:** **Create Groups** (→ Grouping, prefilled from tapped/weak
  topics).
- **Data needed:** topic map, skill map, student mastery scores, class average
  mastery.
- **Empty state:** "No mastery data yet."

### 4.5 Student List
**Route:** `/teacher/classes/:classId/students` · sidebar: Students

- **Purpose:** Students in a class with quick learning status.
- **Main content:** student cards — name · level · mastery status badge ·
  weakest topic · recent practice completion (`ProgressBar`) · intervention
  status badge · per-card **View Student**. Search + "needs attention" filter.
- **Primary CTA:** per-card **View Student**.
- **Data needed:** class roster, student profiles, mastery status, assignment
  completion, intervention status.
- **Empty state:** "No students added to this class yet."

### 4.6 Student Detail
**Route:** `/teacher/students/:studentId`

- **Purpose:** Inspect one student's needs.
- **Main content:** overview header (name, level, avatar) · current mastery
  summary (`Ring` + `Stat`) · weak topics (list w/ mastery cells) · recent
  mistakes · completed assignments · **missing assignments** (error tone) ·
  **recommended intervention** (gold `Hint`) · teacher notes (editable).
- **Primary CTA:** **Assign Practice**.
- **Data needed:** student profile, mastery data, mistake history, assignment
  history, intervention notes. *(Teacher workspace scope only — no private
  tutoring records.)*
- **Empty state:** "No student activity yet."

### 4.7 Grouping
**Route:** `/teacher/groups` · bottom nav: Groups

- **Purpose:** Create remediation groups from weak topics / skill gaps.
- **Main content:** **AI-suggested groups** with rationale (calm tone), grouped
  by weak topic / skill gap / assignment completion. Example labels: *Fractions
  Support Group · Word Problem Method Group · Fluency Practice Group · Science
  Keywords Group*. `GroupBuilder` lets the teacher **edit students in each
  group** (drag/tap chips between groups).
- **Primary CTA:** **Assign Group Practice** (→ Assign Practice with group
  target prefilled).
- **Data needed:** mastery data, weak-topic clusters, student list, assignment
  completion, teacher edits.
- **Empty state:** "No grouping suggestions yet. Run a diagnostic or assign
  practice first." CTA → Assign Practice.

### 4.8 Assign Practice
**Route:** `/teacher/assign` · bottom nav: Assign

- **Purpose:** Assign targeted work to a class, group, or individual.
- **Main content (calm form):** **Assign to** (Whole class / Group / Individual
  student) · **Module** (MathPath · Fluency Practice · Mistake-to-Mastery ·
  Mastery Worksheet · Spelling Practice · Science Adaptive Revision · LifeLab) ·
  topic/skill (filtered by module + class weak topics) · difficulty · number of
  questions · due date.
- **Primary CTA:** **Assign Practice**.
- **Data needed:** class/group/student selection, modules, topic map, skill map,
  question bank, assignment settings; writes `Assignment`.
- **Empty state:** "Select a class or group to begin."

### 4.9 Intervention Tracker
**Route:** `/teacher/intervention` · sidebar: Intervention

- **Purpose:** Track students receiving extra support.
- **Main content:** `InterventionRow` per student — name · target skill/topic ·
  start date · assigned practice · recent progress (trend) · teacher notes ·
  next action · **status badge**: Needs Support / Improving / Stable / Mastered.
- **Primary CTA:** **Update Intervention**.
- **Data needed:** intervention records, mastery changes, assignment completion,
  teacher notes.
- **Empty state:** "No active interventions yet."

### 4.10 LifeLab Assignment
**Route:** `/teacher/lifelab/assign` · sidebar: LifeLab

- **Purpose:** Assign real-life Math and Science activities.
- **Main content:** **Activity type** (Home activity · Group work · Holiday
  assignment · Math journal · Parent-home activity) · **Subject** (Math /
  Science) · topic · activity instructions · materials needed · data-recording
  requirement · reflection questions.
- **Primary CTA:** **Assign LifeLab Activity**.
- **Data needed:** LifeLab activity library, class/group/student list,
  subject/topic map, assignment settings.
- **Empty state:** "No LifeLab activities selected yet."

### 4.11 LifeLab Submissions
**Route:** `/teacher/lifelab/submissions`

- **Purpose:** Review student LifeLab work.
- **Main content:** submission cards — activity title · data recorded ·
  reflection response · photo/evidence placeholder · completion status badge ·
  teacher feedback field.
- **Primary CTA:** **Give Feedback**.
- **Data needed:** LifeLab submissions, student responses, uploaded evidence,
  feedback notes.
- **Empty state:** "No LifeLab submissions yet."

### 4.12 Reports
**Route:** `/teacher/reports` · sidebar: Reports

- **Purpose:** Simple reports for class, student, and parent communication.
- **Main content:** **Report type** (Class progress · Student progress ·
  Intervention summary · Parent-friendly summary · LifeLab activity report) ·
  date range · subject/module filter · export/share placeholder. Keep reports
  scannable, parent-friendly tone for the parent summary.
- **Primary CTA:** **Generate Report**.
- **Data needed:** class mastery, student mastery, assignment completion,
  intervention records, LifeLab submissions, teacher notes.
- **Empty state:** "No report data yet."

### 4.13 Teacher Settings / More
**Route:** `/teacher/settings` · bottom nav: More

- **Purpose:** Manage teacher-related settings.
- **Main content:** Classes · Subjects/modules taught · notification preferences
  · report settings · LifeLab library · help/training · account settings · (and
  the workspace switcher entry for teacher-tutor users).
- **Primary CTA:** none required (settings hub); each row links out. If one is
  needed, **Save Changes** on edited sub-screens.
- **Data needed:** teacher account, classes, notification settings, module
  permissions.
- **Empty state:** "Settings will appear here."

---

## 5. Teacher user flow

```
Class Overview (4.3)
  → Class Mastery Map (4.4)        // see topic mastery
  → Identify weak topics           // tap topic → affected students
  → Grouping (4.7)                 // remediation groups
  → Assign Practice (4.8)          // targeted work to group/class/student
  → Intervention Tracker (4.9)     // track who's improving
  → LifeLab Submissions (4.11)     // review applied-learning work
  → Reports (4.12)                 // class / parent-friendly summary
```

Home (4.1) is the daily entry point and routes in via **Review Class Needs**.
State hand-offs: tapped topics on the Mastery Map prefill Grouping; a selected
group prefills Assign Practice; assignments + mastery changes feed the
Intervention Tracker; intervention + LifeLab + mastery data feed Reports.

---

## 6. Implementation notes for Claude Code

- **Where it lives:** React app (`frontend/`), pages under
  `frontend/src/pages/teacher/`, routes `/teacher/*` behind `ProtectedRoute` +
  `role === 'teacher'` **and** an active **teacher workspace** (see role model in
  `TUTOR_MVP_SPEC.md`). Render inside the shared Tian OS shell (sidebar + topbar
  desktop, `BottomNav` mobile). Do not hand-roll a per-page header.
- **Reuse shared core data — no teacher-only data system.** Read student
  profiles, class roster, subject/topic/skill map, mastery records, assignments,
  practice sessions, mistake history, LifeLab records, interventions, and reports
  from the same sources Student/Parent/Tutor use.
- **Same mastery engine.** Class mastery, the mastery map, grouping suggestions,
  and intervention status must derive from the **existing mastery/recommendation
  engine** (MathPath `mathpath/src/`, unified profile `utils/learningProfile.js`)
  — aggregated to class level, not a parallel calculation.
- **Components:** port the kit primitives into `frontend/src/components/ui/`,
  then build `ClassCard`, `MasteryMap`, `GroupBuilder`, `InterventionRow`,
  `ReportCard` on top. Mastery map = `MasteryCell` grid keyed to the mastery
  scale; keep it a heatmap, not charts.
- **Indicative API surface (MVP):**
  ```
  GET  /api/teacher/me/classes
  GET  /api/teacher/classes/:id
  GET  /api/teacher/classes/:id/mastery
  GET  /api/teacher/classes/:id/students
  GET  /api/teacher/students/:id            // teacher-workspace scope only
  POST /api/teacher/groups                  // create/edit groups
  POST /api/teacher/assignments             // class/group/student target
  GET/PUT /api/teacher/interventions
  GET  /api/teacher/lifelab/submissions
  POST /api/teacher/lifelab/assign
  POST /api/teacher/reports/generate
  ```
  All teacher endpoints enforce `workspaceId` server-side and never join private
  tutoring records without an explicit consented link.

---

## 7. What to build first (MVP order)

1. **Foundation:** shell + bottom nav + ported primitives + `StatusBadge` /
   `EmptyState` / `ClassCard`, scoped to the teacher workspace.
2. **Math remediation core (the priority):** Classes (4.2) → Class Overview
   (4.3) → Class Mastery Map (4.4) → Student List (4.5) → Student Detail (4.6),
   reading real mastery data.
3. **Grouping + Assign Practice** (4.7, 4.8) — the intervention setup loop.
4. **Intervention Tracker** (4.9) — close the loop on remediation progress.
5. **Home Dashboard** (4.1) — assemble alerts once the underlying data exists.
6. **Reports** (4.12) — class + parent-friendly summary.
7. **LifeLab (secondary):** Assignment (4.10) + Submissions (4.11).
8. Settings (4.13) last; can start as a simple links hub.

**Defer / keep light for MVP:** Spelling Practice and Science Adaptive Revision
appear as available modules but are not the focus of v1; report export/share and
LifeLab photo evidence can start as placeholders; mastery-map drill-down can
begin with a simple affected-students list.

**Non-negotiables:** one primary CTA per screen; allowed module/subject labels
only; no unsupported English modules; teacher-workspace data isolation; calm
voice, no emoji, Unicode math glyphs; mobile-first, tablet-friendly; reuse the
shared mastery engine; don't break existing routes or auth.
