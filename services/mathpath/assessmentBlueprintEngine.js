import { PDFParse } from 'pdf-parse';
import AssessmentBlueprint, {
  BLUEPRINT_QUESTION_TYPES,
  COGNITIVE_LEVELS,
  DIAGRAM_TYPES,
} from '../../models/mathpath/AssessmentBlueprint.js';
import AssessmentBlueprintVersion from '../../models/mathpath/AssessmentBlueprintVersion.js';
import SchoolAssessmentProfile from '../../models/mathpath/SchoolAssessmentProfile.js';
import AssessmentSpecification from '../../models/mathpath/AssessmentSpecification.js';

const DIFFICULTY_KEYS = ['beginner', 'basic', 'standard', 'advanced', 'challenge', 'easy', 'medium', 'hard'];
const EPSILON = 0.001;

function safeNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function sumObjectValues(obj = {}, keys = []) {
  return keys.reduce((sum, key) => sum + safeNum(obj?.[key], 0), 0);
}

function normalizeDifficultyMix(raw = {}) {
  const out = {};
  DIFFICULTY_KEYS.forEach((key) => {
    out[key] = Math.max(0, safeNum(raw?.[key], 0));
  });
  return out;
}

function normalizeCognitiveMix(raw = {}) {
  return {
    Recall: Math.max(0, safeNum(raw?.Recall, 0)),
    Procedural: Math.max(0, safeNum(raw?.Procedural, 0)),
    Application: Math.max(0, safeNum(raw?.Application, 0)),
    ComplexApplication: Math.max(0, safeNum(raw?.ComplexApplication ?? raw?.['Complex Application'], 0)),
  };
}

function normalizeQuestionTypes(types = []) {
  const clean = [...new Set(asArray(types).map((type) => String(type || '').trim()).filter(Boolean))];
  return clean.filter((type) => BLUEPRINT_QUESTION_TYPES.includes(type));
}

function normalizeDiagramTypes(types = []) {
  const clean = [...new Set(asArray(types).map((type) => String(type || '').trim()).filter(Boolean))];
  return clean.filter((type) => DIAGRAM_TYPES.includes(type));
}

function normalizeSection(row = {}) {
  return {
    name: String(row.name || '').trim(),
    marks: Math.max(0, safeNum(row.marks, 0)),
    questionCount: Math.max(0, Math.round(safeNum(row.questionCount, 0))),
    questionTypes: normalizeQuestionTypes(row.questionTypes),
    difficultyMix: normalizeDifficultyMix(row.difficultyMix || {}),
    cognitiveMix: normalizeCognitiveMix(row.cognitiveMix || {}),
  };
}

function normalizeTopic(row = {}) {
  const difficulty = String(row.difficulty || 'mixed').trim();
  return {
    topic: String(row.topic || row.topicName || '').trim(),
    topicId: row.topicId || null,
    domainId: String(row.domainId || 'fractions').trim().toLowerCase(),
    skillIds: asArray(row.skillIds).map((skillId) => String(skillId || '').trim()).filter(Boolean),
    weightage: Math.max(0, safeNum(row.weightage, 0)),
    marks: Math.max(0, safeNum(row.marks, 0)),
    difficulty: ['beginner', 'basic', 'standard', 'advanced', 'challenge', 'mixed'].includes(difficulty)
      ? difficulty
      : 'mixed',
    difficultyMix: normalizeDifficultyMix(row.difficultyMix || {}),
    diagramTypes: normalizeDiagramTypes(row.diagramTypes),
  };
}

export function normalizeAssessmentBlueprintPayload(payload = {}) {
  const normalized = {
    title: String(payload.title || '').trim(),
    level: String(payload.level || '').trim(),
    subject: String(payload.subject || 'Math').trim(),
    school: String(payload.school || '').trim(),
    assessmentType: String(payload.assessmentType || '').trim(),
    durationMinutes: Math.max(0, safeNum(payload.durationMinutes, 0)),
    totalMarks: Math.max(0, safeNum(payload.totalMarks, 0)),
    calculatorAllowed: Boolean(payload.calculatorAllowed),
    timed: payload.timed !== false,
    status: ['draft', 'active', 'archived'].includes(String(payload.status || '').trim())
      ? String(payload.status).trim()
      : 'draft',
    sections: asArray(payload.sections).map(normalizeSection),
    topics: asArray(payload.topics).map(normalizeTopic),
    requiredDiagramTypes: normalizeDiagramTypes(payload.requiredDiagramTypes),
    questionMetadata: asArray(payload.questionMetadata),
    sourceType: ['manual', 'uploadDerived', 'schoolProfileDerived'].includes(String(payload.sourceType || '').trim())
      ? String(payload.sourceType).trim()
      : 'manual',
    blueprintVersion: Math.max(1, Math.round(safeNum(payload.blueprintVersion, 1))),
    parentBlueprintId: payload.parentBlueprintId || null,
    versionGroupId: String(payload.versionGroupId || '').trim(),
    createdBy: payload.createdBy || payload.createdByUserId || null,
    createdByUserId: payload.createdByUserId || payload.createdBy || null,
    workspaceId: payload.workspaceId || null,
    archivedAt: payload.archivedAt || null,
  };
  return normalized;
}

