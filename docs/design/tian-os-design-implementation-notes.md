# Tian OS — Design Implementation Notes

A clean, build-oriented summary of the downloaded design reference in
[`tian-os-design-reference/`](./tian-os-design-reference/). Source of truth for *how Tian OS should
look and feel* when we implement it in the app. Pairs with the product-scope source of truth,
[`../tian-os-mvp-scope.md`](../tian-os-mvp-scope.md) — **where the reference and the MVP scope
disagree on which modules exist, the scope doc wins** (see §7).

Inspected: `README.md`, `colors_and_type.css`, `Design System Summary.html`,
`Student MVP.html` (+ `ui_kits/student-app/*`), `Parent MVP.html` (+ `ui_kits/parent-app/*`),
`MathPath Prototype.html`, `ui_kits/tutor-app/*`, the `preview/` token gallery, and `screenshots/`.

---

## 1. Design direction

### Student v2 direction

For P4-P6, Tian OS should standardise on a warmer student language than the
original navy/gold-only reference:

- 40% Duolingo, 30% Canva, 20% Notion, 10% Nintendo.
- Warm, modern, encouraging, premium, and academic.
- Student screens answer: what should I do next, why should I do it, and how am
  I progressing?
- Use motifs, not mascots. Examples: targets, fractions, numbers, shapes,
  growth, trophies, stopwatch, lightning, search, and light bulb.
- Avoid cartoon mascots, talking animals, neon colours, dense dashboards, grey
  LMS cards, red warning-heavy mistake states, and multiple primary CTAs.

The student reference style now applies to Student Home, Progress, Profile,
Mistakes, Fluency, and future student domains.

Tian OS is a **calm, premium "mastery operating system"** — explicitly *not* a gamified LMS. The
guiding metaphor from the reference: **"a quiet room with one bright thing in it."**

- **Calm intelligence.** Focused, confidence-building, low cognitive load. One primary action per
  screen. No badges, coins, confetti, leaderboards, or dopamine loops.
- **Restraint as a feature.** Hierarchy comes from *space, weight, and scale* — not colour. Navy +
  gold on ivory/white; semantic colour used sparingly and meaningfully.
- **Mobile-first practice surfaces.** Sticky bottom nav, large touch targets, minimal typing,
  rapid transitions, distraction-free question screens.
- **Voice:** direct, quiet, premium, competence-affirming. *"Nice — that's 4 in a row. One more for
  mastery."* — never *"Awesome job!! You crushed it!"*.
- **Motion:** subtle fades and short distances (`140–320ms`, calm easing). No bounce/shake.
- **Iconography:** Lucide, outline-only, no emoji, no filled icons. Real Unicode math glyphs
  (`×  ÷  π  →  ½`).
- **Adaptive, not level-locked:** a student can be P6 in multiplication and P4 in fractions
  simultaneously; the skill graph (not chapter order) drives progression.

---

## 2. Reusable UI components

From `ui_kits/student-app/primitives.jsx` (the canonical kit), extended by parent/tutor shared
files. These map almost 1:1 to what already exists in `mathpath-mvp/src/components/ui.jsx` — that
component set should become the shared library.

### Core primitives (`primitives.jsx`)
| Component | Props (key) | Notes |
| --- | --- | --- |
| `Card` | `padding=20, radius=20, active, onClick` | resting vs active shadow; the base surface. |
| `Button` | `variant: primary\|secondary\|ghost\|gold`, `size: s\|m\|l (36/48/56px)`, `icon`, `iconRight`, `fullWidth` | radius 14; navy primary, gold = premium/celebratory CTA. |
| `Chip` | `tone: neutral\|navy\|gold\|success\|error\|outline`, `size: s\|m`, `active` | pill; status + filter tags. |
| `Stat` | `label, value, suffix, delta, tone` | KPI block, tabular-nums. |
| `ProgressBar` | `value, max, color, height=6, gold` | gold ⇒ navy→gold gradient near mastery. |
| `Ring` | `value, size=72, stroke=8, label, sub, gold` | SVG circular mastery dial; gold gradient variant. |
| `ScreenHeader` | `title, subtitle, onBack, action` | 54px top inset, Fraunces title + back pill. |
| `BottomNav` | `tab, onChange` | floating glassmorphic pill (blur+saturate), 4 student tabs. |
| `Section` | `title, action` | uppercase micro-label block wrapper. |
| `MasteryCell` | `level 0–5, size, gold, label` | the heatmap cell (5-step navy ramp + gold ring). |
| `Hint` | `title, label, tone: gold\|navy, defaultOpen` | collapsible "why this matters" coach card. |

