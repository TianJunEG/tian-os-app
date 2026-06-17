import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import AssessmentSpecification from '../models/mathpath/AssessmentSpecification.js';
import MathPathAssessmentSession from '../models/mathpath/MathPathAssessmentSession.js';
import StudentGuardian from '../models/StudentGuardian.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import ClassStudent from '../models/ClassStudent.js';
import Class from '../models/Class.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import Subject from '../models/Subject.js';
import { buildGeneratedPaperBlueprintFromSpecification } from '../services/mathpath/assessmentBlueprintEngine.js';
import {
  resolveTestMode,
  getTestModeConfig,
  normalizeDifficultyMix,
  sampleQuestionsByDifficulty,
  isTestMode,
} from '../services/mathpath/testModePresets.js';
import { sourceWeakSkills } from '../services/mathpath/weaknessSkillSourcer.js';
import { buildPaperSections } from '../services/mathpath/paperSectioning.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);
const asArray = (v) => (Array.isArray(v) ? v : []);
const roleSet = (user) => new Set([user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean));
const hasRole = (user, role) => roleSet(user).has(role);

function assessmentSessionId(prefix = 'specassess') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeSpecPayload(body = {}) {
  return {
    title: String(body.title || '').trim(),
    ownerType: String(body.ownerType || '').trim(),
    targetType: String(body.targetType || '').trim(),
    targetStudentId: body.targetStudentId || null,
    targetClassId: body.targetClassId || null,
    level: String(body.level || '').trim(),
    subject: String(body.subject || 'Math').trim(),
    paperType: String(body.paperType || 'paper1').trim(),
    totalMarks: Math.max(0, Number(body.totalMarks || 0)),
    durationMinutes: Math.max(0, Number(body.durationMinutes || 0)),
    calculatorAllowed: Boolean(body.calculatorAllowed),
    timed: body.timed !== false,
    source: String(body.source || 'manual'),
    status: String(body.status || 'draft'),
    assessmentBlueprintId: body.assessmentBlueprintId || null,
    outputMode: ['quickCheck', 'topicTest', 'miniPaper', 'fullPaper', 'schoolAlignedMock'].includes(String(body.outputMode || ''))
      ? String(body.outputMode)
      : 'topicTest',
    testMode: isTestMode(body.testMode)
      ? String(body.testMode)
      : resolveTestMode({ outputMode: body.outputMode }),
    topics: asArray(body.topics).map((t) => ({
      topicName: String(t.topicName || '').trim(),
      topicId: t.topicId || null,
      domainId: String(t.domainId || '').trim(),
      skillIds: asArray(t.skillIds).map((s) => String(s)).filter(Boolean),
      marks: Math.max(0, Number(t.marks || 0)),
      questionCount: Math.max(0, Number(t.questionCount || 0)),
      difficulty: ['easy', 'medium', 'hard', 'mixed'].includes(String(t.difficulty || '').toLowerCase())
        ? String(t.difficulty).toLowerCase()
        : 'mixed',
      difficultyMix: normalizeDifficultyMix(t.difficultyMix),
      includeWordProblems: t.includeWordProblems !== false,
      notes: String(t.notes || '').trim(),
    })),
  };
}

async function assertSpecAccess(req, spec) {
  if (!spec) return { ok: false, code: 404, error: 'Assessment specification not found.' };
  if (String(spec.createdByUserId) === String(req.user.id)) return { ok: true };
  if (spec.workspaceId && req.workspaceId && String(spec.workspaceId) === String(req.workspaceId)) return { ok: true };
  return { ok: false, code: 403, error: 'Not authorized for this assessment specification.' };
}

