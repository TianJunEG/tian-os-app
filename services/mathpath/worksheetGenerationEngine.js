import mongoose from 'mongoose';
import Worksheet from '../../models/Worksheet.js';
import Skill from '../../models/Skill.js';
import Student from '../../models/Student.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import { selectWorksheetQuestions, WORKSHEET_TYPE_RULES } from './worksheetQuestionSelector.js';
import { evaluateQuestionVisualCoverage } from './skillVisualRequirementEngine.js';

const SOURCE_TYPE_TO_MODE = {
  diagnostic: 'diagnostic_intervention',
  recovery_pack: 'recovery_pack',
  paper_analysis: 'paper_analysis',
  tutor_lesson: 'tutor_lesson',
  student_care_intervention: 'student_care_intervention',
  parent_support: 'parent_support',
  manual: 'intervention',
};

const SOURCE_TYPE_TO_WORKSHEET_TYPE = {
  diagnostic: 'recovery_worksheet',
  recovery_pack: 'recovery_worksheet',
  paper_analysis: 'recovery_worksheet',
  tutor_lesson: 'tutor_lesson_worksheet',
  student_care_intervention: 'recovery_worksheet',
  parent_support: 'parent_support_worksheet',
  manual: 'practice_worksheet',
};

function unique(values = []) {
  return [...new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean))];
}

function normalizeCode(value = '') {
  return String(value || '').trim().toUpperCase();
}

function weakSkillsFromDiagnostic(session = {}) {
  const result = session.result || session.resultPayload || {};
  return unique([
    ...(result.weakSkillIds || []),
    ...(result.remainingWeakSkills || []),
    ...(result.assignedPracticeSkillIds || []),
    ...(session.assignedPracticeSkillIds || []),
    ...((session.perSkillSnapshot || [])
      .filter((row) => Number(row.score) < 70)
      .map((row) => row.skillId)),
  ]).map(normalizeCode).filter(Boolean);
}

function weakSkillsFromPaper(analysis = {}) {
  return unique([
    ...(analysis.weakSkillIds || []),
    ...((analysis.detectedQuestions || [])
      .filter((question) => question.adultConfirmedWrong || question.teacherMarkedCorrect === false)
      .flatMap((question) => question.detectedSkillIds || [])),
  ]).map(normalizeCode).filter(Boolean);
}

function misconceptionsFromPaper(analysis = {}) {
  return unique((analysis.detectedQuestions || [])
    .filter((question) => question.adultConfirmedWrong || question.teacherMarkedCorrect === false)
    .flatMap((question) => question.misconceptionTags || []));
}

async function resolveSkillDocuments(skillIds = []) {
  const ids = unique(skillIds);
  if (!ids.length) return [];
  const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const codes = ids.map(normalizeCode).filter(Boolean);
  const skills = await Skill.find({
    $or: [
      ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
      { 'metadata.mathPathSkillId': { $in: codes } },
      { 'metadata.frameworkCode': { $in: codes } },
      { slug: { $in: codes.map((code) => code.toLowerCase()) } },
    ],
  }).populate('topicId');
  return skills;
}

