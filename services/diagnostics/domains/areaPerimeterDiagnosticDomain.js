import areaPerimeter from '../../../scripts/domains/areaPerimeter.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

export default createDiagnosticDomain({
  domainId:             'area_perimeter',
  displayName:          'Area & Perimeter',
  subjectId:            'math',
  skills:               areaPerimeter.skills,
  fallbackSkillId:      'ap.perimeter-rect',
  defaultStartSkillIds: ['ap.perimeter-rect'],
  domainVersion:        'v0.1',
});
