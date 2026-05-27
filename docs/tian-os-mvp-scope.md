# Tian OS — MVP Scope

> **Design correction note (2026-05-27).** Earlier mobile prototypes surfaced English modules that
> Tian OS does **not** support yet (English Reading, Reading Practice, Comprehension, Writing
> Practice, Comprehension Cloze). This document is the source of truth that removes them from the
> MVP. **For the MVP, English = Spelling Practice only.**

Companion to [`TIAN_OS_ARCHITECTURE.md`](../TIAN_OS_ARCHITECTURE.md) (the shared data model). Where
the two ever disagree on what is "in the MVP," **this document wins.**

---

## 1. Tian OS positioning

Tian OS is one **AI-native learning operating system** with a single shared student profile — not a
bundle of separate apps.

- **Math mastery is the core.** MathPath and its supporting loops (fluency, mistakes, worksheets,
  progress, assignments) are the product's centre of gravity and the most complete.
- **Spelling and Science are secondary learning modules.** They exist in the MVP but sit beside the
  math core — not presented as full subject coverage.
- **LifeLab is applied, not a subject.** It supports hands-on **Math and Science** activities; it is
  not an English/literacy or general-projects module.
- **English is intentionally narrow.** The only English experience in the MVP is **Spelling
  Practice**. Tian OS must **not** look like it supports reading, comprehension, composition, or
  writing yet.

One-line framing: **"Master math first; reinforce spelling and science; apply it in LifeLab."**

---

## 2. Active MVP modules

Build, ship, and show these now. Split into the **primary math core** and **secondary reinforcement**.

### Primary — Math core
| # | Module | Role in the MVP |
| --- | --- | --- |
| 1 | **MathPath** | Adaptive math mastery + fluency — the flagship loop. |
| 2 | **Fluency Practice** | Timed speed/accuracy drills feeding the same skill profile. |
| 3 | **Mistake-to-Mastery** | Centralised mistakes → targeted re-practice until resolved. |
| 4 | **Mastery Worksheet Generator** | Generates targeted worksheets from a student's gaps. |
| 5 | **Skill Graph / Progress** | The unified mastery view across modules (by skill, not by app). |
| 6 | **Assignments** | Parent/tutor/AI-assigned work that routes into the modules above. |

### Secondary — reinforcement (shown, but clearly not the core)
| # | Module | Role in the MVP |
| --- | --- | --- |
| 7 | **Spelling Practice** | The **only** English module. Look/cover/check, dictation, mock test. |
| 8 | **Science Adaptive Revision** | Secondary subject revision; adaptive, skill-keyed. |
| 9 | **LifeLab** | Applied **Math + Science** activities only. |

### Dashboards (read-only views over the core)
| # | Module | Role in the MVP |
| --- | --- | --- |
| 10 | **Student Dashboard** | Today's plan, recommended next, progress, streak, available modules. |
| 11 | **Parent Dashboard** | Mastery summary, assignments, mistakes, recommendations, worksheets. |

---

## 3. Near-term modules

Designed for, but built **after** the Active MVP is proven. They are additive — new permissions +
read views over the existing core, no schema migration.

| Module | Why near-term |
| --- | --- |
| **Tutor Dashboard** | Needs the core mastery/mistake/assignment data to be real first; then it's a tutor-scoped read view + lesson-prep references + homework assignment. |

---

## 4. Future modules

Explicitly **not** in the MVP and **not** near-term. Reserve space in the data model; do not build UI.

| Module | Status |
| --- | --- |
| **Teacher Dashboard** | Later — class lists, class mastery map, group weaknesses, interventions, reports. |
| **English Reading** | Future. Not supported. |
| **Reading Practice** | Future. Not supported. |
| **Comprehension** | Future. Not supported. |
| **Writing Practice / Composition** | Future. Not supported. |
| **Comprehension Cloze** | Future. Not supported. |

> The five English items above were the prototype over-reach this note corrects. They may return as
> a proper "English" expansion once Spelling has proven the English vertical — but they are
> **invisible** in the MVP.

---

## 5. What NOT to show in the MVP

- ❌ No **English Reading, Reading Practice, Comprehension, Writing Practice, or Comprehension
  Cloze** — no cards, nav items, subject-filter options, assignment types, or "coming soon" tiles.
- ❌ No generic **"English"** subject that implies full coverage. English appears **only** as
  *Spelling Practice*.
- ❌ No **"Reading"** module tile (remove the placeholder in the MathPath MVP dashboard).
- ❌ No **Teacher Dashboard** surfaces (defer entirely).
- ❌ No **LifeLab** literacy/English/free-project framing — keep it to applied Math + Science.
- ❌ No heuristics / Olympiad / IQ math (already out of scope per `MATHPATH_ROADMAP.md`).
- ⚠️ Science and LifeLab must read as **secondary** — never given equal billing or top placement
  over the math core.

---

## 6. Dashboard navigation rules

**Module ordering (everywhere a module list/grid appears):**
1. Math core first: MathPath → Fluency → Mistake-to-Mastery → Worksheet Generator → Progress.
2. Then secondary, visibly de-emphasised: Spelling → Science → LifeLab.
3. Assignments surface contextually (a "Today" / "Assigned" section), not as a subject.

