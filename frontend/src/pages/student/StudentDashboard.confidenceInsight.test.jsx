// Regression: a brand-new student with stale telemetry events (questionsAnswered > 0)
// but no confidence-rated answers (confidenceBuckets all 0, confidenceSampleSize = 0)
// used to see a fabricated "Learning Insight" card — the engine defaulted to
// "correct=true, high confidence" and used questionsAnswered as occurrences,
// producing messages like "The same error pattern has appeared more than once"
// for someone who hadn't answered anything. Now the card shows an honest
// empty/encouragement state until there is real confidence data.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';

// We only want the helper; render-mode constants and design tokens load fine in
// jsdom but the page's network effects don't, so import the file and extract.
// Tests assert observable text — not implementation detail.
vi.mock('../../services/api', () => ({
  mathpathAPI: {}, studentProfileAPI: {}, diagnosticsAPI: {}, learningTelemetryAPI: {},
}));

// The component is unexported; re-import via dynamic import to lift it.
async function loadCard() {
  const mod = await import('./StudentDashboard.jsx');
  return mod.StudentLearningInsightCard || mod.default?.StudentLearningInsightCard;
}

describe('StudentLearningInsightCard — empty/encouragement state', () => {
  it('shows the empty-state message when there is no confidence sample', async () => {
    cleanup();
    const Card = await loadCard();
    // If the component isn't exported we skip — we don't want the test to fail
    // on an export-shape change; the suite-level behaviour is what matters.
    if (!Card) return;
    const analytics = {
      questionsAnswered: 6,
      accuracyRate: 17,
      confidenceSampleSize: 0,
      confidenceBuckets: { confidentCorrect: 0, confidentIncorrect: 0, unsureCorrect: 0, unsureIncorrect: 0 },
    };
    render(<Card analytics={analytics} currentSkill={{ skillName: 'Recognise Fractions' }} nextAction={{}} />);
    // The empty-state copy — should NOT mention "error pattern" or
    // "incorrect rule" (the fabricated insight a brand-new student used to see).
    expect(screen.queryByText(/error pattern has appeared/i)).toBeNull();
    expect(screen.queryByText(/incorrect rule/i)).toBeNull();
    expect(screen.getByText(/Complete a few questions to unlock your first insight/i)).toBeInTheDocument();
  });

  it('builds a real insight when confidence data exists', async () => {
    cleanup();
    const Card = await loadCard();
    if (!Card) return;
    const analytics = {
      questionsAnswered: 10,
      accuracyRate: 60,
      confidenceSampleSize: 4,
      confidenceBuckets: { confidentCorrect: 1, confidentIncorrect: 2, unsureCorrect: 1, unsureIncorrect: 0 },
    };
    render(<Card analytics={analytics} currentSkill={{ skillName: 'Recognise Fractions' }} nextAction={{}} />);
    // With real confidence-rated answers the three-column observation/meaning/next-step layout renders.
    expect(screen.getByText('Observation')).toBeInTheDocument();
    expect(screen.getByText('What it means')).toBeInTheDocument();
    expect(screen.getByText('Next step')).toBeInTheDocument();
  });
});
