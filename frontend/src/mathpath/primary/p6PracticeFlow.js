import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getAllSupportedSkillIds } from './p6Orchestrator.js';
import { checkP6Answer, checkP6AnswerCompat } from './p6AnswerChecker.js';

const P6_PREFIXES = ['P6-ALG', 'P6-FR', 'P6-PCT', 'P6-RAT', 'P6-SPD', 'P6-CIR', 'P6-GEO', 'P6-AV', 'P6-DA'];

export function isP6SkillId(skillId) {
  if (!skillId) return false;
  return P6_PREFIXES.some((p) => skillId.startsWith(p));
}

function buildSessionId() {
  return `p6-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function startP6PracticeFlow(skillId, options = {}) {
  const { sessionType = 'practice', questionCount = 10, existingSessionId } = options;

  if (!isP6SkillId(skillId)) {
    return { success: false, error: `Not a P6 skill ID: ${skillId}` };
  }

  const sessionId = existingSessionId || buildSessionId();

  let questions;
  if (sessionType === 'diagnostic') {
    const allSkillIds = getAllSupportedSkillIds();
    questions = generateDiagnosticSet(allSkillIds, 3);
  } else {
    questions = generateQuestionSet(skillId, questionCount);
  }

  if (!questions.length) {
    return { success: false, error: `No questions generated for ${skillId}` };
  }

  return {
    success: true,
    session: {
      sessionId,
      skillId,
      sessionType,
      questions,
      currentIndex: 0,
      attempts: [],
      startedAt: new Date().toISOString(),
    },
  };
}

export function submitP6PracticeAttempt(session, questionIndex, studentAnswer, timeTaken) {
  if (questionIndex < 0 || questionIndex >= session.questions.length) {
    return { success: false, error: 'Invalid question index.' };
  }

  const question = session.questions[questionIndex];
  const result = checkP6Answer(question, studentAnswer);

  const attempt = {
    questionIndex,
    questionId: question.questionId,
    skillId: question.skillId,
    studentAnswer,
    correct: result.correct,
    expected: result.expected,
    timeTaken,
    timestamp: new Date().toISOString(),
  };

  session.attempts.push(attempt);
  session.currentIndex = questionIndex + 1;

  const totalAttempted = session.attempts.length;
  const totalCorrect = session.attempts.filter((a) => a.correct).length;

  return {
    success: true,
    result: {
      ...result,
      solutionText: question.solutionText,
      instructionHint: question.instructionHint,
    },
    progress: {
      totalAttempted,
      totalCorrect,
      totalQuestions: session.questions.length,
      accuracy: totalAttempted > 0 ? totalCorrect / totalAttempted : 0,
      isComplete: session.currentIndex >= session.questions.length,
    },
  };
}

export function checkP6AnswerForSession(session, questionIndex, studentAnswer) {
  if (questionIndex < 0 || questionIndex >= session.questions.length) {
    return { correct: false, error: 'Invalid question index.' };
  }
  return checkP6Answer(session.questions[questionIndex], studentAnswer);
}

export default { isP6SkillId, startP6PracticeFlow, submitP6PracticeAttempt, checkP6AnswerForSession };
