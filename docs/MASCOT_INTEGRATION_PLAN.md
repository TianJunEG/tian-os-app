# Mascot Integration Plan

The Tian 7 — wiring the mascot characters into the student-facing app.

## Principle
The art and primitives already exist. This is **placement work**, not new
infrastructure: drop the existing `MascotAvatar` / `MascotBubble` /
`getMascotForModule` primitives onto the surfaces where the spec assigns each
mascot.

### Assets in place
- `frontend/public/mascots/<key>.png` — 256×256 head crop, drives circular avatars.
- `frontend/public/mascots/<key>-full.png` — 512×512 full body, currently unused.
- Keys: `tiano`, `lysa`, `lejo`, `chelya`, `talia`, `kaesy`, `kylo`.

### Mascot → module map (from `config/mascots.js`)
| Mascot | Color | Role | Module |
|--------|-------|------|--------|
| Tiano | sky blue | Welcome guide | Onboarding / Home |
| Lysa | lavender | Spelling coach | Spelling |
| Lejo | orange | Problem solver | Problem Solving Lab |
| Chelya | sage green | Progress reporter | Progress / Reflection |
| Talia | coral pink | Encourager | Emotional support |
| Kaesy | electric blue | Hype & rewards | Achievements / Rewards |
| Kylo | deep navy | Math buddy | MathPath |

## Already live (no work needed)
- **Dashboard** — Tiano greeting bubble — `pages/student/StudentDashboard.jsx`
- **Module grid** — each card shows its module's mascot — `components/ui/index.jsx`
  (`ModuleCard` → `getMascotForModule`)
- **PSL** — Lejo speech bubbles — `pages/student/psl/PSLSession.jsx`,
  `psl/components/WorkedSolutionWalkthrough.jsx`

## Phase 0 — Cleanup enablers (do first)
1. **Unify the two `MascotBubble`s.** There are two with incompatible APIs:
   - `components/MascotAvatar.jsx` → `MascotBubble({ name, message })`
   - `pages/student/psl/components/MascotBubble.jsx` → `MascotBubble({ text, mascotKey })`
     **+ TTS via `speak()`**

   Standardize on one component (`mascotKey` + `text` + optional `speak`) so every
   surface behaves identically and TTS is consistent. Keep a thin back-compat shim
   if needed to avoid breaking PSL.
2. **Add `<MascotGreeting mascotKey>` header strip** — a small wrapper over the
   bubble for reuse as module-page intros, so each module header is one line, not
   bespoke markup.

## Phase 1 — Module headers (broad, low risk)
| Mascot | Surface | File |
|--------|---------|------|
| Kylo | MathPath home header | `pages/student/mathpath/MathPathHome.jsx` |
| Lysa | Spelling home header | `pages/student/spelling/SpellingHome.jsx` |
| Chelya | Progress page header | the Progress route page |
| Tiano | Login + Register welcome | `pages/LoginPage.jsx`, `pages/RegisterPage.jsx` |

## Phase 2 — Reward / support behavioral moments
| Mascot | Trigger | File |
|--------|---------|------|
| Kaesy | Correct-answer hype, streaks, completion celebration | `pages/student/mathpath/PracticeResult.jsx` |
| Talia | Encouragement on wrong answers / struggle | shared practice "keep going" states (`PracticeSession.jsx`) |

These touch practice-flow logic (when to show, which message), so higher care
than Phase 1.

## Phase 3 — Profile avatar
- Student picks a mascot as their avatar; shown in nav header.
- Files: `pages/student/StudentProfile.jsx`, nav header, persist to profile.
- **Note:** the sibling branch (`vigilant-nash-9c0d6e`) prototyped this but with a
  *different `MascotAvatar` API* (`mascotKey`/`size=48`, no fallback) + an
  `AuthContext.avatar` field. Adapt the idea to this branch's API rather than copy
  its component, to avoid breaking the existing `name`/`size="md"` callers here.

## Out of scope / open questions
- **Greeting copy** — `mascots.js` only has one `greeting()` per mascot. Phase 1/2
  want context-specific lines (intro vs. celebration vs. encouragement). Extend
  `mascots.js` with a small message map. Decide: personality-rich vs. minimal copy.
- **Guest appearances** — spec says mascots can cameo in other modules; leave for a
  later pass.
- **`-full.png` body art** — currently unused; candidate for a dashboard hero or
  empty-states later.

## Suggested order
Phase 0 → Phase 1 (one PR, broad visible win) → Phase 2 → Phase 3.
