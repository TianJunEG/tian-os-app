import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { PDFParse } from 'pdf-parse';
import { COGNITIVE_LEVELS, DIAGRAM_TYPES } from '../../models/mathpath/AssessmentBlueprint.js';
import {
  createAssessmentBlueprint,
  extractBlueprintFromUploadedPdf,
  upsertSchoolAssessmentProfileFromBlueprint,
} from './assessmentBlueprintEngine.js';

export const REQUIRED_UPLOAD_CONSENT =
  'I understand the uploaded file will be automatically deleted after analysis.';

const DIAGRAM_KEYWORDS = [
  { diagramType: 'number_line', patterns: [/number line/gi, /number-line/gi] },
  { diagramType: 'fraction_model', patterns: [/fraction model/gi, /fraction bar/gi, /shaded fraction/gi] },
  { diagramType: 'fraction_circle', patterns: [/fraction circle/gi, /pie model/gi, /circle model/gi] },
  { diagramType: 'bar_graph', patterns: [/bar graph/gi, /bar chart/gi] },
  { diagramType: 'line_graph', patterns: [/line graph/gi] },
  { diagramType: 'table', patterns: [/\btable\b/gi] },
  { diagramType: 'angle', patterns: [/\bangle\b/gi] },
  { diagramType: 'cube_stack', patterns: [/cube stack/gi, /stack of cubes/gi, /cubes\W/gi] },
  { diagramType: 'pie_chart', patterns: [/pie chart/gi] },
  { diagramType: 'shape_composition', patterns: [/composite figure/gi, /shape composition/gi] },
  { diagramType: 'comparison_models', patterns: [/bar model/gi, /comparison model/gi] },
  { diagramType: 'dot_grid', patterns: [/dot grid/gi] },
];

