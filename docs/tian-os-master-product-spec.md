# Tian OS — Master Product Spec

> **Tian OS — built by teachers, powered for parents.**
> Single source of truth for implementation. Role MVPs are detailed in
> `TUTOR_MVP_SPEC.md` and `TEACHER_MVP_SPEC.md` (repo root); this document is the
> umbrella that ties all roles, modules, the shared core, and the build order
> together. Where this doc and a role spec disagree, **this doc wins**.

---

## 1. Product overview

**What it is.** Tian OS is an AI-native **mastery learning operating system** for
K–12, from Tian Jun Education Group. It unifies adaptive practice, diagnostics,
fluency training, mistake remediation, applied-learning activities, tutor
support, and parent/teacher analytics into one calm, premium platform — not a
collection of separate apps.

**Who it is for.** Students (mobile-first practice), parents (clarity +
confidence), private tutors (data-driven lesson support), and teachers
(intervention + remediation). Admin comes later.

**Positioning.** *Built by teachers, powered for parents.* Calm intelligence:
focused, confidence-building, premium, low cognitive load — "a quiet room with
one bright thing in it." Singapore MOE curriculum context.

**Why it exists.** Learning is fragmented across worksheets, apps, and tutors,
and progress is invisible to the adults supporting a child. Tian OS models
mastery per **skill** (not per chapter), adapts to each learner, and gives every
role the same underlying truth about where a student is and what to do next.

---

## 2. MVP scope

**Active MVP modules (build now):**
1. MathPath — adaptive math mastery (the core)
2. Fluency Practice — timed speed/accuracy drills
3. Mistake-to-Mastery — turn errors into targeted practice
4. Mastery Worksheet Generator — practice sets (digital first; PDF later)
5. Skill Graph / Progress — mastery map + progression
6. Assignments — assign practice to student/group/class

**Near-term modules (after core):**
7. Spelling Practice — *the only English module in scope*
8. Science Adaptive Revision
9. LifeLab — real-life Math & Science applied activities

**Surfaces (roles):** 10. Parent Dashboard · 11. Tutor Dashboard ·
12. Teacher Dashboard. Student app is the first surface built.

**Future (not MVP):** Admin/school analytics console, tutor marketplace &
payments, MathThink (Olympiad/heuristics), Reading Companion, Revision Planner,
parent training marketplace, certification payments.

**Explicitly excluded from MVP (do not build, do not surface anywhere):**
English Reading, Reading Practice, Comprehension, Writing Practice, Comprehension
Cloze. **For English, only Spelling Practice exists.**

---

## 3. User roles

For each role: main goal · key screens · main actions · data they can **see** ·
data they can **create**. Data visibility is always scoped by the active
**workspace** (see §4).

### Student
- **Goal:** get sharper through focused daily practice.
- **Key screens:** Today / dashboard · practice launcher · MathPath · topic
  detail · question practice · mistake review · fluency practice · assignments ·
  progress · skill graph.
- **Actions:** practise, answer questions, review mistakes, run fluency drills,
  complete assignments.
- **Sees:** own profile, own mastery, own assignments, own mistakes.
- **Creates:** practice attempts, session results, mistake records (implicitly).

### Parent
- **Goal:** understand my child and know the next right action.
- **Key screens:** parent dashboard · child progress · weak topics · recommended
  actions · assign practice · mistake history · worksheet generator · parent
  training · tutor/consult booking · notifications/settings.
- **Actions:** view child progress, assign practice, generate worksheets, book
  consult/tutor, manage notifications.
- **Sees:** own children's profiles, mastery, mistakes, assignments
  (parent-workspace scope).
- **Creates:** assignments, worksheets, bookings, child accounts.

### Tutor
- **Goal:** prepare and run high-impact lessons; keep parents updated.
- **Key screens:** see `TUTOR_MVP_SPEC.md` (home, today's lessons, students,
  student profile, lesson prep, lesson plan, during lesson, lesson notes, assign
  homework, progress, availability, training).
- **Actions:** prepare/run lessons, assign homework, write notes, send parent
  updates, manage availability, progress certification.
- **Sees:** **private** students in the **tutor workspace** only.
- **Creates:** lesson plans, lesson notes, homework, availability, parent
  updates.

### Teacher
- **Goal:** run intervention and remediation for classes, fast.
- **Key screens:** see `TEACHER_MVP_SPEC.md` (home, classes, class overview,
  mastery map, student list, student detail, grouping, assign practice,
  intervention tracker, LifeLab assignment, LifeLab submissions, reports,
  settings).