function validateDifficultyMix(mix = {}, contextLabel, errors) {
  const sum = sumObjectValues(mix, DIFFICULTY_KEYS);
  const anySet = sum > EPSILON;
  if (!anySet) return;
  if (Math.abs(sum - 100) > EPSILON) {
    errors.push(`${contextLabel} difficultyMix must total 100%.`);
  }
}

function validateCognitiveMix(mix = {}, contextLabel, errors) {
  const sum = sumObjectValues(mix, COGNITIVE_LEVELS);
  const anySet = sum > EPSILON;
  if (!anySet) return;
  if (Math.abs(sum - 100) > EPSILON) {
    errors.push(`${contextLabel} cognitiveMix must total 100%.`);
  }
}

export function validateAssessmentBlueprint(payload = {}) {
  const normalized = normalizeAssessmentBlueprintPayload(payload);
  const errors = [];

  if (!normalized.title) errors.push('title is required.');
  if (!normalized.level) errors.push('level is required.');
  if (!normalized.subject) errors.push('subject is required.');
  if (normalized.durationMinutes <= 0) errors.push('durationMinutes must be > 0.');
  if (normalized.totalMarks <= 0) errors.push('totalMarks must be > 0.');

  if (!normalized.sections.length) errors.push('sections must be a non-empty array.');
  if (!normalized.topics.length) errors.push('topics must be a non-empty array.');

  let sectionMarks = 0;
  let sectionQuestions = 0;
  normalized.sections.forEach((section, index) => {
    const label = `sections[${index}]`;
    if (!section.name) errors.push(`${label}.name is required.`);
    if (section.marks <= 0) errors.push(`${label}.marks must be > 0.`);
    if (section.questionCount <= 0) errors.push(`${label}.questionCount must be > 0.`);
    if (!section.questionTypes.length) errors.push(`${label}.questionTypes must include at least one supported type.`);
    validateDifficultyMix(section.difficultyMix, label, errors);
    validateCognitiveMix(section.cognitiveMix, label, errors);
    sectionMarks += section.marks;
    sectionQuestions += section.questionCount;
  });
  if (sectionQuestions <= 0) errors.push('Total section questionCount must be > 0.');
  if (Math.abs(sectionMarks - normalized.totalMarks) > 1) {
    errors.push('Sum of section marks must equal totalMarks.');
  }

  let topicMarks = 0;
  let topicWeightage = 0;
  normalized.topics.forEach((topic, index) => {
    const label = `topics[${index}]`;
    if (!topic.topic) errors.push(`${label}.topic is required.`);
    if (topic.marks < 0) errors.push(`${label}.marks must be >= 0.`);
    if (topic.weightage < 0) errors.push(`${label}.weightage must be >= 0.`);
    validateDifficultyMix(topic.difficultyMix, label, errors);
    topicMarks += topic.marks;
    topicWeightage += topic.weightage;
  });
  if (topicMarks <= 0) errors.push('Total topic marks must be > 0.');
  if (Math.abs(topicMarks - normalized.totalMarks) > 1) {
    errors.push('Sum of topic marks must equal totalMarks.');
  }
  if (Math.abs(topicWeightage - 100) > 1) {
    errors.push('Topic weightage must total 100%.');
  }

  const seenTypes = new Set([...normalized.requiredDiagramTypes]);
  if (seenTypes.size !== normalized.requiredDiagramTypes.length) {
    errors.push('requiredDiagramTypes cannot contain duplicates.');
  }

  return {
    valid: errors.length === 0,
    ok: errors.length === 0,
    errors,
    normalized,
  };
}

// Backward compatibility for existing callers.
export function validateBlueprintPayload(payload = {}) {
  const out = validateAssessmentBlueprint(payload);
  return { ok: out.valid, valid: out.valid, errors: out.errors, normalized: out.normalized };
}

function getCognitiveMixFromSections(sections = []) {
  const totals = {
    Recall: 0,
    Procedural: 0,
    Application: 0,
    ComplexApplication: 0,
  };
  let weightedMarks = 0;
  sections.forEach((section) => {
    const marks = Math.max(0, safeNum(section.marks, 0));
    if (marks <= 0) return;
    weightedMarks += marks;
    COGNITIVE_LEVELS.forEach((level) => {
      totals[level] += safeNum(section.cognitiveMix?.[level], 0) * marks;
    });
  });
  if (!weightedMarks) return totals;
  const normalized = {};
  COGNITIVE_LEVELS.forEach((level) => {
    normalized[level] = Number((totals[level] / weightedMarks).toFixed(2));
  });
  return normalized;
}

