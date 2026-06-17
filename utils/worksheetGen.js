// Rule-based worksheet generation (Phase 4 MVP — no AI). Resolves which skills
// to target per mode, selects similar questions from the shared bank, and
// assembles structured worksheet content (questions + optional review + solutions).
import Question from '../models/Question.js';
import Mistake from '../models/Mistake.js';
import MasteryRecord from '../models/MasteryRecord.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import Skill from '../models/Skill.js';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import FluencyRecord from '../models/FluencyRecord.js';
import RetentionReview from '../models/RetentionReview.js';

const DIFF_NEIGHBOURS = { easy: ['easy', 'medium'], medium: ['easy', 'medium', 'hard'], hard: ['medium', 'hard'] };
const SEC1_G1_FRACTIONS_SKILL_IDS = ['F010', 'F013', 'F014', 'F017', 'F018', 'F021', 'F022', 'F023', 'F025', 'F026'];
const MODE_LABELS = {
  recent_mistakes: 'Recent mistakes',
  weak_skills: 'Weak skills',
  diagnostic_results: 'Diagnostic results',
  selected_topic: 'Selected topic',
  recommended: 'Recommended practice',
  fluency: 'Fluency practice',
  retention: 'Retention review',
  custom: 'Custom practice',
  mastery_check: 'Mastery check',
  intervention: 'Intervention worksheet',
  session: 'Session worksheet',
  homework: 'Homework worksheet',
  class: 'Class worksheet',
  group: 'Group worksheet',
  intervention_group: 'Intervention group worksheet',
};

const WORKSHEET_TYPE_TO_MODE = {
  recommended: 'recommended',
  fluency: 'fluency',
  retention: 'retention',
  custom: 'custom',
  mastery_check: 'mastery_check',
  intervention: 'intervention',
  session: 'session',
  homework: 'homework',
  class: 'class',
  group: 'group',
  intervention_group: 'intervention_group',
};

export function normalizeWorksheetMode({ mode = '', worksheetType = '' } = {}) {
  const type = String(worksheetType || '').trim();
  if (WORKSHEET_TYPE_TO_MODE[type]) return WORKSHEET_TYPE_TO_MODE[type];
  const raw = String(mode || '').trim();
  return MODE_LABELS[raw] ? raw : 'recommended';
}

export function getSec1G1FractionsWorksheetSkillPlan() {
  return {
    arithmeticFractions: ['F017', 'F018', 'F021', 'F022'],
    negativeFractions: ['F013', 'F017', 'F018', 'F022'],
    fractionDecimalApplications: ['F021', 'F023', 'F025'],
    ratioFractionsDecimals: ['F023'],
    percentFractionDecimal: ['F025'],
    algebraicFractionNotation: ['F026'],
    allSkillIds: [...SEC1_G1_FRACTIONS_SKILL_IDS],
  };
}

export function getFractionsMvpDepthWorksheetPlan() {
  return {
    foundationalShallow: ['F001', 'F002', 'F011', 'F012', 'F015'],
    highRiskMvp: ['F018', 'F023'],
    mixedReview: ['F005', 'F006', 'F007', 'F008', 'F009', 'F013', 'F014', 'F019', 'F021', 'F022', 'F024', 'F025', 'F026'],
    difficultyProgression: {
      F001: ['easy', 'medium'],
      F002: ['easy', 'medium'],
      F011: ['easy', 'medium'],
      F012: ['easy', 'medium'],
      F015: ['easy', 'medium', 'hard'],
      F018: ['medium', 'hard'],
      F023: ['medium', 'hard'],
    },
  };
}

