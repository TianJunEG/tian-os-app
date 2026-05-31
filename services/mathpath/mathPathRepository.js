import MathPathSkill from '../../models/mathpath/MathPathSkill.js';
import MathPathQuestionFamily from '../../models/mathpath/MathPathQuestionFamily.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathPracticeSession from '../../models/mathpath/MathPathPracticeSession.js';
import MathPathAssessmentSession from '../../models/mathpath/MathPathAssessmentSession.js';
import MathPathWorkingSession from '../../models/mathpath/MathPathWorkingSession.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';

function toId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeList(items = []) {
  return [...new Set((Array.isArray(items) ? items : []).filter(Boolean))];
}

function sanitizeCurriculumMappings(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      skillId: String(row.skillId || '').trim(),
      country: String(row.country || '').trim().toUpperCase(),
      curriculum: String(row.curriculum || '').trim().toUpperCase(),
      subject: String(row.subject || '').trim(),
      phase: String(row.phase || '').trim(),
      level: String(row.level || '').trim().toUpperCase(),
      stream: row.stream == null ? null : String(row.stream),
      strand: String(row.strand || '').trim(),
      subStrand: String(row.subStrand || '').trim(),
      syllabusTopic: String(row.syllabusTopic || '').trim(),
      syllabusOutcome: String(row.syllabusOutcome || '').trim(),
      introducedLevel: String(row.introducedLevel || '').trim().toUpperCase(),
      masteryLevel: String(row.masteryLevel || '').trim().toUpperCase(),
      levelBand: sanitizeList((row.levelBand || []).map((v) => String(v || '').toUpperCase())),
      sourceDocument: String(row.sourceDocument || '').trim(),
      syllabusRef: String(row.syllabusRef || '').trim(),
      notes: String(row.notes || '').trim(),
    }))
    .filter((row) => row.country && row.curriculum);
}

export async function upsertMathPathSkills(skills = []) {
  if (!Array.isArray(skills) || !skills.length) return { matched: 0, modified: 0, upserted: 0 };
  const ops = skills.map((skill) => ({
    updateOne: {
      filter: { domainId: skill.domainId, skillId: skill.skillId },
      update: {
        $set: {
          universalSkillId: skill.universalSkillId || '',
          universalDomain: skill.universalDomain || skill.domainId || 'fractions',
          universalTitle: skill.universalTitle || skill.name,
          universalDescription: skill.universalDescription || skill.description || '',
          difficultyBand: skill.difficultyBand || '',
          questionTypes: sanitizeList(skill.questionTypes),
          mistakeTypes: sanitizeList(skill.mistakeTypes),
          pathwayOrder: Number(skill.pathwayOrder || 1),
          name: skill.name,
          description: skill.description || '',
          strand: skill.strand || '',
          difficulty: skill.difficulty ?? 1,
          singaporeLevel: sanitizeList(skill.singaporeLevel),
          introducedLevel: skill.introducedLevel || '',
          masteryLevel: skill.masteryLevel || '',
          curriculumMappings: sanitizeCurriculumMappings(skill.curriculumMappings),
          prerequisites: sanitizeList(skill.prerequisites),
          dependents: sanitizeList(skill.dependents),
          mastery: skill.mastery || { minimumAccuracy: 90, minimumQuestions: 20 },
          fluency: skill.fluency || { targetAccuracy: 90, targetAverageSeconds: 20 },
          retention: skill.retention || { reviewDays: [3, 7, 30, 90] },
          remediationTargets: sanitizeList(skill.remediationTargets),
          questionFamilies: sanitizeList(skill.questionFamilies),
          isActive: skill.isActive !== false,
        },
      },
      upsert: true,
    },
  }));
  return MathPathSkill.bulkWrite(ops, { ordered: false });
}

export function getMathPathSkillsByDomain(domainId) {
  return MathPathSkill.find({ domainId, isActive: true }).sort({ skillId: 1 }).lean();
}

export function getMathPathSkill(domainId, skillId) {
  return MathPathSkill.findOne({ domainId, skillId }).lean();
}

