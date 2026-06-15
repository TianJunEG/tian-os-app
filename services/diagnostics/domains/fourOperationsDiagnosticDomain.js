import operations from '../../../scripts/domains/operations.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

// Four Operations diagnostic domain (P1–P6).
// Skill graph: scripts/domains/operations.js (24 skills, op.* slugs).
// DB-free — question templates from questionStructures; arithmetic rules evaluated
// at runtime via genericQuestionGenerator.

export default createDiagnosticDomain({
  domainId:            'four_operations',
  displayName:         'Four Operations',
  subjectId:           'math',
  skills:              operations.skills,
  fallbackSkillId:     'op.add.facts',
  defaultStartSkillIds:['op.add.facts'],
  domainVersion:       'v0.1',
});
