import Question from '../../models/Question.js';

export const WORKSHEET_TYPE_RULES = {
  recovery_worksheet: {
    label: 'Recovery Worksheet',
    sections: [
      { key: 'foundation', title: 'Section A: Foundation Practice', difficulty: 'easy', ratio: 0.6 },
      { key: 'guided', title: 'Section B: Guided Practice', difficulty: 'medium', ratio: 0.3 },
      { key: 'mastery', title: 'Section C: Challenge Questions', difficulty: 'hard', ratio: 0.1 },
    ],
  },
  practice_worksheet: {
    label: 'Practice Worksheet',
    sections: [
      { key: 'foundation', title: 'Section A: Foundation Practice', difficulty: 'easy', ratio: 0.34 },
      { key: 'guided', title: 'Section B: Guided Practice', difficulty: 'medium', ratio: 0.33 },
      { key: 'mastery', title: 'Section C: Challenge Questions', difficulty: 'hard', ratio: 0.33 },
    ],
  },
  homework_worksheet: {
    label: 'Homework Worksheet',
    sections: [
      { key: 'foundation', title: 'Section A: Foundation Practice', difficulty: 'easy', ratio: 0.4 },
      { key: 'guided', title: 'Section B: Guided Practice', difficulty: 'medium', ratio: 0.4 },
      { key: 'mastery', title: 'Section C: Challenge Questions', difficulty: 'hard', ratio: 0.2 },
    ],
  },
  tutor_lesson_worksheet: {
    label: 'Tutor Lesson Worksheet',
    sections: [
      { key: 'foundation', title: 'Section A: Warm-Up', difficulty: 'easy', ratio: 0.25 },
      { key: 'guided', title: 'Section B: Guided Practice', difficulty: 'medium', ratio: 0.5 },
      { key: 'mastery', title: 'Section C: Exit Check', difficulty: 'hard', ratio: 0.25 },
    ],
  },
  recheck_worksheet: {
    label: 'Recheck Worksheet',
    sections: [
      { key: 'foundation', title: 'Section A: Readiness Check', difficulty: 'easy', ratio: 0.2 },
      { key: 'guided', title: 'Section B: Skill Verification', difficulty: 'medium', ratio: 0.4 },
      { key: 'mastery', title: 'Section C: Independent Challenge', difficulty: 'hard', ratio: 0.4 },
    ],
  },
  parent_support_worksheet: {
    label: 'Parent Support Worksheet',
    sections: [
      { key: 'foundation', title: 'Section A: Parent-Supported Practice', difficulty: 'easy', ratio: 0.5 },
      { key: 'guided', title: 'Section B: Try Together', difficulty: 'medium', ratio: 0.35 },
      { key: 'mastery', title: 'Section C: Independent Try', difficulty: 'hard', ratio: 0.15 },
    ],
  },
};

function normalizeWorksheetType(value = '') {
  const key = String(value || '').trim();
  return WORKSHEET_TYPE_RULES[key] ? key : 'practice_worksheet';
}

