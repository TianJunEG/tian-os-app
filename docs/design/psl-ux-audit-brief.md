# Problem Solving Lab — Full UX Audit Brief

**Date:** 2026-06-12
**Branch:** `feat/emerald-design-system`
**Status:** PSL is fully functional (engineering-complete), needs design pass

---

## Scope

Full UX audit of **Problem Solving Lab (PSL)** — a 6-step guided word-problem module for Primary 3–6 students (ages 9–12). PSL was built engineering-first with minimal design input. This brief covers the complete student-facing flow: skill browser, session experience, results, and mistake review.

---

## Inventory

| Metric | Count |
|--------|-------|
| Screens | 5 |
| Components | 34 |
| Heuristic types | 10 |
| Misconception tags | 57 |

### Screens

| Screen | File | Purpose |
|--------|------|---------|
| PSLHome | `frontend/src/pages/student/psl/PSLHome.jsx` | Skill browser with level filters, heuristic grouping, mastery badges |
| PSLSession | `frontend/src/pages/student/psl/PSLSession.jsx` | Core 6-step guided problem-solving flow (5 problems per session) |
| PSLResults | `frontend/src/pages/student/psl/PSLResults.jsx` | Session summary — score, full marks, avg time, misconception counts |
| PSLMistakeReview | `frontend/src/pages/student/psl/PSLMistakeReview.jsx` | Aggregated mistake patterns grouped by category |
| DecisionGuide | `frontend/src/pages/student/psl/DecisionGuide.jsx` | Interactive heuristic flowchart (standalone, not linked from session) |

### Key Components

| Component | File | Role |
|-----------|------|------|
| StoryPanel | `components/StoryPanel.jsx` | Displays word problem text; number-tap highlighting in identify_info step |
| StepProgressBar | `components/StepProgressBar.jsx` | 6 colored dots showing step completion state |
| QuestionIdentifier | `components/QuestionIdentifier.jsx` | Multiple-choice selector (used for understand + identify_question) |
| ModelSelector | `components/ModelSelector.jsx` | Pick model type + unknown position (bar-model plan step) |
| PlanDispatcher | `components/PlanDispatcher.jsx` | Routes to 7 plan-type components |
| SolveDispatcher | `components/SolveDispatcher.jsx` | Routes to 6 solve-type components |
| SolvePanel | `components/SolvePanel.jsx` | Expression + answer input (single or two-step) |
| CheckPanel | `components/CheckPanel.jsx` | Binary yes/no reasonableness check with "go back" option |
| StepFeedbackCard | `components/StepFeedbackCard.jsx` | Correct/partial/wrong feedback banner with misconception tip |
| MascotBubble | `components/MascotBubble.jsx` | Speech bubble with placeholder star SVG icon as "mascot" |
| ReasoningInput | `components/ReasoningInput.jsx` | Collapsible text area for student reasoning (hidden by default) |
| WorkedSolutionWalkthrough | `components/WorkedSolutionWalkthrough.jsx` | Step-by-step reveal of worked solution with voice scripts |
| BarModelBuilder | `components/BarModelBuilder.jsx` | Interactive bar model construction |
| BarModelViewer | `components/BarModelViewer.jsx` | Read-only bar model display |
| SolutionVisual | `components/SolutionVisual.jsx` | Visual representation of solution (bar models, diagrams) |
| WorkingCanvas | `components/learning/WorkingCanvas.jsx` | Freehand scratchpad (shared component) |
| PrerequisiteGate | `components/PrerequisiteGate.jsx` | Blocker display for locked skills |
| ChartVisuals | `components/ChartVisuals.jsx` | Chart rendering for data-interpretation problems |

All component paths relative to `frontend/src/pages/student/psl/`.

---

## User Flow

### Session Flow (per problem)

```
Understand → Identify Info → Identify Question → Plan → Solve → Check
```

- **Steps 1–3** are multiple-choice or tap-to-select
- **Steps 4–5** vary by heuristic — each dispatches to a specialized component (7 plan types, 6 solve types)
- **Step 6** is binary yes/no with "go back to solve" option
- Each step: submit → get feedback → continue
- Wrong answers allow 1 retry before showing the correct answer
- After all 6 steps, problem completes → next problem loads (5 per session)

