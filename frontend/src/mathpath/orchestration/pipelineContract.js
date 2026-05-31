export function validateStudentDashboardPayload(payload = {}) {
  const errors = [];
  const studentProgress = payload?.studentProgress || {};
  const nextAction = studentProgress?.nextRecommendedAction || payload?.nextRecommendedAction;
  const currentSkill = studentProgress?.currentSkill;
  const mastery = studentProgress?.masteryProgress;
  const fluency = studentProgress?.fluencyProgress;
  const retention = studentProgress?.retentionProgress;

  if (!currentSkill) errors.push('Missing required field: studentProgress.currentSkill');
  if (!nextAction || !nextAction.action) errors.push('Missing required field: nextRecommendedAction.action');
  if (!mastery || typeof mastery !== 'object') errors.push('Missing required block: masteryProgress');
  if (!fluency || typeof fluency !== 'object') errors.push('Missing required block: fluencyProgress');
  if (!retention || typeof retention !== 'object') errors.push('Missing required block: retentionProgress');

  return {
    valid: errors.length === 0,
    errors,
  };
}