function getDifficultyMixFromSections(sections = []) {
  const totals = {};
  DIFFICULTY_KEYS.forEach((key) => { totals[key] = 0; });
  let weightedMarks = 0;
  sections.forEach((section) => {
    const marks = Math.max(0, safeNum(section.marks, 0));
    if (marks <= 0) return;
    weightedMarks += marks;
    DIFFICULTY_KEYS.forEach((key) => {
      totals[key] += safeNum(section.difficultyMix?.[key], 0) * marks;
    });
  });
  if (!weightedMarks) return totals;
  const normalized = {};
  DIFFICULTY_KEYS.forEach((key) => {
    normalized[key] = Number((totals[key] / weightedMarks).toFixed(2));
  });
  return normalized;
}

function snapshotBlueprint(doc) {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject({ depopulate: true }) : deepClone(doc);
  return raw;
}

async function writeVersion(blueprintDoc, { changeType = 'update', changedBy = null } = {}) {
  if (!blueprintDoc) return null;
  const snapshot = snapshotBlueprint(blueprintDoc);
  return AssessmentBlueprintVersion.create({
    blueprintId: blueprintDoc._id,
    versionGroupId: snapshot.versionGroupId || String(snapshot.parentBlueprintId || snapshot._id),
    versionNumber: Number(snapshot.blueprintVersion || 1),
    changeType,
    changedBy: changedBy || null,
    snapshot,
  });
}

export async function listAssessmentBlueprints(filters = {}) {
  const query = {};
  if (filters.level) query.level = String(filters.level);
  if (filters.subject) query.subject = String(filters.subject);
  if (filters.school) query.school = String(filters.school);
  if (filters.assessmentType) query.assessmentType = String(filters.assessmentType);
  if (filters.status) query.status = String(filters.status);
  if (filters.workspaceId) query.workspaceId = filters.workspaceId;
  if (filters.createdByUserId) query.createdByUserId = filters.createdByUserId;
  if (!filters.includeArchived) query.status = query.status || { $ne: 'archived' };
  const limit = Math.max(1, Math.min(500, Number(filters.limit || 100)));
  return AssessmentBlueprint.find(query).sort({ updatedAt: -1 }).limit(limit).lean();
}

export async function getAssessmentBlueprintById(id, { includeVersions = false } = {}) {
  const blueprint = await AssessmentBlueprint.findById(id);
  if (!blueprint) return null;
  if (!includeVersions) return blueprint;
  const versions = await AssessmentBlueprintVersion.find({ blueprintId: blueprint._id }).sort({ versionNumber: -1 }).lean();
  return { blueprint, versions };
}

export async function createAssessmentBlueprint(payload = {}, { actorUserId = null, workspaceId = null, changeType = 'create' } = {}) {
  const validation = validateAssessmentBlueprint(payload);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }
  const normalized = validation.normalized;
  const doc = await AssessmentBlueprint.create({
    ...normalized,
    createdBy: actorUserId || normalized.createdBy || null,
    createdByUserId: actorUserId || normalized.createdByUserId || null,
    workspaceId: workspaceId || normalized.workspaceId || null,
    status: normalized.status || 'draft',
    archivedAt: normalized.status === 'archived' ? (normalized.archivedAt || new Date()) : null,
    versionGroupId: normalized.versionGroupId || '',
    blueprintVersion: Math.max(1, safeNum(normalized.blueprintVersion, 1)),
  });
  if (!doc.versionGroupId) {
    doc.versionGroupId = String(doc.parentBlueprintId || doc._id);
    await doc.save();
  }
  await writeVersion(doc, { changeType, changedBy: actorUserId });
  return doc;
}

export async function updateAssessmentBlueprint(id, payload = {}, { actorUserId = null } = {}) {
  const existing = await AssessmentBlueprint.findById(id);
  if (!existing) throw new Error('Assessment blueprint not found.');
  const merged = {
    ...existing.toObject(),
    ...payload,
    sections: payload.sections ?? existing.sections,
    topics: payload.topics ?? existing.topics,
    requiredDiagramTypes: payload.requiredDiagramTypes ?? existing.requiredDiagramTypes,
    questionMetadata: payload.questionMetadata ?? existing.questionMetadata,
    createdBy: existing.createdBy || existing.createdByUserId,
    createdByUserId: existing.createdByUserId || existing.createdBy,
    workspaceId: existing.workspaceId,
    blueprintVersion: Math.max(1, safeNum(existing.blueprintVersion, 1) + 1),
  };
  const validation = validateAssessmentBlueprint(merged);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }
  Object.assign(existing, validation.normalized, {
    createdBy: existing.createdBy || existing.createdByUserId,
    createdByUserId: existing.createdByUserId || existing.createdBy,
    workspaceId: existing.workspaceId,
    blueprintVersion: Math.max(1, safeNum(existing.blueprintVersion, 1)),
    archivedAt: validation.normalized.status === 'archived' ? (existing.archivedAt || new Date()) : null,
  });
  await existing.save();
  await writeVersion(existing, { changeType: 'update', changedBy: actorUserId });
  return existing;
}