### Navigation Flow

```
PSLHome (skill browser) → PSLSession (5 problems × 6 steps) → PSLResults (summary) → MistakeReview
```

---

## UX Issues

### Critical

#### 1. No hint system

When students get stuck, the only path is: guess wrong → see feedback → retry once → see correct answer. No progressive hints exist. The `MascotBubble` component exists but is only used in the post-hoc worked solution, not during active problem-solving.

**Impact:** Students who don't understand the feedback have no lifeline. This contradicts the guided methodology premise.

#### 2. Feedback is generic and flat

All 6 steps produce one of three messages:
- "Well done!"
- "Almost there — check your answer carefully."
- "Not quite. Let's look at this again."

The 57 misconception tags are captured in data but only the _tip_ text surfaces — and only on the results screen after the session, not during the session when the student needs it most.

**Impact:** The system knows exactly what the student did wrong (e.g., `psl/wrong-model-type`, `psl/arithmetic-error`) but tells them nothing actionable in the moment.

#### 3. No mobile layout

Components use `max-w-2xl` desktop centering. Specific issues:
- StepProgressBar with 6 dots + labels overflows on <400px screens
- SolvePanel's multi-input forms (two-step expression: 4 inputs) are cramped
- StoryPanel number-tap targets are too small for touch (no min 44px hit area)
- No bottom-sheet or swipe patterns for step navigation

### Medium

#### 4. Step labels are developer jargon

"identify_info" and "identify_question" are shown raw with underscores in the step header via `replaceAll('_', ' ')`. These should be child-friendly labels:

| Current | Suggested |
|---------|-----------|
| understand | What's the story about? |
| identify info | Find the clues |
| identify question | What are we looking for? |
| plan | Make a plan |
| solve | Work it out |
| check | Does it make sense? |

#### 5. No visual progression or celebration

MathPath has confetti, streaks, XP animations, and emerald-themed celebrations. PSL has:
- Zero animation
- No celebration on problem completion
- No visual reward for session completion
- Results screen is a static stat card with no emotional payoff
- No streak tracking or progress visualization

#### 6. Mascot is a placeholder SVG star

`MascotBubble` uses a tiny inline SVG star icon as the "mascot." It has no character, no name, no personality. MathPath has its own praise system and voice. PSL has a star emoji in a circle. This needs a character design or should reuse the platform mascot.

#### 7. StoryPanel number highlighting is fragile

The number-tap interaction splits text on `/(\d+)/g` regex. Issues:
- Dates like "2024" become selectable
- Currency like "$5" splits the "$" from the number
- Fractions like "3/4" become two separate tappable numbers
- No visual affordance (pulsing, underline) tells students they should tap numbers
- Deselecting requires remembering which you already tapped

### Low Priority / Opportunities

#### 8. Reasoning input is hidden by default

"+ Write my reasoning" is collapsed on every step. For a module that teaches reasoning methodology, this seems backwards. Consider making it visible by default on at least steps 1 (Understand) and 4 (Plan), where articulating thinking is most valuable.

#### 9. DecisionGuide is disconnected

The heuristic decision flowchart is a standalone page at `/student/psl/guide` with no entry point from the session flow. Students can't access it when they need it (during Plan step). It should be linkable from the Plan step or integrated as a helper overlay.

#### 10. Voice scripts exist but are unused in-session

24 heuristic-specific voice script sets with step-by-step narration exist in `utils/voiceScripts.js`. They're only used in the post-hoc WorkedSolutionWalkthrough. These could power TTS guidance during the active session, similar to MathPath's read-aloud feature (which already uses pitch 1.35 for a younger-sounding voice).

#### 11. Scratchpad has no math tools

The solve step has a collapsible scratchpad (WorkingCanvas), but it's a blank freehand drawing area. No calculator, no number line, no structured working grid. For a problem-solving module, structured math tools would help students show their working.

---

## Design Tokens (Current)

