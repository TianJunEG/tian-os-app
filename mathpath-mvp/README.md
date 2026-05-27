# MathPath MVP — Multiplication Fluency Vertical Slice

A self-contained **Next.js + Tailwind + MongoDB** implementation of the one working loop from
[`../MVP_BUILD_PLAN.md`](../MVP_BUILD_PLAN.md), styled with the **Tian OS Design System** (light
premium: white surface, navy + gold, Fraunces / Inter / JetBrains Mono), recreating the 5-screen
MathPath prototype from the design handoff:

```
log in → Tian OS dashboard → enter MathPath → recommended skill
→ timed fluency practice → mistake → AI remediation (worked example + guided pattern)
→ mastery profile updates → next recommendation appears
```

Scope is deliberately narrow: **only** the multiplication-fluency chain
(`mul-tables-2510 → mul-tables-346 → mul-tables-6789 → div-within-tables`). No heuristics,
Olympiad, science, spelling, tutor marketplace, school admin, or advanced analytics.

## Run

```bash
cd mathpath-mvp
cp .env.example .env        # optional — runs without it (in-memory store, templated remediation)
npm install
npm run dev                 # http://localhost:3000
```

- **No `MONGODB_URI`** → an in-memory store is used so the loop runs immediately (state resets on restart).
- **No `ANTHROPIC_API_KEY`** → remediation uses a deterministic templated message; the worked example and guided-pattern replication are deterministic either way.

## Structure

| Path | Role |
| --- | --- |
| `src/app/page.jsx` | Tian OS dashboard (lightweight login). |
| `src/app/mathpath/page.jsx` | MathPath module dashboard — recommendation + chain mastery. |
| `src/app/mathpath/practice/page.jsx` | Timed fluency practice, remediation flow, results. |
| `src/components/ui.jsx` | Ported Tian OS design kit (navy + gold, glass, motion presets). |
| `src/components/Keypad.jsx` | Large-target numeric keypad (+ hardware keyboard). |
| `src/lib/graph.js` | The skill graph (multiplication chain) — single source of truth. |
| `src/lib/questions.js` | Procedural question generation + misconception diagnosis. |
| `src/lib/mastery.js` | Mastery engine (`SKILL.md §1`: accuracy **and** speed, first-try un-hinted). |
| `src/lib/recommend.js` | Recommendation engine (start / continue / remediate). |
| `src/lib/remediation.js` | AI remediation (Anthropic Haiku, cached) + deterministic fallback. |
| `src/lib/db.js` | Mongo connection with in-memory fallback. |
| `src/app/api/*` | Route handlers: `recommendation`, `session/start`, `attempt`, `session/complete`. |

## How it maps to the specs

- Skill nodes & edges follow [`../SKILL.md`](../SKILL.md) §1.1 / §4.1.
- Questions follow [`../QUESTION_TAGGING.md`](../QUESTION_TAGGING.md) (generated, not banked).
- Collections follow [`../DATABASE_SCHEMA.md`](../DATABASE_SCHEMA.md); the static graph stays in
  code, only learner state is persisted.

## Not yet wired

- Real auth (login is a name → local id) and the unified Tian OS learning-profile post.
- Persisting `skills`/`skill_edges`/`questions` to Mongo (the graph is code-defined for the slice).
