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

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'student', visualMode: 'p4_6' } }),
}));

vi.mock('../../../../components/learning/WorkingCanvas', () => ({
  resolveWorkingRequirement: () => ({ required: false, allowNoWorking: true, type: 'optional' }),
}));

vi.mock('../../../../components/learning/FullScreenWorkingMode', () => ({
  default: () => <div data-testid="fullscreen-working" />,
}));

function renderDiagnostic({ questions, session }) {
  return render(
    <MemoryRouter
      initialEntries={[{
        pathname: `/student/mathpath/diagnostic/session/session-1`,
        state: { questions, session },
      }]}
    >
      <Routes>
        <Route path="/student/mathpath/diagnostic/session/:diagnosticSessionId" element={<DiagnosticQuestionScreenWrapper />} />
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

const recoverableDiagramQuestion = {
  questionId: 'q-diagram-ok',
  skillId: 'F001',
  questionFamilyId: 'F001-recognition',
  prompt: 'What fraction of the shape is shaded?',
  type: 'short_answer',
  answerFormat: 'fraction',
  answer: { type: 'fraction', numerator: 3, denominator: 5, display: '3/5' },
  requiresDiagram: true,
  workingRequired: false,
};

const recoverableOldDiagramQuestion = {
  ...recoverableDiagramQuestion,
  questionId: 'q-diagram-old',
  diagramSpec: { type: 'legacy_shaded_shape', data: { old: true } },
};

const brokenDiagramQuestion = {
  questionId: 'q-diagram-broken',
  skillId: 'F001',
  questionFamilyId: 'F001-recognition',
  prompt: 'What fraction of the shape is shaded?',
  type: 'short_answer',
  answerFormat: 'fraction',
  answer: { type: 'text', value: 'unknown', display: 'unknown' },
  requiresDiagram: true,
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
        supportiveCopy: 'Try a simpler step.',
        progress: { answeredCount: 1, estimatedQuestionCount: 3, readinessScore: 50 },
        sessionComplete: false,
        nextQuestion: secondQuestion,
        decision: { decisionType: 'PREREQUISITE_PROBE', nextSkillId: 'T001' },
      },
    });
    renderDiagnostic({ questions: [firstQuestion], session: { sessionId: 'session-1' } });

    await screen.findByText(/What is 3 \+ 4/i, {}, { timeout: 5000 });
    // Fast check-in: pick an answer then submit directly — no confidence modal,
    // no working declaration.
    fireEvent.click(await screen.findByRole('button', { name: '7' }));
    fireEvent.click(await screen.findByRole('button', { name: /Next Question/i }));

    await waitFor(() => expect(answerDiagnostic).toHaveBeenCalledTimes(1));
    expect(answerDiagnostic.mock.calls[0][0]).toBe('session-1');
    expect(answerDiagnostic.mock.calls[0][1]).toMatchObject({
      questionId: 'q1',
      answer: '7',
      skipped: false,
    });
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

  it('ends the check-in early when the backend reports the session is complete', async () => {
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

    // Fast check-in: answer + submit directly; backend completes → results.
    fireEvent.click(await screen.findByRole('button', { name: '6' }));
    fireEvent.click(await screen.findByRole('button', { name: /Next Question/i }));

    await waitFor(() => expect(screen.getByText('Diagnostic results')).toBeInTheDocument());
  });

  it('recovers a missing shaded-shape diagram from the fraction answer', async () => {
    renderDiagnostic({ questions: [recoverableDiagramQuestion], session: { sessionId: 'session-1' } });

    expect(await screen.findByText(/What fraction of the shape is shaded/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /fraction bar/i })).toBeInTheDocument();
    expect(screen.queryByText(/This question could not load/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Your answer/i)).toBeInTheDocument();
  });

  it('recovers a shaded-shape diagram when old diagram metadata cannot render', async () => {
    renderDiagnostic({ questions: [recoverableOldDiagramQuestion], session: { sessionId: 'session-1' } });

    expect(await screen.findByText(/What fraction of the shape is shaded/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /fraction bar/i })).toBeInTheDocument();
    expect(screen.queryByText(/This question could not load/i)).not.toBeInTheDocument();
  });

  it('blocks answer controls when a required diagram cannot be rendered', async () => {
    renderDiagnostic({ questions: [brokenDiagramQuestion], session: { sessionId: 'session-1' } });

    expect(await screen.findByText(/This question could not load/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try another question/i })).toBeInTheDocument();
    expect(screen.queryByText(/Your answer/i)).not.toBeInTheDocument();
  });
});