async function validateSpecOwnership(req, specData) {
  const ownerType = specData.ownerType;
  const targetType = specData.targetType;
  const workspaceId = req.workspaceId || null;

  if (!['parent', 'tutor', 'teacher'].includes(ownerType)) return { ok: false, code: 400, error: 'Invalid ownerType.' };
  if (!['student', 'class'].includes(targetType)) return { ok: false, code: 400, error: 'Invalid targetType.' };
  if (!hasRole(req.user, ownerType)) return { ok: false, code: 403, error: `Current user is not a ${ownerType}.` };

  if (ownerType === 'parent') {
    if (targetType !== 'student' || !specData.targetStudentId) return { ok: false, code: 400, error: 'Parent TOS must target one student.' };
    const guard = await StudentGuardian.findOne({
      guardianUserId: req.user.id,
      studentId: specData.targetStudentId,
    });
    if (!guard) return { ok: false, code: 403, error: 'Parent can only target linked children.' };
    if (guard.accessLevel === 'view_only') return { ok: false, code: 403, error: 'View-only access does not permit this action.' };
    return { ok: true, workspaceId: guard.workspaceId || workspaceId };
  }

  if (ownerType === 'tutor') {
    if (!workspaceId) return { ok: false, code: 400, error: 'Tutor workspace required (X-Workspace-Id).' };
    if (targetType !== 'student' || !specData.targetStudentId) return { ok: false, code: 400, error: 'Tutor TOS must target one assigned student.' };
    const link = await TutorStudentLink.findOne({
      workspaceId,
      tutorUserId: req.user.id,
      studentId: specData.targetStudentId,
      status: 'active',
    });
    if (!link) return { ok: false, code: 403, error: 'Tutor can only target assigned students.' };
    return { ok: true, workspaceId };
  }

  if (!workspaceId) return { ok: false, code: 400, error: 'Teacher workspace required (X-Workspace-Id).' };
  if (targetType === 'class') {
    if (!specData.targetClassId) return { ok: false, code: 400, error: 'Teacher class target requires targetClassId.' };
    const ownedClass = await Class.findOne({
      _id: specData.targetClassId,
      workspaceId,
      teacherUserId: req.user.id,
    });
    if (!ownedClass) return { ok: false, code: 403, error: 'Teacher can only target own classes.' };
    return { ok: true, workspaceId };
  }

  if (!specData.targetStudentId) return { ok: false, code: 400, error: 'Teacher student target requires targetStudentId.' };
  const enrollment = await ClassStudent.findOne({
    workspaceId,
    studentId: specData.targetStudentId,
    status: 'active',
  });
  if (!enrollment) return { ok: false, code: 403, error: 'Teacher can only target students in own workspace classes.' };
  return { ok: true, workspaceId };
}

