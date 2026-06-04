import { describe, expect, it } from 'vitest';
import {
  buildAnswerFeedback,
  buildGeneratedFractionMistakePayloads,
  buildPracticeTelemetryEvents,
  filterDisplayablePracticeQuestions,
  validatePracticeQuestionForDisplay,
} from './PracticeSession';

describe('PracticeSession telemetry', () => {
  it('builds answered and confidence-selected events from practice results', () => {
    const events = buildPracticeTelemetryEvents({
      studentId: 'student-1',
      sessionType: 'practice',
      practiceSessionId: 'session-1',
      results: [
        {
          questionId: 'q1',
          skillId: 'F001',
          correct: false,
          confidence: 'i_know_this',
          timeTaken: 12,
          workingSubmitted: true,
        },
      ],
    });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      studentId: 'student-1',
      eventType: 'question_answered',
      domain: 'fractions',
      skillCode: 'F001',
      questionId: 'q1',
      sessionId: 'session-1',
      metadata: {
        answerCorrect: false,
        confidence: 'i_know_this',
        timeTakenSeconds: 12,
        workingSubmitted: true,
      },
    });
    expect(events[1]).toMatchObject({
      eventType: 'confidence_selected',
      metadata: { confidence: 'i_know_this' },
    });
  });

  it('builds one mistake payload for every incorrect generated fraction result', () => {
    const mistakes = buildGeneratedFractionMistakePayloads({
      practiceSessionId: 'frac-session-1',
      questions: [
        { questionId: 'q1', skillId: 'F001', prompt: 'What is shaded?', answer: { display: '1/2' } },
        { questionId: 'q2', skillId: 'F002', prompt: 'Find an equivalent fraction.', answer: { display: '2/4' } },
        { questionId: 'q3', skillId: 'F003', prompt: 'Compare fractions.', answer: { display: '>' } },
      ],
      results: [
        { questionId: 'q1', skillId: 'F001', correct: false, studentAnswer: '1/3', correctAnswer: '1/2', confidence: 'i_know_this', answeredAt: '2026-06-04T01:00:00.000Z' },
        { questionId: 'q2', skillId: 'F002', correct: true, studentAnswer: '2/4', correctAnswer: '2/4', confidence: 'not_sure' },
        { questionId: 'q3', skillId: 'F003', correct: false, studentAnswer: '<', correctAnswer: '>', confidence: 'dont_know', answeredAt: '2026-06-04T01:01:00.000Z' },
      ],
    });

    expect(mistakes).toHaveLength(2);
    expect(mistakes[0]).toMatchObject({
      sessionId: 'frac-session-1',
      questionId: 'q1',
      skillCode: 'F001',
      questionText: 'What is shaded?',
      studentAnswer: '1/3',
      correctAnswer: '1/2',
      confidence: 'i_know_this',
    });
    expect(mistakes[1]).toMatchObject({
      questionId: 'q3',
      skillCode: 'F003',
      studentAnswer: '<',
      correctAnswer: '>',
      confidence: 'dont_know',
    });
  });
});

describe('PracticeSession answer feedback', () => {
  it('uses accurate and quick feedback for fast correct answers', () => {
    const feedback = buildAnswerFeedback({
      correct: true,
      timeTaken: 6,
      estimatedSeconds: 20,
      streak: 1,
      questionId: 'F001-q1',
    });

    expect(feedback).toMatchObject({
      correct: true,
      title: 'Correct',
      message: 'Correct — accurate and quick!',
      streakMessage: '',
      showConfetti: false,
    });
  });

  it('uses speed-building feedback for correct but slow answers', () => {
    const feedback = buildAnswerFeedback({
      correct: true,
      timeTaken: 34,
      estimatedSeconds: 20,
      streak: 1,
      questionId: 'F001-q2',
    });

    expect(feedback.message).toBe("Correct — good thinking. Let's build speed next.");
  });

  it('adds streak microcopy after two correct answers', () => {
    const feedback = buildAnswerFeedback({
      correct: true,
      timeTaken: 15,
      estimatedSeconds: 20,
      streak: 2,
      questionId: 'F001-q3',
    });

    expect(feedback.streakMessage).toBe('2 in a row — keep going!');
    expect(feedback.showConfetti).toBe(false);
  });

  it('adds stronger streak microcopy and occasional confetti after three correct answers', () => {
    const feedback = buildAnswerFeedback({
      correct: true,
      timeTaken: 15,
      estimatedSeconds: 20,
      streak: 3,
      questionId: 'F001-q4',
    });

    expect(feedback.streakMessage).toBe("3 in a row! You're on a roll.");
    expect(feedback.showConfetti).toBe(true);
  });

  it('keeps incorrect and skipped feedback calm', () => {
    expect(buildAnswerFeedback({ correct: false }).message).toBe("Let's review this skill.");
    expect(buildAnswerFeedback({ skipped: true }).message).toBe("We'll come back to this.");
  });
});

describe('PracticeSession diagram validation', () => {
  const visualQuestions = [
    {
      label: 'shaded bar model',
      question: {
        questionId: 'bar-1',
        prompt: 'What fraction of the shape is shaded?',
        requiresDiagram: true,
        diagramSpec: {
          type: 'fraction_bar',
          width: 640,
          height: 180,
          data: { parts: 5, shaded: 3, labelMode: 'none' },
        },
      },
    },
    {
      label: 'shaded shape',
      question: {
        questionId: 'shape-1',
        prompt: 'What fraction of the shape is shaded?',
        requiresDiagram: true,
        diagramSpec: {
          type: 'fraction_circle',
          width: 360,
          height: 240,
          data: { parts: 4, shaded: 1, labelMode: 'none' },
        },
      },
    },
    {
      label: 'fraction strip',
      question: {
        questionId: 'strip-1',
        prompt: 'What fraction of the fraction strip is shaded?',
        requiresDiagram: true,
        diagramSpec: {
          type: 'fraction_bar',
          width: 640,
          height: 140,
          data: { parts: 8, shaded: 5, labelMode: 'none' },
        },
      },
    },
    {
      label: 'set model',
      question: {
        questionId: 'set-1',
        prompt: 'Use the set model to identify the selected part.',
        requiresDiagram: true,
        diagramSpec: {
          type: 'part_whole_bar',
          width: 640,
          height: 180,
          data: {
            parts: [
              { value: 3, label: 'selected', fill: '#bfdbfe' },
              { value: 5, label: 'not selected', fill: '#fff' },
            ],
          },
        },
      },
    },
  ];

  it.each(visualQuestions)('allows a renderable $label question', ({ question }) => {
    expect(validatePracticeQuestionForDisplay(question)).toMatchObject({ ok: true });
  });

  it('filters diagram-required questions when diagram data is missing', () => {
    const good = visualQuestions[0].question;
    const broken = {
      questionId: 'broken-1',
      prompt: 'What fraction of the shape is shaded?',
      requiresDiagram: true,
    };

    const result = filterDisplayablePracticeQuestions([broken, good]);

    expect(result.valid).toEqual([good]);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].validation).toMatchObject({
      ok: false,
      reason: 'missing_required_diagram',
      message: "This question could not load. Let's try another one.",
    });
  });

  it('does not block non-visual text questions', () => {
    expect(validatePracticeQuestionForDisplay({
      questionId: 'text-1',
      prompt: 'Which is greater: 1/3 or 1/4?',
    })).toMatchObject({ ok: true });
  });
});
