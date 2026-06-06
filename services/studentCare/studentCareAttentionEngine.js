const PRIORITY_WEIGHT = { high: 0, medium: 1, low: 2 };
const TYPE_WEIGHT = {
  recheck_overdue: 0,
  parent_requested_help: 1,
  recovery_pack_incomplete: 2,
  multiple_weak_skills: 3,
  paper_needs_review: 4,
  diagnostic_due: 5,
  inactive: 6,
};

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function daysSince(value, now = new Date()) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((now - d) / 86400000);
}

function studentKey(student = {}) {
  return String(student._id || student.id || student.studentId || '');
}

function studentName(student = {}) {
  return student.name || 'Student';
}

function sortQueue(items = []) {
  return [...items].sort((a, b) => {
    const p = (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9);
    if (p !== 0) return p;
    const t = (TYPE_WEIGHT[a.type] ?? 9) - (TYPE_WEIGHT[b.type] ?? 9);
    if (t !== 0) return t;
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });
}

function attentionItem(item = {}) {
  return {
    ...item,
    recommendedAction: item.recommendedAction || item.action || '',
    linkedObjectType: item.linkedObjectType || (
      item.paperAnalysisId ? 'paper_analysis'
        : item.assignmentId ? 'assignment'
          : item.diagnosticSessionId ? 'diagnostic'
            : ''
    ),
    linkedObjectId: item.linkedObjectId || item.paperAnalysisId || item.assignmentId || item.diagnosticSessionId || '',
  };
}