export function getMathPathSkillsByCountryCurriculumLevel({
  domainId = 'fractions',
  country = 'SG',
  curriculum = 'MOE_PRIMARY_MATH_2021',
  level = null,
} = {}) {
  const query = {
    domainId,
    isActive: true,
    'curriculumMappings.country': String(country || '').toUpperCase(),
    'curriculumMappings.curriculum': String(curriculum || '').toUpperCase(),
  };
  if (level) {
    query['curriculumMappings.levelBand'] = String(level || '').toUpperCase();
  }
  return MathPathSkill.find(query).sort({ pathwayOrder: 1, skillId: 1 }).lean();
}

export async function getMathPathSkillCurriculumMapping({
  domainId = 'fractions',
  skillId,
  country = 'SG',
  curriculum = 'MOE_PRIMARY_MATH_2021',
} = {}) {
  if (!skillId) return null;
  const row = await MathPathSkill.findOne({ domainId, skillId }).lean();
  if (!row) return null;
  const c = String(country || '').toUpperCase();
  const cur = String(curriculum || '').toUpperCase();
  return (row.curriculumMappings || []).find(
    (mapping) =>
      String(mapping.country || '').toUpperCase() === c
      && String(mapping.curriculum || '').toUpperCase() === cur
  ) || null;
}

export async function upsertQuestionFamilies(questionFamilies = []) {
  if (!Array.isArray(questionFamilies) || !questionFamilies.length) return { matched: 0, modified: 0, upserted: 0 };
  const ops = questionFamilies.map((family) => ({
    updateOne: {
      filter: { domainId: family.domainId, questionFamilyId: family.questionFamilyId },
      update: {
        $set: {
          skillId: family.skillId,
          name: family.name,
          description: family.description || '',
          difficulty: family.difficulty ?? 1,
          recommendedQuestionCount: family.recommendedQuestionCount ?? 20,
          fluencyBenchmarks: family.fluencyBenchmarks || { bronze: 30, silver: 20, gold: 12, platinum: 8 },
          masteryTargetAccuracy: family.masteryTargetAccuracy ?? 90,
          mentalMathEligible: Boolean(family.mentalMathEligible),
          workingRequired: Boolean(family.workingRequired),
          misconceptionTags: sanitizeList(family.misconceptionTags),
          assessmentRelevant: family.assessmentRelevant !== false,
          isActive: family.isActive !== false,
        },
      },
      upsert: true,
    },
  }));
  return MathPathQuestionFamily.bulkWrite(ops, { ordered: false });
}

export function getQuestionFamiliesByDomain(domainId) {
  return MathPathQuestionFamily.find({ domainId, isActive: true }).sort({ questionFamilyId: 1 }).lean();
}

export function getQuestionFamiliesBySkill(domainId, skillId) {
  return MathPathQuestionFamily.find({ domainId, skillId, isActive: true }).sort({ questionFamilyId: 1 }).lean();
}

export function getStudentSkillStates(studentId, domainId) {
  return MathPathStudentSkillState.find({ studentId, domainId }).sort({ skillId: 1 }).lean();
}

export function getStudentSkillState(studentId, domainId, skillId) {
  return MathPathStudentSkillState.findOne({ studentId, domainId, skillId }).lean();
}

