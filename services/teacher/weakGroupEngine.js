import Student from '../../models/Student.js';
import ClassStudent from '../../models/ClassStudent.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import fractionSkillGraph from '../../frontend/src/mathpath/fractions/fractionSkillGraph.js';

const DEFAULT_SUBJECT = 'math';
const DEFAULT_DOMAIN = 'fractions';

const fractionSkillNameById = new Map(
  (fractionSkillGraph.skills || []).map((skill) => [String(skill.id || '').toUpperCase(), skill.name])
);

function normalizeId(value) {
  return String(value || '').trim();
}

function normalizeSkillId(value) {
  return normalizeId(value).toUpperCase();
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function studentName(student = {}) {
  return student.name || student.fullName || student.displayName || `Student ${normalizeId(student.studentId || student._id).slice(-4)}`;
}

function skillName(skillId, explicitName = '') {
  return explicitName || fractionSkillNameById.get(normalizeSkillId(skillId)) || normalizeSkillId(skillId);
}

function addEvidence(groupMap, { studentId, studentName: name, skillId, skillName: explicitSkillName, type, weight = 1, summary = '', misconceptionTags = [] } = {}) {
  const sid = normalizeId(studentId);
  const normalizedSkillId = normalizeSkillId(skillId);
  if (!sid || !normalizedSkillId) return;

  if (!groupMap.has(normalizedSkillId)) {
    groupMap.set(normalizedSkillId, {
      skillId: normalizedSkillId,
      skillName: skillName(normalizedSkillId, explicitSkillName),
      studentIds: new Set(),
      students: new Map(),
      evidenceTypes: new Set(),
      evidence: [],
      weight: 0,
      misconceptionTags: new Set(),
    });
  }

  const group = groupMap.get(normalizedSkillId);
  group.studentIds.add(sid);
  group.students.set(sid, { studentId: sid, name: name || sid });
  group.evidenceTypes.add(type);
  group.weight += weight;
  for (const tag of misconceptionTags || []) {
    if (tag) group.misconceptionTags.add(tag);
  }
  group.evidence.push({
    studentId: sid,
    studentName: name || sid,
    type,
    summary,
  });
}

function weakSkillsFromDiagnostic(session = {}) {
  const result = session.resultPayload || session.result || {};
  const weakFromResult = [
    ...(result.weakSkillIds || []),
    ...(result.remainingWeakSkills || []),
    ...(session.assignedPracticeSkillIds || []),
    ...(result.assignedPracticeSkillIds || []),
  ];
  const weakFromSnapshot = (session.perSkillSnapshot || [])
    .filter((row) => Number(row.score || 0) < 70)
    .map((row) => row.skillId);
  return unique([...weakFromResult, ...weakFromSnapshot].map(normalizeSkillId));
}

function diagnosticSkillEvidence(session = {}) {
  const skills = [];
  const bySnapshot = new Map((session.perSkillSnapshot || []).map((row) => [normalizeSkillId(row.skillId), row]));
  for (const skillId of weakSkillsFromDiagnostic(session)) {
    const row = bySnapshot.get(normalizeSkillId(skillId)) || {};
    const score = Number(row.score || 0);
    skills.push({
      skillId,
      skillName: row.skillName,
      weight: score > 0 && score < 50 ? 3 : 2,
      summary: row.questionsAnswered
        ? `Diagnostic score ${score}% across ${row.questionsAnswered} question${row.questionsAnswered === 1 ? '' : 's'}.`
        : 'Diagnostic marked this as a weak skill.',
      misconceptionTags: row.misconceptionTags || [],
    });
  }
  return skills;
}

function paperSkillEvidence(analysis = {}) {
  const confirmedWrongSkills = (analysis.detectedQuestions || [])
    .filter((question) => question.adultConfirmedWrong || question.teacherMarkedCorrect === false)
    .flatMap((question) => question.detectedSkillIds || []);
  return unique([...(analysis.weakSkillIds || []), ...confirmedWrongSkills].map(normalizeSkillId))
    .map((skillId) => ({
      skillId,
      weight: 2,
      summary: 'School paper analysis confirmed a weak question for this skill.',
      misconceptionTags: (analysis.detectedQuestions || [])
        .filter((question) => (question.detectedSkillIds || []).map(normalizeSkillId).includes(skillId))
        .flatMap((question) => question.misconceptionTags || []),
    }));
}

function assignmentSkillEvidence(assignment = {}) {
  const accuracy = Number(assignment.completion?.accuracy ?? 100);
  const shouldInclude = assignment.recheck?.recommended || (assignment.status === 'completed' && accuracy < 70);
  if (!shouldInclude) return [];
  return (assignment.skillIds || []).map((skillId) => ({
    skillId,
    weight: assignment.recheck?.recommended ? 2 : 1,
    summary: assignment.recheck?.recommended
      ? 'Recovery pack is ready for a recheck.'
      : `Recovery pack accuracy is ${accuracy}%.`,
  }));
}

function priorityFor(group) {
  const count = group.studentIds.size;
  const hasPaper = group.evidenceTypes.has('paper_analysis');
  const hasMisconception = group.evidenceTypes.has('mistake') || group.misconceptionTags.size > 0;
  if (count >= 3 || hasPaper || (count >= 2 && hasMisconception)) return 'high';
  if (count >= 2 || group.weight >= 3) return 'medium';
  return 'low';
}

function actionFor(priority) {
  if (priority === 'high') return 'Teach this as a small-group intervention, then assign a recovery pack.';
  if (priority === 'medium') return 'Assign targeted recovery practice and monitor recheck readiness.';
  return 'Assign short targeted practice or include in the next worksheet.';
}

export function buildWeakGroupsFromEvidence({
  students = [],
  diagnostics = [],
  mistakes = [],
  paperAnalyses = [],
  assignments = [],
} = {}) {
  const studentById = new Map(students.map((student) => [normalizeId(student.studentId || student._id), student]));
  const groups = new Map();

  for (const session of diagnostics || []) {
    const student = studentById.get(normalizeId(session.studentId)) || {};
    for (const evidence of diagnosticSkillEvidence(session)) {
      addEvidence(groups, {
        studentId: session.studentId,
        studentName: studentName(student),
        type: 'diagnostic',
        ...evidence,
      });
    }
  }

  for (const mistake of mistakes || []) {
    const student = studentById.get(normalizeId(mistake.studentId)) || {};
    addEvidence(groups, {
      studentId: mistake.studentId,
      studentName: studentName(student),
      skillId: mistake.skillId,
      skillName: mistake.mistakeName,
      type: 'mistake',
      weight: mistake.severity === 'high' ? 3 : mistake.severity === 'medium' ? 2 : 1,
      summary: `${mistake.mistakeName || mistake.mistakeCode || 'Mistake pattern'} seen ${mistake.frequency || 1} time${Number(mistake.frequency || 1) === 1 ? '' : 's'}.`,
      misconceptionTags: [mistake.mistakeCode].filter(Boolean),
    });
  }

  for (const analysis of paperAnalyses || []) {
    const student = studentById.get(normalizeId(analysis.studentId)) || {};
    for (const evidence of paperSkillEvidence(analysis)) {
      addEvidence(groups, {
        studentId: analysis.studentId,
        studentName: studentName(student),
        type: 'paper_analysis',
        ...evidence,
      });
    }
  }

  for (const assignment of assignments || []) {
    const student = studentById.get(normalizeId(assignment.studentId)) || {};
    for (const evidence of assignmentSkillEvidence(assignment)) {
      addEvidence(groups, {
        studentId: assignment.studentId,
        studentName: studentName(student),
        type: 'recovery_pack',
        ...evidence,
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => {
      const priority = priorityFor(group);
      return {
        skillId: group.skillId,
        skillName: group.skillName,
        studentIds: Array.from(group.studentIds),
        students: Array.from(group.students.values()).sort((a, b) => a.name.localeCompare(b.name)),
        priority,
        evidenceTypes: Array.from(group.evidenceTypes),
        misconceptionTags: Array.from(group.misconceptionTags),
        evidenceSummary: summarizeEvidence(group),
        evidence: group.evidence.slice(0, 8),
        recommendedAction: actionFor(priority),
      };
    })
    .sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 };
      return (rank[b.priority] - rank[a.priority]) || (b.studentIds.length - a.studentIds.length) || a.skillId.localeCompare(b.skillId);
    });
}

function summarizeEvidence(group) {
  const count = group.studentIds.size;
  const sources = Array.from(group.evidenceTypes).map((type) => type.replace(/_/g, ' ')).join(', ');
  return `${count} student${count === 1 ? '' : 's'} flagged by ${sources || 'learning evidence'}.`;
}

export async function buildWeakGroupsForClass({
  classId,
  subjectId = DEFAULT_SUBJECT,
  domainId = DEFAULT_DOMAIN,
} = {}) {
  const links = await ClassStudent.find({ classId, status: 'active' }).lean();
  const studentIds = links.map((link) => normalizeId(link.studentId));
  const students = await Student.find({ _id: { $in: studentIds } }).lean();
  const [diagnostics, mistakes, paperAnalyses, assignments] = await Promise.all([
    MathPathDiagnosticSession.find({ studentId: { $in: studentIds }, subjectId, domainId, status: 'completed' }).sort({ completedAt: -1 }).lean(),
    MathPathMistakeRecord.find({ studentId: { $in: studentIds }, domainId }).lean(),
    PaperAnalysis.find({ studentId: { $in: studentIds }, subjectId, domainId, status: { $in: ['needs_review', 'reviewed', 'assigned'] } }).lean(),
    MathPathAssignment.find({ studentId: { $in: studentIds }, subjectId, domainId }).lean(),
  ]);

  return buildWeakGroupsFromEvidence({
    students,
    diagnostics,
    mistakes,
    paperAnalyses,
    assignments,
  });
}

export default {
  buildWeakGroupsForClass,
  buildWeakGroupsFromEvidence,
};