**Navigation labels (use exactly these; avoid implying broader coverage):**
- "MathPath", "Fluency", "Mistakes", "Worksheets", "Progress", "Assignments"
- "Spelling" (never "English")
- "Science" (qualify as "Science Revision" where space allows)
- "LifeLab" (never "Projects" or "Activities" alone)

**Subject filters** (pickers, worksheet generator, assignment creation) — MVP allowlist only:
- **Math** (all sub-topics)
- **Science** (revision topics)
- **Spelling** (under English, labelled "Spelling")
- Do **not** list: Comprehension, Composition, Grammar, Oral, Summary Writing, Reading, Cloze.

**Card states:** a module card is either **live** or absent. No "coming soon" placeholders for
future modules in the MVP — they create the false impression of support.

---

## 7. Role-specific scope

### Student
- **Sees:** today's assignments, recommended next practice, progress summary, streak/completion,
  the available **Active MVP** modules, and the skill graph.
- **Modules available:** Math core (1–6), Spelling, Science (secondary), LifeLab (applied).
- **Does not see:** any English module beyond Spelling; Teacher/Tutor surfaces.

### Parent
- **Sees:** child's mastery summary, active/overdue assignments, recent mistakes, recommendations,
  generated worksheets, recent sessions.
- **Actions (MVP allowlist):**
  - Assign a **Math** practice / worksheet
  - Assign **Spelling** practice
  - Assign **Science** revision
  - Review the child's recent **mistakes**
  - View **progress** by skill
  - (LifeLab) assign an applied Math/Science activity
- **Removed parent actions:** "Assign reading", "Assign comprehension", "Assign writing/composition"
  — these must not appear in the parent action menu.

### Tutor (near-term)
- **Sees:** assigned students, weak topics, session notes, homework assignments, progress history,
  lesson coverage, recommendations.
- **Lesson-prep references (MVP-relevant subjects only):** Math topics, Science revision topics,
  Spelling lists. **No** reading/comprehension/writing lesson-prep content.
- **Build after** the Active MVP core is real (see §3).

### Teacher (future)
- **Deferred.** When built: class list, class mastery map, group weaknesses, assigned class
  activities, intervention tracking, LifeLab submissions, reports.
- **Assignment options must mirror the MVP allowlist:** Math, Science, Spelling, LifeLab (applied) —
  **no** reading/comprehension/writing assignment types.

---

## 8. Implementation notes for Claude Code

These are the concrete code touch-points that currently violate this scope. Fix when wiring the MVP.

| Location | Issue | Action |
| --- | --- | --- |
| `mathpath-mvp/src/app/page.jsx` (~L101) | A **"Reading"** module card ("Inference passage", "Coming soon") | **Remove** the reading entry from the `modules` array. Reorder per §6 (Math core → Spelling → Science → LifeLab). |
| `mathpath-mvp/src/lib/tokens.js` (~L56) | `reading` accent colour in `MODULE_COLORS` | Remove `reading` (and confirm no remaining references) — keep `mathpath`, `science`, `spelling`, `planner` only if used. |
| `tian-os/src/data.js` (~L20, L25) | English subject filters list `Comprehension, Composition, Grammar, Oral, Summary Writing` (and Chinese equivalents) | For Tian OS MVP surfaces, English subject filter = **Spelling only**. (Note: this file powers the legacy tutor-marketplace; if that marketplace is out of MVP scope, gate it rather than editing the marketplace taxonomy.) |
| `tian-os/src/learning.js` (~L56) | Classifier maps `composit/essay/writing/作文` to a composition strand | Leave the classifier (harmless if no composition content is produced), but ensure no MVP module emits composition/writing skills. |
| `TIAN_OS_ARCHITECTURE.md` (~L376) | Uses **"Reading Comprehension"** as the example new-app | Re-label the plug-in example to a *future* subject (e.g. a future "English: Comprehension") and note it is **not** an MVP module. |

**Data-model assumptions to honour (`TIAN_OS_ARCHITECTURE.md`):**
- The **English subject node has exactly one active skill branch — Spelling** — in `curriculum_nodes`
  for the MVP. Reading/comprehension/writing nodes may exist as `is_active: false` (future) but must
  never be surfaced or assignable.
- `question_type` enum keeps `spelling`; do **not** add reading/comprehension/writing question types
  for the MVP.
- The `module` enum's active values are: `mathpath, fluency, mistake_mastery, worksheet, spelling,
  science, lifelab, assignment`. No reading/writing module value.
- Subject filters, assignment `subject_id` options, and worksheet/parent/teacher pickers must be
  driven by an **MVP allowlist** (`math`, `science`, `english:spelling`) rather than the full subject
  table — so future-but-inactive curriculum nodes can exist without leaking into the UI.

**Definition of done for this correction:** no Tian OS student/parent/tutor surface offers reading,
comprehension, composition/writing, or cloze; English appears solely as Spelling; Science and LifeLab
render as clearly secondary to the math core.
```
