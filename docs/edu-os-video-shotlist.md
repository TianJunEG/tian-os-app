# Tian OS — Launch Video Shot List

Maps each scene of the launch-video brief to a **real screen we can film**, where it lives, and
what's still motion-graphics / to-build. Legend: ✅ real & film-ready · 🟡 partial · 🟠 exists but
not in this repo · ⚪ aspirational (motion-graphics only).

> Tip: seed rich demo data first so dashboards aren't empty on camera —
> `node scripts/seedDemo.js` (creates a demo parent + children with cross-app progress).
> Log in as **demo.parent@tianos.test / Passw0rd!** then film `/children`.

| # | Scene | What to film | Route / source | Status |
|---|-------|--------------|----------------|--------|
| 1 | The Problem | Live-action B-roll (stressed parents, worksheets, late-night tutors). No app UI. | — | n/a |
| 2 | Enter Tian OS | Landing hero: wordmark, tagline, navy/gold, glass header. | `/` (App.jsx LandingPage) | ✅ |
| 3 | AI Worksheet Generator | Worksheet generator + MathPath/Heuristics; progress ring as "mastery". The **photo→AI-misconception** moment is motion-graphics unless we build it (see Hero option below). | Worksheet generator app · `/learning` ring | 🟡 |
| 4 | Adaptive Science | Open-ended Booklet-B revision; concept maps = motion-graphics. | Your local Science app (2,500 Qs) — **push it** to integrate | 🟠 |
| 5 | English & Spelling | Lists, dictation, surprise/revision, word-mastery streaks; parent monitoring from phone. | `/spelling/*`; parent view via `/children/:id` → English | ✅ |
| 6 | Secondary & O-Level | Step-by-step math; "exam readiness" = the readiness ring/bands. Focus mode ⚪. | Math apps · `/learning` & `/children/:id` rings | 🟡 |
| 7 | Tutor & Agency | Tutor search, parent–tutor match, booking, reviews, schedule. Music/sports marketplace ⚪. | `/search`, `/booking/:id`, tutor profiles, `/bookings` | ✅ |
| 8 | The Bigger Vision | **The hero of our actual product**: Parent dashboard (a ring per child) → tap a child → unified cross-app profile (subjects, mastery, weak topics, "fed by …"). Network-graph + extra apps (reading, Chinese, music, planner) = motion-graphics. | `/children` → `/children/:childId` | ✅ core |
| 9 | Final Payoff | Landing hero + dashboards "floating"; logo + tagline end frame. | `/` and `/children` screen-grabs | ✅ |

## Film-ready today (real screens)
- **Landing hero** `/` — Scenes 2 & 9.
- **Parent dashboard** `/children` and **child profile** `/children/:childId` — Scene 8 (and parent-monitoring in 5).
- **Student dashboard** `/learning` — readiness ring for Scenes 3/6.
- **Spelling app** `/spelling/*` — Scene 5.
- **Tutor marketplace** `/search`, `/booking`, `/bookings` — Scene 7.

## Motion-graphics only (not built — don't try to film as product)
Photo→AI misconception diagnosis · science concept maps · O-Level focus mode · exam-readiness
analytics charts · tutor AI lesson recommendations · music/sports marketplace · reading app ·
Chinese spelling · music notation · revision planner · daily planner · the global network graph.

## Bring more scenes into "real" (optional builds, in effort order)
1. **Push the Science app** → Scene 4 becomes a real screen (it already conforms once it POSTs the
   shared result contract; see `routes/learning.js` `POST /result`).
2. **Wire `child` through app launches** so per-child numbers are genuinely live (not just seeded).
3. **AI Worksheet Generator photo→diagnosis** (Scene 3 marquee) — the biggest build: needs a
   vision/LLM step (upload → misconception → generated mastery worksheet).

## Brand kit (for the editor)
- Palette: white `#ffffff` · deep navy `#0a1a33`/`#142b4d` · soft gold `#c9a24b`/`#d4af37`.
- Type: Poppins (headlines) + DM Sans (body) — already loaded in `index.html`.
- Wordmark: "Tian**OS**" (gold "OS"); square mark = navy tile + gold "T".
- Tagline: "AI-Native Learning. Built for Every Student." · Secondary: "Powered by teachers.
  Designed for parents. Personalized by AI." · Footer: "Tian Jun Education Group".
