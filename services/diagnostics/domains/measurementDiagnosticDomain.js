import measurement from '../../../scripts/domains/measurement.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

export default createDiagnosticDomain({
  domainId:             'measurement',
  displayName:          'Measurement',
  subjectId:            'math',
  skills:               measurement.skills,
  fallbackSkillId:      'mea.length',
  defaultStartSkillIds: ['mea.length'],
  domainVersion:        'v0.1',
});
