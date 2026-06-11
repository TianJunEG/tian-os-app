import Intervention from '../../models/Intervention.js';
import Student from '../../models/Student.js';
import Workspace from '../../models/Workspace.js';
import { notify } from '../notifications/notificationService.js';
import { buildHelpRequestSummary } from '../../routes/mathpathWorking.js';

const ESCALATION_PRIORITY = {
  parent_notify: 'medium',
  tutor_intervention: 'high',
  diagnostic_assessment: 'high',
  priority_remediation: 'critical',
};

export async function processHelpEscalations({ studentId, workspaceId }) {
  const summary = await buildHelpRequestSummary({ studentId });
  const actionable = summary.filter((row) => row.escalation !== 'monitor');
  if (!actionable.length) return { interventions: [], notifications: [] };

  const existing = await Intervention.find({
    studentId,
    source: 'help_request',
    status: { $nin: ['completed', 'skipped', 'expired', 'mastered'] },
  }).lean();
  const existingSkills = new Set(existing.flatMap((i) => i.linkedSkillIds || []));

  const interventions = [];
  const notifications = [];

  for (const row of actionable) {
    if (existingSkills.has(row.skillId)) continue;

    const priority = ESCALATION_PRIORITY[row.escalation] || 'medium';
    const intervention = await Intervention.create({
      workspaceId,
      studentId,
      interventionId: `help_esc_${studentId}_${row.skillId}_${Date.now()}`,
      type: 'practice_pack',
      title: `Help requested: ${row.skillId}`,
      linkedSkillIds: [row.skillId],
      priority,
      source: 'help_request',
      sourceId: `escalation_${row.escalation}`,
      workflow: ['review_help_requests', 'guided_practice', 'independent_check'],
      nextAction: 'review_help_requests',
    });
    interventions.push(intervention);

    if (['parent_notify', 'tutor_intervention', 'diagnostic_assessment', 'priority_remediation'].includes(row.escalation)) {
      try {
        const student = await Student.findById(studentId).lean();
        const workspace = student ? await Workspace.findById(student.workspaceId || workspaceId).lean() : null;
        const recipientUserId = workspace?.ownerUserId || student?.createdByUserId;
        if (recipientUserId) {
          const n = await notify({
            recipientUserId: String(recipientUserId),
            type: 'help_escalation',
            title: `${student?.name || 'Your child'} needs help`,
            body: `${row.count} help request(s) in ${row.skillId}. Escalation level: ${row.escalation.replace(/_/g, ' ')}.`,
            linkPath: `/parent/children/${studentId}/mathpath`,
            sourceType: 'help_escalation',
            sourceId: String(intervention._id),
          });
          notifications.push(n);
        }
      } catch { /* notification is best-effort */ }
    }
  }

  return { interventions, notifications };
}
