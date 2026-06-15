import numberSense from '../../../scripts/domains/numberSense.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

// Whole Numbers diagnostic domain (P1–P6).
// Skill graph: scripts/domains/numberSense.js (23 skills, ns.* slugs).
// Question generation: genericQuestionGenerator from questionStructures templates.
// DB-free — mirrors the Decimals engine_ready pattern.

export default createDiagnosticDomain({
  domainId:            'whole_numbers',
  displayName:         'Whole Numbers',
  subjectId:           'math',
  skills:              numberSense.skills,
  fallbackSkillId:     'ns.count.to-20',
  defaultStartSkillIds:['ns.count.to-20'],
  domainVersion:       'v0.1',
});
