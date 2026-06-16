# Spoken Input (STT) for Mascots — Spec

## Goal
Let students **answer and explain aloud** — the mascot listens. Closes the loop
with the TTS we already ship, and is a big unlock for lower-primary kids who
can't type and for the fraction-keypad friction.

## Engine options
| Option | Free? | Privacy | Notes |
|--------|-------|---------|-------|
| **Whisper via transformers.js** (already a dep, came in with Kokoro) | ✅ | ✅ on-device | Consistent across devices; model download (~40–200 MB) + CPU latency. Mirrors the Kokoro decision. |
| **Web Speech API `SpeechRecognition`** | ✅ | ⚠️ cloud (Chrome→Google) | Zero download, but Chrome/Safari-only, variable, and sends kids' audio to a cloud recognizer. |

**Recommendation:** on-device **Whisper-web** (whisper-tiny/base) for privacy +
consistency, with Web Speech as an optional fast fallback. Same "in-browser,
free, no backend" posture as the voices.

## Phasing (start low-stakes)
1. **Spoken self-explanation first.** Free-form, low-stakes: capture/transcribe
   the student's reasoning after a correct answer (pairs with the
   self-explanation prompt). No answer-parsing needed — just transcribe + store.
2. **Spoken answers second.** Needs a parse layer (spoken → value) and high
   accuracy, so it comes after #1 proves the mic UX.

## UX
- Mic button in the answer/explanation area; **press-to-talk**.
- **Show the transcript for confirmation** before submit (kids + accuracy).
- Mascot prompt: "Tell me your answer" / "Say why that works."

## Hard parts / decisions needed
- **Kid-speech accuracy** is lower than adult; **accents** (SG / Filipino-Latino)
  matter — needs real testing.
- **Spoken→fraction parsing** ("three sevenths" → `3/7`, "one and a half" →
  `1 1/2`) — a dedicated normalizer.
- **Mic permissions UX** + graceful denial.
- **Privacy/consent — the gating decision.** Under-13 voice capture (COPPA /
  Singapore PDPA): on-device Whisper avoids sending audio anywhere, which is the
  strongest position; confirm no audio is persisted, and add parental consent.
- **Offline / model size** budget (reuse the Kokoro caching pattern).

## Effort
**Large.** Privacy/consent + parsing are the real work, not the transcription.
Recommend prototyping spoken self-explanation behind a flag first.
