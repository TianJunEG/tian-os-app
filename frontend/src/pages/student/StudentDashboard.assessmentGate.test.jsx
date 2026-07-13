// Regression: UpperPrimaryRecommendedNext / LowerPrimaryRecommendedNext used to
// FABRICATE fraction skill codes from a raw mastered-skill COUNT —
// Array.from({length: masteredSkillCount}, (_, i) => `F${i+1}`) — to decide
// whether the "Mastery Check" card unlocks. That count includes mastery from ANY
// domain (operations, early numeracy, ...), so a non-fractions student's mastery
// could wrongly unlock (or a fractions student's real progress wrongly stay
// locked behind) the FRACTIONS assessment gate. The correct computation already
// existed one level up in StudentDashboard.jsx (filtering mastered ids to real
// F-codes via /^F\d{3}$/), so both sub-components now take the real
// `assessmentGate` as a prop instead of re-deriving one from a count.
import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UpperPrimaryRecommendedNext } from './StudentDashboardUpperPrimary.jsx';
import { LowerPrimaryRecommendedNext } from './StudentDashboardLowerPrimary.jsx';

const nextAction = { action: 'continuePractice', label: 'Continue Practice' };

function r(node) {
  cleanup();
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

// Button renders <Link to=...> when enabled, but a native disabled <button>
// (no href) when disabled — the card component passes `to={disabled ? undefined : to}`.
describe('UpperPrimaryRecommendedNext — Mastery Check follows the real assessment gate', () => {
  it('locks the Mastery Check when the gate says not ready, regardless of other mastery', () => {
    r(<UpperPrimaryRecommendedNext
      currentSkill={{ skillId: 'OP014', skillName: 'Long division' }}
      nextAction={nextAction}
      hasPlacement
      assessmentGate={{ ready: false }}
    />);
    expect(screen.getByText('Mastery Check')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mastery Check' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Mastery Check' })).toBeNull();
  });

  it('unlocks the Mastery Check when the gate says ready', () => {
    r(<UpperPrimaryRecommendedNext
      currentSkill={{ skillId: 'F010', skillName: 'Equivalent fractions' }}
      nextAction={nextAction}
      hasPlacement
      assessmentGate={{ ready: true }}
    />);
    const link = screen.getByRole('link', { name: 'Mastery Check' });
    expect(link).toHaveAttribute('href', '/student/mathpath/assessment');
  });

  it('defaults to locked when no assessmentGate prop is supplied (fail closed, not fabricated-open)', () => {
    r(<UpperPrimaryRecommendedNext currentSkill={null} nextAction={nextAction} hasPlacement={false} />);
    expect(screen.getByRole('button', { name: 'Mastery Check' })).toBeDisabled();
  });
});

describe('LowerPrimaryRecommendedNext — Mastery Check follows the real assessment gate', () => {
  it('locks the Mastery Check when the gate says not ready', () => {
    r(<LowerPrimaryRecommendedNext
      currentSkill={{ skillId: 'OP001', skillName: 'Addition within 20' }}
      nextAction={nextAction}
      hasPlacement
      assessmentGate={{ ready: false }}
      studentLevel="Primary 1"
    />);
    expect(screen.getByRole('button', { name: 'Mastery Check' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Mastery Check' })).toBeNull();
  });

  it('unlocks the Mastery Check when the gate says ready', () => {
    r(<LowerPrimaryRecommendedNext
      currentSkill={{ skillId: 'F002', skillName: 'Fraction basics' }}
      nextAction={nextAction}
      hasPlacement
      assessmentGate={{ ready: true }}
      studentLevel="Primary 3"
    />);
    const link = screen.getByRole('link', { name: 'Mastery Check' });
    expect(link).toHaveAttribute('href', '/student/mathpath/assessment');
  });
});