export function upsertStudentSkillState(state) {
  return MathPathStudentSkillState.findOneAndUpdate(
    { studentId: state.studentId, domainId: state.domainId, skillId: state.skillId },
    { $set: state },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export function updateStudentSkillState(studentId, domainId, skillId, updates = {}) {
  return MathPathStudentSkillState.findOneAndUpdate(
    { studentId, domainId, skillId },
    { $set: updates },
    { new: true }
  ).lean();
}

export function createMathPathAttempt(attempt) {
  return MathPathAttempt.create({
    ...attempt,
    domainId: attempt.domainId || 'fractions',
    sessionType: attempt.sessionType || 'practice',
    createdAt: attempt.createdAt || new Date(),
  });
}

export function getStudentAttempts(studentId, domainId, filters = {}) {
  const query = { studentId, domainId };
  if (filters.skillId) query.skillId = filters.skillId;
  if (filters.questionFamilyId) query.questionFamilyId = filters.questionFamilyId;
  if (filters.sessionType) query.sessionType = filters.sessionType;
  if (filters.since) query.createdAt = { ...(query.createdAt || {}), $gte: new Date(filters.since) };
  if (filters.until) query.createdAt = { ...(query.createdAt || {}), $lte: new Date(filters.until) };
  return MathPathAttempt.find(query).sort({ createdAt: -1 }).lean();
}

export function getAttemptsBySession(sessionId) {
  return MathPathAttempt.find({ sessionId }).sort({ createdAt: 1 }).lean();
}

export function createDiagnosticSession(data = {}) {
  return MathPathDiagnosticSession.create({
    ...data,
    diagnosticSessionId: data.diagnosticSessionId || toId('diag'),
  });
}

export function updateDiagnosticSession(sessionId, updates = {}) {
  return MathPathDiagnosticSession.findOneAndUpdate(
    { diagnosticSessionId: sessionId },
    { $set: updates },
    { new: true }
  ).lean();
}

export function createPracticeSession(data = {}) {
  return MathPathPracticeSession.create({
    ...data,
    practiceSessionId: data.practiceSessionId || toId('practice'),
  });
}

export function updatePracticeSession(sessionId, updates = {}) {
  return MathPathPracticeSession.findOneAndUpdate(
    { practiceSessionId: sessionId },
    { $set: updates },
    { new: true }
  ).lean();
}

export function createAssessmentSession(data = {}) {
  return MathPathAssessmentSession.create({
    ...data,
    assessmentSessionId: data.assessmentSessionId || toId('assess'),
  });
}

export function updateAssessmentSession(sessionId, updates = {}) {
  return MathPathAssessmentSession.findOneAndUpdate(
    { assessmentSessionId: sessionId },
    { $set: updates },
    { new: true }
  ).lean();
}

export function createWorkingSession(data = {}) {
  return MathPathWorkingSession.create({
    ...data,
    workingSessionId: data.workingSessionId || toId('work'),
  });
}

export function updateWorkingSession(workingSessionId, updates = {}) {
  return MathPathWorkingSession.findOneAndUpdate(
    { workingSessionId },
    { $set: updates },
    { new: true }
  ).lean();
}

export function getWorkingSession(workingSessionId) {
  return MathPathWorkingSession.findOne({ workingSessionId }).lean();
}

export async function upsertMistakeRecord(record = {}) {
  const filter = {
    studentId: record.studentId,
    domainId: record.domainId,
    mistakeCode: record.mistakeCode,
    skillId: record.skillId || '',
    questionFamilyId: record.questionFamilyId || '',
  };
  const existing = await MathPathMistakeRecord.findOne(filter);
  if (!existing) {
    return MathPathMistakeRecord.create({
      ...record,
      frequency: record.frequency || 1,
      lastSeenAt: record.lastSeenAt || new Date(),
    });
  }

  return MathPathMistakeRecord.findOneAndUpdate(
    filter,
    {
      $set: {
        mistakeName: record.mistakeName || existing.mistakeName,
        severity: record.severity || existing.severity,
        evidence: record.evidence ?? existing.evidence,
        remediationSkillIds: sanitizeList(record.remediationSkillIds?.length ? record.remediationSkillIds : existing.remediationSkillIds),
        lastSeenAt: record.lastSeenAt || new Date(),
      },
      $inc: { frequency: 1 },
    },
    { new: true }
  ).lean();
}

export function getStudentMistakeRecords(studentId, domainId) {
  return MathPathMistakeRecord.find({ studentId, domainId }).sort({ lastSeenAt: -1 }).lean();
}

export const mathPathRepository = {
  upsertMathPathSkills,
  getMathPathSkillsByDomain,
  getMathPathSkill,
  getMathPathSkillsByCountryCurriculumLevel,
  getMathPathSkillCurriculumMapping,
  upsertQuestionFamilies,
  getQuestionFamiliesByDomain,
  getQuestionFamiliesBySkill,
  getStudentSkillStates,
  getStudentSkillState,
  upsertStudentSkillState,
  updateStudentSkillState,
  createMathPathAttempt,
  getStudentAttempts,
  getAttemptsBySession,
  createDiagnosticSession,
  updateDiagnosticSession,
  createPracticeSession,
  updatePracticeSession,
  createAssessmentSession,
  updateAssessmentSession,
  createWorkingSession,
  updateWorkingSession,
  getWorkingSession,
  upsertMistakeRecord,
  getStudentMistakeRecords,
};

export default mathPathRepository;
