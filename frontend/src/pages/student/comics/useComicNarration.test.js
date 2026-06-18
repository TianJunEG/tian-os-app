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

  it('buildNarrationSteps keeps authored order and each speaker pitch/rate', () => {
    const steps = buildNarrationSteps(PANEL);
    expect(steps).toEqual([
      { text: PANEL.speech[0].text, pitch: getMascotVoice('lejo').pitch, rate: getMascotVoice('lejo').rate },
      { text: PANEL.speech[1].text, pitch: getMascotVoice('kylo').pitch, rate: getMascotVoice('kylo').rate },
    ]);
    // distinct mascots → distinct pitch (boys lower vs higher)
    expect(steps[0].pitch).not.toBe(steps[1].pitch);
  });

  it('returns no steps for a panel with no dialogue', () => {
    expect(buildNarrationSteps({ characters: [], speech: [] })).toEqual([]);
    expect(buildNarrationSteps(undefined)).toEqual([]);
  });
});