function safeNum(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDifficulty(value) {
  const raw = String(value || '').toLowerCase().trim();
  if (raw === 'beginner' || raw === 'basic' || raw === 'easy') return 'easy';
  if (raw === 'standard' || raw === 'medium') return 'medium';
  if (raw === 'advanced' || raw === 'challenge' || raw === 'hard') return 'hard';
  return 'mixed';
}

function normalizeQuestionStyle(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'mixed';
  const normalized = raw.replace(/\s+/g, '_');
  const allowed = new Set([
    'mcq',
    'short_answer',
    'open_ended',
    'word_problem',
    'multi_step',
    'diagram',
    'graph',
    'table',
    'mixed',
    'school-style',
  ]);
  return allowed.has(normalized) ? normalized : 'mixed';
}

function dominantCognitiveLevel(sections = []) {
  const totals = {
    Recall: 0,
    Procedural: 0,
    Application: 0,
    ComplexApplication: 0,
  };
  asArray(sections).forEach((section) => {
    const marks = Math.max(0, safeNum(section?.marks, 0));
    COGNITIVE_LEVELS.forEach((level) => {
      totals[level] += Math.max(0, safeNum(section?.cognitiveMix?.[level], 0)) * marks;
    });
  });
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || 'Procedural';
}

function summarizeQuestionStyles(sections = []) {
  const counts = {};
  asArray(sections).forEach((section) => {
    asArray(section?.questionTypes).forEach((type) => {
      const key = normalizeQuestionStyle(type);
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([questionStyle, count]) => ({ questionStyle, count }))
    .sort((a, b) => b.count - a.count);
}

function buildDifficultyProfile(sections = []) {
  const totals = { beginner: 0, basic: 0, standard: 0, advanced: 0, challenge: 0 };
  let weightedMarks = 0;
  asArray(sections).forEach((section) => {
    const marks = Math.max(0, safeNum(section?.marks, 0));
    if (!marks) return;
    weightedMarks += marks;
    totals.beginner += Math.max(0, safeNum(section?.difficultyMix?.beginner, 0)) * marks;
    totals.basic += Math.max(0, safeNum(section?.difficultyMix?.basic, 0)) * marks;
    totals.standard += Math.max(0, safeNum(section?.difficultyMix?.standard, 0)) * marks;
    totals.advanced += Math.max(0, safeNum(section?.difficultyMix?.advanced, 0)) * marks;
    totals.challenge += Math.max(0, safeNum(section?.difficultyMix?.challenge, 0)) * marks;
  });
  if (!weightedMarks) return totals;
  return {
    beginner: roundTo(totals.beginner / weightedMarks, 2),
    basic: roundTo(totals.basic / weightedMarks, 2),
    standard: roundTo(totals.standard / weightedMarks, 2),
    advanced: roundTo(totals.advanced / weightedMarks, 2),
    challenge: roundTo(totals.challenge / weightedMarks, 2),
  };
}

export function normalizeUploadConsent(input) {
  const value = String(input ?? '').trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
}

export async function writeTemporaryUploadFile(fileBuffer, preferredExt = '.pdf') {
  const ext = String(preferredExt || '.pdf').startsWith('.') ? preferredExt : `.${preferredExt}`;
  const safeExt = ext.toLowerCase().slice(0, 10);
  const dir = path.join(os.tmpdir(), 'tian-os-assessment-uploads');
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(
    dir,
    `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}${safeExt || '.pdf'}`
  );
  await fs.writeFile(filePath, fileBuffer);
  return filePath;
}

export async function deleteTemporaryUploadFile(filePath) {
  if (!filePath) return { deleted: false, verified: false };
  let deleted = false;
  try {
    await fs.unlink(filePath);
    deleted = true;
  } catch (err) {
    if (err?.code !== 'ENOENT') throw err;
    deleted = true;
  }

  let verified = false;
  try {
    await fs.access(filePath);
    verified = false;
  } catch {
    verified = true;
  }
  return { deleted, verified };
}

async function extractPdfText(buffer) {
  let parser = null;
  try {
    parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText({ parsePageInfo: false });
    return String(parsed?.text || '');
  } catch {
    return '';
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch {
        // best effort cleanup
      }
    }
  }
}

export function detectDiagramMetadata(text = '', blueprintPayload = {}) {
  const counts = {};
  const lower = String(text || '');

  asArray(blueprintPayload.requiredDiagramTypes).forEach((diagramType) => {
    if (!DIAGRAM_TYPES.includes(diagramType)) return;
    counts[diagramType] = (counts[diagramType] || 0) + 1;
  });
  asArray(blueprintPayload.topics).forEach((topic) => {
    asArray(topic?.diagramTypes).forEach((diagramType) => {
      if (!DIAGRAM_TYPES.includes(diagramType)) return;
      counts[diagramType] = (counts[diagramType] || 0) + 1;
    });
  });

  DIAGRAM_KEYWORDS.forEach(({ diagramType, patterns }) => {
    if (!DIAGRAM_TYPES.includes(diagramType)) return;
    const keywordMatches = patterns.reduce((sum, regex) => {
      const matches = lower.match(regex);
      return sum + (matches ? matches.length : 0);
    }, 0);
    if (keywordMatches > 0) {
      counts[diagramType] = (counts[diagramType] || 0) + keywordMatches;
    }
  });

  return Object.entries(counts)
    .map(([diagramType, count]) => ({ diagramType, count: Math.max(0, Math.round(count)) }))
    .sort((a, b) => b.count - a.count);
}

export function buildQuestionMetadata(blueprintPayload = {}, diagramMetadata = []) {
  const topics = asArray(blueprintPayload.topics);
  const sections = asArray(blueprintPayload.sections);
  const totalQuestionCount = Math.max(
    1,
    sections.reduce((sum, section) => sum + Math.max(0, Math.round(safeNum(section?.questionCount, 0))), 0)
  );
  const cognitiveLevel = dominantCognitiveLevel(sections);
  const styleSummary = summarizeQuestionStyles(sections);
  const styleQueue = styleSummary.length ? styleSummary : [{ questionStyle: 'mixed', count: 1 }];
  const diagramPool = diagramMetadata.length ? diagramMetadata : [{ diagramType: 'none', count: 1 }];

  const metadata = [];
  topics.forEach((topic, topicIndex) => {
    const weightage = Math.max(0, safeNum(topic?.weightage, 0));
    const targetQuestions = Math.max(1, Math.round((totalQuestionCount * (weightage || 100 / Math.max(1, topics.length))) / 100));
    const marksTotal = Math.max(0, safeNum(topic?.marks, 0));
    const marksPerQuestion = targetQuestions ? roundTo(marksTotal / targetQuestions, 2) : marksTotal;
    const diagramTypeFromTopic = asArray(topic?.diagramTypes)[0];
    for (let i = 0; i < targetQuestions; i += 1) {
      const styleRef = styleQueue[(topicIndex + i) % styleQueue.length];
      const fallbackDiagram = diagramPool[(topicIndex + i) % diagramPool.length]?.diagramType || 'none';
      const diagramType = DIAGRAM_TYPES.includes(diagramTypeFromTopic) ? diagramTypeFromTopic : fallbackDiagram;
      metadata.push({
        topic: String(topic?.topic || ''),
        skill: String(asArray(topic?.skillIds)[0] || ''),
        marks: marksPerQuestion,
        difficulty: normalizeDifficulty(topic?.difficulty),
        questionStyle: normalizeQuestionStyle(styleRef?.questionStyle || 'mixed'),
        diagramType: DIAGRAM_TYPES.includes(diagramType) ? diagramType : 'none',
        cognitiveLevel,
      });
    }
  });
  return metadata;
}

export async function extractAssessmentMetadataFromBuffer(fileBuffer, context = {}) {
  const text = await extractPdfText(fileBuffer);
  const blueprintPayload = await extractBlueprintFromUploadedPdf(fileBuffer, context);
  const diagramMetadata = detectDiagramMetadata(text, blueprintPayload);
  const questionMetadata = buildQuestionMetadata(blueprintPayload, diagramMetadata);

  const sections = asArray(blueprintPayload.sections);
  const totalQuestionCount = sections.reduce(
    (sum, section) => sum + Math.max(0, Math.round(safeNum(section?.questionCount, 0))),
    0
  );

  const analysisSummary = {
    assessmentType: String(blueprintPayload.assessmentType || ''),
    durationMinutes: Math.max(0, safeNum(blueprintPayload.durationMinutes, 0)),
    calculatorAllowed: Boolean(blueprintPayload.calculatorAllowed),
    totalMarks: Math.max(0, safeNum(blueprintPayload.totalMarks, 0)),
    sectionCount: sections.length,
    questionCount: totalQuestionCount,
    topicDistribution: asArray(blueprintPayload.topics).map((topic) => ({
      topic: topic.topic,
      marks: Math.max(0, safeNum(topic.marks, 0)),
      weightage: Math.max(0, safeNum(topic.weightage, 0)),
      difficulty: normalizeDifficulty(topic.difficulty),
    })),
    difficultyProfile: buildDifficultyProfile(sections),
    questionStyles: summarizeQuestionStyles(sections),
    diagramMetadata,
  };

  return {
    rawText: text,
    blueprintPayload,
    questionMetadata,
    diagramMetadata,
    analysisSummary,
  };
}

export async function createBlueprintFromUpload(metadataBundle, options = {}) {
  const blueprintDoc = await createAssessmentBlueprint(metadataBundle.blueprintPayload, {
    actorUserId: options.actorUserId || null,
    workspaceId: options.workspaceId || null,
    changeType: 'uploadDerived',
  });
  const schoolProfile = await upsertSchoolAssessmentProfileFromBlueprint(blueprintDoc);
  return { blueprintDoc, schoolProfile };
}

