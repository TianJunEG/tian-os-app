# Story Mode & Comics Chronicles

**Status:** Working documentation
**Last updated:** June 2026
**Feature flag:** `fractionsStoryMode` (default off — enable with `VITE_ENABLE_FRACTIONS_STORY_MODE=true`)

---

## 1. What it is

Story Mode is a guided word-problem teaching format that wraps fraction multi-step questions in a narrative scene. Instead of presenting a bare equation, the student reads a short story, identifies key facts, draws bar models, selects a strategy, and steps through the solution with scaffold support.

Story Mode is currently implemented for Fractions only, covering skills F025 (Exam Applications) and F026 (Mastery Challenge). Other domains show a "Coming Soon" placeholder.

It is not a standalone app — it is a feature layer inside MathPath that reuses the existing practice session pipeline (`mathpathAPI.startSession`, `practice_attempts`, mastery updates).

---

## 2. Session structure

A story mode session follows six step types:

| Step type | What the student does |
|---|---|
| `read_story` | Read the narrative; sentences are colour-highlighted with tapable facts |
| `identify_question` | Select what the question is asking for |
| `identify_parts` | Identify the given information (fraction parts, quantities, remainders) |
| `choose_strategy` | Pick the problem-solving strategy (bar model, work backwards, one-unit-first, etc.) |
| `solve` | Enter the answer |
| `check` | Verify the answer matches what the question asked |

The engine (`fractionStoryModeEngine.js`) drives the session as a state machine. Each step has a `correct`, `partial`, and `wrong` outcome path. Wrong answers trigger domain-specific supportive feedback messages (e.g. "Check what fraction is left after the part is used or given away.") before re-attempting.

---

## 3. Key fact highlighting

Stories are split into sentences. Each sentence can contain tagged key facts:

| Fact type | Colour | Meaning |
|---|---|---|
| `fraction_part` | Blue | A fraction mentioned in the problem |
| `quantity_known` | Green | A number given explicitly |
| `remainder` | Orange | What is left after an operation |
| `whole` | Purple | The total or complete set |
| `target_unknown` | Red | What the question asks for |
| `operation_hint` | Grey | Language hinting at + − × ÷ |

The student taps a sentence to reveal a model prompt card. The fact type drives which bar model step is displayed next (`StoryFactToModelMapper.jsx`).

---

## 4. Visual models

Story Mode surfaces five visual hint types:

- `fraction_bar` — standard horizontal fraction bar
- `fraction_bar_remainder` — fraction bar with the remainder portion highlighted
- `shaded_grid` — grid with cells shaded to proportion
- `number_line` — fraction on a 0–1 number line
- `part_whole_cards` — card layout showing part and whole separately

The guided bar model (`GuidedBarModelCard.jsx`) shows the step-by-step model building sequence: which fraction is removed, what remains, and labels for each section. It updates as the student progresses through steps.

---

## 5. Strategy menu

Available strategies (shown at the `choose_strategy` step):

- Draw a bar model
- Work backwards
- Find the remaining fraction
- Find one unit first
- Use equivalent fractions
- Break the problem into parts
- Check the final answer against the question

The engine scores the strategy choice and gives targeted feedback for common wrong picks (e.g. "Try again. Match the operation to what happened in the story.").

---

## 6. Audio narration

Story text is read aloud using the TTS system (see `MASCOT_TTS.md`). The story module uses `useStoryTextToSpeech.js` with sentence-by-sentence playback:

- Sentences are split on `.`, `!`, `?`, `;` boundaries
- The student can play, pause, or replay individual sentences
- `StoryAudioControls.jsx` shows the current playback status: `idle`, `speaking`, `starting`, `voices_loading`, `blocked`, `failed`
- The mascot assigned to story mode is **Talia** (coral pink, encourager role)

---

## 7. Skill mapping

Story Mode questions map to the top of the Fractions skill graph:

| Skill | ID | Story mode role |
|---|---|---|
| Exam Applications | F025 | Primary story mode content (4 question families: QF_F025_001–004) |
| Mastery Challenge | F026 | Advanced story mode content (4 question families: QF_F026_001–004) |

F025 prerequisites: F018, F019, F020, F021, F022, F023, F024 (all prior fraction operations).
F026 prerequisites: F025.

Attempts in story mode sessions log to `practice_attempts` with `sessionType: 'story'`, update `MasteryRecord`, and create `Mistake` records on wrong answers — the same pipeline as all other MathPath sessions.

---

## 8. Route and entry points

| Route | Component | Notes |
|---|---|---|
| `/student/mathpath/story` | `StoryModeDomainRoute.jsx` | Domain router — currently passes Fractions through, shows "coming soon" for others |
| `/student/mathpath/fractions/story` | `FractionsStoryModeSession.jsx` | Main story session component |

Story mode is linked from the Fractions learning path page and can be launched from an assignment (`assignmentId` passed as a query param).

---

## 9. File map

| File | Role |
|---|---|
| `frontend/src/mathpath/fractions/fractionStoryModeEngine.js` | Session state machine, step evaluation, feedback messages, strategy scoring |
| `frontend/src/mathpath/fractions/fractionStoryModeEngine.test.js` | Engine unit tests |
| `frontend/src/pages/student/mathpath/FractionsStoryModeSession.jsx` | Main session container (state, rendering, answer input) |
| `frontend/src/pages/student/mathpath/StoryModeDomainRoute.jsx` | Domain routing (Fractions live, others placeholder) |
| `frontend/src/pages/student/mathpath/story/StoryAudioControls.jsx` | Play/pause/replay UI for sentence narration |
| `frontend/src/pages/student/mathpath/story/StoryFactToModelMapper.jsx` | Maps tapped fact → bar model step |
| `frontend/src/pages/student/mathpath/story/SentenceHighlighter.jsx` | Renders story text with tapable sentence regions |
| `frontend/src/pages/student/mathpath/story/KeyFactHighlighter.jsx` | Colour-codes key facts within sentences |
| `frontend/src/pages/student/mathpath/story/GuidedBarModelCard.jsx` | Step-by-step bar model visual |
| `frontend/src/pages/student/mathpath/story/ModelDrawingPromptCard.jsx` | Model prompt card for selected fact |
| `frontend/src/mathpath/story/storyTtsService.js` | Low-level TTS: sentence splitting, voice detection, fallback config |
| `frontend/src/mathpath/story/useStoryTextToSpeech.js` | React hook: sentence-by-sentence playback, play/pause/stop |
| `frontend/tests/e2e/story-mode-direct-routes.spec.js` | E2E route tests |

---

## 10. Expanding to other domains

To add story mode for a new domain:

1. Create story question content in that domain's question families (tagged with a story context).
2. Add a domain-specific story session component alongside `FractionsStoryModeSession.jsx`.
3. Register the domain in `StoryModeDomainRoute.jsx`.
4. Update `domainCatalog.js` `storyMode` field from `'planned'` to `'live'`.
5. Enable with a feature flag if the domain isn't fully pilot-ready.
