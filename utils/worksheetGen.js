// Rule-based worksheet generation (Phase 4 MVP — no AI). Resolves which skills
// to target per mode, selects similar questions from the shared bank, and
// assembles structured worksheet content (questions + optional review + solutions).
import Question from '../models/Question.js';
import Mistake from '../models/Mistake.js';
import MasteryRecord from '../models/MasteryRecord.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import Skill from '../models/Skill.js';

const DIFF_NEIGHBOURS = { easy: ['easy', 'medium'], medium: ['easy', 'medium', 'hard'], hard: ['medium', 'hard'] };

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

  const pool = await Question.find({ skillId: { $in: skillIds }, difficulty: { $in: allowed } })
    .populate('skillId');

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

  // Take the best-ranked questions in order, de-duplicating by stem, up to `count`.
  const seenStems = new Set();
  const out = [];
  for (const { q } of ranked) {
    if (seenStems.has(q.stem)) continue;
    seenStems.add(q.stem);
    out.push(q);
    if (out.length >= count) break;
  }
  return out;
}

// Resolve target skills for each generation mode.
async function resolveSkills({ mode, studentId, skillIds, topicId }) {
  if (mode === 'selected_topic') {
    if (skillIds?.length) return skillIds;
    if (topicId) return (await Skill.find({ topicId }).select('_id')).map((s) => s._id);
    return [];
  }
  if (mode === 'recent_mistakes') {
    const mistakes = await Mistake.find({ studentId, status: { $ne: 'resolved' } }).sort({ occurredAt: -1 }).limit(30);
    // Weight by frequency.
    const freq = {};
    mistakes.forEach((m) => { freq[m.skillId] = (freq[m.skillId] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 4);
  }
  // weak_skills
  const recs = await MasteryRecord.find({ studentId, status: { $in: ['needs_review', 'learning', 'not_started'] } })
    .sort({ score: 1 }).limit(4);
  return recs.map((r) => r.skillId);
}

// Build the structured worksheet content. Returns { skillIds, topicIds, content }.
export async function generateWorksheet({ mode, studentId, studentName, skillIds = [], topicId = null, difficulty = 'medium', questionCount = 10, includesSolutions = true, includesMistakeReview = false }) {
  const targetSkillIds = (await resolveSkills({ mode, studentId, skillIds, topicId })).map(String);
  const skills = await Skill.find({ _id: { $in: targetSkillIds } }).populate('topicId');
  const skillNameById = Object.fromEntries(skills.map((s) => [String(s._id), s.name]));
  const topicIds = [...new Set(skills.map((s) => s.topicId?._id).filter(Boolean).map(String))];

  const questions = await selectSimilarQuestions({ studentId, skillIds: targetSkillIds, difficulty, count: questionCount });

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

  const modeLabel = { recent_mistakes: 'Recent mistakes', weak_skills: 'Weak skills', selected_topic: 'Selected topic' }[mode] || 'Practice';
  const topicNames = [...new Set(skills.map((s) => s.topicId?.name).filter(Boolean))];
  const content = {
    title: `${modeLabel} worksheet${topicNames.length ? ' · ' + topicNames.join(', ') : ''}`,
    studentName: studentName || '',
    skillNames: skills.map((s) => s.name),
    reviewSection,
    questions: questions.map((q, i) => ({
      n: i + 1,
      questionId: q._id,
      stem: q.stem,
      type: q.type,
      choices: q.choices,
      answer: q.answer,
      workedSolution: includesSolutions ? q.workedSolution : '',
      skillName: skillNameById[String(q.skillId?._id || q.skillId)] || '',
      difficulty: q.difficulty,
    })),
  };

  return { skillIds: targetSkillIds, topicIds, content };
}