PSL uses the **gold** accent palette (`gold-400`, `gold-500`, `gold-100`) to differentiate from MathPath's emerald.

| Role | Token |
|------|-------|
| Primary accent | `gold-400` / `gold-500` |
| Accent background | `gold-50` / `gold-100` |
| Correct | `emerald-400` / `emerald-100` |
| Partial | `amber-400` / `amber-100` |
| Wrong | `red-400` / `red-100` |
| Worked solution | `sky-500` / `sky-50` |
| Text | `ink-700` (body), `ink-400` (secondary), `ink-800` (headings) |

The gold palette works for differentiation but feels generic — it doesn't convey "problem solving" or "detective/investigator" energy that the 6-step methodology implies.

---

## Heuristic-Specific UX Variants

### Plan Step (7 variants)

| Type | Component | Interaction |
|------|-----------|-------------|
| `model` | ModelSelector | Pick model type + unknown position |
| `reverse_steps` | PlanReverseSteps | Order operations in reverse |
| `table_setup` | PlanTableSetup | Select columns for a table |
| `guess_setup` | PlanGuessSetup | Identify constraints |
| `list_candidates` | PlanListCandidates | Select conditions to filter by |
| `equation_setup` | PlanEquationSetup | Choose variable to eliminate |
| `strategySelect` | PlanStrategySelect | Multiple choice strategy picker |

### Solve Step (6 variants)

| Type | Component | Interaction |
|------|-----------|-------------|
| `expression` / `twoStep` | SolvePanel | Expression input + answer (1 or 2 steps) |
| `reverse_chain` | SolveReverseChain | Chain of reverse operations |
| `find_rule` | SolveFindRule | Pattern table + rule + answer |
| `guess_table` | SolveGuessTable | Iterative guess table |
| `list_check` | SolveListCheck | Systematic listing |
| `eliminate` | SolveEliminate | Simultaneous equation solving |

Each variant has its own UI but they don't share visual language. A unified design system for "interactive math input" would give them consistent styling while preserving their unique interaction patterns.

---

## 10 Heuristic Categories

1. **Bar Model** (Units & Parts) — part-whole, comparison, multi-step
2. **Before-After** — addition, subtraction scenarios
3. **Work Backwards** — reverse operations from final result
4. **Multi-Step Arithmetic** — sequential calculations
5. **Guess & Check / Supposition** — systematic trial
6. **Proportional & Ratio Reasoning** — ratio, proportion, percentage
7. **Data Interpretation** — tables, bar charts, line graphs, pie charts
8. **Excess & Shortage** — distribution comparison
9. **Simultaneous / Elimination** — two-variable systems
10. **Pattern Recognition** — sequences and rules

---

## Recommended Design Priorities

1. **Hint system UX** — design a progressive hint flow (nudge → clue → reveal) that uses the existing MascotBubble + voice scripts infrastructure
2. **Rich in-session feedback** — surface misconception tips during the session, not just on the results screen; use the 57 tags already being captured
3. **Mobile-first session layout** — story panel + step panel + action button must work on 375px width
4. **Celebration and progression** — add confetti/animation on problem + session completion; visual streak/XP consistent with MathPath
5. **Child-friendly step labels and mascot** — replace developer jargon; design a character or reuse platform mascot
6. **Unified math input design system** — consistent styling across all 13 plan + solve variants

---

## Backend Context (for reference)

PSL backend services (not in design scope, but useful context):

| Service | File | Role |
|---------|------|------|
| sessionOrchestrator | `services/psl/sessionOrchestrator.js` | Full session lifecycle — start, submit step, complete problem/session |
| problemGenerator | `services/psl/problemGenerator.js` | Constraint-based number generation, 275+ templates |
| stepEvaluator | `services/psl/stepEvaluator.js` | Evaluation for all 6 steps with misconception tagging |
| prerequisiteChecker | `services/psl/prerequisiteChecker.js` | MathPath skill prerequisite gates |

The backend already captures rich data (misconception tags, partial credit, per-step timing, retry counts) — the design opportunity is surfacing this data to students in the frontend.
