import { describe, it, expect } from 'vitest';
import { buildNarrationSteps, voiceForLine } from './useComicNarration';
import { getMascotVoice } from '../../../config/mascots';

const PANEL = {
  characters: [
    { key: 'lejo', side: 'left' },
    { key: 'kylo', side: 'right' },
  ],
  speech: [
    { text: 'I can smell the char kway teow.', side: 'left' },
    { text: 'Count properly first.', side: 'right' },
  ],
};

describe('comic narration helpers', () => {
  it('voiceForLine resolves the speaking mascot via the line side', () => {
    expect(voiceForLine(PANEL.speech[0], PANEL.characters)).toEqual(getMascotVoice('lejo'));
    expect(voiceForLine(PANEL.speech[1], PANEL.characters)).toEqual(getMascotVoice('kylo'));
  });

  it('falls back to the default voice when no character is on that side', () => {
    expect(voiceForLine({ text: '...', side: 'left' }, [])).toEqual(getMascotVoice(undefined));
  });

  it('buildNarrationSteps keeps authored order and each speaker full voice profile', () => {
    const lejo = getMascotVoice('lejo');
    const kylo = getMascotVoice('kylo');
    const steps = buildNarrationSteps(PANEL);
    expect(steps).toEqual([
      { text: PANEL.speech[0].text, kokoro: lejo.kokoro, gender: lejo.gender, pitch: lejo.pitch, rate: lejo.rate },
      { text: PANEL.speech[1].text, kokoro: kylo.kokoro, gender: kylo.gender, pitch: kylo.pitch, rate: kylo.rate },
    ]);
    // each step carries its mascot's chosen Kokoro voice (the per-character fix)
    expect(steps[0].kokoro).toBe(lejo.kokoro);
    expect(steps[1].kokoro).toBe(kylo.kokoro);
  });

  it('returns no steps for a panel with no dialogue', () => {
    expect(buildNarrationSteps({ characters: [], speech: [] })).toEqual([]);
    expect(buildNarrationSteps(undefined)).toEqual([]);
  });
});