export async function archiveAssessmentBlueprint(id, { actorUserId = null } = {}) {
  const existing = await AssessmentBlueprint.findById(id);
  if (!existing) throw new Error('Assessment blueprint not found.');
  if (existing.status === 'archived') return existing;
  existing.status = 'archived';
  existing.archivedAt = new Date();
  existing.blueprintVersion = Math.max(1, safeNum(existing.blueprintVersion, 1) + 1);
  await existing.save();
  await writeVersion(existing, { changeType: 'archive', changedBy: actorUserId });
  return existing;
}

export async function duplicateAssessmentBlueprint(id, { actorUserId = null, workspaceId = null, title = '' } = {}) {
  const source = await AssessmentBlueprint.findById(id).lean();
  if (!source) throw new Error('Assessment blueprint not found.');
  const copyTitle = String(title || `${source.title} (Copy)`).trim();
  const duplicated = await createAssessmentBlueprint(
    {
      ...source,
      title: copyTitle,
      status: 'draft',
      blueprintVersion: 1,
      parentBlueprintId: source._id,
      versionGroupId: source.versionGroupId || String(source.parentBlueprintId || source._id),
      archivedAt: null,
    },
    { actorUserId, workspaceId, changeType: 'duplicate' }
  );
  return duplicated;
}

export async function getBlueprintVersions(blueprintId) {
  return AssessmentBlueprintVersion.find({ blueprintId }).sort({ versionNumber: -1, createdAt: -1 }).lean();
}

export async function generateTestBlueprint(blueprintOrId) {
  const blueprint = typeof blueprintOrId === 'string'
    ? await AssessmentBlueprint.findById(blueprintOrId).lean()
    : snapshotBlueprint(blueprintOrId);
  if (!blueprint) throw new Error('Assessment blueprint not found.');
  return {
    blueprintId: String(blueprint._id || ''),
    title: blueprint.title,
    level: blueprint.level,
    subject: blueprint.subject,
    school: blueprint.school || '',
    assessmentType: blueprint.assessmentType || '',
    sections: blueprint.sections || [],
    marks: {
      totalMarks: safeNum(blueprint.totalMarks, 0),
      sectionMarks: (blueprint.sections || []).map((s) => ({ name: s.name, marks: safeNum(s.marks, 0) })),
    },
    timing: {
      timed: blueprint.timed !== false,
      durationMinutes: safeNum(blueprint.durationMinutes, 0),
      calculatorAllowed: Boolean(blueprint.calculatorAllowed),
    },
    topics: blueprint.topics || [],
    cognitiveMix: getCognitiveMixFromSections(blueprint.sections || []),
    difficultyMix: getDifficultyMixFromSections(blueprint.sections || []),
    requiredDiagramTypes: blueprint.requiredDiagramTypes || [],
  };
}

function inferCalculatorAllowed(text = '') {
  const lc = text.toLowerCase();
  if (/calculator (is )?allowed/.test(lc)) return true;
  if (/calculator (is )?not allowed/.test(lc)) return false;
  return false;
}

function inferDurationMinutes(text = '') {
  const match = text.match(/(\d{2,3})\s*(minutes|min)/i);
  return match ? Number(match[1]) : 50;
}

function inferTotalMarks(text = '') {
  const match = text.match(/total\s*[:\-]?\s*(\d{2,3})\s*marks?/i) || text.match(/(\d{2,3})\s*marks?/i);
  return match ? Number(match[1]) : 50;
}

function inferLevel(text = '') {
  const match = text.match(/\b(P[3-6]|Primary\s*[3-6]|Sec\s*[1-4]|Secondary\s*[1-4])\b/i);
  if (!match) return 'P6';
  return match[1].replace(/\s+/g, '');
}

function inferAssessmentType(text = '') {
  const lc = text.toLowerCase();
  if (lc.includes('psle')) return 'PSLE-style';
  if (lc.includes('prelim')) return 'Prelim';
  if (lc.includes('wa2')) return 'WA2';
  if (lc.includes('wa1')) return 'WA1';
  if (lc.includes('eoy')) return 'EOY';
  if (lc.includes('ca2')) return 'CA2';
  if (lc.includes('ca1')) return 'CA1';
  return 'School Test';
}

