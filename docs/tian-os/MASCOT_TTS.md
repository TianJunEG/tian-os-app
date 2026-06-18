# The Tian 7 — Mascot & TTS System

**Status:** Working documentation
**Last updated:** June 2026
**Source files:** `frontend/src/config/mascots.js`, `frontend/src/utils/kokoroTTS.js`, `frontend/src/mathpath/story/storyTtsService.js`

---

## 1. The Tian 7

Seven chibi robot-hybrid streetwear kids. Each anchors a module and can guest-appear elsewhere.

| Key | Name | Age | Gender | Colour | Module | Role |
|---|---|---|---|---|---|---|
| `tiano` | Tiano | 18 | boy | Sky blue `#0284c7` | Home | Welcome guide |
| `lysa` | Lysa | 16 | girl | Lavender `#7c3aed` | Spelling | Spelling coach |
| `lejo` | Lejo | 14 | boy | Orange `#ea580c` | PSL | Problem solver |
| `chelya` | Chelya | 12 | girl | Sage green `#059669` | Progress | Progress reporter |
| `talia` | Talia | 10 | girl | Coral pink `#e11d48` | Support / MathPath | Encourager |
| `kaesy` | Kaesy | 8 | girl | Electric blue `#2563eb` | Achievements | Hype & rewards |
| `kylo` | Kylo | 6 | boy | Deep navy | MathPath | Math buddy |

The module-to-mascot mapping is defined in `MODULE_MASCOT_MAP` inside `frontend/src/config/mascots.js`. Use `getMascotForModule(moduleKey)` to resolve the correct mascot for a surface.

---

## 2. TTS architecture

Two-tier voice system: Kokoro neural TTS is the primary voice; Web Speech API is the fallback. Neither requires a backend — both run entirely in-browser.

```
kokoroSpeak(text, { voice, speed })
  → Kokoro neural TTS (ONNX/WASM, ~80MB model, streamed from HuggingFace CDN)
  → If unavailable: Web Speech API (system voices, gender/pitch/rate from mascot profile)
```

The Kokoro model loads once on first use and is cached by the browser. Subsequent calls are instant. Model ID: `onnx-community/Kokoro-82M-v1.0-ONNX` (Apache-2.0 licence, q8 quantised).

---

## 3. Voice assignments

Each mascot has a dedicated Kokoro voice ID and a Web Speech fallback profile derived from age and gender.

| Mascot | Kokoro voice | Gender | Pitch (approx) | Rate |
|---|---|---|---|---|
| Tiano (18, boy) | `am_liam` | male | 0.67 | 0.95 |
| Lysa (16, girl) | `af_sky` | female | 1.03 | 0.95 |
| Lejo (14, boy) | `bm_fable` | male | 0.73 | 0.95 |
| Chelya (12, girl) | `af_sarah` | female | 1.09 | 0.95 |
| Talia (10, girl) | `af_heart` | female | 1.15 | 0.95 |
| Kaesy (8, girl) | `bf_alice` | female | 1.21 | 0.90 |
| Kylo (6, boy) | `am_eric` | male | 0.85 | 0.90 |

Kokoro voice prefix conventions: `af_` = American female, `am_` = American male, `bf_` = British female, `bm_` = British male.

Web Speech fallback pitch is computed from age: `base (0.85 boy / 1.15 girl) + (12 − age) × 0.03`. Children aged ≤ 8 speak at rate 0.90; others at 0.95. Values are clamped to the SpeechSynthesis range (0–2).

To get a mascot's full voice profile:

```js
import { getMascotVoice } from 'frontend/src/config/mascots.js';
const profile = getMascotVoice('talia');
// → { gender: 'female', pitch: 1.15, rate: 0.95, kokoro: 'af_heart' }
```

---

## 4. Kokoro TTS API

Source: `frontend/src/utils/kokoroTTS.js`

```js
import { kokoroSpeak, stopKokoro, loadKokoro, isKokoroSupported } from 'utils/kokoroTTS';

// Check before attempting to load
if (isKokoroSupported()) {
  await loadKokoro();   // pre-warm (optional; kokoroSpeak loads on demand)
}

// Speak text with a mascot's voice
await kokoroSpeak('Great work!', { voice: 'af_heart', speed: 1 });

// Interrupt current playback
stopKokoro();
```