// Find similar questions for a set of skills: same skill, near difficulty,
// prefer not-recently-attempted, no duplicates, optional exclude.
export async function selectSimilarQuestions({ studentId, skillIds, difficulty = 'medium', count = 10, excludeQuestionIds = [] }) {
  if (!skillIds.length) return [];
  const allowed = DIFF_NEIGHBOURS[difficulty] || ['easy', 'medium', 'hard'];

  // Questions the student attempted recently — deprioritise (not exclude, so a
  // thin bank still fills the set).
  const recent = await PracticeAttempt.find({ studentId }).sort({ createdAt: -1 }).limit(40).select('questionId');
  const recentSet = new Set(recent.map((a) => String(a.questionId)));
  const excludeSet = new Set(excludeQuestionIds.map(String));

  const pool = await Question.find({
    skillId: { $in: skillIds },
    difficulty: { $in: allowed },
    worksheetCompatible: { $ne: false },
  })
    .populate({ path: 'skillId', populate: { path: 'topicId' } });

  // Score: matching difficulty first, then unseen, then a mix of skills.
  const ranked = pool
    .filter((q) => !excludeSet.has(String(q._id)))
    .map((q) => ({
      q,
      score:
        (q.difficulty === difficulty ? 0 : 1) +
        (recentSet.has(String(q._id)) ? 2 : 0) +
        Math.random() * 0.5,
    }))
    .sort((a, b) => a.score - b.score);

  // When the caller targets multiple skills (topic-level session), round-robin
  // across skill buckets so the set is balanced instead of being dominated by
  // whichever skill happens to have the deepest matching pool. Within each
  // bucket the ranking is preserved.
  const buckets = new Map(skillIds.map((id) => [String(id), []]));
  for (const item of ranked) {
    const key = String(item.q.skillId?._id || item.q.skillId);
    if (buckets.has(key)) buckets.get(key).push(item.q);
  }

  const questionSignature = (q) => JSON.stringify({
    stem: q.stem,
    answer: q.answer || q.modelAnswer || '',
    visual: q.visual || null,
    figureUrl: q.figureUrl || '',
  });
  const seenSignatures = new Set();
  const out = [];
  let madeProgress = true;
  while (out.length < count && madeProgress) {
    madeProgress = false;
    for (const list of buckets.values()) {
      if (out.length >= count) break;
      while (list.length) {
        const q = list.shift();
        const signature = questionSignature(q);
        if (seenSignatures.has(signature)) continue;
        seenSignatures.add(signature);
        out.push(q);
        madeProgress = true;
        break;
      }
    }
  }
  return out;
}

export function distributeQuestionCounts(priorities = [], total = 10) {
  const cleaned = priorities
    .map((row) => ({ ...row, skillId: String(row.skillId || ''), weight: Math.max(1, Number(row.weight || 1)) }))
    .filter((row) => row.skillId);
  if (!cleaned.length || total <= 0) return [];
  const sum = cleaned.reduce((acc, row) => acc + row.weight, 0);
  const allocations = cleaned.map((row) => {
    const raw = (row.weight / sum) * total;
    return { ...row, count: Math.max(1, Math.floor(raw)), remainder: raw - Math.floor(raw) };
  });
  let allocated = allocations.reduce((acc, row) => acc + row.count, 0);
  if (allocated > total) {
    [...allocations].sort((a, b) => a.weight - b.weight).forEach((row) => {
      while (allocated > total && row.count > 0) {
        row.count -= 1;
        allocated -= 1;
      }
    });
  }
  if (allocated < total) {
    [...allocations].sort((a, b) => b.remainder - a.remainder || b.weight - a.weight).forEach((row) => {
      if (allocated < total) {
        row.count += 1;
        allocated += 1;
      }
    });
  }
  return allocations.filter((row) => row.count > 0).map(({ remainder, ...row }) => row);
}