function inferTopics(text = '', totalMarks = 50) {
  const candidates = ['Fractions', 'Decimals', 'Percentage', 'Ratio', 'Geometry', 'Measurement', 'Data Analysis'];
  const lc = text.toLowerCase();
  const found = candidates.filter((topic) => lc.includes(topic.toLowerCase()));
  const topics = found.length ? found : ['Fractions'];
  const baseWeight = Math.floor(100 / topics.length);
  let remainingWeight = 100;
  let remainingMarks = totalMarks;
  return topics.map((topic, index) => {
    const weightage = index === topics.length - 1 ? remainingWeight : baseWeight;
    const marks = index === topics.length - 1 ? remainingMarks : Math.max(1, Math.round((totalMarks * weightage) / 100));
    remainingWeight -= weightage;
    remainingMarks -= marks;
    return {
      topic,
      weightage,
      marks,
      difficulty: 'mixed',
      difficultyMix: { basic: 25, standard: 50, advanced: 25 },
      diagramTypes: [],
    };
  });
}

function defaultSections(totalMarks = 50) {
  const sectionAMarks = Math.round(totalMarks * 0.4);
  const sectionBMarks = totalMarks - sectionAMarks;
  return [
    {
      name: 'Section A',
      marks: sectionAMarks,
      questionCount: Math.max(8, Math.round(sectionAMarks / 2)),
      questionTypes: ['mcq', 'short_answer'],
      difficultyMix: { basic: 45, standard: 45, advanced: 10 },
      cognitiveMix: { Recall: 40, Procedural: 45, Application: 15, ComplexApplication: 0 },
    },
    {
      name: 'Section B',
      marks: sectionBMarks,
      questionCount: Math.max(4, Math.round(sectionBMarks / 4)),
      questionTypes: ['word_problem', 'multi_step', 'open_ended'],
      difficultyMix: { basic: 15, standard: 45, advanced: 40 },
      cognitiveMix: { Recall: 10, Procedural: 35, Application: 40, ComplexApplication: 15 },
    },
  ];
}

function questionMetadataFromTopics(topics = []) {
  return topics.map((topic) => ({
    topic: topic.topic,
    skill: '',
    marks: Math.max(1, Math.round(safeNum(topic.marks, 0) / 2)),
    difficulty: topic.difficulty === 'advanced' || topic.difficulty === 'challenge' ? 'hard' : 'medium',
    questionStyle: 'school-style',
    cognitiveLevel: 'Application',
  }));
}

export async function extractBlueprintFromUploadedPdf(buffer, context = {}) {
  let text = '';
  try {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText({ parsePageInfo: false });
    text = parsed?.text || '';
    await parser.destroy();
  } catch (_) {
    text = '';
  }

  const totalMarks = context.totalMarks || inferTotalMarks(text);
  const topics = context.topics?.length ? context.topics : inferTopics(text, totalMarks);
  const payload = {
    title: context.title || `${context.school || 'School'} ${inferAssessmentType(text)} Blueprint`,
    level: context.level || inferLevel(text),
    subject: context.subject || 'Math',
    school: context.school || '',
    assessmentType: context.assessmentType || inferAssessmentType(text),
    durationMinutes: context.durationMinutes || inferDurationMinutes(text),
    totalMarks,
    calculatorAllowed: context.calculatorAllowed ?? inferCalculatorAllowed(text),
    timed: context.timed !== false,
    sections: context.sections?.length ? context.sections : defaultSections(totalMarks),
    topics,
    requiredDiagramTypes: context.requiredDiagramTypes || [],
    questionMetadata: questionMetadataFromTopics(topics),
    sourceType: 'uploadDerived',
    createdBy: context.createdBy || context.createdByUserId || null,
    createdByUserId: context.createdByUserId || context.createdBy || null,
    workspaceId: context.workspaceId || null,
    status: context.status || 'draft',
  };

  const validation = validateAssessmentBlueprint(payload);
  if (!validation.valid) {
    throw new Error(`Blueprint extraction failed validation: ${validation.errors.join(' ')}`);
  }
  return validation.normalized;
}

function toDistributionEntries(mapLike = {}) {
  return Object.entries(mapLike)
    .map(([key, value]) => ({ key, value: Math.max(0, safeNum(value, 0)) }))
    .filter((entry) => entry.value > 0);
}

