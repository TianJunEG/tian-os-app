import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMascotSpeaker } from './sound';

// Drive createMascotSpeaker through the Web Speech path (kokoroReady is false in
// tests, and ttsEngine='webspeech' forces the fallback) with a controllable
// SpeechSynthesis mock so we can step line-by-line. This pins the sequencing and
// the monotonic-token guard that stops a superseded sequence from advancing —
// the replay/panel-change race the review flagged.

describe('createMascotSpeaker', () => {
  let utterances;

  beforeEach(() => {
    utterances = [];
    try { localStorage.setItem('ttsEngine', 'webspeech'); } catch { /* ignore */ }
    const Utt = class {
      constructor(text) { this.text = text; this.onend = null; this.onerror = null; }
    };
    vi.stubGlobal('SpeechSynthesisUtterance', Utt);
    vi.stubGlobal('speechSynthesis', {
      speak: (u) => utterances.push(u),
      cancel: () => {},
      getVoices: () => [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    try { localStorage.removeItem('ttsEngine'); } catch { /* ignore */ }
  });

  const endLast = () => utterances[utterances.length - 1].onend();

  it('plays steps one at a time, reporting onStep then onDone in order', () => {
    const sp = createMascotSpeaker();
    const onStep = vi.fn();
    const onDone = vi.fn();

    sp.play([{ text: 'a' }, { text: 'b' }], { onStep, onDone });
    // Only the first line is speaking — the second waits for it to end.
    expect(utterances).toHaveLength(1);
    expect(onStep).toHaveBeenLastCalledWith(0, expect.anything());

    endLast();
    expect(utterances).toHaveLength(2);
    expect(onStep).toHaveBeenLastCalledWith(1, expect.anything());
    expect(onDone).not.toHaveBeenCalled();

    endLast();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('a superseding play() invalidates the prior sequence (no stale advance)', () => {
    const sp = createMascotSpeaker();
    const doneA = vi.fn();
    const doneB = vi.fn();

    sp.play([{ text: 'a0' }, { text: 'a1' }], { onDone: doneA });
    expect(utterances).toHaveLength(1); // a0 speaking

    sp.play([{ text: 'b0' }], { onDone: doneB }); // panel changed → new sequence
    expect(utterances).toHaveLength(2); // b0 speaking

    // a0's late onend must NOT advance the OLD sequence to a1.
    utterances[0].onend();
    expect(utterances).toHaveLength(2); // still just a0, b0 — no a1 queued
    expect(doneA).not.toHaveBeenCalled();

    // Finishing b0 completes only the new sequence.
    utterances[1].onend();
    expect(doneB).toHaveBeenCalledTimes(1);
  });

  it('stop() halts the sequence and a late end does not advance it', () => {
    const sp = createMascotSpeaker();
    const onDone = vi.fn();

    sp.play([{ text: 'a' }, { text: 'b' }], { onDone });
    expect(utterances).toHaveLength(1);

    sp.stop();
    utterances[0].onend(); // late end after stop
    expect(utterances).toHaveLength(1); // no advance
    expect(onDone).not.toHaveBeenCalled();
  });

  it('skips empty/emoji-only lines without stalling the chain', () => {
    const sp = createMascotSpeaker();
    const onDone = vi.fn();

    sp.play([{ text: '🎉' }, { text: 'real' }], { onDone });
    // The emoji-only line is skipped synchronously; the real line speaks.
    expect(utterances).toHaveLength(1);
    expect(utterances[0].text).toBe('real');

    endLast();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
