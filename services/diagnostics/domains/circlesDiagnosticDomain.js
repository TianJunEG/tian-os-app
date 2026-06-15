import circles from '../../../scripts/domains/circles.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

export default createDiagnosticDomain({
  domainId:             'circles',
  displayName:          'Circles',
  subjectId:            'math',
  skills:               circles.skills,
  fallbackSkillId:      'cir.parts',
  defaultStartSkillIds: ['cir.parts'],
  domainVersion:        'v0.1',
});