async function resolveEvidence(input = {}) {
  const sourceType = String(input.sourceType || 'manual');
  if (sourceType === 'diagnostic') {
    const diagnostic = await MathPathDiagnosticSession.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(input.sourceId) ? input.sourceId : undefined },
        { diagnosticSessionId: String(input.sourceId || '') },
      ].filter((row) => Object.values(row)[0] !== undefined),
      studentId: String(input.studentId || ''),
      status: 'completed',
    }).lean();
    if (!diagnostic) throw Object.assign(new Error('Completed diagnostic source not found.'), { status: 404 });
    return {
      source: diagnostic,
      skillCodes: weakSkillsFromDiagnostic(diagnostic),
      misconceptionTags: [],
      rationale: {
        whyGenerated: 'Generated from diagnostic weak skills.',
        weaknessTargeted: 'Skills below the readiness threshold in the completed diagnostic.',
        pathToRecheck: 'Foundation, guided, and challenge practice prepare the student for a recheck.',
      },
    };
  }

  if (sourceType === 'recovery_pack') {
    const assignment = await MathPathAssignment.findById(input.sourceId).lean();
    if (!assignment) throw Object.assign(new Error('Recovery Pack source not found.'), { status: 404 });
    return {
      source: assignment,
      skillCodes: unique([...(assignment.skillIds || []), ...(input.skillIds || [])]),
      misconceptionTags: [],
      rationale: {
        whyGenerated: 'Generated from a Recovery Pack.',
        weaknessTargeted: 'The same weak skills targeted by the assigned Recovery Pack.',
        pathToRecheck: 'Extra written practice supports completion and recheck readiness.',
      },
    };
  }

  if (sourceType === 'paper_analysis') {
    const analysis = await PaperAnalysis.findById(input.sourceId).lean();
    if (!analysis) throw Object.assign(new Error('Paper analysis source not found.'), { status: 404 });
    return {
      source: analysis,
      skillCodes: weakSkillsFromPaper(analysis),
      misconceptionTags: misconceptionsFromPaper(analysis),
      rationale: {
        whyGenerated: 'Generated from confirmed wrong questions in an uploaded paper.',
        weaknessTargeted: 'Weak skills and misconceptions confirmed during paper review.',
        pathToRecheck: 'Targeted written practice closes the paper-review gaps before reassessment.',
      },
    };
  }

  return {
    source: null,
    skillCodes: unique(input.skillIds || []),
    misconceptionTags: unique(input.misconceptionTags || []),
    rationale: {
      whyGenerated: sourceType === 'tutor_lesson'
        ? 'Generated from tutor lesson-planning priorities.'
        : sourceType === 'student_care_intervention'
          ? 'Generated from student care intervention priorities.'
          : sourceType === 'parent_support'
            ? 'Generated for parent-supported home practice.'
            : 'Generated from manually selected skills.',
      weaknessTargeted: 'Selected skills that need written practice.',
      pathToRecheck: 'Sectioned practice builds accuracy and confidence before recheck.',
    },
  };
}

function normalizeWorksheetType({ sourceType, worksheetType }) {
  if (WORKSHEET_TYPE_RULES[worksheetType]) return worksheetType;
  return SOURCE_TYPE_TO_WORKSHEET_TYPE[sourceType] || 'practice_worksheet';
}

function titleFor({ worksheetType, sourceType, skills = [] } = {}) {
  const label = WORKSHEET_TYPE_RULES[worksheetType]?.label || 'Practice Worksheet';
  const firstSkill = skills[0]?.name || '';
  if (sourceType === 'paper_analysis') return firstSkill ? `Paper Review ${label} · ${firstSkill}` : `Paper Review ${label}`;
  if (sourceType === 'diagnostic') return firstSkill ? `Diagnostic Recovery Worksheet · ${firstSkill}` : 'Diagnostic Recovery Worksheet';
  if (sourceType === 'recovery_pack') return firstSkill ? `Recovery Pack Worksheet · ${firstSkill}` : 'Recovery Pack Worksheet';
  return firstSkill ? `${label} · ${firstSkill}` : label;
}

function answerKeyFor(questions = []) {
  return questions.map((question, index) => ({
    questionId: String(question._id),
    n: index + 1,
    answer: question.answer || question.modelAnswer || '',
    explanation: question.workedSolution || question.explanation || '',
    workedSolution: question.workedSolution || question.explanation || '',
    misconceptionNotes: question.targetsMisconception ? [question.targetsMisconception] : (question.misconceptionTags || []),
  }));
}

function frameworkSkillIdForQuestion(question = {}) {
  const populatedSkill = typeof question.skillId === 'object' ? question.skillId : null;
  return String(
    question.frameworkSkillId ||
    question.officialSkillCode ||
    question.metadata?.mathPathSkillId ||
    populatedSkill?.metadata?.mathPathSkillId ||
    populatedSkill?.metadata?.frameworkCode ||
    populatedSkill?.slug ||
    ''
  ).trim().toUpperCase();
}

