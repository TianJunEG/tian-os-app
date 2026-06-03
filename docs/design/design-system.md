# Tian OS Design System v2

The shared visual language for the unified Tian OS app. Reuse these tokens and
primitives everywhere — **do not hand-roll cards, buttons, inputs, or badges.**

Source of truth:
- Tokens: `frontend/tailwind.config.js` + `frontend/src/index.css`
- Primitives: `frontend/src/components/ui/index.jsx`
- Shell (sidebar/topbar/bottom-nav): `frontend/src/components/shell/AppShell.jsx`

## Student Core Language

Tian OS for upper primary students should feel warm, modern, encouraging,
premium, and academic. The positioning target is:

- 40% Duolingo
- 30% Canva
- 20% Notion
- 10% Nintendo

Avoid both extremes: not a kindergarten app, not a school portal or LMS. Every
student screen should quickly answer:

1. What should I do next?
2. Why should I do it?
3. How am I progressing?

Student surfaces use motifs, not mascots. Keep motifs small and purposeful:
targets, fractions, numbers, shapes, growth, trophies, stopwatch, lightning,
search, and light bulb. Avoid cartoon mascots, talking animals, neon colour,
dense dashboards, red warning-heavy mistake states, and more than one primary
CTA per screen.

## Tokens

**Colour**
- Page background: `ivory` = `#FAFBFC`. Never use pure white for the full page.
- Brand: `navy-{50..900}` (primary), `gold-{50..700}` (accent).
- Student pastel identity:
  - `tianLavender` `#F1ECFF` — mission cards
  - `tianMint` `#EAF9F1` — progress
  - `tianSky` `#EAF4FF` — fluency
  - `tianPeach` `#FFF1E8` — mistakes
  - `tianYellow` `#FFF8E1` — achievements
  - `tianRose` `#FFEFF3` — confidence
- Neutrals: `ink-{100..900}` (text), `paper` (#fff surface), `ivory` (app bg),
  `bone` (muted fill), `hairline` (borders).
- Semantic: `success-{100,500,700}`, `error-{100,500,700}`. Warning = `gold`,
  info = `navy` (used by `Alert`/`Toast` tones).
- ⚠️ Use `navy-50` (not `navy-050` — that token does not exist; a bug fixed Oct 2025).

**Type**
- Shell/app UI: `font-ui` (Inter); numerics: `font-mono` (JetBrains Mono);
  display headings: `font-display` (Fraunces).
- Marketing/legacy pages still use `font-sans` (Manrope) + `font-display` — see
  Known follow-ups.

**Shape & elevation**
- Radius: primary cards `rounded-[24px]`, controls/buttons `rounded-xl`, pills `rounded-full`.
- Shadow: very soft only. `shadow-resting` = `0 6px 24px rgba(0,0,0,0.04)`;
  `shadow-active` is for hover/overlays. Avoid heavy SaaS shadows.
- Focus: every interactive element uses `focus-visible:ring-2 ring-gold-400/40`.

**Student Page Patterns**
- Home: greeting, large `Today's Mission`, one primary CTA, three compact
  highlight cards, `Recommended Next`, and a short recent activity timeline.
- Progress: avoid percentages alone. Group skills as `Mastered Skills`,
  `Working On`, `Needs Review`, and `Not Started`.
- Confidence: use student-friendly choices: `I know this`, `I'm not sure`,
  `I need help`.
- Working Evidence: label working actions as `Show Your Thinking`, not
  `Upload Working`, wherever the action is student-facing.
- Mobile: no horizontal scrolling, max three cards per section, 48px minimum
  primary tap targets, one primary action.

## Primitives (`components/ui`)

**Layout & content**
`Card`, `PageHeader`, `Divider`, `StatTile`, `ProgressBar`, `EmptyState`, `Spinner`,
`Skeleton`, `ModuleCard`, `Fraction`/`MathText`.

**Actions**
`Button` (variants: primary/secondary/ghost/gold; sizes s/m/l; `icon`, `to` for links),
`IconButton` (icon-only, requires `label`).

**Status & feedback**
`Badge`, `StatusBadge` (maps domain status → tone+label), `Alert`
(tone: info/success/warning/error), `Toast` via `ToastProvider` + `useToast()`,
`Tooltip`.

**Forms** — wrap any control in `Field` for label + hint + error:
`Field`, `Input` (optional leading `icon`, `invalid`), `Textarea`, `Select`,
`Checkbox`, `Radio`.
```jsx
<Field label="Email" error={err}>
  <Input type="email" icon={Mail} value={v} onChange={…} />
</Field>
```

**Navigation**
`Tabs` (underline, routed `NavLink` items), `Segmented` (controlled pill toggle),
`Breadcrumb` (`items: [{label, to?}]`).

**Overlay**
`Modal` (`open`, `onClose`, `title`, `footer`; Esc + scrim close, rendered via portal).

**Notifications** — mount once at the app root (already done in `App.jsx`):
```jsx
const toast = useToast();
toast('Saved', { tone: 'success' });
```

## Coverage status
On-system: the whole Tian OS shell (student/parent/tutor/teacher dashboards,
MathPath, Science, Spelling-practice, LifeLab, Secondary → Mechanisms), and the
auth pages (Login/Register). Legacy marketplace pages and the standalone
`/spelling/*` set are not yet migrated.

## Known follow-ups
- **Migrate remaining pages** onto the kit (legacy marketplace pages; the 12
  standalone `spelling/` pages; `SciencePracticePage`). ~40 pages still hand-roll
  raw inputs/cards.
- **Unify typography:** marketing/legacy pages use Manrope/Fraunces while the shell
  uses Inter/JetBrains/Fraunces. Pick one scale.
- **Dark mode:** not implemented.
- **Promote** any remaining local primitives (e.g. mechanisms' `components.jsx`) to
  the shared kit and delete the duplicates.