async function resolveTopicSkillIds(topicRow = {}, subjectId) {
  const explicit = new Set(asArray(topicRow.skillIds).map((s) => String(s)).filter(Boolean));
  if (explicit.size) return [...explicit];

  const topicId = topicRow.topicId ? toObjectId(topicRow.topicId) : null;
  if (topicId) {
    const byTopic = await Skill.find({ topicId }).select('_id metadata slug');
    return byTopic.map((s) => String(s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || s.slug || s._id));
  }

  if (topicRow.topicName) {
    const t = await Topic.findOne({
      subjectId,
      name: { $regex: new RegExp(`^${topicRow.topicName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).select('_id');
    if (t) {
      const byTopic = await Skill.find({ topicId: t._id }).select('_id metadata slug');
      return byTopic.map((s) => String(s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || s.slug || s._id));
    }
  }
  return [];
}

function questionMarksForDifficulty(difficulty) {
  if (difficulty === 'hard') return 3;
  if (difficulty === 'medium') return 2;
  return 1;
}

function pickDifficultyFilter(difficulty) {
  if (difficulty === 'mixed') return ['easy', 'medium', 'hard'];
  return [difficulty];
}

// Build synthetic topic rows from a student's weak skill set, one row per domain.
// Marks are weighted by how many weak skills fall in each domain so the paper
// spends more questions where the student is weakest.
export function synthesizeWeaknessTopicRows(weakSkillIds, domainBySkill = {}) {
  const byDomain = new Map();
  for (const skillId of weakSkillIds) {
    const dom = String(domainBySkill[skillId] || 'mixed');
    if (!byDomain.has(dom)) byDomain.set(dom, []);
    byDomain.get(dom).push(skillId);
  }
  return [...byDomain.entries()].map(([domainId, skillIds]) => ({
    topicName: `Weak skills — ${domainId}`,
    topicId: null,
    domainId: domainId === 'mixed' ? '' : domainId,
    skillIds,
    marks: skillIds.length,
    questionCount: 0,
    difficulty: 'mixed',
    difficultyMix: null,
    includeWordProblems: true,
  }));
}

// Soft ranking for error-diagnosis selection: reward MCQ items and items carrying
// a misconception tag so wrong answers map to a named error pattern.
function questionPreferenceScore(q, modeConfig = {}) {
  let score = 0;
  if (modeConfig.preferMcq && String(q.type || '') === 'mcq') score += 2;
  if (modeConfig.preferMisconception && q.misconceptionTag) score += 1;
  return score;
}

export async function generateTestFromSpecification(specificationId, options = {}) {
  const spec = await AssessmentSpecification.findById(specificationId);
  if (!spec) throw new Error('Assessment specification not found.');

  const subject = await Subject.findOne({ key: String(spec.subject || 'math').toLowerCase() });
  if (!subject) throw new Error(`Subject "${spec.subject}" not found.`);

  const testMode = resolveTestMode({ testMode: spec.testMode, outputMode: spec.outputMode });
  const modeConfig = getTestModeConfig(testMode);
  const effectiveTimed = modeConfig.forceTimed ? true : Boolean(spec.timed);
  const targetStudentId = spec.targetType === 'student' ? String(spec.targetStudentId || '') : String(options.targetStudentId || '');
  const sessionId = assessmentSessionId('specassess');

  const specTopicRows = asArray(spec.topics);

  // Data-driven modes (weakness_drill) auto-source the student's weak skills and
  // narrow selection to them. Sourcing failures degrade gracefully to the spec's
  // own topic/skill scope rather than aborting the paper.
  let weakSkillSet = null;
  let weakSkillIds = [];
  let weakDomainBySkill = {};
  if (modeConfig.sourceWeakSkills && targetStudentId) {
    try {
      const sourced = await sourceWeakSkills({
        studentId: targetStudentId,
        domainIds: specTopicRows.map((t) => t.domainId).filter(Boolean),
        limit: 12,
      });
      weakSkillIds = sourced.skillIds;
      weakDomainBySkill = sourced.domainBySkill || {};
      if (weakSkillIds.length) weakSkillSet = new Set(weakSkillIds);
    } catch {
      weakSkillSet = null;
    }
  }

  // When a weakness spec carries no topic rows, synthesize them from the weak
  // skill set (grouped by domain) so the paper builds itself with zero manual config.
  let synthesizedFromWeakness = false;
  let topicRows = specTopicRows;
  if (!topicRows.length && weakSkillIds.length) {
    topicRows = synthesizeWeaknessTopicRows(weakSkillIds, weakDomainBySkill);
    synthesizedFromWeakness = true;
  }

  if (!topicRows.length) {
    throw new Error(
      modeConfig.sourceWeakSkills
        ? 'No weak skills found for this student yet, so a weakness drill cannot be built. Add topics manually or run a diagnostic/practice first.'
        : 'Specification has no topic rows.'
    );
  }

  // Default a paper size when synthesizing for a spec that carries no marks.
  const totalMarks = Math.max(
    1,
    Number(spec.totalMarks || 0) || (synthesizedFromWeakness ? weakSkillIds.length * 4 : 0)
  );
  const markSum = topicRows.reduce((s, t) => s + Math.max(0, Number(t.marks || 0)), 0) || totalMarks;

  const targetSkillIds = new Set();
  const targetQuestionFamilyIds = new Set();
  const topicBlueprint = [];
  const responsesBlueprint = [];

  for (const row of topicRows) {
    const weightMarks = Math.max(0, Number(row.marks || 0));
    const ratio = markSum ? weightMarks / markSum : 0;
    const allocatedMarks = Math.max(1, Math.round(totalMarks * ratio));
    const difficulty = row.difficulty || 'mixed';
    const marksPerQuestion = questionMarksForDifficulty(difficulty === 'mixed' ? 'medium' : difficulty);
    const desiredCount = Math.max(
      row.questionCount || 0,
      Math.ceil(allocatedMarks / Math.max(1, marksPerQuestion))
    );

    const resolvedSkillKeys = await resolveTopicSkillIds(row, subject._id);
    // For weakness mode, keep only the weak skills within this topic. If the topic
    // has no weak overlap, fall back to its full skill set so the paper still fills.
    let skillKeys = resolvedSkillKeys;
    let topicWeakSourced = false;
    if (weakSkillSet) {
      const intersect = resolvedSkillKeys.filter((k) => weakSkillSet.has(k));
      if (intersect.length) {
        skillKeys = intersect;
        topicWeakSourced = true;
      }
    }

    const skillDocs = await Skill.find({
      $or: [
        { _id: { $in: skillKeys.map(toObjectId).filter(Boolean) } },
        { slug: { $in: skillKeys } },
        { 'metadata.mathPathSkillId': { $in: skillKeys } },
        { 'metadata.frameworkCode': { $in: skillKeys } },
      ],
    }).select('_id slug metadata topicId');

    const skillDocIds = skillDocs.map((s) => s._id);
    const skillPublicIds = skillDocs.map((s) => String(s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || s.slug || s._id));
    skillPublicIds.forEach((id) => targetSkillIds.add(id));

    const pool = await Question.find({
      subjectId: subject._id,
      skillId: { $in: skillDocIds },
      difficulty: { $in: pickDifficultyFilter(difficulty) },
      ...(row.includeWordProblems === false ? { stem: { $not: /word|story|problem/i } } : {}),
    })
      // Fetch a generous candidate pool so the difficulty sampler has buckets to
      // draw from rather than seeing only the first N of one difficulty.
      .limit(Math.max(desiredCount * 5, desiredCount, 30))
      .lean();

    // Error-diagnosis papers prefer MCQ items with a misconception tag so a wrong
    // answer maps to a named error. This is a soft sort (preference), so the pool
    // still falls back to other items when tagged MCQs are scarce.
    const candidates = (modeConfig.preferMcq || modeConfig.preferMisconception)
      ? [...pool].sort((a, b) => questionPreferenceScore(b, modeConfig) - questionPreferenceScore(a, modeConfig))
      : pool;

    // Effective difficulty distribution: a per-topic override wins for 'mixed'
    // rows, otherwise the test mode's default mix. For single-band rows the query
    // already constrained difficulty, so the mix is effectively a no-op slice.
    const effectiveMix = (difficulty === 'mixed'
      ? (normalizeDifficultyMix(row.difficultyMix) || modeConfig.difficultyMix)
      : modeConfig.difficultyMix);

    const selected = sampleQuestionsByDifficulty(candidates, desiredCount, effectiveMix);
    selected.forEach((q, idx) => {
      // Honour each question's own difficulty for marks rather than a flat
      // topic-level value, so a balanced paper carries balanced marks. Trade-off:
      // a topic's summed marks can drift from its planned `allocatedMarks` (which
      // assumes the medium rate), so the paper's actual total may differ from the
      // requested totalMarks. The session stores the actual sum (generatedTotalMarks).
      const marks = questionMarksForDifficulty(q.difficulty || 'medium');
      const qSkill = skillDocs.find((s) => String(s._id) === String(q.skillId));
      const publicSkillId = String(qSkill?.metadata?.mathPathSkillId || qSkill?.metadata?.frameworkCode || qSkill?.slug || q.skillId);
      targetQuestionFamilyIds.add(`TOS_${publicSkillId}_${idx + 1}`);
      responsesBlueprint.push({
        questionId: String(q._id),
        skillId: publicSkillId,
        questionFamilyId: `TOS_${publicSkillId}_${idx + 1}`,
        prompt: q.stem,
        type: q.type || 'short_answer',
        choices: q.choices || [],
        answer: { display: String(q.answer || '') },
        acceptedAnswers: [String(q.answer || '')],
        solutionSteps: q.workedSolution ? [String(q.workedSolution)] : [],
        difficulty: q.difficulty,
        marks,
        workingRequired: true,
        mentalMathEligible: false,
      });
    });

    topicBlueprint.push({
      topicName: row.topicName || 'Topic',
      requestedMarks: weightMarks,
      allocatedMarks,
      questionCount: selected.length,
      difficulty,
      difficultyMix: difficulty === 'mixed' ? effectiveMix : null,
      includeWordProblems: row.includeWordProblems !== false,
      skillIds: skillPublicIds,
      weaknessSourced: topicWeakSourced,
    });
  }

  const generatedTotalMarks = responsesBlueprint.reduce((s, q) => s + Number(q.marks || 0), 0);

  // Group the flat question list into PSLE-style paper sections (Paper 1 booklets
  // + Paper 2). Reorders the questions by section and tags each with its section;
  // non-booklet specs collapse to a single section, preserving prior behaviour.
  const { sections, questions: sectionedQuestions } = buildPaperSections({
    questions: responsesBlueprint,
    paperType: spec.paperType,
    testMode,
    calculatorAllowed: Boolean(spec.calculatorAllowed),
  });

  const sessionDoc = await MathPathAssessmentSession.create({
    assessmentSessionId: sessionId,
    studentId: targetStudentId || 'class-assignment',
    domainId: (topicRows[0]?.domainId || 'fractions').toLowerCase(),
    assessmentType: 'curriculum',
    mode: 'tos',
    singaporeLevel: spec.level || '',
    paperType: spec.paperType || '',
    targetSkillIds: [...targetSkillIds],
    targetQuestionFamilyIds: [...targetQuestionFamilyIds],
    totalMarks: generatedTotalMarks,
    timeLimitMinutes: Number(spec.durationMinutes || 0),
    calculatorAllowed: Boolean(spec.calculatorAllowed),
    workingRequired: true,
    status: 'notStarted',
    result: {
      specificationId: String(spec._id),
      testMode,
      timed: effectiveTimed,
      weakSkillIds,
      synthesizedFromWeakness,
      source: spec.source,
      title: spec.title,
      topicBlueprint,
      sections,
      questions: sectionedQuestions,
    },
  });

  return {
    specificationId: String(spec._id),
    assessmentSessionId: sessionDoc.assessmentSessionId,
    targetType: spec.targetType,
    targetStudentId: spec.targetStudentId ? String(spec.targetStudentId) : null,
    targetClassId: spec.targetClassId ? String(spec.targetClassId) : null,
    title: spec.title,
    level: spec.level,
    subject: spec.subject,
    paperType: spec.paperType,
    testMode,
    timed: effectiveTimed,
    weakSkillIds,
    synthesizedFromWeakness,
    durationMinutes: Number(spec.durationMinutes || 0),
    calculatorAllowed: Boolean(spec.calculatorAllowed),
    totalMarks: generatedTotalMarks,
    topicBlueprint,
    sections,
    questions: sectionedQuestions,
  };
}

router.use(protect);

router.get('/mine', asyncHandler(async (req, res) => {
  try {
    const query = { createdByUserId: req.user.id };
    if (req.query.ownerType) query.ownerType = String(req.query.ownerType);
    if (req.query.status) query.status = String(req.query.status);
    const rows = await AssessmentSpecification.find(query).sort({ updatedAt: -1 }).limit(100);
    return res.json({ specifications: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load specifications.' });
  }
}));

router.post('/', asyncHandler(async (req, res) => {
  try {
    const payload = normalizeSpecPayload(req.body || {});
    const access = await validateSpecOwnership(req, payload);
    if (!access.ok) return res.status(access.code).json({ error: access.error });

    const doc = await AssessmentSpecification.create({
      ...payload,
      createdByUserId: req.user.id,
      workspaceId: access.workspaceId || null,
    });
    return res.status(201).json({ specification: doc });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create specification.' });
  }
}));

router.put('/:id', asyncHandler(async (req, res) => {
  try {
    const doc = await AssessmentSpecification.findById(req.params.id);
    const access = await assertSpecAccess(req, doc);
    if (!access.ok) return res.status(access.code).json({ error: access.error });
    const payload = normalizeSpecPayload(req.body || {});
    const ownership = await validateSpecOwnership(req, payload);
    if (!ownership.ok) return res.status(ownership.code).json({ error: ownership.error });

    Object.assign(doc, payload);
    if (ownership.workspaceId) doc.workspaceId = ownership.workspaceId;
    await doc.save();
    return res.json({ specification: doc });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update specification.' });
  }
}));

router.post('/:id/generate', asyncHandler(async (req, res) => {
  try {
    const doc = await AssessmentSpecification.findById(req.params.id);
    const access = await assertSpecAccess(req, doc);
    if (!access.ok) return res.status(access.code).json({ error: access.error });
    const generated = await generateTestFromSpecification(req.params.id, req.body || {});
    return res.json({ generated });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to generate test from specification.' });
  }
}));

router.get('/:id/generated-paper-blueprint', asyncHandler(async (req, res) => {
  try {
    const doc = await AssessmentSpecification.findById(req.params.id);
    const access = await assertSpecAccess(req, doc);
    if (!access.ok) return res.status(access.code).json({ error: access.error });
    const generatedPaperBlueprint = await buildGeneratedPaperBlueprintFromSpecification(req.params.id, {
      fallbackProfile: req.query.school
        ? {
            school: String(req.query.school),
            level: String(doc.level || ''),
            subject: String(doc.subject || 'Math'),
            assessmentType: String(req.query.assessmentType || 'School Test'),
          }
        : null,
    });
    if (!generatedPaperBlueprint) {
      return res.status(404).json({ error: 'No blueprint/profile available for this specification.' });
    }
    return res.json({ generatedPaperBlueprint });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to build generated paper blueprint.' });
  }
}));

router.get('/:id/class-results', asyncHandler(async (req, res) => {
  try {
    const doc = await AssessmentSpecification.findById(req.params.id);
    const access = await assertSpecAccess(req, doc);
    if (!access.ok) return res.status(access.code).json({ error: access.error });
    if (doc.targetType !== 'class') return res.status(400).json({ error: 'Specification targetType is not class.' });

    const sessions = await MathPathAssessmentSession.find({
      'result.specificationId': String(doc._id),
      status: { $in: ['submitted', 'marked', 'reviewed'] },
    }).select('studentId result totalMarks');

    const topicMap = new Map();
    sessions.forEach((s) => {
      const topicRows = asArray(s.result?.topicBlueprint);
      topicRows.forEach((t) => {
        const key = String(t.topicName || 'Topic');
        if (!topicMap.has(key)) topicMap.set(key, { topicName: key, marks: 0, runs: 0, studentsNeedingSupport: 0 });
        const row = topicMap.get(key);
        row.marks += Number(t.allocatedMarks || 0);
        row.runs += 1;
      });
    });

    return res.json({
      specificationId: String(doc._id),
      classId: String(doc.targetClassId || ''),
      totalSessions: sessions.length,
      classAverageByTopic: [...topicMap.values()].map((t) => ({
        topicName: t.topicName,
        averageAllocatedMarks: t.runs ? Math.round((t.marks / t.runs) * 10) / 10 : 0,
      })),
      studentsNeedingSupportPerTopic: [],
      interventionGroups: [],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load class-level TOS results.' });
  }
}));

export default router;