- `isKokoroSupported()` — returns `true` if `WebAssembly` and `Audio` are available.
- `loadKokoro()` — returns a singleton promise; safe to call multiple times. Rejects if the model fails to load (allows retry).
- `kokoroSpeak(text, { voice, speed })` — generates audio and starts playback. Resolves when playback begins. Interrupts any prior playback before starting.
- `stopKokoro()` — pauses current audio and revokes the object URL to free memory.

The consumer (`utils/sound.js`) calls `kokoroSpeak` first and falls back to Web Speech API on rejection. Voice never fails silently.

---

## 5. Story TTS service

Source: `frontend/src/mathpath/story/storyTtsService.js` and `useStoryTextToSpeech.js`

Used specifically for story mode narration. Adds sentence-by-sentence playback on top of the base Kokoro API.

```js
import { useStoryTextToSpeech } from 'mathpath/story/useStoryTextToSpeech';

const { play, pause, stop, status, currentSentenceIndex } = useStoryTextToSpeech({
  text: storyText,
  mascotKey: 'talia',
});
```

Playback states: `idle` | `starting` | `speaking` | `voices_loading` | `blocked` | `failed`.

Sentences are split on `.`, `!`, `?`, `;` boundaries. The hook tracks `currentSentenceIndex` so the UI can highlight the sentence being read. `StoryAudioControls.jsx` consumes this hook to render play/pause/replay buttons.

---

## 6. Mascot narration on the parent dashboard

Source: `frontend/src/mathpath/dashboard/parentMascotNarration.js`

Chelya generates a weekly progress update for the parent dashboard. This is fully deterministic — no LLM involved.

The narration is composed from a `snapshot` object:

```js
{
  childName: 'Kai',
  masteryPercent: 72,
  weeklyStreak: 4,
  focusArea: 'Adding unlike fractions',
  fluencyStatus: 'developing',
  retentionStatus: 'retained',
  recommendations: ['Practice F018', 'Review F019'],
}
```

The output is a short paragraph in Chelya's voice — warm, growth-mindset framing, no alarming language. Gated behind the `parentNarration` feature flag (default off; enable with `VITE_ENABLE_PARENT_NARRATION=true`).

Tests: `frontend/src/mathpath/dashboard/parentMascotNarration.test.js`

---

## 7. MascotAvatar component

Source: `frontend/src/components/MascotAvatar.jsx`

Renders a mascot by key. Loads the mascot's image from `frontend/public/mascots/`. Supports size variants (`sm`, `md`, `lg`) and an optional speech bubble.

```jsx
<MascotAvatar mascot="talia" size="md" />
<MascotAvatar mascot="chelya" size="lg" bubble="Look how far you've come!" />
```

The `MascotBubble.jsx` in `frontend/src/pages/student/psl/components/` is a PSL-specific variant with voice narration built in, used during PSL session steps.

---

## 8. Adding a mascot to a new surface

1. Determine which mascot owns the module. If none fits, use `getMascotForModule(moduleKey)` — it returns the configured mascot for the nearest parent module.
2. Import `getMascotVoice(key)` to get the voice profile.
3. Use `kokoroSpeak(text, { voice: profile.kokoro, speed: profile.rate })` for any spoken text. Wrap in a try/catch and fall back to Web Speech using `profile.gender`, `profile.pitch`, `profile.rate`.
4. Use `<MascotAvatar mascot={key} />` for the visual presence.
5. Keep mascot voice text short (1–2 sentences), warm, and specific to the moment — never generic praise.

---

## 9. Voice audition tool

`mascot-voice-audition.html` (project root) — a standalone HTML page for auditioning Kokoro voice IDs. Lets you try alternate voices per mascot and hear how they sound before updating `KOKORO_VOICE` in `mascots.js`. Run directly in a browser; no server needed.

---

## 10. Privacy note

Kokoro runs entirely in-browser. No audio is transmitted to any server. The model is streamed from HuggingFace CDN once and cached; subsequent sessions use the browser cache. The `spokenInput` feature (mic for spoken self-explanation) requires explicit parental consent before enabling for students under 13 (COPPA / Singapore PDPA). It is off by default (`VITE_ENABLE_SPOKEN_INPUT=true` required).
