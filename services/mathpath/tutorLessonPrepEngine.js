import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import MathPathWorkingIntelligence from '../../models/mathpath/MathPathWorkingIntelligence.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import { buildDiagnosticGrowth, getDiagnosticHistory } from '../diagnostics/diagnosticGrowthService.js';

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function latest(items = [], key = 'createdAt') {
  return [...items]
    .filter((item) => item?.[key])
    .sort((a, b) => new Date(b[key]) - new Date(a[key]))[0] || null;
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function countBy(values = []) {
  return values.reduce((acc, value) => {
    const key = String(value || '').trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function shapeStudent(student = {}) {
  return {
    studentId: String(student._id || student.id || student.studentId || ''),
    name: student.name || 'Student',
    level: student.level || '',
  };
}

function skillLabel(skillId = '') {
  return String(skillId || '').toUpperCase();
}

function paperFindings(papers = []) {
  return papers.slice(0, 5).map((paper) => ({
    paperAnalysisId: String(paper._id || paper.id || ''),
    title: paper.originalFilename || 'Uploaded paper',
    status: paper.status,
    weakSkillIds: paper.weakSkillIds || [],
    misconceptions: unique((paper.detectedQuestions || []).flatMap((q) => q.misconceptionTags || [])),
    reviewedAt: paper.reviewedAt || paper.updatedAt || paper.createdAt,
  }));
}

function mistakePatterns(mistakes = [], papers = []) {
  const counts = {};
  for (const mistake of mistakes) {
    const key = mistake.mistakeName || mistake.mistakeCode || 'Repeated mistake';
    counts[key] = (counts[key] || 0) + num(mistake.frequency, 1);
  }
  for (const paper of papers) {
    for (const question of paper.detectedQuestions || []) {
      for (const tag of question.misconceptionTags || []) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .map(([misconception, frequency]) => ({ misconception, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 6);
}

function activeAssignmentRows(assignments = []) {
  return assignments
    .filter((assignment) => ['assigned', 'in_progress', 'completed'].includes(assignment.status))
    .map((assignment) => ({
      assignmentId: String(assignment._id || assignment.id || ''),
      title: assignment.title || 'Recovery Pack',
      status: assignment.status,
      skillIds: assignment.skillIds || [],
      completion: assignment.completion || {},
      recheck: assignment.recheck || {},
      sourceType: assignment.sourceType || '',
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));
}

function workingMethodSignals(workings = []) {
  return workings.slice(0, 5).map((working) => ({
    workingId: working.workingId || String(working._id || ''),
    skillId: working.skillId || working.skillCode || '',
    detectedMethod: working.tutorInsight?.detectedMethod
      || working.procedureAnalysis?.detectedMethod
      || working.methodEvidence?.detectedMethod
      || '',
    detectedIssue: working.tutorInsight?.detectedIssue
      || working.procedureAnalysis?.detectedIssue
      || working.misconceptionDetection?.primaryMisconception
      || '',
    qualityBand: working.workingQualityEnhanced?.qualityBand || working.workingQualityScore?.qualityBand || '',
    updatedAt: working.updatedAt || working.createdAt,
  }));
}

function priorityFocusAreas({
  growth = {},
  mistakes = [],
  papers = [],
  assignments = [],
  workings = [],
} = {}) {
  const scores = new Map();
  const reasons = new Map();
  const add = (skillId, points, reason) => {
    const key = skillLabel(skillId);
    if (!key) return;
    scores.set(key, (scores.get(key) || 0) + points);
    if (!reasons.has(key)) reasons.set(key, []);
    reasons.get(key).push(reason);
  };

  for (const skillId of growth.remainingWeakSkills || []) add(skillId, 30, 'Skill remains weak in diagnostic growth evidence.');
  for (const mistake of mistakes) {
    add(mistake.skillId, num(mistake.frequency, 1) >= 3 ? 35 : 20, 'Same misconception or mistake appears repeatedly.');
  }
  for (const paper of papers) {
    for (const skillId of paper.weakSkillIds || []) add(skillId, 25, 'School paper review confirmed this weak skill.');
  }
  for (const assignment of assignments) {
    const accuracy = num(assignment.completion?.accuracy, null);
    for (const skillId of assignment.skillIds || []) {
      if (assignment.status === 'completed' && accuracy !== null && accuracy < 70) add(skillId, 28, 'Recovery Pack accuracy is below 70%.');
      if (assignment.status === 'in_progress') add(skillId, 12, 'Recovery Pack is still in progress.');
    }
  }
  for (const working of workings) {
    if (working.procedureAnalysis || working.misconceptionDetection || working.tutorInsight) {
      add(working.skillId || working.skillCode, 18, 'Working evidence suggests a method gap.');
    }
  }
  for (const row of growth.perSkillGrowth || []) {
    if (row.status === 'no_change' || num(row.improvement) <= 0) add(row.skillId, 26, 'Recheck/growth evidence shows little or no improvement.');
  }

  const rows = [...scores.entries()]
    .map(([skillId, score]) => ({
      skillId,
      priorityScore: score,
      title: skillId,
      why: unique(reasons.get(skillId) || []).slice(0, 4),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3);

  if (!rows.length) {
    rows.push({
      skillId: '',
      priorityScore: 0,
      title: 'Quick diagnostic warm-up',
      why: ['No clear weak-skill pattern yet. Start with a short check before teaching.'],
    });
  }
  return rows;
}

function lessonFlowFor(focusAreas = []) {
  const focus = focusAreas[0]?.skillId || 'current focus';
  return [
    { step: 1, phase: 'Warm-up', focus: `${focus} review`, minutes: 5, activity: 'Use 3 quick questions to check recall and confidence.' },
    { step: 2, phase: 'Teach', focus, minutes: 15, activity: 'Model the method with one visual or worked example.' },
    { step: 3, phase: 'Guided practice', focus, minutes: 15, activity: 'Work through 4 questions together and ask the student to explain each step.' },
    { step: 4, phase: 'Independent practice', focus, minutes: 10, activity: 'Student completes 6 questions independently while tutor watches method.' },
    { step: 5, phase: 'Exit check', focus, minutes: 5, activity: 'Use 3 questions to decide whether to assign practice or recheck.' },
  ];
}

export function buildTutorLessonPrep({
  student = {},
  growth = {},
  mistakes = [],
  papers = [],
  assignments = [],
  workings = [],
  tutorNotes = [],
} = {}) {
  const studentSummary = shapeStudent(student);
  const focusAreas = priorityFocusAreas({ growth, mistakes, papers, assignments, workings });
  const activeAssignments = activeAssignmentRows(assignments);
  const recheckReady = activeAssignments.filter((assignment) => assignment.recheck?.recommended);
  const recentPapers = paperFindings(papers);
  const misconceptionPatterns = mistakePatterns(mistakes, papers);
  const recentMistakes = mistakes.slice(0, 6).map((mistake) => ({
    mistakeId: String(mistake._id || mistake.id || ''),
    skillId: mistake.skillId || '',
    mistakeName: mistake.mistakeName || mistake.mistakeCode || 'Repeated mistake',
    frequency: num(mistake.frequency, 1),
    severity: mistake.severity || 'medium',
    lastSeenAt: mistake.lastSeenAt || mistake.updatedAt || mistake.createdAt,
  }));
  const suggestedHomeworkSkillIds = unique(focusAreas.map((focus) => focus.skillId)).filter(Boolean);

  return {
    studentSummary,
    currentReadiness: growth.latest?.readinessScore ?? null,
    baselineReadiness: growth.baseline?.readinessScore ?? null,
    improvement: growth.overallImprovement ?? null,
    weakSkills: unique([
      ...(growth.remainingWeakSkills || []),
      ...focusAreas.map((focus) => focus.skillId),
    ]).filter(Boolean),
    recentMistakes,
    misconceptionPatterns,
    recentPaperFindings: recentPapers,
    activeAssignments,
    recheckReadiness: {
      ready: recheckReady.length > 0,
      assignments: recheckReady,
      reason: recheckReady.length ? 'At least one Recovery Pack is ready for recheck.' : 'No Recovery Pack is currently ready for recheck.',
    },
    recommendedLessonFocus: focusAreas,
    suggestedLessonFlow: lessonFlowFor(focusAreas),
    suggestedHomework: suggestedHomeworkSkillIds.length ? {
      type: 'recovery_pack',
      title: 'Assign targeted Recovery Pack',
      skillIds: suggestedHomeworkSkillIds,
      targetQuestionCount: suggestedHomeworkSkillIds.length > 2 ? 16 : 12,
      reason: focusAreas[0]?.why?.[0] || 'Target the top lesson focus skill.',
    } : null,
    workingEvidence: workingMethodSignals(workings),
    tutorNotes: {
      recentNotes: tutorNotes.slice(0, 5).map((note) => ({
        id: String(note._id || note.id || ''),
        lessonDate: note.lessonDate || note.createdAt,
        focusSkillIds: note.focusSkillIds || [],
        notes: note.notes || note.covered || '',
        nextAction: note.nextAction || note.nextRecommendation || '',
      })),
      summary: focusAreas[0]?.why?.join(' ') || 'Start with a short diagnostic warm-up.',
    },

    // Backward-compatible fields used by the existing LessonPrep page.
    focus: focusAreas[0]?.skillId ? { skillId: focusAreas[0].skillId, skillName: focusAreas[0].title } : null,
    reason: focusAreas[0]?.why?.join(' ') || '',
    weakTopics: focusAreas.filter((focus) => focus.skillId).map((focus) => ({
      skillId: focus.skillId,
      skillName: focus.title,
      topicName: 'Fractions',
      score: Math.max(0, 100 - focus.priorityScore),
    })),
    teachingSequence: lessonFlowFor(focusAreas).map((step) => `${step.phase}: ${step.activity} (${step.minutes} min)`),
    notes: focusAreas[0]?.why || [],
  };
}

export function buildTutorLessonPrepPreview({
  student = {},
  growth = {},
  mistakes = [],
  papers = [],
  assignments = [],
} = {}) {
  const weakSkills = [
    ...(growth.remainingWeakSkills || []),
    ...mistakes.map((mistake) => mistake.skillId).filter(Boolean),
  ];
  const uniqueWeakSkills = [...new Set(weakSkills)].slice(0, 5);
  const repeatedMistakes = [...mistakes]
    .sort((a, b) => num(b.frequency) - num(a.frequency))
    .slice(0, 5)
    .map((mistake) => ({
      skillId: mistake.skillId || '',
      mistakeName: mistake.mistakeName || mistake.mistakeCode || 'Repeated mistake',
      frequency: num(mistake.frequency, 1),
      severity: mistake.severity || 'medium',
    }));
  const recentPaper = latest(papers, 'createdAt');
  const activeAssignment = assignments.find((assignment) => ['assigned', 'in_progress'].includes(assignment.status)) || null;
  const suggestedLessonFocus = uniqueWeakSkills[0]
    ? `Rebuild ${uniqueWeakSkills[0]} using worked examples, then check transfer with two word problems.`
    : 'Run a short diagnostic warm-up, then choose a focus from the latest mistakes.';

  return {
    student: {
      studentId: String(student._id || student.id || student.studentId || ''),
      name: student.name || 'Student',
      level: student.level || '',
    },
    weakSkills: uniqueWeakSkills,
    recentMistakes: repeatedMistakes,
    recentPapers: recentPaper ? [{
      paperAnalysisId: String(recentPaper._id || recentPaper.id || ''),
      title: recentPaper.originalFilename || 'Uploaded paper',
      status: recentPaper.status,
      weakSkillIds: recentPaper.weakSkillIds || [],
      createdAt: recentPaper.createdAt,
    }] : [],
    activeRecoveryPack: activeAssignment ? {
      assignmentId: String(activeAssignment._id || activeAssignment.id || ''),
      title: activeAssignment.title || 'Recovery Pack',
      status: activeAssignment.status,
      completion: activeAssignment.completion || {},
    } : null,
    suggestedLessonFocus,
    estimatedLessonDurationMinutes: uniqueWeakSkills.length >= 3 || repeatedMistakes.length >= 3 ? 45 : 30,
  };
}

export async function getTutorLessonPrep({
  student,
  tutorId = '',
  subjectId = 'math',
  domainId = 'fractions',
  tutorNotes = [],
} = {}) {
  const studentId = String(student?._id || student?.id || student?.studentId || '');
  const [history, assignments, papers, mistakes, workings] = await Promise.all([
    getDiagnosticHistory({ studentId, subjectId, domainId }),
    MathPathAssignment.find({ studentId, subjectId, domainId }).sort({ updatedAt: -1, createdAt: -1 }).limit(20).lean(),
    PaperAnalysis.find({ studentId, subjectId, domainId }).sort({ updatedAt: -1, createdAt: -1 }).limit(10).lean(),
    MathPathMistakeRecord.find({ studentId, domainId }).sort({ lastSeenAt: -1, updatedAt: -1 }).limit(20).lean(),
    MathPathWorkingIntelligence.find({ studentId }).sort({ updatedAt: -1, createdAt: -1 }).limit(10).lean(),
  ]);
  return buildTutorLessonPrep({
    student,
    tutorId,
    growth: { ...buildDiagnosticGrowth(history), history },
    assignments,
    papers,
    mistakes,
    workings,
    tutorNotes,
  });
}

export default {
  buildTutorLessonPrep,
  buildTutorLessonPrepPreview,
  getTutorLessonPrep,
};
