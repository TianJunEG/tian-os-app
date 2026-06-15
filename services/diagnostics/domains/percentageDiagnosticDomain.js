import percentage from '../../../scripts/domains/percentage.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

// Percentage diagnostic domain (P5–P6).
// Skill graph: scripts/domains/percentage.js (10 skills, pct.* slugs).
// DB-free — question templates from questionStructures; percentage arithmetic
// evaluated via genericQuestionGenerator (p/100, p/100*q, a/b*100, etc.).

export default createDiagnosticDomain({
  domainId:            'percentage',
  displayName:         'Percentage',
  subjectId:           'math',
  skills:              percentage.skills,
  fallbackSkillId:     'pct.meaning',
  defaultStartSkillIds:['pct.meaning'],
  domainVersion:       'v0.1',
});
