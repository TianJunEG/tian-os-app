import { fractionSkillGraph, getSkill } from './fractionSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './fractionQuestionFamilies.js';
import { calculateQuestionFluency } from './fractionFluencyEngine.js';
import { classifyFractionMistake, updatePracticeQueueFromMistake } from './fractionMistakeToMasteryEngine.js';

const ASSESSMENT_STORE = new Map();

const STATUS = {
  NOT_STARTED: 'notStarted',
  IN_PROGRESS: 'inProgress',
  SUBMITTED: 'submitted',
  MARKED: 'marked',
  REVIEWED: 'reviewed',
};

const TYPES = new Set(['baseline', 'progress', 'mastery', 'curriculum', 'mockPaper']);

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function levelNumber(level) {
  const m = String(level || '').toUpperCase().match(/P(\d+)/);
  return m ? Number(m[1]) : 0;
}

function calcAllowed(singaporeLevel, paperType, assessmentType) {
  const n = levelNumber(singaporeLevel);
  if (assessmentType !== 'mockPaper') return false;
  if (n >= 5 && String(paperType || '').toLowerCase() === 'paper2') return true;
  return false;
}

function dedupe(arr) {
  return [...new Set(arr)];
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function singaporeLevelForSkill(skill) {
  const levels = skill?.singaporeLevel || [];
  if (!levels.length) return null;
  return levels[0];
}

function skillInLevel(skillId, singaporeLevel) {
  const skill = getSkill(skillId);
  const n = levelNumber(singaporeLevel);
  const mapped = levelNumber(singaporeLevelForSkill(skill));
  if (!mapped || !n) return true;
  return mapped <= n;
}

function normalizeFamilyWeight(family) {
  // non-mental / working-required items weighted slightly higher for assessments
  if (family.workingRequired && !family.mentalMathEligible) return 1.2;
  return 1;
}

export function selectAssessmentTargets(options = {}) {
  const {
    assessmentType = 'baseline',
    singaporeLevel = 'P4',
    targetSkillIds = [],
    weakSkillIds = [],
    recentSkillIds = [],
    masteredSkillIds = [],
    mode = 'core',
  } = options;

  const allSkills = fractionSkillGraph.skillIds.filter((id) => skillInLevel(id, singaporeLevel));
  let chosenSkills = [];

  if (assessmentType === 'baseline') {
    const step = Math.max(1, Math.floor(allSkills.length / 8));
    chosenSkills = allSkills.filter((_, idx) => idx % step === 0).slice(0, 10);
  } else if (assessmentType === 'progress') {
    chosenSkills = dedupe([...weakSkillIds, ...recentSkillIds]).filter((id) => allSkills.includes(id));
    if (!chosenSkills.length) chosenSkills = allSkills.slice(0, 8);
  } else if (assessmentType === 'mastery') {
    chosenSkills = dedupe(masteredSkillIds).filter((id) => allSkills.includes(id));
    if (!chosenSkills.length) chosenSkills = allSkills.slice(-8);
  } else if (assessmentType === 'curriculum') {
    const n = levelNumber(singaporeLevel);
    chosenSkills = allSkills.filter((id) => levelNumber(singaporeLevelForSkill(getSkill(id))) <= n).slice(-12);
  } else if (assessmentType === 'mockPaper') {
    const anchors = ['F003', 'F007', 'F010', 'F015', 'F018', 'F020', 'F023', 'F025'];
    chosenSkills = anchors.filter((id) => allSkills.includes(id));
    if (!chosenSkills.length) chosenSkills = allSkills.slice(-10);
  }

  if (Array.isArray(targetSkillIds) && targetSkillIds.length) {
    chosenSkills = dedupe(targetSkillIds.filter((id) => allSkills.includes(id)));
  }

  const questionFamilies = chosenSkills.flatMap((skillId) =>
    getQuestionFamiliesBySkill(skillId)
      .slice(0, assessmentType === 'mockPaper' ? 3 : 2)
      .map((f) => f.id)
  );

  return {
    skillIds: chosenSkills,
    questionFamilyIds: dedupe(questionFamilies),
    coverage: {
      assessmentType,
      totalSkillsAvailable: allSkills.length,
      selectedSkills: chosenSkills.length,
      selectedFamilies: dedupe(questionFamilies).length,
      mode,
    },
  };
}

export function buildFractionAssessmentSession(options = {}) {
  const {
    studentId,
    assessmentType = 'baseline',
    singaporeLevel = 'P4',
    targetSkillIds = [],
    mode = 'core',
    paperType = 'paper1',
    weakSkillIds = [],
    recentSkillIds = [],
    masteredSkillIds = [],
  } = options;

  if (!studentId) throw new Error('studentId is required.');
  if (!TYPES.has(assessmentType)) throw new Error('Invalid assessmentType.');

  const targets = selectAssessmentTargets({
    assessmentType,
    singaporeLevel,
    targetSkillIds,
    weakSkillIds,
    recentSkillIds,
    masteredSkillIds,
    mode,
  });

  const calculatorAllowed = calcAllowed(singaporeLevel, paperType, assessmentType);
  const workingRequired = true; // assessment default: required except mental families per question
  const totalMarks = Math.max(20, targets.questionFamilyIds.length * 2);
  const timeLimitMinutes =
    assessmentType === 'mockPaper' ? 50 : assessmentType === 'curriculum' ? 40 : assessmentType === 'mastery' ? 35 : 30;

  const session = {
    assessmentSessionId: makeId('fracassess'),
    studentId,
    assessmentType,
    mode,
    singaporeLevel,
    targetSkillIds: targets.skillIds,
    targetQuestionFamilyIds: targets.questionFamilyIds,
    totalMarks,
    timeLimitMinutes,
    calculatorAllowed,
    workingRequired,
    paperType,
    status: STATUS.NOT_STARTED,
    createdAt: nowIso(),
    startedAt: null,
    submittedAt: null,
    targetCoverage: targets.coverage,
  };

  ASSESSMENT_STORE.set(session.assessmentSessionId, session);
  return session;
}

function buildWorkingSummary(responses = []) {
  const expectedResponses = responses.filter((r) => {
    const family = getQuestionFamily(r.questionFamilyId);
    return family ? family.workingRequired && !family.mentalMathEligible : false;
  });
  const workingExpected = expectedResponses.length;
  const workingUploaded = expectedResponses.filter((r) => r.workingUploaded).length;
  const missingWorking = Math.max(0, workingExpected - workingUploaded);
  return {
    workingExpected,
    workingUploaded,
    missingWorking,
    completenessRate: workingExpected ? Math.round((Math.min(workingUploaded, workingExpected) / workingExpected) * 1000) / 10 : 100,
  };
}

function aggregateBreakdown(responses, keySelector) {
  const map = new Map();
  responses.forEach((r) => {
    const key = keySelector(r);
    if (!key) return;
    if (!map.has(key)) map.set(key, { marksAwarded: 0, totalMarks: 0, attempts: 0, correct: 0, fluencyFlags: [] });
    const item = map.get(key);
    item.marksAwarded += toNum(r.marksAwarded);
    item.totalMarks += toNum(r.totalMarks, 1);
    item.attempts += 1;
    if (r.correct) item.correct += 1;
    const family = getQuestionFamily(r.questionFamilyId);
    item.fluencyFlags.push(calculateQuestionFluency(r, family).fluencyFlag);
  });

  return Array.from(map.entries()).reduce((acc, [key, val]) => {
    const percentage = val.totalMarks ? Math.round((val.marksAwarded / val.totalMarks) * 1000) / 10 : 0;
    const accuracy = val.attempts ? Math.round((val.correct / val.attempts) * 1000) / 10 : 0;
    const accurateButSlow = val.fluencyFlags.filter((f) => f === 'accurateButSlow').length;
    acc[key] = {
      marksAwarded: val.marksAwarded,
      totalMarks: val.totalMarks,
      percentage,
      accuracy,
      accurateButSlowCount: accurateButSlow,
    };
    return acc;
  }, {});
}

export function calculateFractionReadinessScore(input = {}) {
  const {
    score = 0,
    skillBreakdown = {},
    fluencyBreakdown = {},
    retentionData = null,
    workingSummary = {},
  } = input;

  const skillValues = Object.values(skillBreakdown);
  const avgSkill = skillValues.length
    ? skillValues.reduce((sum, s) => sum + toNum(s.percentage, 0), 0) / skillValues.length
    : toNum(score, 0);
  const fluencyValues = Object.values(fluencyBreakdown);
  const fluencyPenalty = fluencyValues.reduce((sum, f) => sum + toNum(f.accurateButSlowCount, 0), 0) * 0.8;
  const workingPenalty = (100 - toNum(workingSummary.completenessRate, 100)) * 0.2;
  const retentionBonus = retentionData?.retainedRate ? toNum(retentionData.retainedRate) * 0.1 : 0;

  const readinessScore = Math.max(0, Math.min(100, Math.round((avgSkill - fluencyPenalty - workingPenalty + retentionBonus) * 10) / 10));
  let readinessBand = 'notReady';
  if (readinessScore >= 85) readinessBand = 'strong';
  else if (readinessScore >= 70) readinessBand = 'ready';
  else if (readinessScore >= 55) readinessBand = 'approaching';
  else if (readinessScore >= 40) readinessBand = 'developing';

  const explanation =
    readinessBand === 'strong'
      ? 'Performance is strong across score, fluency, and working completeness.'
      : readinessBand === 'ready'
        ? 'Performance indicates readiness with minor areas to polish.'
        : readinessBand === 'approaching'
          ? 'Student is approaching readiness but needs targeted reinforcement.'
          : readinessBand === 'developing'
            ? 'Student is developing key fraction skills and requires guided practice.'
            : 'Student is not yet ready and should revisit prerequisite concepts.';

  return { readinessScore, readinessBand, explanation };
}

export function scoreFractionAssessmentSubmission(submission = {}) {
  const { assessmentSessionId, responses = [] } = submission;
  const session = ASSESSMENT_STORE.get(assessmentSessionId);
  if (!session) throw new Error('Invalid assessmentSessionId.');

  const totalScore = responses.reduce((sum, r) => sum + toNum(r.marksAwarded), 0);
  const totalMarks = responses.reduce((sum, r) => sum + toNum(r.totalMarks, 1), 0);
  const percentage = totalMarks ? Math.round((totalScore / totalMarks) * 1000) / 10 : 0;

  const skillBreakdown = aggregateBreakdown(responses, (r) => r.skillId);
  const questionFamilyBreakdown = aggregateBreakdown(responses, (r) => r.questionFamilyId);
  const fluencyBreakdown = Object.entries(questionFamilyBreakdown).reduce((acc, [familyId, data]) => {
    const family = getQuestionFamily(familyId);
    acc[familyId] = {
      ...data,
      fluencyTargetSeconds: family?.fluencyTargetSeconds ?? null,
      weightedLoad: normalizeFamilyWeight(family || {}),
    };
    return acc;
  }, {});
  const workingSummary = buildWorkingSummary(responses);

  const suspectedMistakes = responses
    .filter((r) => !r.correct)
    .map((r) =>
      classifyFractionMistake({
        skillId: r.skillId,
        questionFamilyId: r.questionFamilyId,
        studentAnswer: r.studentAnswer,
        correctAnswer: r.correctAnswer,
        timeTaken: r.timeTaken,
        confidence: r.confidence,
        workingAnalysisResult: r.workingAnalysisResult || {},
        attemptHistory: [],
        assessmentMode: true,
      })
    );

  const readiness = calculateFractionReadinessScore({
    score: percentage,
    skillBreakdown,
    fluencyBreakdown,
    retentionData: submission.retentionData || null,
    workingSummary,
  });

  const queue = suspectedMistakes.reduce((q, mistake) => updatePracticeQueueFromMistake(q, mistake), []);
  const recommendedNextActions = dedupe([
    ...suspectedMistakes.map((m) => m.recommendedAction),
    workingSummary.missingWorking > 0 ? 'requireWorkingReview' : null,
  ].filter(Boolean));

  const result = {
    assessmentSessionId,
    totalScore,
    totalMarks,
    percentage,
    skillBreakdown,
    questionFamilyBreakdown,
    fluencyBreakdown,
    workingSummary,
    suspectedMistakes,
    readinessScore: readiness,
    recommendedNextActions,
    nextPracticeQueue: queue,
  };

  const nextSession = { ...session, status: STATUS.MARKED, submittedAt: nowIso() };
  ASSESSMENT_STORE.set(assessmentSessionId, nextSession);
  return result;
}

export function buildAssessmentReport(result = {}) {
  const readiness = result.readinessScore || { readinessBand: 'developing', readinessScore: 0 };
  const topMistake = result.suspectedMistakes?.[0];
  const nextPracticeQueue = result.nextPracticeQueue || [];
  const recommendedRemediation = topMistake?.remediationSkillIds || [];

  const studentSummary =
    readiness.readinessBand === 'strong'
      ? 'Great work. Your fractions assessment performance is strong. Keep practising to maintain speed and accuracy.'
      : `You are making progress. Next focus: ${topMistake ? topMistake.suspectedMistakeCode : 'fraction fluency'} to improve your readiness.`;
  const parentSummary =
    readiness.readinessBand === 'notReady'
      ? 'Your child needs more support with core fraction skills. A targeted remediation queue is recommended before higher-level assessments.'
      : `Your child is in the "${readiness.readinessBand}" readiness band. Continue focused practice to strengthen weaker areas.`;
  const tutorSummary = `Assessment readiness: ${readiness.readinessScore} (${readiness.readinessBand}). Recommended remediation skills: ${recommendedRemediation.join(', ') || 'none'}.`;

  return {
    studentSummary,
    parentSummary,
    tutorSummary,
    nextPracticeQueue,
    recommendedRemediation,
  };
}

export function compareAssessmentProgress(previousResults = [], currentResult = {}) {
  const previous = Array.isArray(previousResults) && previousResults.length
    ? previousResults[previousResults.length - 1]
    : null;
  const prevScore = previous?.percentage ?? 0;
  const currScore = currentResult?.percentage ?? 0;
  const prevReadiness = previous?.readinessScore?.readinessScore ?? 0;
  const currReadiness = currentResult?.readinessScore?.readinessScore ?? 0;

  const prevSkills = previous?.skillBreakdown || {};
  const currSkills = currentResult?.skillBreakdown || {};
  const allSkillIds = dedupe([...Object.keys(prevSkills), ...Object.keys(currSkills)]);

  const improvedSkills = [];
  const declinedSkills = [];
  const stillWeakSkills = [];
  allSkillIds.forEach((skillId) => {
    const prevPct = prevSkills[skillId]?.percentage ?? 0;
    const currPct = currSkills[skillId]?.percentage ?? 0;
    if (currPct - prevPct >= 8) improvedSkills.push(skillId);
    if (prevPct - currPct >= 8) declinedSkills.push(skillId);
    if (currPct < 70) stillWeakSkills.push(skillId);
  });

  const prevFluent = new Set(Object.entries(previous?.fluencyBreakdown || {})
    .filter(([, v]) => v.accurateButSlowCount === 0 && v.accuracy >= 85)
    .map(([k]) => k));
  const currFluent = new Set(Object.entries(currentResult?.fluencyBreakdown || {})
    .filter(([, v]) => v.accurateButSlowCount === 0 && v.accuracy >= 85)
    .map(([k]) => k));
  const newlyFluentSkills = [...currFluent].filter((id) => !prevFluent.has(id));

  return {
    scoreChange: Math.round((currScore - prevScore) * 10) / 10,
    readinessChange: Math.round((currReadiness - prevReadiness) * 10) / 10,
    improvedSkills,
    declinedSkills,
    newlyFluentSkills,
    stillWeakSkills,
  };
}

export function getMockPaperStructure(level = 'P6', paperType = 'paper1') {
  return {
    paperId: `MOCK_${level}_${String(paperType).toUpperCase()}`,
    level,
    paperType,
    sections: [
      { sectionId: 'A', name: 'Short Response', markWeight: 40 },
      { sectionId: 'B', name: 'Structured Response', markWeight: 60 },
    ],
    totalMarks: 100,
    duration: paperType === 'paper2' ? 90 : 60,
    calculatorAllowed: calcAllowed(level, paperType, 'mockPaper'),
  };
}

export function validateFractionAssessmentEngine() {
  const s1 = buildFractionAssessmentSession({
    studentId: 'assess_student',
    assessmentType: 'baseline',
    singaporeLevel: 'P4',
    mode: 'core',
    paperType: 'paper1',
    weakSkillIds: ['F010', 'F018'],
    recentSkillIds: ['F016', 'F020'],
    masteredSkillIds: ['F001', 'F002', 'F003'],
  });

  const p1 = buildFractionAssessmentSession({
    studentId: 'assess_student',
    assessmentType: 'mockPaper',
    singaporeLevel: 'P4',
    paperType: 'paper1',
  });
  const p6p2 = buildFractionAssessmentSession({
    studentId: 'assess_student',
    assessmentType: 'mockPaper',
    singaporeLevel: 'P6',
    paperType: 'paper2',
  });

  const progressTargets = selectAssessmentTargets({
    assessmentType: 'progress',
    singaporeLevel: 'P5',
    weakSkillIds: ['F018'],
    recentSkillIds: ['F020'],
  });
  const masteryTargets = selectAssessmentTargets({
    assessmentType: 'mastery',
    singaporeLevel: 'P5',
    masteredSkillIds: ['F010', 'F011', 'F016'],
  });

  const responses = [
    {
      questionId: 'q1',
      skillId: 'F010',
      questionFamilyId: 'QF_F010_001',
      correct: false,
      marksAwarded: 0,
      totalMarks: 2,
      timeTaken: 15,
      confidence: 'Unsure',
      workingUploaded: true,
      studentAnswer: '1/3',
      correctAnswer: '1/2',
    },
    {
      questionId: 'q2',
      skillId: 'F018',
      questionFamilyId: 'QF_F018_001',
      correct: false,
      marksAwarded: 0,
      totalMarks: 2,
      timeTaken: 20,
      confidence: 'Confident',
      workingUploaded: false,
      studentAnswer: '2/5',
      correctAnswer: '5/6',
    },
    {
      questionId: 'q3',
      skillId: 'F016',
      questionFamilyId: 'QF_F016_001',
      correct: true,
      marksAwarded: 2,
      totalMarks: 2,
      timeTaken: 25,
      confidence: 'Confident',
      workingUploaded: true,
      studentAnswer: '5/8',
      correctAnswer: '5/8',
    },
  ];

  const scored = scoreFractionAssessmentSubmission({
    assessmentSessionId: s1.assessmentSessionId,
    responses,
  });
  const readinessBandCalculated = Boolean(scored.readinessScore?.readinessBand);
  const report = buildAssessmentReport(scored);
  const compare = compareAssessmentProgress(
    [
      {
        percentage: 40,
        readinessScore: { readinessScore: 42 },
        skillBreakdown: { F010: { percentage: 30 }, F018: { percentage: 35 } },
        fluencyBreakdown: { QF_F010_001: { accurateButSlowCount: 2, accuracy: 30 } },
      },
    ],
    scored
  );

  const nonMentalWorkingRequired = responses
    .filter((r) => {
      const f = getQuestionFamily(r.questionFamilyId);
      return f && !f.mentalMathEligible;
    })
    .every((r) => s1.workingRequired === true);

  return {
    isValid:
      Boolean(s1.assessmentSessionId) &&
      p1.calculatorAllowed === false &&
      p6p2.calculatorAllowed === true &&
      nonMentalWorkingRequired &&
      progressTargets.skillIds.includes('F018') &&
      masteryTargets.skillIds.includes('F010') &&
      Boolean(scored.skillBreakdown && scored.questionFamilyBreakdown) &&
      readinessBandCalculated &&
      Boolean(report.parentSummary && report.studentSummary && report.tutorSummary) &&
      typeof compare.scoreChange === 'number',
    checks: {
      sessionCreated: Boolean(s1.assessmentSessionId),
      calculatorRulesApplied: p1.calculatorAllowed === false && p6p2.calculatorAllowed === true,
      workingRequiredForNonMental: nonMentalWorkingRequired,
      baselineBroadTargets: s1.targetSkillIds.length >= 6,
      progressSelectsWeakRecent: progressTargets.skillIds.includes('F018') || progressTargets.skillIds.includes('F020'),
      masterySelectsCompleted: masteryTargets.skillIds.includes('F010'),
      scoreIncludesBreakdowns: Boolean(scored.skillBreakdown && scored.questionFamilyBreakdown),
      readinessBandCalculated,
      reportHasSummaries: Boolean(report.parentSummary && report.studentSummary && report.tutorSummary),
      progressComparisonWorks: typeof compare.scoreChange === 'number',
    },
    sample: {
      session: s1,
      scored,
      report,
      compare,
      mockPaperStructure: getMockPaperStructure('P6', 'paper2'),
    },
  };
}

export const fractionAssessmentEngine = {
  buildFractionAssessmentSession,
  selectAssessmentTargets,
  scoreFractionAssessmentSubmission,
  calculateFractionReadinessScore,
  buildAssessmentReport,
  compareAssessmentProgress,
  getMockPaperStructure,
  validateFractionAssessmentEngine,
};

export default fractionAssessmentEngine;