- **Actions:** view class mastery, group students, assign practice, track
  intervention, assign/review LifeLab, generate reports.
- **Sees:** **school** classes & students in the **teacher workspace** only.
- **Creates:** groups, assignments, interventions, LifeLab activities, reports.

### Admin (later)
- **Goal:** manage accounts, content, tutors, schools, billing.
- Out of MVP. Reserve the role string and route namespace; build last.

---

## 4. Role and workspace model

**One account, multiple roles.** A person has exactly **one user account**.
Roles (`student | parent | tutor | teacher | admin`) layer on top. **Never create
duplicate accounts** for the same human (a teacher who also tutors privately is
one account with two roles).

- **Role profile:** per-role profile/settings (`tutor_profiles`,
  `teacher_profiles`, parent fields, student profile).
- **Workspace:** the data boundary a user operates inside. A parent has a parent
  workspace; a tutor a tutor workspace; a teacher a school workspace. A
  teacher-tutor user has **two workspaces** and switches between them.

**Two orthogonal axes — keep distinct:**
- **Role → available *features*** (which screens/capabilities exist).
- **Workspace → visible *students & records*** (which data is in scope).

**Teacher + tutor dual-role case.** Same login. Topbar **workspace switcher**
flips between Teacher (school classes, class mastery, intervention groups, LifeLab
class assignments, school reports) and Tutor (private students, lesson prep,
notes, homework, parent updates, availability, certification). Switching swaps the
entire data scope and feature set — not a filter over a shared list.

**Privacy boundary (non-negotiable).** School data and private-tutoring data stay
**separate** unless **explicitly linked with permission**. The same child may
exist as a school-class student *and* a private student as two isolated records.
No screen, search, report, or recommendation crosses the boundary without a
consented link. **Every query is scoped by the active `workspaceId`** — never by
user identity alone; missing/ambiguous workspace = deny.

---

## 5. Student MVP summary

Mobile-first, calm, encouraging (never childish). Screens: **Dashboard / Today**
(next best action + module cards) · **Practice app launcher** · **MathPath**
(mastery score, heatmap, topic levels, prerequisites) · **Topic detail** ·
**Question practice** (worked → guided → independent flow) · **Mistake review** ·
**Fluency practice** (calm timer, streak, keypad) · **Assignments** ·
**Progress overview** · **Skill graph** (prerequisite nodes/edges). One primary
action per screen; Spelling / Science / LifeLab appear as secondary modules.

## 6. Parent MVP summary

Clear, confidence-building, action-oriented. Screens: **Parent dashboard** ·
**Child progress** · **Weak topics** · **Recommended actions** · **Assign
practice** · **Mistake history** · **Worksheet generator** (digital first) ·
**Parent training** · **Tutor / consult booking** · **Notifications / settings**.

## 7. Tutor MVP summary

See `TUTOR_MVP_SPEC.md`. Surfaces: tutor dashboard · today's lessons · assigned
students · student profile · lesson prep · lesson plan · during lesson · lesson
notes · assign homework · student progress · availability · training/
certification. Tutor-workspace scoped; parent-update loop is central.

## 8. Teacher MVP summary

See `TEACHER_MVP_SPEC.md`. Surfaces: teacher dashboard · classes · class overview
· class mastery map · student list · student detail · grouping · assign practice ·
intervention tracker · LifeLab assignment · LifeLab submissions · reports ·
settings. Teacher-workspace scoped; Math remediation is the priority, LifeLab
secondary.

---

## 9. Shared Tian OS core

All roles read/write the **same platform services** — there is **no per-app data
silo**:

- **Authentication** — one account, JWT, password hashing.
- **User roles** — `roles[]` on the account; role gates features.
- **Workspaces** — data boundary; membership controls access; scopes every query.
- **Student profiles** — the learner record (level, modules used, profile).
- **Class rosters** — school enrolment (teacher workspace).
- **Subject / topic / skill map** — the knowledge graph (skills + prerequisites).
- **Mastery engine** — single source of mastery per student×skill; everyone reads
  it (student dashboard, parent, tutor prep, teacher map all aggregate the same
  records).
- **Question bank** — questions tagged by skill + MOE level + difficulty.
- **Practice sessions** — a sitting of practice (mode, results).
- **Mistake history** — wrong attempts + misconception tags → feed remediation.
- **Assignments** — targeted work to student/group/class.
- **Recommendations** — next best skill/drill/remediation from the mastery engine.
- **Worksheet generation** — practice sets from skills/mistakes (PDF later).
- **LifeLab records** — applied activities + submissions.
- **Reports** — class/student/parent summaries assembled from the above.

