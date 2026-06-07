import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MathPathAssignments from './MathPathAssignments';

const mocks = vi.hoisted(() => ({
  mathPathAssignments: vi.fn(),
  createAssignmentRecheck: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../../../services/api', () => ({
  mathpathAPI: {
    mathPathAssignments: (...args) => mocks.mathPathAssignments(...args),
    createAssignmentRecheck: (...args) => mocks.createAssignmentRecheck(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <MathPathAssignments />
    </MemoryRouter>
  );
}

describe('MathPathAssignments student recovery pack UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('explains why a recovery pack exists and starts targeted practice', async () => {
    mocks.mathPathAssignments.mockResolvedValue({
      data: {
        assignments: [{
          id: 'assignment-1',
          status: 'assigned',
          sourceType: 'diagnostic',
          title: 'Equivalent Fractions Recovery Pack',
          description: 'Strengthen equivalent fractions.',
          skillIds: ['F011'],
          targetQuestionCount: 12,
          completion: { questionsAttempted: 3, accuracy: 67 },
          recheck: { recommended: false },
          evidenceSource: {
            studentExplanation: 'We noticed difficulty generating equivalent fractions.',
          },
          guidedPracticeFlow: {
            steps: [
              { type: 'worked_example' },
              { type: 'visual_explanation' },
              { type: 'guided_question' },
              { type: 'independent_practice' },
              { type: 'mastery_check' },
            ],
          },
        }],
      },
    });

    renderPage();

    expect(await screen.findByText('Equivalent Fractions Recovery Pack')).toBeInTheDocument();
    expect(screen.getByText(/We noticed difficulty generating equivalent fractions/i)).toBeInTheDocument();
    expect(screen.getByText(/Worked example -> Visual explanation -> Guided practice -> Independent practice -> Mastery check/i)).toBeInTheDocument();
    expect(screen.getByText(/Skills: Making equivalent fractions/i)).toBeInTheDocument();
    expect(screen.queryByText(/\bF011\b/)).not.toBeInTheDocument();
    expect(screen.getByText(/Continue the pack until Tian OS unlocks your recheck/i)).toBeInTheDocument();
    expect(screen.getByText(/Recheck unlocks after enough targeted practice/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Start Recovery Pack/i }));

    expect(mocks.navigate).toHaveBeenCalledWith('/student/mathpath/recovery-pack/assignment-1');
  });

  it('shows recheck when the recovery pack is ready', async () => {
    mocks.mathPathAssignments.mockResolvedValue({
      data: {
        assignments: [{
          id: 'assignment-2',
          status: 'completed',
          sourceType: 'paper_analysis',
          title: 'Paper Review Recovery Pack',
          skillIds: ['F018'],
          targetQuestionCount: 10,
          completion: { questionsAttempted: 10, accuracy: 82 },
          recheck: { recommended: true },
        }],
      },
    });
    mocks.createAssignmentRecheck.mockResolvedValue({ data: { diagnosticSessionId: 'diag-recheck-1' } });

    renderPage();

    expect(await screen.findByText(/An uploaded paper found questions to strengthen/i)).toBeInTheDocument();
    expect(screen.getByText(/Skills: Adding fractions with different denominators/i)).toBeInTheDocument();
    expect(screen.queryByText(/\bF018\b/)).not.toBeInTheDocument();
    expect(screen.getByText(/ready to do a short recheck/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Run Recheck/i }));

    await waitFor(() => {
      expect(mocks.createAssignmentRecheck).toHaveBeenCalledWith('assignment-2');
    });
    expect(mocks.navigate).toHaveBeenCalledWith('/student/mathpath/diagnostic/session/diag-recheck-1');
  });

  it('lets students check recheck readiness after completing a pack', async () => {
    mocks.mathPathAssignments.mockResolvedValue({
      data: {
        assignments: [{
          id: 'assignment-3',
          status: 'completed',
          sourceType: 'diagnostic',
          title: 'Completed Recovery Pack',
          skillIds: ['F012'],
          targetQuestionCount: 12,
          completion: { questionsAttempted: 12, accuracy: 69 },
          recheck: { recommended: false },
        }],
      },
    });
    mocks.createAssignmentRecheck.mockResolvedValue({
      data: { message: 'Complete more of the Recovery Pack before recheck.' },
    });

    renderPage();

    expect(await screen.findByText(/You finished this pack/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Check Recheck Readiness/i }));

    await waitFor(() => {
      expect(mocks.createAssignmentRecheck).toHaveBeenCalledWith('assignment-3');
    });
    expect(await screen.findByText(/Complete more of the Recovery Pack before recheck/i)).toBeInTheDocument();
  });
});
