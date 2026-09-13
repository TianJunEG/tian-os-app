import crypto from 'crypto';
import logger from '../../config/logger.js';
import PSLSession from '../../models/psl/PSLSession.js';
import PSLAttempt from '../../models/psl/PSLAttempt.js';
import PSLSkill from '../../models/psl/PSLSkill.js';
import Mistake from '../../models/Mistake.js';
import LearningResult from '../../models/LearningResult.js';
import MasteryRecord from '../../models/MasteryRecord.js';
import { recordAttempt } from '../../utils/masteryEngine.js';
import { generateProblemsForSession } from './problemGenerator.js';
import { evaluateStep, evaluateAttempt } from './stepEvaluator.js';

function sanitizeProblemForClient(problem) {
  if (!problem) return null;
  const sanitized = {
    problemId: problem.problemId,
    templateId: problem.templateId,
    storyText: problem.storyText,
    givenNumbers: problem.givenNumbers,
    status: problem.status,
    heuristic: problem.heuristic,
    structure: problem.structure,
    unknownPosition: problem.unknownPosition || null,
    scaffoldSteps: (problem.scaffoldSteps || []).map((step) => {
      const out = {
        stepId: step.stepId,
        type: step.type,
        prompt: step.prompt,
        choices: step.choices || [],
      };
      // Tell the client how many clues to find WITHOUT leaking which ones.
      if (step.stepId === 'identify_info') {
        out.expectedCount = (step.expectedResponse?.numbers || []).length;
      }
      return out;
    }),
  };
  if (problem.status === 'completed' && problem.solutionText) {
    sanitized.solutionText = problem.solutionText;
  }
  if (problem.status === 'completed' && problem.visualSpec) {
    sanitized.visualSpec = problem.visualSpec;
  }
  return sanitized;
}

export async function startSession({ studentId, skillId, workspaceId, problemCount = 5, assignmentId = null }) {
  const skill = await PSLSkill.findOne({ skillId }).lean();
  if (!skill) throw Object.assign(new Error(`PSL skill not found: ${skillId}`), { status: 404 });

  const mastery = await MasteryRecord.findOne({ studentId, skillId: skill._id, module: 'PSL' }).lean().catch(() => null);
  const { problems, targetDifficulty } = await generateProblemsForSession(skillId, problemCount, {
    masteryScore: mastery?.score ?? null,
  });
  const session = await PSLSession.create({
    sessionId: crypto.randomUUID(),
    studentId,
    skillId,
    workspaceId,
    assignmentId,
    targetDifficulty,
    status: 'inProgress',
    problems,
    currentProblemIndex: 0,
    startedAt: new Date(),
    summary: { totalProblems: problems.length },
  });

  return {
    sessionId: session.sessionId,
    skillId,
    skillName: skill.name,
    totalProblems: problems.length,
    currentProblem: sanitizeProblemForClient(problems[0]),
    currentProblemIndex: 0,
  };
}

export async function getSession(sessionId, { studentId } = {}) {
  const query = { sessionId };
  if (studentId) query.studentId = studentId;
  const session = await PSLSession.findOne(query).lean();
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

  const [attempts, skill] = await Promise.all([
    PSLAttempt.find({ sessionId }).lean(),
    PSLSkill.findOne({ skillId: session.skillId }).lean(),
  ]);
  const attemptsByProblem = {};
  for (const a of attempts) attemptsByProblem[a.problemId] = a;

  return {
    ...session,
    skillName: skill?.name || session.skillId,
    currentProblem: sanitizeProblemForClient(session.problems[session.currentProblemIndex]),
    attempts: attemptsByProblem,
  };
}

export async function submitStep({ sessionId, problemId, stepId, response, timeSpentMs = 0, studentId = null }) {
  const query = { sessionId };
  if (studentId) query.studentId = studentId;
  const session = await PSLSession.findOne(query);
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

  const problem = session.problems.find((p) => p.problemId === problemId);
  if (!problem) throw Object.assign(new Error('Problem not found'), { status: 404 });

  const scaffoldStep = problem.scaffoldSteps.find((s) => s.stepId === stepId);
  if (!scaffoldStep) throw Object.assign(new Error('Step not found'), { status: 404 });

  const problemVars = {
    givenNumbers: problem.givenNumbers,
    answer: problem.correctAnswer,
    structure: problem.structure,
    unknownPosition: problem.unknownPosition,
    heuristic: problem.heuristic,
  };
  const result = evaluateStep(stepId, response, scaffoldStep.expectedResponse, problemVars);

  let attempt = await PSLAttempt.findOne({ sessionId, problemId });
  if (!attempt) {
    attempt = new PSLAttempt({
      attemptId: crypto.randomUUID(),
      sessionId,
      studentId: session.studentId,
      skillId: session.skillId,
      problemId,
      steps: [],
    });
  }

  const existingIdx = attempt.steps.findIndex((s) => s.stepId === stepId);
  const existingStep = existingIdx >= 0 ? attempt.steps[existingIdx] : null;
  const hintsUsed = existingStep?.hintsUsed || 0;
  const hintPenalty = Math.min(hintsUsed * 0.1, 0.3);
  const penalisedScore = Math.max(0, result.score - (result.correct ? hintPenalty : 0));

  const stepResult = {
    stepId,
    response,
    correct: result.correct,
    partial: result.partial,
    score: penalisedScore,
    misconceptionTag: result.misconceptionTag,
    feedback: result.feedback,
    hintUsed: hintsUsed > 0,
    hintsUsed,
    retried: existingIdx >= 0,
    timeSpentMs,
    submittedAt: new Date(),
  };

  if (existingIdx >= 0) {
    attempt.steps[existingIdx] = stepResult;
  } else {
    attempt.steps.push(stepResult);
  }

  const { overallCorrect, overallScore } = evaluateAttempt(attempt.steps);
  attempt.overallCorrect = overallCorrect;
  attempt.overallScore = overallScore;
  attempt.totalTimeMs = attempt.steps.reduce((sum, s) => sum + (s.timeSpentMs || 0), 0);
  await attempt.save();

  if (problem.status === 'pending') {
    problem.status = 'inProgress';
    await session.save();
  }

  const submitResult = {
    stepId,
    correct: result.correct,
    partial: result.partial,
    score: result.score,
    misconceptionTag: result.misconceptionTag,
    feedback: result.feedback,
    expectedResponse: scaffoldStep.expectedResponse,
  };
  if (result.workedExample) submitResult.workedExample = result.workedExample;
  if (result.remediation) submitResult.remediation = result.remediation;
  return submitResult;
}