function shapeQuestion(question = {}, index = 0, sectionKey = '') {
  const frameworkSkillId = frameworkSkillIdForQuestion(question);
  const visualCoverage = evaluateQuestionVisualCoverage({
    ...question,
    skillId: frameworkSkillId,
    questionText: question.stem,
  });
  return {
    n: index + 1,
    questionId: question._id,
    skillId: String(question.skillId?._id || question.skillId || ''),
    frameworkSkillId,
    stem: question.stem,
    type: question.type,
    choices: question.choices,
    visual: question.visual || null,
    diagramSpec: question.diagramSpec || question.metadata?.diagramSpec || null,
    requiredVisualTypes: visualCoverage.requiredVisualTypes,
    optionalVisualTypes: visualCoverage.optionalVisualTypes,
    providedVisualTypes: visualCoverage.providedVisualTypes,
    visualModelRequired: visualCoverage.visualModelRequired,
    visualCoverageStatus: visualCoverage.status,
    answer: question.answer || question.modelAnswer || '',
    workedSolution: question.workedSolution || question.explanation || '',
    targetsMisconception: question.targetsMisconception || question.misconceptionTag || '',
    misconceptionTags: question.misconceptionTags || question.metadata?.misconceptionTags || [],
    skillName: question.skillId?.name || '',
    topicName: question.skillId?.topicId?.name || '',
    difficulty: question.difficulty,
    sectionKey,
  };
}

function shapeWorksheet(worksheet) {
  const raw = typeof worksheet.toObject === 'function' ? worksheet.toObject() : worksheet;
  return {
    id: String(raw._id || raw.id || ''),
    worksheetId: String(raw._id || raw.id || ''),
    title: raw.generatedContent?.title || 'Worksheet',
    worksheetType: raw.worksheetType,
    sourceMode: raw.sourceMode,
    interventionSourceType: raw.interventionSourceType,
    interventionSourceId: raw.interventionSourceId,
    interventionRationale: raw.interventionRationale,
    studentId: String(raw.studentId || ''),
    studentName: raw.studentName,
    skillIds: raw.skillIds || [],
    questionCount: raw.questionCount,
    estimatedMinutes: raw.estimatedMinutes,
    content: raw.generatedContent,
    answerKey: raw.answerKey || raw.generatedContent?.answerKey || [],
    createdAt: raw.createdAt,
  };
}

