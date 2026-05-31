import { describe, expect, it } from 'vitest';
import { STORY_TTS_CONFIG, splitIntoSentences } from './storyTtsService';

describe('storyTtsService', () => {
  it('defaults to browser TTS with a swappable voice config', () => {
    expect(STORY_TTS_CONFIG.provider).toBe('browser');
    expect(STORY_TTS_CONFIG.voice).toBeTruthy();
  });

  it('splits story text into readable sentences', () => {
    expect(splitIntoSentences('Ali had 18 left. How many at first?')).toEqual([
      'Ali had 18 left.',
      'How many at first?',
    ]);
  });
});
