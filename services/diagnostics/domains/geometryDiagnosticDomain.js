import geometry from '../../../scripts/domains/geometry.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

export default createDiagnosticDomain({
  domainId:             'geometry',
  displayName:          'Geometry',
  subjectId:            'math',
  skills:               geometry.skills,
  fallbackSkillId:      'geo.2d-shapes',
  defaultStartSkillIds: ['geo.2d-shapes'],
  domainVersion:        'v0.1',
});
