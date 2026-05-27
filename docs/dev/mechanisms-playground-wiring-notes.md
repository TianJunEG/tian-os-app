# Mechanisms Playground — Wiring Notes (Secondary module)

> Mechanisms Playground is a **Secondary** Tian OS module — a lower-secondary
> **D&T** classroom tool for gears, levers, pulleys and linkages. It lives at
> **Tian OS → Secondary → Mechanisms Playground** (route base `/secondary/mechanisms`).
> It is **not** placed under LifeLab, has **no** D&T submenu, and carries no separate
> product identity — it is part of Tian OS and uses the Tian OS design system.

## What existed before
A standalone, in-browser prototype at repo root: `Mechanisms playground/`
(`app.jsx`, `common.jsx`, `gears.jsx`, `levers.jsx`, `pulleys.jsx`, `linkages.jsx`,
`Mechanisms Playground.html`). It loaded React + Babel from a CDN and used browser
globals (`window.GearsSection`, etc.). It was **incomplete** standalone — the HTML
referenced a `teacher.jsx` and `styles.css` that do not exist — so it could not run
as-is. The **simulation logic** (SVG rendering + physics) was sound and was preserved.

## What was created (the Tian OS integration)
All under `frontend/src/pages/secondary/mechanisms/`:

- **`content.js`** — pedagogy as data: per-mechanism objective, key concepts,
  common misconceptions and a teacher discussion prompt (`MECHANISMS`,
  `MECHANISM_ORDER`).
- **`components.jsx`** — reusable Tian OS chrome + learning cards: `SimCanvas`
  (the dominant simulation surface, with a faint technical grid *inside the canvas
  only*), `Slider`, `ControlPanel`, `RunControls`, `Readout`/`ReadoutBar`,
  `Segmented` (sub-mode tabs), `PredictionCard`, `ObservationCard`,
  `ExplanationCard`, `MisconceptionCard`, `ConceptCheck`, `DiscussionCard`,
  `KeyConcepts`, `SimShell` (the standard canvas + control-panel + learning-cards
  layout), `SvgLabel`, `useAnimationFrame`.
- **`sims/{GearsSim,LeversSim,PulleysSim,LinkagesSim}.jsx`** — the four simulators,
  ported from the prototype globals to ES-module React components. The SVG geometry
  and physics (gear ratio/direction, lever class + mechanical advantage with drag,
  pulley MA configs with auto-pull, crank-slider/reverse/parallel kinematics) are
  preserved; only the surrounding chrome was rebuilt with the shared components.
  `sims/index.js` is the key → component registry.
- **`MechanismsHome.jsx`** — overview: breadcrumb, title/subtitle, four mechanism
  cards (explanation + key concepts + open), and a Teacher Mode entry point.
- **`MechanismSimulator.jsx`** — the simulator template: breadcrumb, title,
  learning objective, **Student / Teacher** mode toggle, teacher tools, then the
  mechanism's simulator + key concepts + links to the other mechanisms.
- **`MechanismPresent.jsx`** — classroom presentation view: large simulation,
  minimal controls, answers hidden by default, reveal-explanation / discussion
  buttons, and a mechanism switcher.

## Routing added (inside the Tian OS `ShellLayout`, so it renders in the AppShell)
- `/secondary/mechanisms` → overview
- `/secondary/mechanisms/:mechanism` → simulator (`gears|levers|pulleys|linkages`;
  unknown keys redirect to the overview). `?mode=teacher` opens in Teacher Mode.
- `/secondary/mechanisms/:mechanism/present` → presentation view

Breadcrumb on every page: **Tian OS → Secondary → Mechanisms Playground → {mechanism}**.

## Navigation / dashboard
- `config/modules.js` gains a `mechanisms` module (`status: 'live'`,
  `section: 'Secondary'`) plus a `SECTIONS` grouping (core/Primary, then Secondary).
- `StudentDashboard` now renders the module grid **grouped by section**, so a
  **Secondary** heading appears with the Mechanisms Playground card. No sidebar/
  bottom-nav change (the module is reached from the dashboard card + breadcrumb).

## Design system
- Tian OS core language throughout: white/ivory surfaces, deep navy primary, gold
  accent, hairline borders, rounded `Card`s, soft `shadow-resting/active`, Inter UI
  + JetBrains Mono numerics — reusing `components/ui` (`Card`, `Button`, `Badge`,
  `PageHeader`).
- Secondary **technical sub-style**: a subtle engineering grid lives **only** inside
  `SimCanvas`; slate/bone control panels; monospace readouts; blue for input/motion,
  gold for output, green for correct, amber/red for misconceptions. The SVG
  simulations keep their on-brand navy/gold/green/slate palette.
