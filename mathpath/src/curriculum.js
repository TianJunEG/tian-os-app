// curriculum.js — curriculum registry + active-curriculum manager.
//
// The engine (generator, diagnostic, session, mastery) is curriculum-agnostic. A curriculum
// is just data: ordered display `groups` and `skills`, each skill carrying a generator `spec`.
// Mapping a new country = adding a dataset here, not changing the engine. This is what lets
// MathPath cover frameworks IXL doesn't, e.g. the Singapore MOE syllabus.

import foundational from './curricula/foundational.js';
import singaporeP1 from './curricula/singapore-p1.js';
import singaporeP2 from './curricula/singapore-p2.js';
import singaporeP3 from './curricula/singapore-p3.js';
import singaporeP4 from './curricula/singapore-p4.js';
import singaporeP5 from './curricula/singapore-p5.js';
import singaporeP6 from './curricula/singapore-p6.js';

export const CURRICULA = [singaporeP1, singaporeP2, singaporeP3, singaporeP4, singaporeP5, singaporeP6, foundational];

// engine constants (framework-independent)
export const QUESTIONS_PER_SESSION = 10;
export const MASTERY_ACCURACY = 0.9;
export const SPEED_GRACE = 1.5;

let active = CURRICULA[0];

export function listCurricula() { return CURRICULA; }
export function getCurriculum(id) { return CURRICULA.find((c) => c.id === id) || null; }
export function getActiveCurriculum() { return active; }
export function setActiveCurriculum(id) {
  const c = getCurriculum(id);
  if (c) active = c;
  return active;
}

export function activeSkills() { return active.skills; }
export function firstSkillId(curriculumId) {
  const c = curriculumId ? getCurriculum(curriculumId) : active;
  return c ? c.skills[0].id : null;
}

export function getSkill(id) {
  const inActive = active.skills.find((s) => s.id === id);
  if (inActive) return inActive;
  for (const c of CURRICULA) {
    const s = c.skills.find((sk) => sk.id === id);
    if (s) return s;
  }
  return null;
}

export function skillIndex(id) { return active.skills.findIndex((s) => s.id === id); }

export function nextSkillId(id) {
  const i = skillIndex(id);
  return i >= 0 && i < active.skills.length - 1 ? active.skills[i + 1].id : null;
}

export function groupOf(skill) { return active.groups.find((g) => g.id === skill.group) || null; }
export function skillsInGroup(groupId) { return active.skills.filter((s) => s.group === groupId); }

export function skillLabel(id) {
  const s = getSkill(id);
  if (!s) return '';
  const owner = CURRICULA.find((c) => c.skills.includes(s));
  const group = owner ? owner.groups.find((g) => g.id === s.group) : null;
  return group ? `${group.name} · ${s.name}` : s.name;
}
