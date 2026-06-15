import volume from '../../../scripts/domains/volume.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

export default createDiagnosticDomain({
  domainId:             'volume',
  displayName:          'Volume',
  subjectId:            'math',
  skills:               volume.skills,
  fallbackSkillId:      'vol.unit-cubes',
  defaultStartSkillIds: ['vol.unit-cubes'],
  domainVersion:        'v0.1',
});
