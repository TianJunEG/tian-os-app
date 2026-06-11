import {
  getCanonicalFractionSkill,
} from '../../shared/mathpath/curriculum/fractionCanonicalSkillMap.js';
import { getUniversalSkillByFrameworkId } from '../../shared/mathpath/curriculum/fractionUniversalSkills.js';

const STUDENT_EXPLANATIONS = {
  F018: 'making the parts the same size before adding',
  F019: 'making the parts the same size before subtracting',
  F020: 'finding the whole and the fraction part',
  F024: 'keeping track of each step in a word problem',
  F025: 'choosing the right method in exam-style questions',
};

function fallbackName(skillId = '') {
  const normalized = String(skillId || '').toUpperCase();
  const canonical = getCanonicalFractionSkill(normalized);
  const row = getUniversalSkillByFrameworkId(normalized);
  return canonical?.displayName || row?.title || row?.name || 'Fractions practice';
}

export function getSkillDisplayName(skillId = '') {
  const normalized = String(skillId || '').toUpperCase();
  const canonical = getCanonicalFractionSkill(normalized);
  const friendlyName = canonical?.studentName || fallbackName(normalized);
  return {
    friendlyName,
    shortStudentLabel: friendlyName,
    parentLabel: canonical?.parentName || fallbackName(normalized),
    teacherLabel: canonical ? canonical.displayName : `${normalized} · ${fallbackName(normalized)}`,
    studentExplanation: STUDENT_EXPLANATIONS[normalized] || friendlyName.toLowerCase(),
  };
}

export function replaceSkillIdsForStudents(text = '') {
  return String(text || '').replace(/\bF\d{3}\b/g, (match) => getSkillDisplayName(match).shortStudentLabel);
}

export default {
  getSkillDisplayName,
  replaceSkillIdsForStudents,
};