export async function upsertSchoolAssessmentProfileFromBlueprint(blueprintDoc) {
  const normalizedBlueprint = snapshotBlueprint(blueprintDoc);
  const difficultyProfile = getDifficultyMixFromSections(normalizedBlueprint.sections || []);
  const diagramUsage = {};
  (normalizedBlueprint.requiredDiagramTypes || []).forEach((diagramType) => {
    diagramUsage[diagramType] = (diagramUsage[diagramType] || 0) + 1;
  });
  (normalizedBlueprint.topics || []).forEach((topic) => {
    (topic.diagramTypes || []).forEach((diagramType) => {
      diagramUsage[diagramType] = (diagramUsage[diagramType] || 0) + 1;
    });
  });

  const sectionStructure = (normalizedBlueprint.sections || []).map((section) => ({
    name: section.name,
    marks: section.marks,
    questionCount: section.questionCount,
    questionTypes: section.questionTypes || [],
  }));
  const topicDistribution = (normalizedBlueprint.topics || []).map((topic) => ({ key: topic.topic, value: safeNum(topic.weightage, 0) }));
  const questionStyleProfile = {};
  (normalizedBlueprint.sections || []).forEach((section) => {
    (section.questionTypes || []).forEach((type) => {
      questionStyleProfile[type] = (questionStyleProfile[type] || 0) + 1;
    });
  });
  const assessmentStyleProfile = {
    timed: normalizedBlueprint.timed !== false ? 100 : 0,
    untimed: normalizedBlueprint.timed === false ? 100 : 0,
    calculatorAllowed: normalizedBlueprint.calculatorAllowed ? 100 : 0,
    calculatorNotAllowed: normalizedBlueprint.calculatorAllowed ? 0 : 100,
  };

  const key = {
    school: normalizedBlueprint.school || 'Generic',
    level: normalizedBlueprint.level,
    subject: normalizedBlueprint.subject,
    assessmentType: normalizedBlueprint.assessmentType || 'School Test',
  };

  const existing = await SchoolAssessmentProfile.findOne(key);
  const payload = {
    ...key,
    sectionStructure,
    difficultyDistribution: toDistributionEntries(difficultyProfile),
    topicDistribution,
    questionStyleTendencies: toDistributionEntries(questionStyleProfile),
    difficultyProfile: {
      entries: toDistributionEntries(difficultyProfile),
      notes: 'Auto-derived from blueprint sections.',
    },
    diagramProfile: {
      entries: toDistributionEntries(diagramUsage),
      notes: 'Derived from required diagram types.',
    },
    questionStyleProfile: {
      entries: toDistributionEntries(questionStyleProfile),
      notes: 'Derived from section question types.',
    },
    assessmentStyleProfile: {
      entries: toDistributionEntries(assessmentStyleProfile),
      notes: 'Timed/calculator style profile.',
    },
    lastBlueprintId: normalizedBlueprint._id || blueprintDoc._id,
  };

  if (!existing) {
    return SchoolAssessmentProfile.create({
      ...payload,
      sampleSize: 1,
    });
  }

  Object.assign(existing, payload, {
    sampleSize: Math.max(1, safeNum(existing.sampleSize, 1) + 1),
  });
  await existing.save();
  return existing;
}

// Backward compatible wrapper used by existing routes.
export async function createBlueprintFromPayload(payload) {
  return createAssessmentBlueprint(payload, {
    actorUserId: payload.createdByUserId || payload.createdBy || null,
    workspaceId: payload.workspaceId || null,
  }).then(async (doc) => {
    await upsertSchoolAssessmentProfileFromBlueprint(doc);
    return doc;
  });
}

