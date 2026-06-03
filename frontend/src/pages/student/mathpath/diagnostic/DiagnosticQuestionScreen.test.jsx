import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const answerDiagnostic = vi.fn();
const getDiagnostic = vi.fn();

vi.mock('../../../../services/api', () => ({
  mathpathAPI: {
    answerDiagnostic: (...args) => answerDiagnostic(...args),
    getDiagnostic: (...args) => getDiagnostic(...args),
  },
}));

vi.mock('../../../../components/learning/WorkingCanvas', () => ({
  default: () => <div data-testid="working-canvas" />,
  resolveWorkingRequirement: () => ({ required: false, allowNoWorking: true, type: 'optional' }),
}));

vi.mock('../../../../components/learning/FullScreenWorkingMode', () => ({
  default: () => <div data-testid="fullscreen-working" />,
}));

function renderDiagnostic({ questions, session }) {
  return render(
    <MemoryRouter
      initialEntries={[{
        pathname: `/student/mathpath/diagnostic/session-1`,
        state: { questions, session },
      }]}
    >
      <Routes>
        <Route path="/student/mathpath/diagnostic/:diagnosticSessionId" element={<DiagnosticQuestionScreenWrapper />} />
        <Route path="/student/mathpath/diagnostic/results/:diagnosticSessionId" element={<div>Diagnostic results</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function DiagnosticQuestionScreenWrapper() {
  const Component = React.lazy(() => import('./DiagnosticQuestionScreen.jsx'));
  return (
    <React.Suspense fallback={<div>Loading</div>}>
      <Component />
    </React.Suspense>
  );
}

const firstQuestion = {
  questionId: 'q1',
  skillId: 'T002',
  questionFamilyId: 'QF_T002_001',
  prompt: 'What is 3 + 4?',
  type: 'mcq',
  choices: ['6', '7'],
  answer: '7',
  workingRequired: false,
};

const secondQuestion = {
  questionId: 'q2',
  skillId: 'T001',
  questionFamilyId: 'QF_T001_001',
  prompt: 'What is 2 + 2?',
  type: 'mcq',
  choices: ['3', '4'],
  answer: '4',
  workingRequired: false,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DiagnosticQuestionScreen adaptive flow', () => {
  it('submits answers to the adaptive endpoint and renders returned nextQuestion', async () => {
    answerDiagnostic.mockResolvedValueOnce({
      data: {
        isCorrect: true,
        supportiveCopy: 'Let’s check a smaller step first.',
        progress: { answeredCount: 1, estimatedQuestionCount: 3, readinessScore: 50 },
        sessionComplete: false,
        nextQuestion: secondQuestion,
        decision: { decisionType: 'PREREQUISITE_PROBE', nextSkillId: 'T001' },
      },
    });
    renderDiagnostic({ questions: [firstQuestion], session: { sessionId: 'session-1' } });

    await screen.findByText(/What is 3 \+ 4/i, {}, { timeout: 5000 });
    fireEvent.click(await screen.findByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: /I know this 100%/i }));
    fireEvent.click(screen.getByLabelText(/I did not need working for this question/i));
    fireEvent.click(screen.getByRole('button', { name: /Next Question/i }));

    await waitFor(() => expect(answerDiagnostic).toHaveBeenCalledTimes(1));
    expect(answerDiagnostic.mock.calls[0][0]).toBe('session-1');
    expect(answerDiagnostic.mock.calls[0][1]).toMatchObject({
      questionId: 'q1',
      answer: '7',
      confidence: 'i_know_this',
      skipped: false,
      workingNotNeeded: true,
      workingRequirementLevel: 'LOW',
    });
    expect(await screen.findByText('Let’s check a smaller step first.')).toBeInTheDocument();
    expect(await screen.findByText(/What is 2 \+ 2/i)).toBeInTheDocument();
  });

  it('sends skips through the adaptive endpoint', async () => {
    answerDiagnostic.mockResolvedValueOnce({
      data: {
        isCorrect: false,
        supportiveCopy: 'This helps us find the right starting point.',
        progress: { answeredCount: 1, estimatedQuestionCount: 3, readinessScore: 0 },
        sessionComplete: false,
        nextQuestion: secondQuestion,
        decision: { decisionType: 'STEP_DOWN', nextSkillId: 'T001' },
      },
    });
    renderDiagnostic({ questions: [firstQuestion], session: { sessionId: 'session-1' } });

    fireEvent.click(await screen.findByRole('button', { name: /Skip/i }));

    await waitFor(() => expect(answerDiagnostic).toHaveBeenCalledTimes(1));
    expect(answerDiagnostic.mock.calls[0][1]).toMatchObject({
      questionId: 'q1',
      skipped: true,
      blankAnswer: true,
    });
  });

  it('offers I need help as a confidence option and ends early when backend completes', async () => {
    answerDiagnostic.mockResolvedValueOnce({
      data: {
        isCorrect: false,
        supportiveCopy: 'This tells us what to practise next.',
        progress: { answeredCount: 1, estimatedQuestionCount: 3, readinessScore: 10 },
        sessionComplete: true,
        result: { diagnosticCompleted: true, recommendedStartingSkill: { skillId: 'T001', name: 'Foundation skill' } },
        assignedPracticeSkillIds: ['T001'],
        decision: { decisionType: 'STOP_AND_ASSIGN_PRACTICE', nextSkillId: '' },
      },
    });
    renderDiagnostic({ questions: [firstQuestion], session: { sessionId: 'session-1' } });

    expect(await screen.findByRole('button', { name: /^I need help$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '6' }));
    fireEvent.click(screen.getByRole('button', { name: /^I need help$/i }));
    fireEvent.click(screen.getByLabelText(/I did not need working for this question/i));
    fireEvent.click(screen.getByRole('button', { name: /Next Question/i }));

    await waitFor(() => expect(screen.getByText('Diagnostic results')).toBeInTheDocument());
  });
});
