import ratioRate from '../../../scripts/domains/ratioRate.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

const RATIO_SLUGS = new Set([
  'rr.meaning', 'rr.equivalent', 'rr.simplify', 'rr.three-term',
  'rr.ratio-fraction', 'rr.ratio-percent', 'rr.divide', 'rr.divide-3',
  'rr.before-after', 'rr.combine', 'rr.proportion',
]);

export default createDiagnosticDomain({
  domainId:             'ratio',
  displayName:          'Ratio',
  subjectId:            'math',
  skills:               ratioRate.skills.filter((s) => RATIO_SLUGS.has(s.slug)),
  fallbackSkillId:      'rr.meaning',
  defaultStartSkillIds: ['rr.meaning'],
  domainVersion:        'v0.1',
});
