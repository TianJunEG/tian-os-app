import MasteryRecord from '../../models/MasteryRecord.js';
import Skill from '../../models/Skill.js';
import PSLSkill from '../../models/psl/PSLSkill.js';

export async function checkPrerequisites(skillId, studentId, workspaceId) {
  const pslSkill = await PSLSkill.findOne({ skillId }).lean();
  if (!pslSkill) throw Object.assign(new Error(`PSL skill not found: ${skillId}`), { status: 404 });

  const prerequisites = [];
  const blockers = [];

  // Check MathPath prerequisites
  for (const mpCode of pslSkill.mathPathPrerequisites || []) {
    const skill = await Skill.findOne({ code: mpCode }).lean();
    if (!skill) {
      prerequisites.push({ code: mpCode, name: mpCode, type: 'mathpath', ready: false, reason: 'Skill not found' });
      blockers.push({ code: mpCode, name: mpCode, type: 'mathpath' });
      continue;
    }
    const rec = await MasteryRecord.findOne({ studentId, skillId: skill._id, workspaceId }).lean();
    const mastered = rec && rec.status === 'mastered';
    prerequisites.push({
      code: mpCode, name: skill.name || mpCode, type: 'mathpath',
      ready: mastered, score: rec?.score || 0, status: rec?.status || 'not_started',
    });
    if (!mastered) blockers.push({ code: mpCode, name: skill.name || mpCode, type: 'mathpath', score: rec?.score || 0 });
  }

  // Check PSL prerequisites
  for (const pslCode of pslSkill.pslPrerequisites || []) {
    const depSkill = await PSLSkill.findOne({ skillId: pslCode }).lean();
    const rec = depSkill
      ? await MasteryRecord.findOne({ studentId, skillId: depSkill._id, module: 'PSL', workspaceId }).lean()
      : null;
    const mastered = rec && rec.status === 'mastered';
    prerequisites.push({
      code: pslCode, name: depSkill?.name || pslCode, type: 'psl',
      ready: mastered, score: rec?.score || 0, status: rec?.status || 'not_started',
    });
    if (!mastered) blockers.push({ code: pslCode, name: depSkill?.name || pslCode, type: 'psl', score: rec?.score || 0 });
  }

  return { allReady: blockers.length === 0, prerequisites, blockers };
}
