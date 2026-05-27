---
name: tian-os-design
description: Use this skill to generate well-branded interfaces and assets for Tian OS, the AI-native mastery learning operating system from Tian Jun Education Group. Use for production code or throwaway prototypes / mocks / decks. Contains the design philosophy, color and type tokens, motion rules, iconography, and a 5-screen mobile UI kit (student app) to lift components from.
user-invocable: true
---

Read the `README.md` file within this skill to understand Tian OS's product philosophy, calm-intelligence voice, navy + gold visual direction, and module ecosystem (MathPath, MathThink, Science Adaptive Revision, Spelling Companion, Reading Companion, Revision Planner).

Then explore:

- `colors_and_type.css` — design tokens: navy + gold + neutrals + semantic + mastery scale, type scale, spacing, radii, shadows, motion. Import this in any HTML artifact and use the CSS variables.
- `preview/` — small one-concept cards showing every token in use (color scales, type specimens, components, motion curves). Good reference for what "right" looks like.
- `ui_kits/student-app/` — the canonical mobile-first kit. Five screens:
  1. Unified student dashboard
  2. MathPath module dashboard (mastery score, heatmap, topic levels, prerequisites)
  3. Timed fluency practice (Kumon-style, calm timer, streak, keypad)
  4. AI remediation (Worked → Guided → Independent → Fluency 4-step flow)
  5. Skill pathway / mastery graph (interconnected nodes with prerequisite edges)
  Components are factored across `tokens.jsx`, `icons.jsx`, `primitives.jsx`, and one file per screen. Copy what you need; do not re-skin.

When creating visual artifacts (slides, mocks, prototypes), copy the relevant assets and CSS into the working directory and reference them. Output static HTML the user can open. When working on production code, lift the tokens directly and use them as a source of truth.

If the user invokes this skill without other guidance, ask:

1. What surface? (student app / parent dashboard / tutor console / marketing / slides / report)
2. Which module(s)? (MathPath / MathThink / Science / Spelling / Reading / Planner / cross-cutting)
3. Variations? (1 polished direction or 3+ exploratory)
4. Mobile-first, desktop, or both?

Then design as a Tian OS expert and output HTML artifacts or production code. Honour the rules in `README.md`:

- **Voice:** calm coach, never schoolish or hyped. Sentence case. No emoji. Math glyphs (×, ÷, ½, →) as Unicode.
- **Visual:** white background, soft navy primary, gold sparingly. Generous whitespace. Rounded cards. No childish or gamified motifs.
- **Motion:** fades and short translates only — no bounces, no scale-pop.
- **Icons:** Lucide outline, 1.75px stroke. Never filled.
- **Type:** Fraunces (display, headlines), Inter (body, UI), JetBrains Mono (math, numerics with tabular-nums).