export async function generateInterventionWorksheet({
  studentId,
  sourceType = 'manual',
  sourceId = '',
  skillIds = [],
  worksheetType = '',
  questionCount = 12,
  generatedByUserId = '',
  generatedByRole = 'system',
  subject = 'Math',
  domain = 'fractions',
  generatedFor = null,
  difficulty = 'adaptive',
  includeReflection = true,
} = {}) {
  const student = await Student.findById(studentId);
  if (!student) throw Object.assign(new Error('Student not found.'), { status: 404 });

  const normalizedSourceType = String(sourceType || 'manual');
  const evidence = await resolveEvidence({ studentId: student._id, sourceType: normalizedSourceType, sourceId, skillIds });
  const skills = await resolveSkillDocuments(evidence.skillCodes);
  if (!skills.length) {
    throw Object.assign(new Error('No linked worksheet skills are available for this intervention source.'), { status: 400 });
  }
  const targetSkillIds = skills.map((skill) => String(skill._id));
  const normalizedWorksheetType = normalizeWorksheetType({ sourceType: normalizedSourceType, worksheetType });
  const selected = await selectWorksheetQuestions({
    skillIds: targetSkillIds,
    worksheetType: normalizedWorksheetType,
    questionCount,
    misconceptionTags: evidence.misconceptionTags,
  });
  if (!selected.questions.length) {
    throw Object.assign(new Error('No worksheet questions are available for the targeted skills yet.'), { status: 400 });
  }

  let n = 0;
  const sections = selected.sections
    .map((section) => ({
      key: section.key,
      title: section.title,
      difficulty: section.difficulty,
      questions: section.questions.map((question) => shapeQuestion(question, n++, section.key)),
    }))
    .filter((section) => section.questions.length);
  const questions = sections.flatMap((section) => section.questions);
  const answerKey = answerKeyFor(selected.questions);
  const title = titleFor({ worksheetType: normalizedWorksheetType, sourceType: normalizedSourceType, skills });
  const rationale = {
    ...evidence.rationale,
    sourceType: normalizedSourceType,
    sourceId: String(sourceId || ''),
    targetedSkillIds: evidence.skillCodes,
    targetedSkillNames: skills.map((skill) => skill.name),
    misconceptionTags: evidence.misconceptionTags,
  };
  const content = {
    title,
    studentName: student.name,
    domain,
    worksheetType: normalizedWorksheetType,
    skillIds: targetSkillIds,
    skillNames: skills.map((skill) => skill.name),
    topicNames: [...new Set(skills.map((skill) => skill.topicId?.name).filter(Boolean))],
    sections,
    questions,
    answerKey,
    reflection: includeReflection ? {
      prompt: 'Which question was most difficult? What strategy helped you?',
    } : null,
    personalization: {
      notRandom: true,
      sourceMode: SOURCE_TYPE_TO_MODE[normalizedSourceType] || 'intervention',
      sourceLabel: rationale.whyGenerated,
      sourceSummary: `${rationale.whyGenerated} ${rationale.pathToRecheck}`,
      evidenceSignals: [
        ...rationale.targetedSkillIds.map((skillId) => ({ type: 'targeted_skill', skillId })),
        ...rationale.misconceptionTags.map((tag) => ({ type: 'misconception', tag })),
      ],
      recommendedUse: 'Complete Section A first, review guided examples in Section B, then use Section C to check recheck readiness.',
    },
    visualModelReferences: questions
      .filter((question) => question.visualModelRequired || question.requiredVisualTypes?.length)
      .map((question) => ({
        questionId: String(question.questionId || ''),
        n: question.n,
        skillId: question.frameworkSkillId || question.skillId,
        requiredVisualTypes: question.requiredVisualTypes || [],
        providedVisualTypes: question.providedVisualTypes || [],
        status: question.visualCoverageStatus,
      })),
  };

  const worksheet = await Worksheet.create({
    userId: generatedByUserId || student.createdByUserId || student.userId || student._id,
    studentId: student._id,
    studentName: student.name,
    subject,
    workspaceId: student.workspaceId,
    generatedByUserId: generatedByUserId || student.createdByUserId || student.userId || student._id,
    generatedByRole,
    generatedFor: generatedFor || { studentId: student._id, studentName: student.name },
    topicIds: [...new Set(skills.map((skill) => skill.topicId?._id).filter(Boolean))],
    skillIds: targetSkillIds,
    sourceMode: SOURCE_TYPE_TO_MODE[normalizedSourceType] || 'intervention',
    worksheetType: normalizedWorksheetType,
    domain,
    interventionSourceType: normalizedSourceType,
    interventionSourceId: String(sourceId || ''),
    interventionRationale: rationale,
    difficulty,
    questionCount: questions.length,
    estimatedMinutes: Math.max(8, Math.ceil(questions.length * 1.5)),
    includesSolutions: true,
    includesMistakeReview: true,
    generatedContent: content,
    answerKey,
    assignedStatus: 'unassigned',
  });

  return { worksheet: shapeWorksheet(worksheet), rationale };
}

export async function getInterventionWorksheetHistory({ studentId, sourceType = '', sourceId = '' } = {}) {
  const filter = { studentId, interventionSourceType: { $ne: '' } };
  if (sourceType) filter.interventionSourceType = sourceType;
  if (sourceId) filter.interventionSourceId = String(sourceId);
  const worksheets = await Worksheet.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  return worksheets.map(shapeWorksheet);
}

export default {
  generateInterventionWorksheet,
  getInterventionWorksheetHistory,
};