export async function completeProblem({ sessionId, problemId, studentId = null }) {
  const query = { sessionId };
  if (studentId) query.studentId = studentId;
  const session = await PSLSession.findOne(query);
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

  const problem = session.problems.find((p) => p.problemId === problemId);
  if (!problem) throw Object.assign(new Error('Problem not found'), { status: 404 });
  problem.status = 'completed';

  const [attempt, pslSkill] = await Promise.all([
    PSLAttempt.findOne({ sessionId, problemId }).lean(),
    PSLSkill.findOne({ skillId: session.skillId }).lean(),
  ]);
  if (attempt) {
    try {
      await recordAttempt({
        studentId: session.studentId,
        skillId: pslSkill?._id || session.skillId,
        workspaceId: session.workspaceId,
        correct: attempt.overallCorrect,
        timeMs: attempt.totalTimeMs,
        module: 'PSL',
        subject: 'Math',
      });
    } catch (err) {
      logger.error({ err: err.message }, 'PSL recordAttempt failed');
    }

    if (!attempt.overallCorrect) {
      const wrongSteps = attempt.steps.filter((s) => !s.correct);
      for (const step of wrongSteps) {
        const scaffoldStep = problem.scaffoldSteps.find((sc) => sc.stepId === step.stepId);
        await Mistake.create({
          studentId: session.studentId,
          workspaceId: session.workspaceId,
          questionId: `${problemId}:${step.stepId}`,
          sessionId,
          module: 'PSL',
          questionText: problem.storyText,
          studentAnswer: JSON.stringify(step.response),
          correctAnswer: JSON.stringify(scaffoldStep?.expectedResponse || step.stepId),
          answerCorrect: false,
          misconceptionTag: step.misconceptionTag,
          mistakeCategory: 'procedure_error',
          severity: step.score === 0 ? 'major' : 'moderate',
        });
      }
    }
  }

  const nextIdx = session.currentProblemIndex + 1;
  const hasMore = nextIdx < session.problems.length;
  if (hasMore) {
    session.currentProblemIndex = nextIdx;
  }
  await session.save();

  return {
    completed: true,
    hasNextProblem: hasMore,
    nextProblem: hasMore ? sanitizeProblemForClient(session.problems[nextIdx]) : null,
    nextProblemIndex: hasMore ? nextIdx : null,
    attemptScore: attempt?.overallScore || 0,
  };
}

export async function completeSession(sessionId, { studentId = null } = {}) {
  const query = { sessionId };
  if (studentId) query.studentId = studentId;
  const session = await PSLSession.findOne(query);
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

  session.status = 'completed';
  session.completedAt = new Date();

  const attempts = await PSLAttempt.find({ sessionId }).lean();
  const completed = attempts.length;
  const fullMarks = attempts.filter((a) => a.overallCorrect).length;
  const totalScore = attempts.reduce((sum, a) => sum + (a.overallScore || 0), 0);
  const totalTime = attempts.reduce((sum, a) => sum + (a.totalTimeMs || 0), 0);

  const misconceptionCounts = {};
  for (const a of attempts) {
    for (const s of a.steps || []) {
      if (s.misconceptionTag) {
        misconceptionCounts[s.misconceptionTag] = (misconceptionCounts[s.misconceptionTag] || 0) + 1;
      }
    }
  }

  session.summary = {
    totalProblems: session.problems.length,
    completedProblems: completed,
    fullMarks,
    partialCredit: completed - fullMarks,
    misconceptionCounts,
    averageTimeMs: completed ? Math.round(totalTime / completed) : 0,
    overallScore: completed ? Math.round((totalScore / completed) * 100) / 100 : 0,
  };
  await session.save();

  const pslSkill = await PSLSkill.findOne({ skillId: session.skillId }).lean();
  await LearningResult.create({
    user: session.studentId,
    source: 'psl',
    subject: 'emath',
    topic: pslSkill?.name || session.skillId,
    accuracy: Math.round(session.summary.overallScore * 100),
    mastered: session.summary.overallScore >= 0.85,
    minutes: Math.round(totalTime / 60000),
  });


  return {
    sessionId,
    summary: session.summary,
    attempts: attempts.map((a) => ({
      problemId: a.problemId,
      overallCorrect: a.overallCorrect,
      overallScore: a.overallScore,
      totalTimeMs: a.totalTimeMs,
      steps: a.steps,
    })),
  };
}

export async function abandonSession(sessionId, { studentId = null } = {}) {
  const query = { sessionId };
  if (studentId) query.studentId = studentId;
  const session = await PSLSession.findOne(query);
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  session.status = 'abandoned';
  await session.save();
  return { sessionId, status: 'abandoned' };
}