---

## 10. Shared data model (schema proposal)

Practical MongoDB/Mongoose-oriented shapes (the repo uses Mongoose). IDs are
ObjectId refs. Names map to the requested tables. Keep all learner data behind a
`workspaceId` where it is workspace-scoped.

```
users                { _id, name, email, passwordHash, roles[], avatar, status,
                       defaultWorkspaceId, createdAt }
user_roles           { _id, userId, role, profileRef, grantedAt }   // role profile pointer
workspaces           { _id, type('parent'|'tutor'|'teacher'|'school'|'admin'),
                       name, ownerUserId, orgId?, createdAt }
workspace_members    { _id, workspaceId, userId, role, status }     // who can enter a workspace
students             { _id, name, level, profile{}, createdByUserId } // the learner
student_guardians    { _id, studentId, guardianUserId, relation, workspaceId }
tutor_profiles       { _id, userId, certificationStatus, approvedLevels[],
                       approvedModules[], availability{} }
teacher_profiles     { _id, userId, school, subjectsTaught[], classIds[] }
classes              { _id, name, level, workspaceId, modules[], teacherUserId }
class_students       { _id, classId, studentId }
subjects             { _id, key('math'|'science'|'english'), name }
topics               { _id, subjectId, name, moeLevel, order }
skills               { _id, topicId, name, prerequisiteSkillIds[], moeLevel }
questions            { _id, skillId, moeLevel, difficulty, stem, choices?, answer,
                       type }
practice_sessions    { _id, studentId, workspaceId, module, mode, startedAt,
                       endedAt, summary{} }
practice_attempts    { _id, sessionId, studentId, questionId, skillId, correct,
                       answer, timeMs, createdAt }
mastery_records      { _id, studentId, skillId, level(0–5), confidence,
                       lastPracticedAt, workspaceId }
mistakes             { _id, studentId, questionId, skillId, module,
                       misconceptionTag, occurredAt, workspaceId }
assignments          { _id, target{type:'student'|'group'|'class', id},
                       createdByUserId, workspaceId, module, topicSkillId,
                       difficulty, questionCount, dueDate, status }
recommendations      { _id, studentId, kind('skill'|'drill'|'remediation'),
                       skillId, reason, createdAt }
worksheets           { _id, studentId, workspaceId, skillIds[], source, status }
lifelab_activities   { _id, type, subject, topic, instructions, materials[],
                       reflectionQuestions[] }
lifelab_submissions  { _id, activityId, studentId, dataRecorded, reflection,
                       evidenceUrl, status, teacherFeedback }
intervention_records { _id, studentId, classId, targetSkillId, startedAt,
                       assignmentIds[], status, teacherNotes, nextAction }
reports              { _id, type, scope{}, range, payload, generatedByUserId }
```

**Scoping rule:** every workspace-scoped collection carries `workspaceId`. Server
middleware injects + enforces the active workspace on every query. Cross-workspace
joins require an explicit consented link record (future `workspace_links`).

> The existing repo already has `User`, `TutorProfile`, `Worksheet`,
> `SpellingAttempt`, `LearningResult`, `Booking`, etc. Extend `User` with
> `roles[]` (additive — keep legacy `role`); add the new collections rather than
> rewriting existing ones.

---

## 11. Navigation rules

Role-based, inside one shared shell (sidebar desktop/tablet, bottom nav mobile).

- **Student (mobile bottom):** Home · MathPath · Pathway · Profile.
- **Parent (mobile bottom):** Home · Children · Practice · Bookings · More.
- **Tutor (mobile bottom):** Home · Students · Lessons · Homework · More.
  (Desktop sidebar adds Progress · Availability · Training — see `TUTOR_MVP_SPEC`.)
- **Teacher (mobile bottom):** Home · Classes · Groups · Assign · More.
  (Desktop sidebar adds Students · Assignments · Intervention · LifeLab · Reports
  · Settings — see `TEACHER_MVP_SPEC`.)
- **Role switcher:** only if the user has >1 role; changes available features.
- **Workspace switcher:** in the topbar, only if the user has >1 workspace;
  changes visible students/records. Single-workspace users see neither (no
  clutter). Active nav item = navy text on `--navy-050` pill.

---

## 12. Design system summary

Based on the design reference (`colors_and_type.css`, `primitives.jsx`).

- **Visual direction:** calm intelligence — white/ivory space, navy primary, gold
  sparingly, generous spacing, restrained motion (fades + short translates, no
  bounce). Mobile-first.