async function selectWeightedQuestions({ studentId, priorities, difficulty = 'medium', count = 10 }) {
  const distribution = distributeQuestionCounts(priorities, count);
  const out = [];
  for (const row of distribution) {
    const picked = await selectSimilarQuestions({
      studentId,
      skillIds: [row.skillId],
      difficulty,
      count: row.count,
      excludeQuestionIds: out.map((q) => q._id),
    });
    out.push(...picked);
  }
  if (out.length < count) {
    const topUp = await selectSimilarQuestions({
      studentId,
      skillIds: priorities.map((row) => row.skillId),
      difficulty,
      count: count - out.length,
      excludeQuestionIds: out.map((q) => q._id),
    });
    out.push(...topUp);
  }
  return { questions: out.slice(0, count), distribution };
}

function mathPathCodeQuery(codes = []) {
  const unique = [...new Set(codes.map((code) => String(code || '').trim().toUpperCase()).filter(Boolean))];
  if (!unique.length) return null;
  return {
    $or: [
      { 'metadata.mathPathSkillId': { $in: unique } },
      { 'metadata.frameworkCode': { $in: unique } },
      { slug: { $in: unique.map((code) => code.toLowerCase()) } },
    ],
  };
}

async function resolveFrameworkSkillCodes(codes = []) {
  const query = mathPathCodeQuery(codes);
  if (!query) return [];
  const skills = await Skill.find(query).select('_id metadata slug');
  return skills.map((skill) => skill._id);
}

function skillCodeFromResult(row = {}) {
  return String(row.skillId || row.id || row.code || row.skill?.skillId || row.rootGap?.skillId || '').trim().toUpperCase();
}

function summarizeMode({ mode, signalCount = 0, diagnosticSession = null, subject = 'Math' } = {}) {
  if (mode === 'recommended') return `Built from ${signalCount || 'current'} learning signal${signalCount === 1 ? '' : 's'}: weak skills, mistakes, confidence, retention, and fluency.`;
  if (mode === 'fluency') return `Built from developing fluency skill${signalCount === 1 ? '' : 's'} that need repetition for automaticity.`;
  if (mode === 'retention') return `Built from scheduled or overdue retention review skill${signalCount === 1 ? '' : 's'}.`;
  if (mode === 'mastery_check') return 'Built from skills that look ready for a short independent check.';
  if (['custom', 'intervention', 'session', 'homework', 'class', 'group', 'intervention_group'].includes(mode)) return 'Built from selected skills and adult worksheet settings.';
  if (mode === 'recent_mistakes') return `Built from ${signalCount || 'recent'} unresolved mistake signal${signalCount === 1 ? '' : 's'}.`;
  if (mode === 'weak_skills') return `Built from ${signalCount || 'current'} low-mastery skill signal${signalCount === 1 ? '' : 's'}.`;
  if (mode === 'diagnostic_results') {
    const date = diagnosticSession?.completedAt ? new Date(diagnosticSession.completedAt).toLocaleDateString('en-SG') : '';
    return `Built from the latest ${subject} diagnostic${date ? ` completed on ${date}` : ''}.`;
  }
  return 'Built from the selected topic or skill.';
}

function mergePriority(map, skillId, patch = {}) {
  if (!skillId) return;
  const key = String(skillId);
  const existing = map.get(key) || { skillId: key, weight: 0, signals: [] };
  existing.weight += Number(patch.weight || 1);
  if (patch.signal) existing.signals.push(patch.signal);
  map.set(key, existing);
}

async function masteredSkillSet(studentId, subject = 'Math') {
  const rows = await MasteryRecord.find({
    studentId,
    status: 'mastered',
    subject: subject === 'Science' ? 'Science' : { $ne: 'Science' },
  }).select('skillId');
  return new Set(rows.map((row) => String(row.skillId)));
}

