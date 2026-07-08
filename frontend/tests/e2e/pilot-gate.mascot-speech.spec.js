import { test, expect } from '@playwright/test';

// Smoke test for the mascot vocals/speech pipeline, driving the REAL production
// modules (config/mascots -> getMascotVoice -> utils/sound speak) in a browser.
//
// CI-safe by design: we force the Web Speech engine via localStorage
// (ttsEngine='webspeech'), so speak() never kicks off Kokoro's ~80MB neural
// model download — the test has no network dependency beyond the app itself and
// never touches audio hardware. It asserts the wiring (per-mascot voice mapping +
// that speak dispatches a correctly-parameterised utterance without error). The
// neural Kokoro synthesis path is verified manually/locally (it needs the model
// download + WebAssembly, which would make a CI gate flaky).

const EXPECTED_KOKORO_VOICE = {
  tiano: 'am_onyx',
  lysa: 'af_sky',
  lejo: 'am_liam',
  chelya: 'af_sarah',
  talia: 'af_heart',
  kaesy: 'bf_alice',
  kylo: 'am_puck',
};

test('pilot gate: mascot voices map correctly and speech dispatches', async ({ page }) => {
  // Force the Web Speech path before any app code runs (no Kokoro model fetch).
  await page.addInitScript(() => {
    try { localStorage.setItem('ttsEngine', 'webspeech'); } catch { /* ignore */ }
  });

  await page.goto('/');

  const report = await page.evaluate(async () => {
    const out = { ok: true, env: {}, mascots: [] };
    try {
      const mascots = await import('/src/config/mascots.js');
      const sound = await import('/src/utils/sound.js');

      sound.setVoiceEnabled(true);
      sound.setMuted(false);
      out.env.voiceEnabled = sound.isVoiceEnabled();
      out.env.webSpeechAPI = typeof window.speechSynthesis !== 'undefined'
        && typeof window.SpeechSynthesisUtterance !== 'undefined';

      // Capture what the pipeline emits to the Web Speech engine.
      const synth = window.speechSynthesis;
      const captured = [];
      const orig = synth.speak.bind(synth);
      synth.speak = (u) => { captured.push({ text: u.text, rate: u.rate, pitch: u.pitch }); };

      const order = mascots.MASCOT_ORDER || Object.keys(mascots.MASCOTS);
      for (const key of order) {
        captured.length = 0;
        const m = mascots.getMascot(key);
        const v = mascots.getMascotVoice(key);
        sound.speak('Hi, I am ' + m.name + '.', v);
        out.mascots.push({
          key,
          kokoroVoice: v.kokoro,
          pitch: v.pitch,
          rate: v.rate,
          webSpeechFired: captured.length,
          emittedRate: captured[0] && captured[0].rate,
          emittedPitch: captured[0] && captured[0].pitch,
        });
      }
      synth.speak = orig;
    } catch (e) {
      out.ok = false;
      out.error = String((e && e.message) || e);
    }
    return out;
  });

  expect(report.ok, report.error).toBe(true);
  expect(report.env.webSpeechAPI).toBe(true);
  expect(report.env.voiceEnabled).toBe(true);
  expect(report.mascots).toHaveLength(Object.keys(EXPECTED_KOKORO_VOICE).length);

  const pitches = new Set();
  for (const m of report.mascots) {
    // Each mascot maps to its distinct, gender-matched neural voice.
    expect(m.kokoroVoice, `voice for ${m.key}`).toBe(EXPECTED_KOKORO_VOICE[m.key]);
    // speak() dispatched exactly one utterance carrying the mascot's own profile.
    expect(m.webSpeechFired, `web speech fired for ${m.key}`).toBe(1);
    expect(m.emittedRate).toBeCloseTo(m.rate, 5);
    expect(m.emittedPitch).toBeCloseTo(m.pitch, 5);
    // Pitch stays inside the SpeechSynthesis-valid range.
    expect(m.pitch).toBeGreaterThanOrEqual(0.5);
    expect(m.pitch).toBeLessThanOrEqual(1.6);
    // Rate is one of the two age-tiered values.
    expect([0.9, 0.95]).toContain(m.rate);
    pitches.add(Number(m.pitch.toFixed(3)));
  }
  // The Tian 7 are differentiated: several distinct pitches, not one flat voice.
  expect(pitches.size).toBeGreaterThanOrEqual(4);
});
