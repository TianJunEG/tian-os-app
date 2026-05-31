import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Question from '../../models/Question.js';
import Skill from '../../models/Skill.js';
import fractionsDomain from '../../scripts/domains/fractions.js';
import { generateQuestionsForSkill, isGeneratable } from '../../utils/questionTemplates.js';
import { fractionSkillGraph, getDependents } from '../../frontend/src/mathpath/fractions/fractionSkillGraph.js';
import { fractionQuestionFamilies, getQuestionFamiliesBySkill } from '../../frontend/src/mathpath/fractions/fractionQuestionFamilies.js';
import { getFractionMistakeTaxonomy } from '../../frontend/src/mathpath/fractions/fractionMistakeToMasteryEngine.js';

dotenv.config();

const DEFAULT_DOMAIN_ID = 'fractions';
const DEFAULT_MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const DEFAULT_PER_DIFFICULTY = 5; // Mirrors scripts/seedQuestions.js default.
const COVERAGE_TARGETS = {
  diagnostic: 10,
  practice: 50,
  fluency: 20,
  assessment: 20,
  total: 100,
};

const MISTAKE_TAXONOMY = getFractionMistakeTaxonomy();
const MISTAKE_CODES = MISTAKE_TAXONOMY.map((t) => t.code);

const MISTAKE_TAG_RULES = {
  M001: [/frac\/add-without-common/i, /frac\/add-denominators/i, /whole-number/i],
  M002: [/frac\/compare-numer/i, /numerator-only/i],
  M003: [/frac\/unit/i, /frac\/part-whole/i, /frac\/of-set/i, /denominator/i],
  M004: [/equivalent/i, /frac\/scale-one-part/i],
  M005: [/simplif/i, /frac\/incomplete-simplify/i],
  M006: [/mixed/i, /improper/i, /convert/i],
  M007: [/frac\/sub-denominators/i, /common-denominator/i],
  M008: [/wordproblem/i, /frac\/remainder/i, /operation-choice/i, /data\//i, /graph\//i],
  M009: [/frac\/mult/i, /frac\/divide/i, /frac\/div/i],
  M010: [/careless/i, /attention/i, /arithmetic/i],
};

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, digits = 1) {
  const n = toNum(value, 0);
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

function unique(values = []) {
  return [...new Set(values)];
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function buildDomainSkillMap() {
  const byFCode = {};
  const bySlug = {};
  (fractionsDomain.skills || []).forEach((skill) => {
    if (skill.frameworkCode) byFCode[skill.frameworkCode] = skill;
    if (skill.slug) bySlug[skill.slug] = skill;
  });
  return { byFCode, bySlug };
}

function mapDbSkillToFrameworkCode(dbSkill = {}, maps = {}) {
  const metaCode = dbSkill?.metadata?.mathPathSkillId;
  if (metaCode && /^F\d{3}$/.test(String(metaCode))) return String(metaCode);

  if (dbSkill.slug && maps.bySlug?.[dbSkill.slug]?.frameworkCode) {
    return maps.bySlug[dbSkill.slug].frameworkCode;
  }

  const dbName = normalizeText(dbSkill.name);
  const matched = (fractionsDomain.skills || []).find((s) => normalizeText(s.mathPathSkillName || s.name) === dbName);
  if (matched?.frameworkCode) return matched.frameworkCode;
  return null;
}

function classifyQuestionForModes(question = {}) {
  const category = String(question.questionCategory || '').toLowerCase();
  if (category) {
    return {
      diagnostic: category === 'diagnostic',
      practice: ['practice', 'remediation', 'challenge'].includes(category),
      fluency: category === 'fluency',
      assessment: category === 'assessment',
    };
  }

  const difficulty = String(question.difficulty || '').toLowerCase();
  const hasVisual = !!question.visual;
  const isTextFirst = !hasVisual;

  const diagnostic = ['medium', 'hard'].includes(difficulty);
  const practice = true;
  const fluency = isTextFirst && ['easy', 'medium'].includes(difficulty);
  const assessment = ['medium', 'hard'].includes(difficulty);

  return { diagnostic, practice, fluency, assessment };
}

function mapTagToMistakeCodes(tag) {
  const input = String(tag || '').trim();
  if (!input) return [];
  const matched = Object.entries(MISTAKE_TAG_RULES)
    .filter(([, rules]) => rules.some((re) => re.test(input)))
    .map(([code]) => code);
  return matched.length ? matched : ['M010'];
}

function computeSkillReadiness(modeCounts = {}) {
  const totalRatio = Math.min(1, toNum(modeCounts.total, 0) / COVERAGE_TARGETS.total);
  const diagnosticRatio = Math.min(1, toNum(modeCounts.diagnostic, 0) / COVERAGE_TARGETS.diagnostic);
  const practiceRatio = Math.min(1, toNum(modeCounts.practice, 0) / COVERAGE_TARGETS.practice);
  const fluencyRatio = Math.min(1, toNum(modeCounts.fluency, 0) / COVERAGE_TARGETS.fluency);
  const assessmentRatio = Math.min(1, toNum(modeCounts.assessment, 0) / COVERAGE_TARGETS.assessment);

  const weightedCoverage = round(
    (totalRatio * 0.45 + diagnosticRatio * 0.15 + practiceRatio * 0.2 + fluencyRatio * 0.1 + assessmentRatio * 0.1) * 100,
    1
  );

  let status = 'notReady';
  const meetsAllTargets =
    modeCounts.total >= COVERAGE_TARGETS.total &&
    modeCounts.diagnostic >= COVERAGE_TARGETS.diagnostic &&
    modeCounts.practice >= COVERAGE_TARGETS.practice &&
    modeCounts.fluency >= COVERAGE_TARGETS.fluency &&
    modeCounts.assessment >= COVERAGE_TARGETS.assessment;

  if (meetsAllTargets && weightedCoverage >= 95) status = 'strong';
  else if (meetsAllTargets) status = 'pilotReady';
  else if (weightedCoverage >= 35) status = 'developing';

  return { weightedCoverage, status };
}

function buildFamilyCoverageRows({ skillId, skillName, families = [], totalQuestions = 0, exactFamilyCounts = null }) {
  const familyCount = families.length || 1;
  const targetPerFamily = Math.ceil(COVERAGE_TARGETS.total / familyCount);

  let totals = {};
  let estimated = true;
  if (exactFamilyCounts && Object.keys(exactFamilyCounts).length) {
    totals = { ...exactFamilyCounts };
    estimated = false;
  } else {
    const base = Math.floor(totalQuestions / familyCount);
    let remainder = totalQuestions % familyCount;
    families.forEach((family) => {
      totals[family.id] = base + (remainder > 0 ? 1 : 0);
      remainder -= remainder > 0 ? 1 : 0;
    });
  }

  return families.map((family) => {
    const total = toNum(totals[family.id], 0);
    const coveragePercentage = round((total / targetPerFamily) * 100, 1);
    return {
      skillId,
      skillName,
      questionFamilyId: family.id,
      questionFamilyName: family.name,
      totalQuestions: total,
      targetQuestions: targetPerFamily,
      coveragePercentage,
      underCovered: total < targetPerFamily,
      estimated,
    };
  });
}

function countDependentsRecursive(skillId, visited = new Set()) {
  if (visited.has(skillId)) return 0;
  visited.add(skillId);
  const direct = getDependents(skillId) || [];
  let total = direct.length;
  direct.forEach((d) => {
    total += countDependentsRecursive(d, visited);
  });
  return total;
}

function buildPriorityQueues(skillCoverage = []) {
  const ranked = [...skillCoverage]
    .map((row) => ({
      ...row,
      dependencyImpact: countDependentsRecursive(row.skillId, new Set()),
      deficit: Math.max(0, COVERAGE_TARGETS.total - toNum(row.totalQuestions, 0)),
    }))
    .sort((a, b) => {
      if (a.readinessStatus !== b.readinessStatus) {
        const rank = { notReady: 0, developing: 1, pilotReady: 2, strong: 3 };
        return rank[a.readinessStatus] - rank[b.readinessStatus];
      }
      if (a.coveragePercentage !== b.coveragePercentage) return a.coveragePercentage - b.coveragePercentage;
      return b.dependencyImpact - a.dependencyImpact;
    });

  const priority1 = ranked.slice(0, 8).map((row) => ({
    skillId: row.skillId,
    skillName: row.skillName,
    coveragePercentage: row.coveragePercentage,
    missingQuestions: row.missingQuestions.total,
    reason: row.readinessStatus === 'notReady'
      ? 'Below minimum pilot threshold with high dependency impact.'
      : 'High-impact coverage gap.',
  }));
  const priority2 = ranked.slice(8, 17).map((row) => ({
    skillId: row.skillId,
    skillName: row.skillName,
    coveragePercentage: row.coveragePercentage,
    missingQuestions: row.missingQuestions.total,
    reason: 'Developing coverage but not yet pilot-ready.',
  }));
  const priority3 = ranked.slice(17).map((row) => ({
    skillId: row.skillId,
    skillName: row.skillName,
    coveragePercentage: row.coveragePercentage,
    missingQuestions: row.missingQuestions.total,
    reason: 'Lower urgency relative to current pilot thresholds.',
  }));

  return { priority1, priority2, priority3 };
}

async function loadFractionQuestionRowsFromDatabase({ mongoUri = DEFAULT_MONGO_URI, connectIfNeeded = true } = {}) {
  const readyState = mongoose.connection.readyState;
  let connectedHere = false;
  if (readyState === 0 && connectIfNeeded) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    connectedHere = true;
  }

  try {
    const dbSkills = await Skill.find({
      $or: [
        { slug: /^fr\./i },
        { 'metadata.mathPathSkillId': /^F\d{3}$/ },
      ],
    }).lean();

    const maps = buildDomainSkillMap();
    const skillDocsByFCode = {};
    dbSkills.forEach((skill) => {
      const code = mapDbSkillToFrameworkCode(skill, maps);
      if (!code) return;
      if (!skillDocsByFCode[code]) skillDocsByFCode[code] = [];
      skillDocsByFCode[code].push(skill);
    });

    const skillIds = unique(
      Object.values(skillDocsByFCode)
        .flat()
        .map((skill) => String(skill._id))
    );

    const questions = skillIds.length
      ? await Question.find({ skillId: { $in: skillIds } }).lean()
      : [];

    return {
      source: 'database',
      skillDocsByFCode,
      questionsByFCode: fractionSkillGraph.skills.reduce((acc, skill) => {
        const docs = skillDocsByFCode[skill.id] || [];
        const idSet = new Set(docs.map((s) => String(s._id)));
        acc[skill.id] = questions.filter((q) => idSet.has(String(q.skillId)));
        return acc;
      }, {}),
      connectedHere,
    };
  } finally {
    if (connectedHere) {
      await mongoose.disconnect();
    }
  }
}

function loadFractionQuestionRowsFromTemplates({ perDifficulty = DEFAULT_PER_DIFFICULTY } = {}) {
  const maps = buildDomainSkillMap();
  const questionsByFCode = {};

  fractionSkillGraph.skills.forEach((skill) => {
    const domainSkill = maps.byFCode[skill.id];
    const fallbackName = domainSkill?.name || skill.name;
    const questions = generateQuestionsForSkill(fallbackName, perDifficulty).map((q) => ({
      ...q,
      source: 'seed-template',
    }));
    questionsByFCode[skill.id] = questions;
  });

  return {
    source: 'seed-template',
    skillDocsByFCode: {},
    questionsByFCode,
  };
}

function buildMisconceptionAudit(skillCoverage = []) {
  const byCode = MISTAKE_CODES.reduce((acc, code) => {
    const taxonomy = MISTAKE_TAXONOMY.find((t) => t.code === code);
    acc[code] = {
      mistakeCode: code,
      mistakeName: taxonomy?.title || code,
      representedQuestionCount: 0,
      representedSkills: [],
      sampleTags: [],
      status: 'missing',
    };
    return acc;
  }, {});

  skillCoverage.forEach((skill) => {
    const tags = unique(skill.misconceptionTags || []);
    tags.forEach((tag) => {
      mapTagToMistakeCodes(tag).forEach((code) => {
        const row = byCode[code];
        if (!row) return;
        row.representedQuestionCount += toNum(skill.tagQuestionCounts?.[tag], 0);
        row.representedSkills.push(skill.skillId);
        row.sampleTags.push(tag);
      });
    });
  });

  Object.values(byCode).forEach((row) => {
    row.representedSkills = unique(row.representedSkills);
    row.sampleTags = unique(row.sampleTags);
    if (row.representedQuestionCount >= 20 && row.representedSkills.length >= 4) row.status = 'represented';
    else if (row.representedQuestionCount > 0) row.status = 'partially represented';
    else row.status = 'missing';
  });

  return Object.values(byCode);
}

function buildPilotReadinessSummary(skillCoverage = []) {
  const totalSkills = skillCoverage.length;
  const pilotReadySkills = skillCoverage.filter((s) => ['pilotReady', 'strong'].includes(s.readinessStatus)).length;
  const missingQuestions = skillCoverage.reduce((sum, s) => sum + s.missingQuestions.total, 0);
  const weakestSkills = [...skillCoverage]
    .sort((a, b) => a.coveragePercentage - b.coveragePercentage)
    .slice(0, 6)
    .map((s) => ({
      skillId: s.skillId,
      skillName: s.skillName,
      coveragePercentage: s.coveragePercentage,
      missingQuestions: s.missingQuestions.total,
    }));
  const strongestSkills = [...skillCoverage]
    .sort((a, b) => b.coveragePercentage - a.coveragePercentage)
    .slice(0, 6)
    .map((s) => ({
      skillId: s.skillId,
      skillName: s.skillName,
      coveragePercentage: s.coveragePercentage,
      totalQuestions: s.totalQuestions,
    }));

  return {
    totalSkills,
    pilotReadySkills,
    missingQuestions,
    weakestSkills,
    strongestSkills,
    estimatedContentGap: {
      totalAdditionalQuestionsNeeded: missingQuestions,
      averageAdditionalQuestionsPerSkill: totalSkills ? round(missingQuestions / totalSkills, 1) : 0,
    },
  };
}

function buildReadinessScore({ skillCoverage = [], misconceptionAudit = [] }) {
  const skillCoveragePct = average(skillCoverage.map((s) => s.coveragePercentage));
  const modeCoveragePct = average(skillCoverage.map((s) => s.modeCoveragePercentage));
  const misconceptionPct = average(
    misconceptionAudit.map((m) => (
      m.status === 'represented' ? 100 : m.status === 'partially represented' ? 50 : 0
    ))
  );

  return round(skillCoveragePct * 0.5 + modeCoveragePct * 0.3 + misconceptionPct * 0.2, 1);
}

function average(values = []) {
  const nums = values.map((v) => toNum(v, NaN)).filter(Number.isFinite);
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

export async function runFractionsContentCoverageAudit(options = {}) {
  const {
    domainId = DEFAULT_DOMAIN_ID,
    perDifficulty = DEFAULT_PER_DIFFICULTY,
    preferDatabase = true,
    connectIfNeeded = true,
    mongoUri = DEFAULT_MONGO_URI,
  } = options;

  const warnings = [];
  let sourcePayload = null;

  if (preferDatabase) {
    try {
      sourcePayload = await loadFractionQuestionRowsFromDatabase({ mongoUri, connectIfNeeded });
    } catch (error) {
      warnings.push(`Database audit unavailable: ${error.message}`);
    }
  }

  if (!sourcePayload) {
    sourcePayload = loadFractionQuestionRowsFromTemplates({ perDifficulty });
    warnings.push('Coverage computed from seed-template generation fallback (DB question inventory not available).');
  }

  const skillCoverage = fractionSkillGraph.skills.map((skill) => {
    const families = getQuestionFamiliesBySkill(skill.id);
    const rows = sourcePayload.questionsByFCode?.[skill.id] || [];

    const familyCounts = {};
    const modeCounts = rows.reduce((acc, question) => {
      const mode = classifyQuestionForModes(question);
      acc.total += 1;
      if (mode.diagnostic) acc.diagnostic += 1;
      if (mode.practice) acc.practice += 1;
      if (mode.fluency) acc.fluency += 1;
      if (mode.assessment) acc.assessment += 1;
      const familyId = String(question.questionFamilyId || '').trim();
      if (familyId) familyCounts[familyId] = toNum(familyCounts[familyId], 0) + 1;
      return acc;
    }, { total: 0, diagnostic: 0, practice: 0, fluency: 0, assessment: 0 });

    const tagQuestionCounts = {};
    rows.forEach((q) => {
      const tag = String(q.misconceptionTag || '').trim();
      if (!tag) return;
      tagQuestionCounts[tag] = toNum(tagQuestionCounts[tag], 0) + 1;
    });
    const misconceptionTags = Object.keys(tagQuestionCounts);

    const readiness = computeSkillReadiness(modeCounts);
    const missingQuestions = {
      diagnostic: Math.max(0, COVERAGE_TARGETS.diagnostic - modeCounts.diagnostic),
      practice: Math.max(0, COVERAGE_TARGETS.practice - modeCounts.practice),
      fluency: Math.max(0, COVERAGE_TARGETS.fluency - modeCounts.fluency),
      assessment: Math.max(0, COVERAGE_TARGETS.assessment - modeCounts.assessment),
      total: Math.max(0, COVERAGE_TARGETS.total - modeCounts.total),
    };

    const modeCoveragePercentage = round(
      (
        Math.min(1, modeCounts.diagnostic / COVERAGE_TARGETS.diagnostic) * 0.2 +
        Math.min(1, modeCounts.practice / COVERAGE_TARGETS.practice) * 0.4 +
        Math.min(1, modeCounts.fluency / COVERAGE_TARGETS.fluency) * 0.2 +
        Math.min(1, modeCounts.assessment / COVERAGE_TARGETS.assessment) * 0.2
      ) * 100,
      1
    );

    const familyCoverage = buildFamilyCoverageRows({
      skillId: skill.id,
      skillName: skill.name,
      families,
      totalQuestions: modeCounts.total,
      exactFamilyCounts: Object.keys(familyCounts).length ? familyCounts : null,
    });

    return {
      skillId: skill.id,
      skillName: skill.name,
      strand: skill.strand,
      mappedSlug: (fractionsDomain.skills || []).find((s) => s.frameworkCode === skill.id)?.slug || '',
      questionFamilies: families.map((f) => f.id),
      totalQuestions: modeCounts.total,
      diagnosticQuestions: modeCounts.diagnostic,
      practiceQuestions: modeCounts.practice,
      fluencyQuestions: modeCounts.fluency,
      assessmentQuestions: modeCounts.assessment,
      misconceptionTags,
      tagQuestionCounts,
      readinessStatus: readiness.status,
      coveragePercentage: readiness.weightedCoverage,
      modeCoveragePercentage,
      missingQuestions,
      familyCoverage,
    };
  });

  const questionFamilyCoverage = skillCoverage.flatMap((skill) => skill.familyCoverage);
  const misconceptionAudit = buildMisconceptionAudit(skillCoverage);
  const pilotReadiness = buildPilotReadinessSummary(skillCoverage);
  const generationQueue = buildPriorityQueues(skillCoverage);
  const pilotReadinessScore = buildReadinessScore({ skillCoverage, misconceptionAudit });

  const skillsBelowThreshold = skillCoverage
    .filter((skill) => skill.totalQuestions < COVERAGE_TARGETS.total)
    .map((skill) => ({
      skillId: skill.skillId,
      skillName: skill.skillName,
      totalQuestions: skill.totalQuestions,
      missingQuestions: skill.missingQuestions.total,
      readinessStatus: skill.readinessStatus,
    }));

  return {
    domainId,
    generatedAt: new Date().toISOString(),
    source: sourcePayload.source,
    coverageTargets: { ...COVERAGE_TARGETS },
    validation: {
      everyFractionSkillAudited: skillCoverage.length === fractionSkillGraph.skills.length,
      everyQuestionFamilyAudited: questionFamilyCoverage.length === fractionQuestionFamilies.length,
      missingContentIdentified: skillsBelowThreshold.length > 0,
      misconceptionCoverageMeasured: misconceptionAudit.length === MISTAKE_CODES.length,
      pilotReadinessCalculated: typeof pilotReadinessScore === 'number',
      contentGenerationPrioritiesCreated:
        generationQueue.priority1.length + generationQueue.priority2.length + generationQueue.priority3.length === skillCoverage.length,
    },
    pilotReadinessScore,
    skillCoverage,
    questionFamilyCoverage,
    misconceptionAudit,
    pilotReadiness,
    skillsBelowThreshold,
    highestPriorityContentGaps: generationQueue.priority1.slice(0, 5),
    generationQueue,
    warnings,
    futureExpansionReady: {
      supportedByConfigDesign: true,
      notes: 'Engine shape is domain-configurable; add skill graph + family catalog + mistake-tag rules for decimals/percentage/ratio/algebra/science.',
    },
  };
}

function renderSkillTableRows(skillCoverage = []) {
  return skillCoverage.map((skill) =>
    `| ${skill.skillId} | ${skill.skillName} | ${skill.totalQuestions} | ${skill.diagnosticQuestions} | ${skill.practiceQuestions} | ${skill.fluencyQuestions} | ${skill.assessmentQuestions} | ${skill.coveragePercentage}% | ${skill.readinessStatus} |`
  ).join('\n');
}

function renderFamilyRows(rows = []) {
  return rows.map((row) =>
    `| ${row.questionFamilyId} | ${row.skillId} | ${row.totalQuestions} | ${row.targetQuestions} | ${row.coveragePercentage}% | ${row.estimated ? 'Yes' : 'No'} |`
  ).join('\n');
}

function renderMistakeRows(rows = []) {
  return rows.map((row) =>
    `| ${row.mistakeCode} | ${row.mistakeName} | ${row.status} | ${row.representedQuestionCount} | ${row.representedSkills.length} | ${row.sampleTags.slice(0, 4).join(', ') || '—'} |`
  ).join('\n');
}

function renderPriorityRows(rows = []) {
  return rows.map((row) =>
    `| ${row.skillId} | ${row.skillName} | ${row.coveragePercentage}% | ${row.missingQuestions} | ${row.reason} |`
  ).join('\n');
}

export function buildFractionsCoverageMarkdown(report = {}) {
  const score = toNum(report.pilotReadinessScore, 0);
  const source = report.source || 'unknown';
  const warnings = (report.warnings || []).map((w) => `- ${w}`).join('\n') || '- None';

  return `# Fractions Content Coverage Report

Generated: ${report.generatedAt || new Date().toISOString()}
Domain: ${report.domainId || DEFAULT_DOMAIN_ID}
Data source: ${source}

## Coverage Targets

- Diagnostic per skill: ${COVERAGE_TARGETS.diagnostic}
- Practice per skill: ${COVERAGE_TARGETS.practice}
- Fluency per skill: ${COVERAGE_TARGETS.fluency}
- Assessment per skill: ${COVERAGE_TARGETS.assessment}
- Total per skill: ${COVERAGE_TARGETS.total}

## Pilot Readiness Summary

- Pilot readiness score: **${score}/100**
- Total skills audited: **${report.pilotReadiness?.totalSkills || 0}**
- Pilot-ready skills: **${report.pilotReadiness?.pilotReadySkills || 0}**
- Estimated missing questions: **${report.pilotReadiness?.missingQuestions || 0}**
- Estimated average additional questions needed per skill: **${report.pilotReadiness?.estimatedContentGap?.averageAdditionalQuestionsPerSkill || 0}**

## Skill Coverage

| Skill ID | Skill Name | Total | Diagnostic | Practice | Fluency | Assessment | Coverage | Status |
|---|---|---:|---:|---:|---:|---:|---:|---|
${renderSkillTableRows(report.skillCoverage || [])}

## Question Family Coverage

> Note: \`Estimated = Yes\` means the current Question schema does not persist \`questionFamilyId\`, so family-level totals are proportionally estimated from skill totals.

| Question Family | Skill | Total | Target | Coverage | Estimated |
|---|---|---:|---:|---:|---|
${renderFamilyRows(report.questionFamilyCoverage || [])}

## Misconception Coverage (M001–M010)

| Code | Mistake | Status | Question Count | Skills Covered | Sample Tags |
|---|---|---|---:|---:|---|
${renderMistakeRows(report.misconceptionAudit || [])}

## Skills Below Threshold

${(report.skillsBelowThreshold || []).length
    ? (report.skillsBelowThreshold || [])
      .map((row) => `- ${row.skillId} ${row.skillName}: ${row.totalQuestions}/${COVERAGE_TARGETS.total} (missing ${row.missingQuestions})`)
      .join('\n')
    : '- None'}

## Question Generation Queue

### Priority 1

| Skill ID | Skill Name | Coverage | Missing | Reason |
|---|---|---:|---:|---|
${renderPriorityRows(report.generationQueue?.priority1 || [])}

### Priority 2

| Skill ID | Skill Name | Coverage | Missing | Reason |
|---|---|---:|---:|---|
${renderPriorityRows(report.generationQueue?.priority2 || [])}

### Priority 3

| Skill ID | Skill Name | Coverage | Missing | Reason |
|---|---|---:|---:|---|
${renderPriorityRows(report.generationQueue?.priority3 || [])}

## Validation

- Every fraction skill audited: ${report.validation?.everyFractionSkillAudited ? 'PASS' : 'FAIL'}
- Every question family audited: ${report.validation?.everyQuestionFamilyAudited ? 'PASS' : 'FAIL'}
- Missing content identified: ${report.validation?.missingContentIdentified ? 'PASS' : 'FAIL'}
- Misconception coverage measured: ${report.validation?.misconceptionCoverageMeasured ? 'PASS' : 'FAIL'}
- Pilot readiness calculated: ${report.validation?.pilotReadinessCalculated ? 'PASS' : 'FAIL'}
- Content generation priorities created: ${report.validation?.contentGenerationPrioritiesCreated ? 'PASS' : 'FAIL'}

## Warnings

${warnings}
`;
}

export const contentCoverageEngine = {
  runFractionsContentCoverageAudit,
  buildFractionsCoverageMarkdown,
};

export default contentCoverageEngine;