### Parent additions (`parent-app/parent-shared.jsx`)
`ParentBottomNav` (5 tabs: Home · Progress · Actions · Worksheets · More), `ChildSelector`
(child-switcher pill: avatar + name + level), `ParentScreenHeader`, plus icons
(`IconDoc/Print/Gear/Users/Message/Download/Tutor/CalendarDot`).

### Tutor additions (`tutor-app/tutor-shared.jsx`)
`TutorBottomNav` (5 tabs: Home · Students · Lessons · Homework · More), `StudentAvatar` (monogram),
`LessonModePill` (online/centre/home/consult), `TutorScreenHeader` (= `ParentScreenHeader`), plus
icons (`IconClipboard/MicOn/Certificate/Chalkboard/ArrowRightLong`).

### Patterns worth lifting wholesale
- **Streak row** (`comp-streak`), **feedback states** (`comp-feedback`: correct/incorrect calm
  flashes), **input + keypad** (`comp-input`), **mastery grid** (`comp-mastery-cells`).
- **iOS device frame** (`ios-frame.jsx`) and **DesignCanvas** (`design-canvas.jsx`) are
  prototyping scaffolds — *not* shipped app code.

---

## 3. Design tokens — colours, type, spacing, buttons, cards, badges, nav

The complete, authoritative token set is [`colors_and_type.css`](./tian-os-design-reference/colors_and_type.css).
**This is the canonical source** and is more complete than the current `mathpath-mvp/src/lib/tokens.js`
(which is missing the spacing, radii, type-size, and motion-duration scales). Port these in full.