export const SAMPLE_ASSESSMENT_BLUEPRINTS = [
  {
    title: 'P3 WA Blueprint',
    level: 'P3',
    subject: 'Math',
    school: 'Generic',
    assessmentType: 'WA',
    durationMinutes: 50,
    totalMarks: 40,
    calculatorAllowed: false,
    timed: true,
    status: 'active',
    sections: [
      { name: 'Section A', marks: 16, questionCount: 12, questionTypes: ['mcq', 'short_answer'], difficultyMix: { basic: 55, standard: 35, advanced: 10 }, cognitiveMix: { Recall: 45, Procedural: 40, Application: 15, ComplexApplication: 0 } },
      { name: 'Section B', marks: 24, questionCount: 8, questionTypes: ['word_problem', 'multi_step'], difficultyMix: { basic: 20, standard: 45, advanced: 35 }, cognitiveMix: { Recall: 15, Procedural: 35, Application: 35, ComplexApplication: 15 } },
    ],
    topics: [
      { topic: 'Fractions', marks: 14, weightage: 35, difficulty: 'mixed', difficultyMix: { basic: 30, standard: 45, advanced: 25 }, diagramTypes: ['fraction_model', 'number_line'] },
      { topic: 'Measurement', marks: 12, weightage: 30, difficulty: 'mixed', difficultyMix: { basic: 30, standard: 50, advanced: 20 }, diagramTypes: ['length_measurement', 'table'] },
      { topic: 'Data Analysis', marks: 14, weightage: 35, difficulty: 'mixed', difficultyMix: { basic: 25, standard: 45, advanced: 30 }, diagramTypes: ['bar_graph', 'table'] },
    ],
    requiredDiagramTypes: ['fraction_model', 'number_line', 'bar_graph', 'table'],
  },
  {
    title: 'P4 WA Blueprint',
    level: 'P4',
    subject: 'Math',
    school: 'Generic',
    assessmentType: 'WA',
    durationMinutes: 55,
    totalMarks: 50,
    calculatorAllowed: false,
    timed: true,
    status: 'active',
    sections: defaultSections(50),
    topics: [
      { topic: 'Fractions', marks: 18, weightage: 36, difficulty: 'mixed', difficultyMix: { basic: 20, standard: 55, advanced: 25 }, diagramTypes: ['fraction_model', 'number_line'] },
      { topic: 'Geometry', marks: 14, weightage: 28, difficulty: 'mixed', difficultyMix: { basic: 20, standard: 45, advanced: 35 }, diagramTypes: ['shape_library', 'dot_grid'] },
      { topic: 'Data Analysis', marks: 18, weightage: 36, difficulty: 'mixed', difficultyMix: { basic: 20, standard: 50, advanced: 30 }, diagramTypes: ['bar_graph', 'table'] },
    ],
    requiredDiagramTypes: ['fraction_model', 'number_line', 'bar_graph', 'table', 'shape_library'],
  },
  {
    title: 'P5 WA Blueprint',
    level: 'P5',
    subject: 'Math',
    school: 'Generic',
    assessmentType: 'WA',
    durationMinutes: 60,
    totalMarks: 60,
    calculatorAllowed: false,
    timed: true,
    status: 'active',
    sections: defaultSections(60),
    topics: [
      { topic: 'Fractions', marks: 20, weightage: 33.33, difficulty: 'mixed', difficultyMix: { basic: 15, standard: 50, advanced: 35 }, diagramTypes: ['fraction_model', 'number_line'] },
      { topic: 'Ratio', marks: 20, weightage: 33.33, difficulty: 'mixed', difficultyMix: { basic: 20, standard: 45, advanced: 35 }, diagramTypes: ['comparison_models', 'table'] },
      { topic: 'Geometry', marks: 20, weightage: 33.34, difficulty: 'mixed', difficultyMix: { basic: 15, standard: 45, advanced: 40 }, diagramTypes: ['shape_library', 'dot_grid'] },
    ],
    requiredDiagramTypes: ['fraction_model', 'number_line', 'comparison_models', 'table'],
  },
  {
    title: 'P6 WA Blueprint',
    level: 'P6',
    subject: 'Math',
    school: 'Generic',
    assessmentType: 'WA',
    durationMinutes: 70,
    totalMarks: 70,
    calculatorAllowed: false,
    timed: true,
    status: 'active',
    sections: defaultSections(70),
    topics: [
      { topic: 'Fractions', marks: 24, weightage: 34.29, difficulty: 'mixed', difficultyMix: { basic: 10, standard: 45, advanced: 45 }, diagramTypes: ['fraction_model', 'number_line'] },
      { topic: 'Percentage', marks: 20, weightage: 28.57, difficulty: 'mixed', difficultyMix: { basic: 15, standard: 50, advanced: 35 }, diagramTypes: ['comparison_models', 'table'] },
      { topic: 'Geometry', marks: 26, weightage: 37.14, difficulty: 'mixed', difficultyMix: { basic: 10, standard: 40, advanced: 50 }, diagramTypes: ['shape_composition', 'dot_grid'] },
    ],
    requiredDiagramTypes: ['fraction_model', 'number_line', 'comparison_models', 'table', 'dot_grid'],
  },
  {
    title: 'P6 Prelim Blueprint',
    level: 'P6',
    subject: 'Math',
    school: 'Generic',
    assessmentType: 'Prelim',
    durationMinutes: 90,
    totalMarks: 100,
    calculatorAllowed: false,
    timed: true,
    status: 'active',
    sections: defaultSections(100),
    topics: [
      { topic: 'Fractions', marks: 26, weightage: 26, difficulty: 'mixed', difficultyMix: { basic: 10, standard: 40, advanced: 50 }, diagramTypes: ['fraction_model', 'number_line'] },
      { topic: 'Ratio', marks: 18, weightage: 18, difficulty: 'mixed', difficultyMix: { basic: 15, standard: 45, advanced: 40 }, diagramTypes: ['comparison_models', 'table'] },
      { topic: 'Geometry', marks: 28, weightage: 28, difficulty: 'mixed', difficultyMix: { basic: 10, standard: 40, advanced: 50 }, diagramTypes: ['shape_composition', 'dot_grid'] },
      { topic: 'Data Analysis', marks: 28, weightage: 28, difficulty: 'mixed', difficultyMix: { basic: 15, standard: 45, advanced: 40 }, diagramTypes: ['bar_graph', 'table'] },
    ],
    requiredDiagramTypes: ['fraction_model', 'number_line', 'comparison_models', 'table', 'bar_graph'],
  },
  {
    title: 'P6 PSLE-style Blueprint',
    level: 'P6',
    subject: 'Math',
    school: 'Generic',
    assessmentType: 'PSLE-style',
    durationMinutes: 100,
    totalMarks: 100,
    calculatorAllowed: false,
    timed: true,
    status: 'active',
    sections: [
      { name: 'Paper 2 Section A', marks: 45, questionCount: 15, questionTypes: ['short_answer', 'diagram', 'table'], difficultyMix: { basic: 20, standard: 55, advanced: 25 }, cognitiveMix: { Recall: 15, Procedural: 55, Application: 25, ComplexApplication: 5 } },
      { name: 'Paper 2 Section B', marks: 55, questionCount: 12, questionTypes: ['word_problem', 'multi_step', 'open_ended'], difficultyMix: { basic: 10, standard: 40, advanced: 50 }, cognitiveMix: { Recall: 5, Procedural: 35, Application: 40, ComplexApplication: 20 } },
    ],
    topics: [
      { topic: 'Fractions', marks: 24, weightage: 24, difficulty: 'mixed', difficultyMix: { basic: 10, standard: 45, advanced: 45 }, diagramTypes: ['fraction_model', 'number_line'] },
      { topic: 'Ratio', marks: 18, weightage: 18, difficulty: 'mixed', difficultyMix: { basic: 10, standard: 45, advanced: 45 }, diagramTypes: ['comparison_models', 'table'] },
      { topic: 'Percentage', marks: 18, weightage: 18, difficulty: 'mixed', difficultyMix: { basic: 10, standard: 50, advanced: 40 }, diagramTypes: ['table', 'bar_graph'] },
      { topic: 'Geometry', marks: 20, weightage: 20, difficulty: 'mixed', difficultyMix: { basic: 10, standard: 40, advanced: 50 }, diagramTypes: ['shape_composition', 'dot_grid'] },
      { topic: 'Data Analysis', marks: 20, weightage: 20, difficulty: 'mixed', difficultyMix: { basic: 10, standard: 45, advanced: 45 }, diagramTypes: ['bar_graph', 'table'] },
    ],
    requiredDiagramTypes: ['fraction_model', 'number_line', 'comparison_models', 'table', 'bar_graph', 'dot_grid'],
  },
];