async function resolveRecommendedSkills({ studentId, subject = 'Math' } = {}) {
  const isScience = subject === 'Science';
  const mastered = await masteredSkillSet(studentId, subject);
  const priorities = new Map();

  const weak = await MasteryRecord.find({
    studentId,
    status: { $in: ['needs_review', 'learning', 'not_started'] },
    subject: isScience ? 'Science' : { $ne: 'Science' },
  }).sort({ score: 1 }).limit(8);
  weak.forEach((record, index) => {
    const score = Number(record.score || 0);
    mergePriority(priorities, record.skillId, {
      weight: score < 40 ? 9 : 6 - Math.min(index, 3),
      signal: { type: 'weak_skill', skillId: String(record.skillId), score, status: record.status },
    });
  });

  const mistakes = await Mistake.find({
    studentId,
    status: { $ne: 'resolved' },
    ...(isScience ? { module: 'Science Adaptive Revision' } : { module: { $ne: 'Science Adaptive Revision' } }),
  }).sort({ occurredAt: -1 }).limit(50);
  const mistakeCounts = new Map();
  mistakes.forEach((mistake) => {
    const key = String(mistake.skillId);
    mistakeCounts.set(key, (mistakeCounts.get(key) || 0) + Number(mistake.frequency || 1));
    if (mistake.mistakeCategory === 'confidence_error' || mistake.severity === 'critical') {
      mergePriority(priorities, key, {
        weight: 7,
        signal: { type: 'high_confidence_incorrect', skillId: key, mistakeId: mistake.mistakeId || '' },
      });
    }
  });
  [...mistakeCounts.entries()].forEach(([skillId, count]) => {
    mergePriority(priorities, skillId, {
      weight: Math.min(8, 3 + count),
      signal: { type: 'repeated_mistake', skillId, count },
    });
  });

  const retentionRows = await RetentionReview.find({
    studentId,
    $or: [
      { status: 'retention_risk' },
      { completed: false, reviewDate: { $lte: new Date() } },
    ],
  }).limit(8);
  retentionRows.forEach((review) => mergePriority(priorities, review.skillId, {
    weight: 5,
    signal: { type: review.status === 'retention_risk' ? 'retention_risk' : 'retention_due', skillId: String(review.skillId), reviewDate: review.reviewDate },
  }));

  const fluencyRows = await FluencyRecord.find({
    studentId,
    fluencyStatus: { $in: ['developing', 'not_fluent'] },
  }).sort({ fluencyScore: 1 }).limit(8);
  fluencyRows.forEach((record) => mergePriority(priorities, record.skillId, {
    weight: record.fluencyStatus === 'not_fluent' ? 4 : 3,
    signal: { type: 'fluency_gap', skillId: String(record.skillId), fluencyStatus: record.fluencyStatus, fluencyScore: record.fluencyScore },
  }));

  const rows = [...priorities.values()]
    .filter((row) => !mastered.has(String(row.skillId)))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
  return {
    priorities: rows,
    skillIds: rows.map((row) => row.skillId),
    signals: rows.flatMap((row) => row.signals).slice(0, 12),
  };
}