- **Colour usage:** navy `#1A2A4F` (primary), gold `#C9A23C` (accent/focus/premium
  only), backgrounds white `#FFFFFF` / ivory `#FAFAF7`, hairline `#EFEDE6`.
  Semantic: success `#2F8F6F`, warning `#C9A23C`, error `#B4453C`. Mastery scale
  `--mastery-0..5` (ivory→navy). Module accents used only on their own surface.
  No rainbow, no per-module random colour.
- **Typography:** Fraunces (display/headlines), Inter (body/UI), JetBrains Mono +
  `tabular-nums` for all numerics. Hierarchy via spacing/weight/scale, not colour.
- **Cards:** white surface, 1px hairline, radius 20, `--shadow-resting`; lift to
  `--shadow-active` on interactive.
- **Buttons:** primary (navy/white), secondary (white/navy/hairline), ghost, gold;
  sizes s/m/l; radius 14; weight 600.
- **Badges (chips):** neutral/navy/gold/success/error/outline tones; pill;
  `StatusBadge` fixes tones per status.
- **Progress indicators:** `ProgressBar` (pill, navy fill, optional gold gradient)
  and `Ring` (SVG circular, tabular numerals).
- **Bottom navigation:** floating rounded bar, blur, active = navy on navy-050.
- **Sidebar navigation:** desktop/tablet; same active treatment; topbar holds
  workspace context.
- **Empty states:** Lucide outline icon + one calm sentence + single CTA.
- **Loading states:** calm spinner / skeleton; no spinners-everywhere; short fade.
- **Error states:** terra `--error-500`, plain-language message, a recovery action;
  never blame the user.
- **Icons:** Lucide outline ~1.75 stroke, never filled, no emoji; Unicode math
  glyphs (×, ÷, ½, →).

---

## 13. MVP build order

- **Phase 1 — Foundation:** auth · roles · workspaces · student profile ·
  topic/skill map · student dashboard shell + shared layout/components.
- **Phase 2 — MathPath core:** MathPath · question practice · practice sessions ·
  mastery records · mistake history.
- **Phase 3 — Assign & parent:** assignments · parent dashboard · worksheet
  generator (digital).
- **Phase 4 — Tutor:** tutor dashboard · lesson notes · homework assignment ·
  parent updates.
- **Phase 5 — Teacher:** teacher dashboard · class roster · class mastery ·
  grouping · intervention tracking.
- **Phase 6 — Near-term modules:** Science Adaptive Revision · Spelling Practice ·
  LifeLab.

---

## 14. Implementation notes for Claude Code

- **Files/folders:** backend models in `models/`; workspace-aware routes in
  `routes/` (`context.js` first); frontend foundation in
  `frontend/src/components/ui/`, `frontend/src/components/shell/`,
  `frontend/src/context/WorkspaceContext.jsx`, role pages under
  `frontend/src/pages/{student,parent,tutor,teacher}/`.
- **Models first:** `Workspace`, `WorkspaceMember`, `Student`, `StudentGuardian`,
  `Subject`, `Topic`, `Skill`, then `Assignment`, `PracticeSession`,
  `PracticeAttempt`, `MasteryRecord`, `Mistake`. Extend `User` with `roles[]`.
- **Routes/pages first:** `/api/context` (available roles/workspaces + switch);
  frontend `AppShell` + student dashboard shell + placeholder role/feature pages.
- **Mock first:** mastery numbers, recommendations, worksheet PDF, LifeLab
  submissions, payments — return seeded/stub data; wire the real mastery engine in
  Phase 2.
- **Do not build yet:** full Parent/Tutor/Teacher dashboards, worksheet PDF
  export, LifeLab submission workflow, payments, tutor marketplace, admin console.
- **Reuse the mastery engine** (`mathpath/src/`, `utils/learningProfile.js`) — do
  not write a parallel one.

---

## 15. Risks and guardrails

- **Don't build too many modules at once.** Math is the MVP core; everything else
  waits its phase.
- **Never surface unsupported English modules** (Reading/Comprehension/Writing/
  Cloze). English = Spelling only.
- **Never mix teacher and tutor data.** Workspace isolation is enforced
  server-side; cross-links require consent.
- **No separate data system per app.** One shared core; all surfaces read the same
  mastery records, students, and skill map.
- **Keep dashboards simple.** One primary action per screen; cards + badges + a
  simple heatmap over chart walls. Calm voice, no emoji, no gamification overload.
- **Don't break existing routes/auth** when adding the unified shell — add
  alongside and migrate deliberately.