- Mobile-first/responsive: `SimShell` is a single column on mobile/tablet (canvas
  first, controls below) and canvas + side control panel on `lg`. Learning cards are
  1-col → 2-col. Buttons are finger-sized; the simulation area is always visually
  dominant.
- Accessibility: SVGs have `aria-label`s; correctness is shown with an icon **and**
  colour (not colour alone); buttons have labels and `focus-visible` rings; the
  technical grid is decorative only.

## Teacher / Student structure
- **Student Mode** tools: predict → run → record observation → check understanding →
  try another example (all in the simulator + learning cards).
- **Teacher Mode** tools: Show / Hide answers (reveals prediction + explanation),
  Discussion prompt (toggles the prompt card), Present to class (→ present route),
  Assign task (placeholder notice — see TODOs), Export worksheet (`window.print()`),
  Reset (in the simulator footer).

## Placeholder actions (no broken buttons)
- **Assign task** → an inline notice ("arriving with the Secondary teacher
  dashboard"); there is no D&T assignment backend yet.
- **Export worksheet** → `window.print()` (a real, if basic, action; no print
  stylesheet yet).
- **Save note** (observation) → saved to component state only (no backend persistence).

## Shared-core mastery wiring (added)
The concept check now records into the shared Tian OS core, so D&T mechanisms count
on a student's progress like every other module:

- **Seed** `scripts/seedMechanisms.js` (`npm run seed:mechanisms`): Subject **dt**
  (Design & Technology) → Topic **Mechanisms** → 4 Skills (Gears/Levers/Pulleys/
  Linkages) → 12 MCQ concept-check questions (3 per skill), mirroring the in-app
  checks. `Subject.key` enum extended with `'dt'` (additive). Run after foundation.
- **Route** `routes/mechanisms.js` (`/api/mechanisms`, mounted in `server.js`):
  - `GET /progress` → per-mechanism `{ status, score }` for the student (+ `seeded`).
  - `POST /:key/complete` → body `{ answers: [{ index, correct }] }`; creates a
    `PracticeSession` (module `Mechanisms Playground`, subject `Design & Technology`,
    `skillIds:[skill]`), calls `recordAttempt` per answer (the ONE mastery writer),
    and writes a `PracticeAttempt` + (on wrong) a `Mistake` mapped to the seeded
    `Question` by answer index. Mastery/mistakes stay **isolated from MathPath**
    (which filters `module:'MathPath'`), exactly like Spelling/Science.
- **Frontend**: `mechanismsAPI` (`progress`, `complete`); `ConceptCheck` posts its
  result on completion when given a `mechanismKey` and shows a "Recorded to your
  progress" note; `MechanismsHome` + `MechanismSimulator` show each mechanism's
  mastery `StatusBadge`. The interactive sims and predict/observe/explain cards stay
  client-side; only the concept check is graded into the core. Grading is taken from
  the client (low-stakes self-check); mastery is updated server-side by the engine.

## What remains incomplete / TODO
- Predictions and observations are still local — only the concept check feeds mastery.
- Real **Assign task** flow once a Secondary/D&T teacher dashboard + assignment
  module exist; a proper print/PDF **worksheet export** (dedicated print layout).
- Surface D&T mastery on parent/teacher dashboards (the records exist; the dashboards
  just need a D&T filter, like Science).
- Run `npm run seed:mechanisms` per environment (the route returns a 409 "not seeded"
  hint until then; the UI degrades gracefully and still shows the local score).
- The original `Mechanisms playground/` prototype at repo root is now superseded by
  this module and can be removed (left in place for reference; never committed).

## Commands
```bash
cd frontend && npx vite build   # build check (passes)
npm --prefix frontend run dev    # then open /secondary/mechanisms
```

## Manual test steps
1. Student Dashboard → scroll to the **Secondary** section → **Mechanisms
   Playground** card → Open Playground.
2. Overview shows Gears, Levers, Pulleys, Linkages + a Teacher Mode entry.
3. Open **Gears** → Predict, press **Run simulation**, watch direction/speed,
   adjust teeth, record an observation, take the concept check.
4. Switch to **Teacher** mode → Show answers (prediction + explanation reveal),
   toggle the Discussion prompt, **Present to class** (large canvas, switch
   mechanism, reveal explanation), Export worksheet (print dialog).
5. Confirm the breadcrumb reads Tian OS → Secondary → Mechanisms Playground →
   {mechanism}, and that existing Tian OS pages still work.