**Colour**
- Brand navy ramp: `900 #0E1A36 · 700 #1A2A4F (primary) · 500 #2E4477 · 300 #6B7FA8 · 100 #DDE3F0 · 050 #F1F4FA`
- Brand gold ramp: `700 #8E6F1F · 500 #C9A23C (accent) · 300 #E3C97A · 100 #F6EBC9`
- Neutrals: `ink 900/700/500/300/100`; surfaces `paper #FFF · ivory #FAFAF7 · bone #F3F1EA · hairline #EFEDE6`
- Semantic: success `#2F8F6F` · warn/gold `#C9A23C` · error `#B4453C` · info `#2E4477` (each with 700/100)
- Fluency dials: fast `#2F8F6F` · medium `#C9A23C` · slow `#B4453C`
- Mastery heatmap (5-step): `#F3F1EA → #DDE3F0 → #B5C2DD → #6B7FA8 → #2E4477 → #1A2A4F` + gold overlay
- Module accents (used **only** on that module's own surface): mathpath navy, science teal `#2F6B7E`,
  spelling aubergine `#6B4F7E`, planner moss `#2F7E5A`. **(`reading` bronze exists in the CSS — drop it, see §7.)**

**Type** — Display **Fraunces** (600), Body **Inter**, Mono **JetBrains Mono** (tabular-nums for all numerics).
Scale: `display-xl 56 / l 44 / m 36 / s 28 · h1 24 / h2 20 / h3 17 · body 15 (body-l 17) · small 13 · micro 11`.
Line-heights `1.1 / 1.25 / 1.5 / 1.65`; tracking `-0.02em` display → `0.08em` caps/micro.

**Spacing** — 4/8pt grid: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`.
**Radii** — `xs 6 (chip) · s 10 (input) · m 14 (button/small card) · l 20 (card) · xl 28 (hero/bottom-nav) · pill 999`.
**Elevation** — `resting` (subtle) · `active` (raised card/nav) · `overlay` (modal) · `focus` (gold halo `0 0 0 4px rgba(201,162,60,.18)`).
**Motion** — easing `calm cubic-bezier(.2,.8,.2,1)` / `out (.16,1,.3,1)`; durations `quick 140 · base 200 · slow 320 · fluency 600`.
**Layout** — container 1200 / narrow 720; nav-h 64; bottomnav-h 68; phone artboard **390×844**.

**Buttons** — heights 36/48/56, radius 14, weight 600; navy=primary, white+hairline=secondary,
transparent=ghost, **gold=premium/celebratory** CTA (use rarely, for the one bright thing).
**Cards** — white, 1px hairline, radius 20, resting shadow; `active` raises to `shadow-active`.
**Badges/chips** — pill (radius 999), tone-coloured 100-bg + 500/700-fg pairs; `s`=22px, `m`=28px.
**Navigation** — floating glassmorphic bottom-nav pill (`blur(20px) saturate(180%)`, inset 12px,
radius 28), active tab = navy text on `navy-050` wash; 4 tabs (student) / 5 tabs (parent, tutor).

---

## 4. Screens already designed

### Student MVP — 10 screens (`Student MVP.html`)
| # | Screen | Group | Nav tab | Maps to module |
| --- | --- | --- | --- | --- |
| 1 | Today (home) | Home | home | (dashboard) |
| 2 | Practice launcher | Home | — | (module launcher) |
| 3 | MathPath dashboard | MathPath | mathpath | **MathPath** |
| 4 | Topic detail | MathPath | — | MathPath |
| 5 | Question practice | Practice | — | MathPath |
| 6 | Fluency practice (timed) | Practice | — | **Fluency Practice** |
| 7 | Mistake review | Practice | — | **Mistake-to-Mastery** |
| 8 | Assignments | Track | home | **Assignments** |
| 9 | Progress overview | Track | profile | **Skill Graph / Progress** |
| 10 | Skill graph / pathway | Track | pathway | Skill Graph / Progress |

### Parent MVP — 10 screens (`Parent MVP.html`)
| # | Screen | Group | Nav tab |
| --- | --- | --- | --- |
| 1 | Parent home | Home | home |
| 2 | Progress overview | Insight | progress |
| 3 | Weak topics | Insight | progress |
| 4 | Recommended actions | Action | actions |
| 5 | Assign practice (5-tap) | Action | — |
| 6 | Mistake history | Action | — |
| 7 | Worksheet generator | Resources | worksheets |
| 8 | Parent training | Resources | more |
| 9 | Tutor & consults | Resources | more |
| 10 | Settings & profile | Resources | more |

Parent design principle (from `Parent MVP.html`): *"the loop is the product"* — every screen either
shows **where** the child is, surfaces **one** action, or carries that action to completion
(progress → weak topic → action → practice → measurable mastery gain).

### Tutor — partial (`ui_kits/tutor-app/tutor-screens-a.jsx`)
Designed: Tutor Home, Lessons, Students (filterable: All / Need attention / P5 / P6), Student
Profile. Nav defined for 5 tabs: Home · Students · Lessons · Homework · More.

### MathPath flow prototype (`MathPath Prototype.html`)
An interactive, stateful walk of the core loop (worked example → guided → independent → timed →
mistake → remediation), incl. an animated subtraction demo. This is the closest reference to the
already-built `mathpath-mvp` practice flow.

---

## 5. Missing screens still needed

Measured against the 12 active/near-term modules in [`tian-os-mvp-scope.md`](../tian-os-mvp-scope.md).

**Student app**
- **Spelling Practice** screens (look/cover/check, dictation, mock test) — *exist in the React app
  under `frontend/src/components/spelling/` but have no Tian-OS-styled design here.*
- **Science Adaptive Revision** screens (revision/diagnostic, open-ended answer + misconception).
- **LifeLab** activity screens (instructions → data recording → reflection → evidence submit).
- **Mastery Worksheet Generator** *student/return* view (only the parent-side generator is designed).
- Onboarding / **placement diagnostic** flow (README describes it; no screens).
- Auth (login/account) — not in either MVP set.

**Parent app** — set is essentially complete for MVP. Missing only: multi-child management beyond
the `ChildSelector`, and a notifications/inbox surface (optional).

**Tutor app (near-term)** — designed Home/Lessons/Students/Profile; **missing**: Lesson prep detail,
Homework/assignment builder, Progress history detail, Session notes editor, Recommendations view.

**Teacher app (future)** — **none designed** (correctly deferred): class list, class mastery map,
group weaknesses, class activities, intervention tracking, LifeLab submissions, reports.

**Cross-role (not yet designed): a Workspace Switcher.** One person can hold multiple roles (e.g.
teacher *and* private tutor) on a single account — see
[`../../TIAN_OS_ARCHITECTURE.md`](../../TIAN_OS_ARCHITECTURE.md) §2.1. We need a calm
workspace-switch control (akin to the parent `ChildSelector` pill) that toggles between **Teacher
workspace** and **Tutor workspace**, since each shows a *different* student list and record set and
school vs. private data must stay separate. Role controls which features appear; workspace controls
which students/records are visible.

---

## 6. Implementation notes for building in the app

1. **Promote the token set first.** Port `colors_and_type.css` wholesale into the app's token source
   (extend `mathpath-mvp/src/lib/tokens.js`): add the missing **spacing**, **radii**, **type-size**,
   and **motion-duration** scales. This directly closes the earlier "missing tokens" gap. Expose as
   CSS variables for static surfaces and as the `T` object for JS-styled components — keep both in
   sync from one source.
2. **Adopt `primitives.jsx` as the shared component library.** `mathpath-mvp/src/components/ui.jsx`
   already implements Card/Button/Chip/Stat/ProgressBar/Ring/Section/ScreenHeader — reconcile the two
   so there is **one** library, then have Spelling/Science/LifeLab consume it (don't re-style per app).
3. **Three bottom-nav variants, one pattern.** Student (4 tabs), Parent (5), Tutor (5) share the
   floating glass pill; parameterise the items, not the styling.
4. **Reuse, don't rebuild, the MathPath loop.** The `MathPath Prototype.html` flow == the shipped
   `mathpath-mvp` practice flow. New modules emit `practice_sessions` to the core
   (see [`../../TIAN_OS_ARCHITECTURE.md`](../../TIAN_OS_ARCHITECTURE.md)) rather than reinventing scoring.
5. **Strip prototype scaffolding.** `ios-frame.jsx`, `design-canvas.jsx`, the `DCSection/DCArtboard`
   wrappers, and Babel-standalone CDN setup are for the static gallery only — never ship them.
6. **Honour the voice + motion rules** in copy and transitions (calm, competence-affirming, subtle).
   Wire `prefers-reduced-motion` to minimise the fluency/ring animations.
7. **Module accent discipline:** a module's accent colour appears **only** on that module's own
   surface — never two module colours in one view (e.g. the dashboard tiles use neutral + one accent).
8. **Build order (matches scope §7):** tokens → shared primitives → Student Today + MathPath loop
   (done) → Progress/Skill-graph → Assignments → Spelling (restyle existing) → Parent dashboard →
   Science → LifeLab → (near-term) Tutor.

---

## 7. Unsupported modules — remove or mark future

The design reference (`README.md`, `colors_and_type.css`) predates the MVP scope correction and
surfaces modules Tian OS does **not** support yet. Treat these as **out of the MVP**:

| Reference says | Correction |
| --- | --- |
| **Reading Companion** (README module table) | ❌ Future. Not an MVP module. |
| `--mod-reading` bronze accent (`colors_and_type.css`) | ❌ Remove the token (already removed from `mathpath-mvp/src/lib/tokens.js`). No "Reading" tile anywhere. |
| **MathThink** (heuristics / Olympiad / IQ) | ❌ Separate future product — out of MathPath scope per `MATHPATH_ROADMAP.md`. |
| **Revision Planner** (README + `--mod-planner`) | ⚠️ Not in the 12 active/near-term modules — treat as **future**; do not surface. |
| Any **English Reading / Reading Practice / Comprehension / Writing Practice / Comprehension Cloze** | ❌ Future. **English = Spelling Practice only** for the MVP. |

**English in the MVP = Spelling Practice only.** No reading/comprehension/writing/cloze cards, nav
items, subject filters, or assignment types. Science Adaptive Revision and LifeLab are in-scope but
**secondary** to the Math core (MathPath + Fluency + Mistake-to-Mastery + Worksheets + Progress +
Assignments). See [`../tian-os-mvp-scope.md`](../tian-os-mvp-scope.md) §5–§6 for the full allowlist
and "what not to show" rules.

> When implementing from this reference, **filter every module list, nav, and subject picker through
> the MVP scope allowlist** — the reference's broader ambition is the roadmap, not the MVP.
