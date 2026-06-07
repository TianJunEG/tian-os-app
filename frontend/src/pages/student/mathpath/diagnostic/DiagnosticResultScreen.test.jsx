import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DiagnosticResultScreen from './DiagnosticResultScreen.jsx';

const mocks = vi.hoisted(() => ({
  getDiagnostic: vi.fn(),
  getRecheckSummary: vi.fn(),
  createAssignmentFromDiagnostic: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../../../../services/api', () => ({
  mathpathAPI: {
    getDiagnostic: (...args) => mocks.getDiagnostic(...args),
    getRecheckSummary: (...args) => mocks.getRecheckSummary(...args),
    createAssignmentFromDiagnostic: (...args) => mocks.createAssignmentFromDiagnostic(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ diagnosticSessionId: 'diag_recheck_1' }),
    useNavigate: () => mocks.navigate,
    useLocation: () => ({
      state: {
        result: {
          diagnosticPurpose: 'recheck',
          assignmentId: 'assignment_1',
          overallFractionReadinessScore: 76,
          questionsCorrect: 8,
          totalQuestions: 10,
          weakSkillIds: [],
          masteredSkillIds: [],
        },
        timingAnalytics: { overall: {}, attemptsBySkill: [] },
      },
    }),
  };
});

describe('DiagnosticResultScreen recheck summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRecheckSummary.mockResolvedValue({
      data: {
        summary: {
          title: 'Recovery Pack Recheck',
          encouragementMessage: 'Great work. Your practice is showing clear progress.',
          overallImprovement: 34,
          coachingExplanation: 'You improved in adding fractions with different denominators.',
          recoveryPackContext: {
            message: 'This recheck came after your Recovery Pack.',
          },
          improvedSkills: [
            { displayName: 'Adding fractions with different denominators', improvement: 37 },
          ],
          stillNeedsWork: [
            { displayName: 'Solving multi-step fraction problems' },
          ],
          resolvedMisconceptions: [
            {
              title: 'A tricky fraction habit',
              explanation: 'You are no longer adding the bottom numbers directly.',
            },
          ],
          nextRecommendedAction: {
            label: 'Try More Guided Practice',
            reason: 'Solving multi-step fraction problems still needs more practice.',
          },
        },
      },
    });
  });

  it('renders coaching-oriented recheck sections without raw skill IDs', async () => {
    render(<DiagnosticResultScreen />);

    expect(await screen.findByText('Recovery Pack Recheck')).toBeInTheDocument();
    expect(screen.getByText(/Great work/i)).toBeInTheDocument();
    expect(screen.getByText(/This recheck came after your Recovery Pack/i)).toBeInTheDocument();
    expect(screen.getByText(/Overall improvement/i)).toBeInTheDocument();
    expect(screen.getByText('What improved')).toBeInTheDocument();
    expect(screen.getByText('Adding fractions with different denominators')).toBeInTheDocument();
    expect(screen.getByText('Keep practising')).toBeInTheDocument();
    expect(screen.getByText('Solving multi-step fraction problems')).toBeInTheDocument();
    expect(screen.getByText(/bottom numbers directly/i)).toBeInTheDocument();
    expect(screen.getByText('Try More Guided Practice')).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.getRecheckSummary).toHaveBeenCalledWith('diag_recheck_1', { assignmentId: 'assignment_1' });
    });
    expect(document.body.textContent).not.toMatch(/\bF\d{3}\b/);
    expect(document.body.textContent).not.toMatch(/recommended intervention|failed/i);
  });
});