async function resolveDiagnosticSkills({ studentId, subject = 'Math' } = {}) {
  const isScience = subject === 'Science';
  const latest = await MathPathDiagnosticSession.findOne({
    studentId: String(studentId),
    status: 'completed',
    ...(isScience ? { subjectId: /^science$/i } : { subjectId: 'math' }),
  }).sort({ completedAt: -1, updatedAt: -1, createdAt: -1 });
  const result = latest?.result || {};
  const resultCodes = [
    ...(Array.isArray(result.weakSkills) ? result.weakSkills.map(skillCodeFromResult) : []),
    ...(Array.isArray(result.prerequisiteGaps) ? result.prerequisiteGaps.map((gap) => skillCodeFromResult(gap.rootGap || gap.skill || gap)) : []),
    ...(Array.isArray(result.fluencyGaps) ? result.fluencyGaps.map(skillCodeFromResult) : []),
    ...(Array.isArray(result.remediationRecommendations) ? result.remediationRecommendations.flatMap((row) => [skillCodeFromResult(row.skill), ...(row.reinforce || []).map(skillCodeFromResult)]) : []),
    skillCodeFromResult(result.recommendedStartingSkill),
  ].filter(Boolean);
  const resolvedFromResult = await resolveFrameworkSkillCodes(resultCodes);
  if (resolvedFromResult.length) {
    return {
      skillIds: resolvedFromResult.slice(0, 4),
      signals: resultCodes.slice(0, 8).map((code) => ({ type: 'diagnostic_gap', value: code })),
      diagnosticSession: latest,
    };
  }

  const diagnosticMistakes = await Mistake.find({
    studentId,
    source: { $in: ['diagnostic-incorrect', 'diagnostic-skipped'] },
    status: { $ne: 'resolved' },
  }).sort({ occurredAt: -1 }).limit(30);
  const freq = {};
  diagnosticMistakes.forEach((mistake) => { freq[mistake.skillId] = (freq[mistake.skillId] || 0) + 1; });
  return {
    skillIds: Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 4),
    signals: diagnosticMistakes.slice(0, 8).map((mistake) => ({
      type: mistake.source || 'diagnostic_mistake',
      skillId: String(mistake.skillId),
      misconceptionTag: mistake.misconceptionTag || '',
    })),
    diagnosticSession: latest,
  };
}

