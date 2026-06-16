// Curriculum domain config and unified skill / misconception / question-family
// lookup for the tutor domain selector and the generic curriculum-domain
// intelligence engine.
//
// These resolvers point at the **System A** namespace (shared/mathpath/<domain>)
// — the one the live student practice flow (/api/mathpath/<domain>) actually
// writes (domainIds like 'money'/'percentages', skill ids like MN001/P001).
// The tutor dashboard reads MathPathStudentSkillState by these same domainIds,
// so the curriculum intelligence reflects real student data.

import * as money from '../../../shared/mathpath/money/MoneySkillGraph.js';
import * as time from '../../../shared/mathpath/time/TimeSkillGraph.js';
import * as areaPerimeter from '../../../shared/mathpath/areaPerimeter/AreaPerimeterSkillGraph.js';
import * as volume from '../../../shared/mathpath/volume/VolumeSkillGraph.js';
import * as circles from '../../../shared/mathpath/circles/CirclesSkillGraph.js';
import * as ratioRate from '../../../shared/mathpath/ratioRate/ratioRateSkillGraph.js';
import * as percentages from '../../../shared/mathpath/percentages/percentageSkillGraph.js';
import * as algebra from '../../../shared/mathpath/algebra/AlgebraSkillGraph.js';

import * as moneyFam from '../../../shared/mathpath/money/MoneyQuestionFamilies.js';
import * as timeFam from '../../../shared/mathpath/time/TimeQuestionFamilies.js';
import * as areaPerimeterFam from '../../../shared/mathpath/areaPerimeter/AreaPerimeterQuestionFamilies.js';
import * as volumeFam from '../../../shared/mathpath/volume/VolumeQuestionFamilies.js';
import * as circlesFam from '../../../shared/mathpath/circles/CirclesQuestionFamilies.js';
import * as ratioRateFam from '../../../shared/mathpath/ratioRate/ratioRateQuestionFamilies.js';
import * as percentagesFam from '../../../shared/mathpath/percentages/percentageQuestionFamilies.js';
import * as algebraFam from '../../../shared/mathpath/algebra/AlgebraQuestionFamilies.js';

import * as percentagesMc from '../../../shared/mathpath/percentages/percentageMisconceptionMap.js';
import * as ratioRateMc from '../../../shared/mathpath/ratioRate/ratioRateMisconceptionMap.js';

// Per-domainId skill graph modules (uniform getSkill / getPrerequisites;
// getRemediationTargets where present).
const DOMAIN_GRAPHS = {
  money,
  time,
  'area-perimeter': areaPerimeter,
  volume,
  circles,
  ratioRate,
  percentages,
  algebra,
};

const DOMAIN_FAMILIES = {
  money: moneyFam,
  time: timeFam,
  'area-perimeter': areaPerimeterFam,
  volume: volumeFam,
  circles: circlesFam,
  ratioRate: ratioRateFam,
  percentages: percentagesFam,
  algebra: algebraFam,
};

// Misconception lookups, normalised to getMisconception(tag) → { label,
// description, remediationExplanation }. Only a couple of System A domains ship
// a misconception map; the rest resolve to null (clusters then fall back to a
// skill-based label). Getter names differ between maps, so adapt per domain.
const DOMAIN_MISCONCEPTIONS = {
  percentages: (tag) => percentagesMc.getMisconception?.(tag) || null,
  ratioRate: (tag) => {
    const e = ratioRateMc.getMisconceptionEntry?.(tag);
    if (!e) return null;
    return {
      tag,
      label: e.label || e.name || tag,
      description: e.description || '',
      remediationExplanation: e.remediationExplanation || e.remediation || '',
    };
  },
};

export function getSkillFromDomain(domainId, skillId) {
  return DOMAIN_GRAPHS[domainId]?.getSkill?.(skillId) ?? null;
}

// The curriculum area domains shown in the tutor domain selector. Each maps to
// one or more System A domainIds (ratio + rate are a single 'ratioRate' domain).
export const CURRICULUM_DOMAINS = [
  { key: 'money', label: 'Money', domainIds: ['money'] },
  { key: 'time', label: 'Time', domainIds: ['time'] },
  { key: 'area-perimeter', label: 'Area & Perimeter', domainIds: ['area-perimeter'] },
  { key: 'volume', label: 'Volume', domainIds: ['volume'] },
  { key: 'circles', label: 'Circles', domainIds: ['circles'] },
  { key: 'ratio-rate', label: 'Ratio & Rate', domainIds: ['ratioRate'] },
  { key: 'percentage', label: 'Percentage', domainIds: ['percentages'] },
  { key: 'algebra', label: 'Algebra', domainIds: ['algebra'] },
];

function findInDomains(domainIds, fnName, arg) {
  for (const domainId of domainIds) {
    const result = DOMAIN_GRAPHS[domainId]?.[fnName]?.(arg);
    if (result != null && (!Array.isArray(result) || result.length)) return result;
  }
  return null;
}

function allSkillIds(domainId) {
  const graph = DOMAIN_GRAPHS[domainId];
  const skills = graph?.default?.skills || graph?.[`${domainId}SkillGraph`]?.skills || [];
  return Array.isArray(skills) ? skills.map((s) => s.id).filter(Boolean) : [];
}

// Builds a domain-agnostic resolver bundle for a curriculum domain key. Injected
// into the generic curriculum-domain tutor engine so it stays pure and testable.
export function getDomainResolvers(domainKey) {
  const domain = CURRICULUM_DOMAINS.find((d) => d.key === domainKey);
  if (!domain) return null;
  const { domainIds, label } = domain;

  return {
    domainKey,
    domainLabel: label,
    domainIds,
    getSkill: (skillId) => findInDomains(domainIds, 'getSkill', skillId),
    getSkillName: (skillId) => findInDomains(domainIds, 'getSkill', skillId)?.name || skillId,
    getPrerequisites: (skillId) => findInDomains(domainIds, 'getPrerequisites', skillId) || [],
    getRemediationTargets: (skillId) => findInDomains(domainIds, 'getRemediationTargets', skillId) || [],
    getAllSkillIds: () => domainIds.flatMap((id) => allSkillIds(id)),
    getMisconception: (tag) => {
      for (const domainId of domainIds) {
        const m = DOMAIN_MISCONCEPTIONS[domainId]?.(tag);
        if (m) return m;
      }
      return null;
    },
    getQuestionFamily: (familyId) => {
      for (const domainId of domainIds) {
        const f = DOMAIN_FAMILIES[domainId]?.getQuestionFamily?.(familyId);
        if (f) return f;
      }
      return null;
    },
  };
}
