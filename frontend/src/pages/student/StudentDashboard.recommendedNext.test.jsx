// Regression: a brand-new student (no diagnostic, no skill placement) used to
// see the dashboard's primary card as:
//   Title:  "Continue Learning"
//   Body:   "Pick up where you left off."
//   CTA:    (the engine's default practice action)
// Even though they had nothing to continue. hasPlacement could be true (the
// engine can recommend a skill for anyone) while currentSkill?.skillName was
// undefined — leaving an empty body fallback that reads as if the student had
// already been here. Now we only treat them as returning when there's a real
// skill name to point at; otherwise show check-in copy.
import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecommendedNextSection } from './StudentDashboard.jsx';

const visual = { mode: 'upper_primary', styles: { card: '', softCard: '', icon: '', primaryIcon: '', decorative: false } };
const nextAction = { action: 'continuePractice', label: 'Continue Practice' };

function r(node) {
  cleanup();
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe('RecommendedNextSection — brand-new student', () => {
  it('shows check-in copy when there is no current skill', () => {
    r(<RecommendedNextSection
      currentSkill={null}
      nextAction={nextAction}
      hasPlacement={false}
      visual={visual}
    />);
    expect(screen.getByText('Take Your Check-In')).toBeInTheDocument();
    expect(screen.getByText(/find your best starting point/i)).toBeInTheDocument();
    // The misleading "Pick up where you left off" must NOT appear.
    expect(screen.queryByText(/Pick up where you left off/i)).toBeNull();
    expect(screen.queryByText('Continue Learning')).toBeNull();
  });

  it('treats hasPlacement=true with no real skill name as new (not "Continue Learning")', () => {
    r(<RecommendedNextSection
      currentSkill={{}}
      nextAction={nextAction}
      hasPlacement
      visual={visual}
    />);
    expect(screen.getByText('Take Your Check-In')).toBeInTheDocument();
    expect(screen.queryByText('Continue Learning')).toBeNull();
    expect(screen.queryByText(/Pick up where you left off/i)).toBeNull();
  });
});

describe('RecommendedNextSection — returning student', () => {
  it('shows "Continue Learning" with the real skill name when one is known', () => {
    r(<RecommendedNextSection
      currentSkill={{ skillId: 'F003', skillName: 'Equivalent Fractions' }}
      nextAction={nextAction}
      hasPlacement
      visual={visual}
    />);
    expect(screen.getByText('Continue Learning')).toBeInTheDocument();
    expect(screen.getByText('Equivalent Fractions')).toBeInTheDocument();
    expect(screen.queryByText('Take Your Check-In')).toBeNull();
  });
});