// Resolve target skills for each generation mode. `subject` ('Math' | 'Science')
// scopes mistakes/mastery to the requested subject — without it a Science
// remediation worksheet would happily pull in Math mistakes and vice-versa.
async function resolveSkills({ mode, studentId, skillIds, topicId, misconceptionTag = '', subject = 'Math' }) {
  const isScience = subject === 'Science';

  if (['selected_topic', 'custom', 'intervention', 'session', 'homework', 'class', 'group', 'intervention_group'].includes(mode)) {
    if (skillIds?.length) return {
      skillIds,
      priorities: skillIds.map((id) => ({ skillId: String(id), weight: 1, signals: [{ type: 'selected_skill', skillId: String(id) }] })),
      signals: skillIds.map((id) => ({ type: 'selected_skill', skillId: String(id) })),
    };
    if (topicId) {
      const skills = await Skill.find({ topicId }).select('_id');
      return {
        skillIds: skills.map((s) => s._id),
        priorities: skills.map((s) => ({ skillId: String(s._id), weight: 1, signals: [{ type: 'selected_topic', topicId: String(topicId) }] })),
        signals: [{ type: 'selected_topic', topicId: String(topicId) }],
      };
    }
    return { skillIds: [], priorities: [], signals: [] };
  }
  if (mode === 'recommended') {
    return resolveRecommendedSkills({ studentId, subject });
  }
  if (mode === 'fluency') {
    const rows = await FluencyRecord.find({ studentId, fluencyStatus: { $in: ['developing', 'not_fluent'] } }).sort({ fluencyScore: 1 }).limit(4);
    return {
      skillIds: rows.map((row) => row.skillId),
      priorities: rows.map((row) => ({ skillId: String(row.skillId), weight: row.fluencyStatus === 'not_fluent' ? 3 : 2, signals: [{ type: 'fluency_gap', skillId: String(row.skillId), fluencyStatus: row.fluencyStatus }] })),
      signals: rows.map((row) => ({ type: 'fluency_gap', skillId: String(row.skillId), fluencyStatus: row.fluencyStatus, fluencyScore: row.fluencyScore })),
    };
  }
  if (mode === 'retention') {
    const rows = await RetentionReview.find({
      studentId,
      completed: false,
      reviewDate: { $lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
    }).sort({ reviewDate: 1 }).limit(4);
    return {
      skillIds: rows.map((row) => row.skillId),
      priorities: rows.map((row) => ({ skillId: String(row.skillId), weight: row.status === 'retention_risk' ? 4 : 2, signals: [{ type: 'retention_review', skillId: String(row.skillId), reviewDate: row.reviewDate }] })),
      signals: rows.map((row) => ({ type: row.status === 'retention_risk' ? 'retention_risk' : 'retention_review', skillId: String(row.skillId), reviewDate: row.reviewDate })),
    };
  }
  if (mode === 'mastery_check') {
    const rows = await MasteryRecord.find({
      studentId,
      status: 'mastered',
      subject: isScience ? 'Science' : { $ne: 'Science' },
    }).sort({ lastPracticedAt: -1 }).limit(4);
    return {
      skillIds: rows.map((row) => row.skillId),
      priorities: rows.map((row) => ({ skillId: String(row.skillId), weight: 1, signals: [{ type: 'mastery_check_ready', skillId: String(row.skillId) }] })),
      signals: rows.map((row) => ({ type: 'mastery_check_ready', skillId: String(row.skillId), score: row.score })),
    };
  }
  if (mode === 'recent_mistakes') {
    // Mistakes carry the originating module; Science practice tags its
    // mistakes with module 'Science Adaptive Revision', so we filter to that
    // bucket for a Science worksheet and exclude it (everything else =
    // MathPath family) for a Math one.
    const moduleFilter = isScience
      ? { module: 'Science Adaptive Revision' }
      : { module: { $ne: 'Science Adaptive Revision' } };
    const filter = { studentId, status: { $ne: 'resolved' }, ...moduleFilter };
    if (misconceptionTag) filter.misconceptionTag = misconceptionTag;
    const mistakes = await Mistake.find(filter)
      .sort({ occurredAt: -1 }).limit(30);
    // Weight by frequency.
    const freq = {};
    mistakes.forEach((m) => { freq[m.skillId] = (freq[m.skillId] || 0) + 1; });
    return {
      skillIds: Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 4),
      priorities: Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ skillId: id, weight: 2 + count, signals: [{ type: 'recent_mistake', skillId: id, count }] })).slice(0, 4),
      signals: mistakes.slice(0, 8).map((mistake) => ({
        type: 'recent_mistake',
        skillId: String(mistake.skillId),
        misconceptionTag: mistake.misconceptionTag || '',
        mistakeType: mistake.mistakeType || '',
      })),
    };
  }
  if (mode === 'diagnostic_results') {
    return resolveDiagnosticSkills({ studentId, subject });
  }
  // weak_skills
  const recs = await MasteryRecord.find({
    studentId, status: { $in: ['needs_review', 'learning', 'not_started'] },
    subject: isScience ? 'Science' : { $ne: 'Science' },
  }).sort({ score: 1 }).limit(4);
  return {
    skillIds: recs.map((r) => r.skillId),
    priorities: recs.map((record, index) => ({
      skillId: String(record.skillId),
      weight: Math.max(1, 6 - index),
      signals: [{ type: 'weak_skill', skillId: String(record.skillId), score: record.score, status: record.status }],
    })),
    signals: recs.map((record) => ({
      type: 'weak_skill',
      skillId: String(record.skillId),
      score: record.score,
      status: record.status,
      confidence: record.confidence,
    })),
  };
}

