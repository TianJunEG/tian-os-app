// session.js — the practice loop + mastery rule.
//
// One session drills one skill for QUESTIONS_PER_SESSION items. Scaffolding lives here:
// a wrong answer earns a hint and a second try; a second miss reveals the worked answer
// and moves on. Mastery (Kumon-flavoured) needs both accuracy AND speed — and only
// *first-try, un-hinted* correct answers count toward fluency.

import {
  QUESTIONS_PER_SESSION, MASTERY_ACCURACY, SPEED_GRACE, getSkill,
} from './curriculum.js';
import { generateProblem } from './generator.js';

export const MAX_ATTEMPTS = 2;

export function createSession(skillId) {
  return {
    skill: getSkill(skillId),
    total: QUESTIONS_PER_SESSION,
    answered: 0,
    current: null,
    attempts: 0,
    hinted: false,
    questionStart: 0,
    results: [], // { firstTry, eventuallyCorrect, attempts, hinted, timeMs }
  };
}

export function isComplete(session) {
  return session.answered >= session.total;
}

export function nextQuestion(session) {
  session.current = generateProblem(session.skill);
  session.attempts = 0;
  session.hinted = false;
  session.questionStart = Date.now();
  return session.current;
}

// value: the learner's typed number. Returns the UI's next move.
export function submitAnswer(session, value) {
  const correct = Number(value) === session.current.answer;
  session.attempts += 1;

  if (correct) {
    record(session, true);
    return { status: 'correct' };
  }
  if (session.attempts >= MAX_ATTEMPTS) {
    record(session, false);
    return { status: 'revealed', answer: session.current.answer };
  }
  session.hinted = true;
  return { status: 'retry', hint: session.skill.hint };
}

function record(session, eventuallyCorrect) {
  const firstTry = eventuallyCorrect && session.attempts === 1 && !session.hinted;
  session.results.push({
    firstTry,
    eventuallyCorrect,
    attempts: session.attempts,
    hinted: session.hinted,
    timeMs: Date.now() - session.questionStart,
  });
  session.answered += 1;
}

export function scoreSession(session) {
  const total = session.results.length || 1;
  const firstTry = session.results.filter((r) => r.firstTry).length;
  const eventually = session.results.filter((r) => r.eventuallyCorrect).length;
  const avgTimeSec = session.results.reduce((s, r) => s + r.timeMs, 0) / total / 1000;

  const accuracy = firstTry / total; // fluency = first-try, no-hint correct
  const speedOk = avgTimeSec <= session.skill.timeTarget * SPEED_GRACE;
  const mastered = accuracy >= MASTERY_ACCURACY && speedOk;

  return {
    skillId: session.skill.id,
    total: session.results.length,
    firstTry,
    eventually,
    accuracy,
    avgTimeSec,
    timeTarget: session.skill.timeTarget,
    speedOk,
    mastered,
  };
}