function normalizeSkillIds(skillIds = []) {
  return [...new Set((skillIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
}

export function allocateWorksheetSections({ worksheetType = 'practice_worksheet', questionCount = 10 } = {}) {
  const normalizedType = normalizeWorksheetType(worksheetType);
  const total = Math.max(1, Number(questionCount || 10));
  const base = WORKSHEET_TYPE_RULES[normalizedType].sections.map((section) => {
    const raw = section.ratio * total;
    return {
      ...section,
      count: Math.max(0, Math.floor(raw)),
      remainder: raw - Math.floor(raw),
    };
  });
  let allocated = base.reduce((sum, section) => sum + section.count, 0);
  while (allocated < total) {
    const next = [...base].sort((a, b) => b.remainder - a.remainder || b.ratio - a.ratio)[allocated % base.length];
    next.count += 1;
    allocated += 1;
  }
  while (allocated > total) {
    const next = [...base].sort((a, b) => a.ratio - b.ratio).find((section) => section.count > 0);
    if (!next) break;
    next.count -= 1;
    allocated -= 1;
  }
  return base.map(({ remainder, ratio, ...section }) => section).filter((section) => section.count > 0);
}

function questionSignature(question = {}) {
  return JSON.stringify({
    stem: question.stem,
    answer: question.answer || question.modelAnswer || '',
    visual: question.visual || null,
    figureUrl: question.figureUrl || '',
  });
}

function matchesMisconception(question = {}, misconceptionTags = []) {
  const tags = (misconceptionTags || []).map((tag) => String(tag || '').trim()).filter(Boolean);
  if (!tags.length) return false;
  const raw = [
    question.targetsMisconception,
    question.misconceptionTag,
    ...(question.misconceptionTags || []),
    ...(question.metadata?.misconceptionTags || []),
  ].map((tag) => String(tag || '').trim()).filter(Boolean);
  return raw.some((tag) => tags.includes(tag));
}

async function pickForSection({
  skillIds = [],
  difficulty,
  count,
  excludeIds = new Set(),
  excludeSignatures = new Set(),
  misconceptionTags = [],
} = {}) {
  const pool = await Question.find({
    skillId: { $in: skillIds },
    difficulty,
    worksheetCompatible: { $ne: false },
  }).populate({ path: 'skillId', populate: { path: 'topicId' } });

  const ranked = pool
    .filter((question) => !excludeIds.has(String(question._id)))
    .map((question) => ({
      question,
      score: (matchesMisconception(question, misconceptionTags) ? -3 : 0) + Math.random() * 0.2,
    }))
    .sort((a, b) => a.score - b.score);

  const picked = [];
  for (const row of ranked) {
    if (picked.length >= count) break;
    const signature = questionSignature(row.question);
    if (excludeSignatures.has(signature)) continue;
    picked.push(row.question);
    excludeIds.add(String(row.question._id));
    excludeSignatures.add(signature);
  }
  return picked;
}

export async function selectWorksheetQuestions({
  skillIds = [],
  worksheetType = 'practice_worksheet',
  questionCount = 10,
  misconceptionTags = [],
} = {}) {
  const normalizedSkillIds = normalizeSkillIds(skillIds);
  if (!normalizedSkillIds.length) {
    const err = new Error('At least one skill is required to generate an intervention worksheet.');
    err.status = 400;
    throw err;
  }
  const sections = allocateWorksheetSections({ worksheetType, questionCount });
  const excludeIds = new Set();
  const excludeSignatures = new Set();
  const outputSections = [];

  for (const section of sections) {
    const picked = await pickForSection({
      skillIds: normalizedSkillIds,
      difficulty: section.difficulty,
      count: section.count,
      excludeIds,
      excludeSignatures,
      misconceptionTags,
    });
    outputSections.push({ ...section, questions: picked });
  }

  const pickedCount = outputSections.reduce((sum, section) => sum + section.questions.length, 0);
  if (pickedCount < Number(questionCount || 10)) {
    const remaining = Number(questionCount || 10) - pickedCount;
    const topUp = await Question.find({
      skillId: { $in: normalizedSkillIds },
      worksheetCompatible: { $ne: false },
      _id: { $nin: [...excludeIds] },
    }).populate({ path: 'skillId', populate: { path: 'topicId' } }).limit(remaining);
    if (topUp.length) {
      outputSections.push({
        key: 'additional',
        title: 'Additional Targeted Practice',
        difficulty: 'mixed',
        count: topUp.length,
        questions: topUp,
      });
    }
  }

  return {
    worksheetType: normalizeWorksheetType(worksheetType),
    sections: outputSections,
    questions: outputSections.flatMap((section) => section.questions),
  };
}

export default {
  WORKSHEET_TYPE_RULES,
  allocateWorksheetSections,
  selectWorksheetQuestions,
};