// Build the structured worksheet content. Returns { skillIds, topicIds, content }.
export async function generateWorksheet({ mode, worksheetType = '', studentId, studentName, skillIds = [], topicId = null, misconceptionTag = '', difficulty = 'medium', questionCount = 10, includesSolutions = true, includesMistakeReview = false, subject = 'Math', domain = 'fractions', generatedFor = null } = {}) {
  const normalizedMode = normalizeWorksheetMode({ mode, worksheetType });
  const requestedDifficulty = difficulty === 'adaptive' ? 'easy' : difficulty;
  const resolved = await resolveSkills({ mode: normalizedMode, studentId, skillIds, topicId, misconceptionTag, subject });
  const targetSkillIds = (resolved.skillIds || []).map(String);
  const skills = await Skill.find({ _id: { $in: targetSkillIds } }).populate('topicId');
  const skillNameById = Object.fromEntries(skills.map((s) => [String(s._id), s.name]));
  const topicIds = [...new Set(skills.map((s) => s.topicId?._id).filter(Boolean).map(String))];

  const priorities = (resolved.priorities?.length ? resolved.priorities : targetSkillIds.map((id) => ({ skillId: id, weight: 1, signals: [] })))
    .filter((row) => targetSkillIds.includes(String(row.skillId)));
  const { questions, distribution } = await selectWeightedQuestions({
    studentId,
    priorities,
    difficulty: requestedDifficulty,
    count: questionCount,
  });

  // Optional review section: recent unresolved mistakes for the targeted skills.
  let reviewSection = [];
  if (includesMistakeReview && targetSkillIds.length) {
    const mistakes = await Mistake.find({ studentId, skillId: { $in: targetSkillIds }, status: { $ne: 'resolved' } })
      .sort({ occurredAt: -1 }).limit(3);
    reviewSection = mistakes.map((m) => ({
      stem: m.questionStem, yourAnswer: m.studentAnswer, correctAnswer: m.correctAnswer,
      workedSolution: includesSolutions ? m.workedSolution : '', skillName: skillNameById[String(m.skillId)] || '',
    }));
  }

  const modeLabel = MODE_LABELS[normalizedMode] || 'Practice';
  const topicNames = [...new Set(skills.map((s) => s.topicId?.name).filter(Boolean))];
  const answerKey = questions.map((q, i) => ({
    questionId: String(q._id),
    n: i + 1,
    answer: q.answer,
    explanation: includesSolutions ? (q.workedSolution || q.explanation || '') : '',
  }));
  const content = {
    title: `${modeLabel} worksheet${topicNames.length ? ' · ' + topicNames.join(', ') : ''}`,
    studentName: studentName || '',
    studentLevel: skills.find((s) => s.moeLevel)?.moeLevel || '',
    domain,
    worksheetType: worksheetType || normalizedMode,
    estimatedMinutes: Math.max(5, Math.ceil(questionCount * (normalizedMode === 'fluency' ? 0.75 : 1.5))),
    topicNames,
    skillIds: targetSkillIds,
    skillNames: skills.map((s) => s.name),
    questionDistribution: distribution.map((row) => ({
      skillId: row.skillId,
      skillName: skillNameById[String(row.skillId)] || '',
      count: row.count,
      weight: row.weight,
    })),
    answerKey,
    personalization: {
      sourceMode: normalizedMode,
      sourceLabel: modeLabel,
      sourceSummary: summarizeMode({
        mode: normalizedMode,
        signalCount: resolved.signals?.length || targetSkillIds.length,
        diagnosticSession: resolved.diagnosticSession,
        subject,
      }),
      evidenceSignals: resolved.signals || [],
      notRandom: true,
      generatedFor,
      recommendedUse: includesMistakeReview ? 'Review the mistake section first, then complete the targeted questions.' : 'Complete the targeted questions and mark with the answer key.',
      audienceActions: ['Assign practice', 'Print worksheet', 'Review mistakes'],
    },
    reviewSection,
    questions: questions.map((q, i) => ({
      n: i + 1,
      questionId: q._id,
      skillId: String(q.skillId?._id || q.skillId),
      stem: q.stem,
      type: q.type,
      choices: q.choices,
      visual: q.visual || null,
      answer: q.answer,
      workedSolution: includesSolutions ? q.workedSolution : '',
      skillName: skillNameById[String(q.skillId?._id || q.skillId)] || '',
      moeLevel: q.moeLevel || '',
      topicName: q.skillId?.topicId?.name || '',
      difficulty: q.difficulty,
    })),
  };

  return { skillIds: targetSkillIds, topicIds, content, answerKey, worksheetType: worksheetType || normalizedMode, sourceMode: normalizedMode, estimatedMinutes: content.estimatedMinutes };
}
