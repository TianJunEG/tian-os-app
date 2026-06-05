import { fractionsDiagnosticAssetMapV1 } from './fractionsDiagnosticAssetMapV1.js';
import { fractionsKnowledgeMapV1 } from './fractionsKnowledgeMapV1.js';
import { fractionsRemediationMapV1 } from './fractionsRemediationMapV1.js';
import {
  buildRemediationAssetEntry,
  normalizeRemediationAssetMap,
  remediationPathRules,
} from '../knowledge/remediationAssetModel.js';

const MICRO_SKILL_TOPICS = Object.fromEntries(
  fractionsDiagnosticAssetMapV1.entries.map((entry) => [entry.microSkill, entry.topic])
);

export const fractionsRemediationAssetMapV1 = normalizeRemediationAssetMap({
  domain: 'fractions',
  domainTitle: 'Fractions',
  stage: 'P4',
  modelVersion: 'fractions-remediation-asset-map-v1',
  sourceKnowledgeMapVersion: fractionsKnowledgeMapV1.modelVersion,
  sourceMisconceptionMapVersion: fractionsRemediationMapV1.modelVersion,
  sourceDiagnosticAssetMapVersion: fractionsDiagnosticAssetMapV1.modelVersion,
  productionBehaviorChanged: false,
  remediationPathRules,
  entries: Object.entries(MICRO_SKILL_TOPICS).map(([microSkill, topic]) =>
    buildRemediationAssetEntry({
      knowledgeMap: fractionsKnowledgeMapV1,
      misconceptionMap: fractionsRemediationMapV1,
      topic,
      microSkill,
    })
  ),
});

export default fractionsRemediationAssetMapV1;
