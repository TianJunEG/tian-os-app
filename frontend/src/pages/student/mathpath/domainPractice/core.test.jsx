import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  DOMAIN_PRACTICE_CONFIG,
  getSkillNameMap,
  friendlySkillName,
  buildSubmitPayload,
  summarisePracticeResult,
  mascotMessageFor,
} from './core';
import DomainPracticeSession from './DomainPracticeSession';

describe('domain practice consolidation', () => {
  it('registry covers all 14 non-fractions domains with start/submit/buildView/label', () => {
    const slugs = Object.keys(DOMAIN_PRACTICE_CONFIG);
    expect(slugs.length).toBe(14);
    for (const [slug, c] of Object.entries(DOMAIN_PRACTICE_CONFIG)) {
      expect(typeof c.start, slug).toBe('function');
      expect(typeof c.submit, slug).toBe('function');
      expect(typeof c.buildView, slug).toBe('function');
      expect(typeof c.label, slug).toBe('string');
    }
  });

  it('every domain resolves a non-empty friendly skill-name map', () => {
    for (const slug of Object.keys(DOMAIN_PRACTICE_CONFIG)) {
      expect(getSkillNameMap(slug).size, `${slug} skill names`).toBeGreaterThan(0);
    }
  });

  it('friendlySkillName falls back to the given fallback when the id is unknown', () => {
    expect(friendlySkillName('circles', 'NON_EXISTENT', 'NON_EXISTENT')).toBe('NON_EXISTENT');
  });

  it('renders the loading state for a real domain without crashing', () => {
    render(<MemoryRouter><DomainPracticeSession domain="circles" /></MemoryRouter>);
    expect(screen.getByText(/Starting practice/i)).toBeTruthy();
  });

  it('surfaces a clear error for an unknown domain', () => {
    render(<MemoryRouter><DomainPracticeSession domain="not-a-domain" /></MemoryRouter>);
    expect(screen.getByText(/Unknown practice domain/i)).toBeTruthy();
  });

  it('buildSubmitPayload and summarisePracticeResult keep their shapes', () => {
    expect(buildSubmitPayload([{ questionId: 'q1', studentAnswer: 2, timeTaken: '3' }])).toEqual({
      responses: [{ questionId: 'q1', studentAnswer: '2', timeTaken: 3 }],
    });
    expect(summarisePracticeResult({})).toEqual({ total: 0, correct: 0, accuracyPercentage: 0, skillRows: [] });
  });

  it('mascotMessageFor scales tone with accuracy', () => {
    expect(mascotMessageFor('Circles', 90)).toMatch(/amazing/i);
    expect(mascotMessageFor('Circles', 20)).toMatch(/every try/i);
  });
});
