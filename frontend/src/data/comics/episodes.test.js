import { describe, it, expect } from 'vitest';
import { episodes, getFirstEpisode, getLatestEpisode, getResumeEpisode } from './episodes';

describe('comics episode helpers', () => {
  it('getFirstEpisode is Ep 1 and getLatestEpisode is the finale', () => {
    expect(getFirstEpisode().id).toBe(episodes[0].id);
    expect(getFirstEpisode().episode).toBe(1);
    expect(getLatestEpisode().id).toBe(episodes[episodes.length - 1].id);
  });

  it('a brand-new reader resumes at Ep 1, not the latest', () => {
    const resume = getResumeEpisode(new Set());
    expect(resume.id).toBe(getFirstEpisode().id);
    expect(resume.id).not.toBe(getLatestEpisode().id);
  });

  it('resumes at the first unfinished episode (accepts a Set or an array)', () => {
    const firstTwo = [episodes[0].id, episodes[1].id];
    expect(getResumeEpisode(new Set(firstTwo)).id).toBe(episodes[2].id);
    expect(getResumeEpisode(firstTwo).id).toBe(episodes[2].id);
  });

  it('falls back to the latest episode once everything is completed', () => {
    const allIds = episodes.map((e) => e.id);
    expect(getResumeEpisode(allIds).id).toBe(getLatestEpisode().id);
  });
});
