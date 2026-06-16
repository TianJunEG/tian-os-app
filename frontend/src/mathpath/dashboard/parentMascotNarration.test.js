import { describe, it, expect } from 'vitest';
import { buildMascotNarration } from './parentMascotNarration';

describe('buildMascotNarration', () => {
  it('leads with a streak win when the streak is strong', () => {
    const { body } = buildMascotNarration(
      { mastered: 4, total: 26, streak: 5, attentionSkill: 'Regrouping', accuracy: 60, recommendation: 'practise Regrouping' },
      { childName: 'Maya Tan' },
    );
    expect(body).toContain('Maya');
    expect(body).toContain('5-day streak');
    expect(body).toContain('Best next step:');
  });

  it('uses mastered count as the win when there is no streak', () => {
    const { body } = buildMascotNarration({ mastered: 7, total: 26, streak: 0 }, { childName: 'Kyle' });
    expect(body).toContain('mastered 7 of 26');
  });

  it('names the selected domain in the mastered-count win', () => {
    const { body } = buildMascotNarration(
      { mastered: 5, total: 20, streak: 0 },
      { childName: 'Ivy', domainName: 'Decimals' },
    );
    expect(body).toContain('mastered 5 of 20 Decimals skills');
    expect(body).not.toContain('fraction');
  });

  it('falls back to a generic "skills" noun when no domain is given', () => {
    const { body } = buildMascotNarration({ mastered: 3, total: 10, streak: 0 }, { childName: 'Roy' });
    expect(body).toContain('mastered 3 of 10 skills');
  });

  it('handles a cold start (no progress yet) without sounding negative', () => {
    const { body } = buildMascotNarration({ mastered: 0, total: 26, streak: 0 }, { childName: 'Sam' });
    expect(body).toContain('just getting started');
    expect(body).not.toMatch(/behind|failing|struggling/i);
  });

  it('frames a low-accuracy focus area as growth, with the percentage', () => {
    const { body } = buildMascotNarration({ mastered: 2, attentionSkill: 'Equivalent Fractions', accuracy: 55 }, { childName: 'Ana' });
    expect(body).toContain('Equivalent Fractions');
    expect(body).toContain('55%');
    expect(body).toContain('growth area');
  });

  it('prefers the explicit recommendation for the next step', () => {
    const { body } = buildMascotNarration(
      { mastered: 1, attentionSkill: 'X', accuracy: 90, recommendation: 'try 5 mixed-number questions' },
      { childName: 'Lee' },
    );
    expect(body).toContain('Best next step: try 5 mixed-number questions');
  });

  it('falls back to a friendly default name and headline', () => {
    const { headline, body } = buildMascotNarration({ mastered: 3 });
    expect(headline).toContain('Your child');
    expect(body.length).toBeGreaterThan(0);
  });
});