export function buildRecoveryPackQueue({ students = [], assignments = [] } = {}) {
  const byStudent = new Map(students.map((student) => [studentKey(student), student]));
  return assignments
    .filter((assignment) => ['assigned', 'in_progress', 'completed'].includes(assignment.status))
    .map((assignment) => {
      const student = byStudent.get(String(assignment.studentId)) || {};
      const attempted = num(assignment.completion?.questionsAttempted);
      const target = num(assignment.targetQuestionCount || assignment.completion?.questionsAssigned);
      return {
        studentId: String(assignment.studentId || ''),
        studentName: studentName(student),
        assignmentId: String(assignment._id || assignment.id || ''),
        assignmentTitle: assignment.title || 'Recovery Pack',
        progress: { attempted, target },
        accuracy: num(assignment.completion?.accuracy),
        status: assignment.recheck?.recommended ? 'recheck_ready' : assignment.status,
        updatedAt: assignment.updatedAt || assignment.createdAt,
      };
    })
    .sort((a, b) => {
      if (a.status === 'recheck_ready' && b.status !== 'recheck_ready') return -1;
      if (a.status !== 'recheck_ready' && b.status === 'recheck_ready') return 1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
}

export function buildRecheckQueue({ students = [], assignments = [], now = new Date() } = {}) {
  const byStudent = new Map(students.map((student) => [studentKey(student), student]));
  return assignments
    .filter((assignment) => assignment.recheck?.recommended)
    .map((assignment) => {
      const student = byStudent.get(String(assignment.studentId)) || {};
      const ageDays = daysSince(assignment.recheck?.recommendedAt, now);
      return {
        studentId: String(assignment.studentId || ''),
        studentName: studentName(student),
        assignmentId: String(assignment._id || assignment.id || ''),
        assignmentTitle: assignment.title || 'Recovery Pack',
        recommendedAt: assignment.recheck?.recommendedAt || null,
        diagnosticSessionId: assignment.recheck?.diagnosticSessionId || '',
        status: assignment.recheck?.diagnosticSessionId ? 'recheck_assigned' : 'recheck_ready',
        overdue: ageDays !== null && ageDays >= 3 && !assignment.recheck?.diagnosticSessionId,
      };
    })
    .sort((a, b) => Number(b.overdue) - Number(a.overdue));
}

export function buildStudentCareAttentionQueue({
  students = [],
  evidenceByStudent = {},
  now = new Date(),
} = {}) {
  const queue = [];

  for (const student of students) {
    const id = studentKey(student);
    const evidence = evidenceByStudent[id] || {};
    const assignments = evidence.assignments || [];
    const papers = evidence.papers || [];
    const growth = evidence.growth || {};
    const weakCount = (growth.remainingWeakSkills || []).length;
    const latestDiagnosticAge = daysSince(growth.latest?.completedAt, now);
    const lastActivityAge = daysSince(evidence.lastActivityAt || growth.latest?.completedAt, now);

    const recheckOverdue = assignments.find((assignment) => {
      const age = daysSince(assignment.recheck?.recommendedAt, now);
      return assignment.recheck?.recommended && !assignment.recheck?.diagnosticSessionId && age !== null && age >= 3;
    });
    const incompletePack = assignments.find((assignment) => ['assigned', 'in_progress'].includes(assignment.status));
    const newPaper = papers.find((paper) => ['uploaded', 'processing', 'ocr_complete', 'questions_detected', 'needs_review'].includes(paper.status));

    if (recheckOverdue) {
      queue.push(attentionItem({
        studentId: id,
        studentName: studentName(student),
        priority: 'high',
        reason: 'Recheck is overdue.',
        action: 'Launch recheck',
        type: 'recheck_overdue',
        assignmentId: String(recheckOverdue._id || recheckOverdue.id || ''),
        updatedAt: recheckOverdue.recheck?.recommendedAt,
      }));
      continue;
    }

    if (evidence.parentRequestedHelp) {
      queue.push(attentionItem({ studentId: id, studentName: studentName(student), priority: 'high', reason: 'Parent requested help.', action: 'Contact parent', type: 'parent_requested_help' }));
      continue;
    }

    if (incompletePack) {
      queue.push(attentionItem({
        studentId: id,
        studentName: studentName(student),
        priority: weakCount >= 3 ? 'high' : 'medium',
        reason: `${incompletePack.title || 'Recovery Pack'} is incomplete.`,
        action: 'Support recovery pack',
        type: 'recovery_pack_incomplete',
        assignmentId: String(incompletePack._id || incompletePack.id || ''),
        updatedAt: incompletePack.updatedAt || incompletePack.createdAt,
      }));
      continue;
    }

    if (weakCount >= 3) {
      queue.push(attentionItem({ studentId: id, studentName: studentName(student), priority: 'high', reason: `${weakCount} weak skills need intervention.`, action: 'Assign recovery pack', type: 'multiple_weak_skills', diagnosticSessionId: growth.latest?.diagnosticSessionId || '', updatedAt: growth.latest?.completedAt }));
      continue;
    }

    if (newPaper) {
      queue.push(attentionItem({ studentId: id, studentName: studentName(student), priority: 'medium', reason: 'New paper awaits review.', action: 'Review paper', type: 'paper_needs_review', paperAnalysisId: String(newPaper._id || newPaper.id || ''), updatedAt: newPaper.updatedAt || newPaper.createdAt }));
      continue;
    }

    if (!growth.latest || latestDiagnosticAge >= 14) {
      queue.push(attentionItem({ studentId: id, studentName: studentName(student), priority: 'medium', reason: 'Diagnostic is due.', action: 'Run diagnostic', type: 'diagnostic_due', diagnosticSessionId: growth.latest?.diagnosticSessionId || '', updatedAt: growth.latest?.completedAt }));
      continue;
    }

    if (lastActivityAge !== null && lastActivityAge >= 14) {
      queue.push(attentionItem({ studentId: id, studentName: studentName(student), priority: 'low', reason: `No activity for ${lastActivityAge} days.`, action: 'Check in', type: 'inactive', updatedAt: evidence.lastActivityAt }));
    }
  }

  return sortQueue(queue);
}

export default {
  buildStudentCareAttentionQueue,
  buildRecoveryPackQueue,
  buildRecheckQueue,
};