export async function seedSampleAssessmentBlueprints({ actorUserId = null, workspaceId = null } = {}) {
  const out = [];
  for (const sample of SAMPLE_ASSESSMENT_BLUEPRINTS) {
    const existing = await AssessmentBlueprint.findOne({
      title: sample.title,
      level: sample.level,
      subject: sample.subject,
      assessmentType: sample.assessmentType,
    });
    if (existing) {
      out.push(existing);
      continue;
    }
    const created = await createAssessmentBlueprint(sample, { actorUserId, workspaceId, changeType: 'seed' });
    await upsertSchoolAssessmentProfileFromBlueprint(created);
    out.push(created);
  }
  return out;
}

export async function buildGeneratedPaperBlueprintFromSpecification(specificationId, { fallbackProfile = null } = {}) {
  const spec = await AssessmentSpecification.findById(specificationId).lean();
  if (!spec) throw new Error('AssessmentSpecification not found.');

  let blueprint = null;
  if (spec.assessmentBlueprintId) {
    blueprint = await AssessmentBlueprint.findById(spec.assessmentBlueprintId).lean();
  }

  if (!blueprint && fallbackProfile) {
    const profile = await SchoolAssessmentProfile.findOne(fallbackProfile).lean();
    if (profile) {
      const totalMarks = Number(spec.totalMarks || 50);
      const topicRows = (profile.topicDistribution || []).map((row, index, arr) => ({
        topic: row.key,
        marks: index === arr.length - 1
          ? totalMarks - arr.slice(0, -1).reduce((sum, prev) => sum + Math.round(totalMarks * (safeNum(prev.value, 0) / 100)), 0)
          : Math.round(totalMarks * (safeNum(row.value, 0) / 100)),
        weightage: safeNum(row.value, 0),
        difficulty: 'mixed',
        difficultyMix: { basic: 25, standard: 50, advanced: 25 },
        diagramTypes: [],
      }));

      blueprint = {
        title: `${profile.school} ${profile.assessmentType} Default Blueprint`,
        level: profile.level,
        subject: profile.subject,
        school: profile.school,
        assessmentType: profile.assessmentType,
        durationMinutes: spec.durationMinutes || 50,
        totalMarks,
        calculatorAllowed: spec.calculatorAllowed ?? false,
        timed: spec.timed !== false,
        sections: profile.sectionStructure || defaultSections(totalMarks),
        topics: topicRows,
        requiredDiagramTypes: [],
      };
    }
  }

  if (!blueprint) return null;
  return generateTestBlueprint(blueprint);
}
