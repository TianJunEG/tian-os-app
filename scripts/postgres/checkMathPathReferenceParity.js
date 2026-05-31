import dotenv from 'dotenv';
import { fractionUniversalSkills } from '../../frontend/src/mathpath/curriculum/fractionUniversalSkills.js';
import { fractionCurriculumMappings } from '../../frontend/src/mathpath/curriculum/fractionCurriculumMappings.js';
import { fractionQuestionFamilies } from '../../frontend/src/mathpath/fractions/fractionQuestionFamilies.js';

dotenv.config();

const REQUIRED_FRAMEWORK_IDS = Array.from({ length: 26 }, (_, idx) => `F${String(idx + 1).padStart(3, '0')}`);
const SG_CURRICULUM = 'MOE_PRIMARY_MATH_2021';
const SG_PRIMARY_REQUIRED = {
  country: 'SG',
  curriculum: SG_CURRICULUM,
  subject: 'Mathematics',
  phase: 'Primary',
  stream: 'Standard',
  strand: 'Number and Algebra',
  subStrand: 'Fractions',
};

async function loadPrisma() {
  try {
    const mod = await import('../../services/db/prismaClient.js');
    return mod.prisma;
  } catch (error) {
    throw new Error(
      `Prisma client could not be loaded. Run npm install and npx prisma generate first. (${error?.message || error})`
    );
  }
}

function asSet(items) {
  return new Set((items || []).map((v) => String(v || '').trim()).filter(Boolean));
}

function skillIdByFrameworkRows() {
  return new Map(fractionUniversalSkills.map((row) => [String(row.frameworkSkillId).toUpperCase(), row]));
}

async function main() {
  const prisma = await loadPrisma();
  const universalRows = skillIdByFrameworkRows();

  const pgSkills = await prisma.skillRef.findMany({
    where: { domain: 'fractions' },
    include: {
      prerequisitesAsSource: true,
      curriculumMappings: true,
      questionFamilies: true,
    },
    orderBy: { pathwayOrder: 'asc' },
  });
  const pgSkillByFramework = new Map(pgSkills.map((row) => [row.frameworkSkillId, row]));

  const missingSkills = REQUIRED_FRAMEWORK_IDS.filter((id) => !pgSkillByFramework.has(id));
  const missingUniversalSlug = REQUIRED_FRAMEWORK_IDS.filter((id) => !pgSkillByFramework.get(id)?.universalSkillSlug);
  const badPathwayOrder = REQUIRED_FRAMEWORK_IDS.filter((id) => {
    const expected = universalRows.get(id)?.pathwayOrder;
    const actual = pgSkillByFramework.get(id)?.pathwayOrder;
    return Number(expected) !== Number(actual);
  });

  const prerequisiteMismatches = [];
  for (const frameworkId of REQUIRED_FRAMEWORK_IDS) {
    const pg = pgSkillByFramework.get(frameworkId);
    if (!pg) continue;
    const expectedPrereqs = asSet(universalRows.get(frameworkId)?.prerequisites || []);
    const actualPrereqs = asSet(
      (pg.prerequisitesAsSource || [])
        .map((edge) => {
          const prereqSkill = pgSkills.find((s) => s.id === edge.prerequisiteSkillId);
          return prereqSkill?.frameworkSkillId || '';
        })
    );
    const missing = [...expectedPrereqs].filter((p) => !actualPrereqs.has(p));
    const extra = [...actualPrereqs].filter((p) => !expectedPrereqs.has(p));
    if (missing.length || extra.length) {
      prerequisiteMismatches.push({ frameworkSkillId: frameworkId, missing, extra });
    }
  }

  const sgPrimaryRows = fractionCurriculumMappings.filter(
    (row) => row.country === 'SG' && row.curriculum === SG_CURRICULUM
  );
  const missingPrimaryMappings = REQUIRED_FRAMEWORK_IDS.filter((id) => {
    const pg = pgSkillByFramework.get(id);
    if (!pg) return true;
    return !(pg.curriculumMappings || []).some(
      (m) => m.country === SG_PRIMARY_REQUIRED.country
        && m.curriculum === SG_PRIMARY_REQUIRED.curriculum
        && m.subject === SG_PRIMARY_REQUIRED.subject
        && m.phase === SG_PRIMARY_REQUIRED.phase
    );
  });

  const invalidPrimaryMappings = [];
  for (const frameworkId of REQUIRED_FRAMEWORK_IDS) {
    const pg = pgSkillByFramework.get(frameworkId);
    if (!pg) continue;
    const row = (pg.curriculumMappings || []).find(
      (m) => m.country === 'SG' && m.curriculum === SG_CURRICULUM && m.phase === 'Primary'
    );
    if (!row) continue;
    const violations = [];
    if (row.stream !== SG_PRIMARY_REQUIRED.stream) violations.push(`stream=${row.stream || ''}`);
    if (row.strand !== SG_PRIMARY_REQUIRED.strand) violations.push(`strand=${row.strand || ''}`);
    if (row.subStrand !== SG_PRIMARY_REQUIRED.subStrand) violations.push(`subStrand=${row.subStrand || ''}`);
    if (!row.introducedLevel) violations.push('introducedLevel missing');
    if (!row.masteryLevel) violations.push('masteryLevel missing');
    if (!row.levelBand?.length) violations.push('levelBand missing');
    if (!row.syllabusRef && !row.notes) violations.push('syllabusRef/notes missing');
    if (violations.length) invalidPrimaryMappings.push({ frameworkSkillId: frameworkId, violations });
  }

  const pgFamilies = await prisma.questionFamilyRef.findMany({
    where: { domain: 'fractions' },
    include: { skill: true },
  });
  const pgFamilyById = new Map(pgFamilies.map((row) => [row.questionFamilyId, row]));
  const missingFamilies = fractionQuestionFamilies
    .map((family) => family.id)
    .filter((id) => !pgFamilyById.has(id));
  const invalidFamilySkillLinks = fractionQuestionFamilies
    .filter((family) => {
      const row = pgFamilyById.get(family.id);
      if (!row) return false;
      return row.skill.frameworkSkillId !== family.skillId;
    })
    .map((family) => ({
      questionFamilyId: family.id,
      expectedFrameworkSkillId: family.skillId,
      actualFrameworkSkillId: pgFamilyById.get(family.id)?.skill?.frameworkSkillId || null,
    }));

  const report = {
    totals: {
      requiredFractionsSkills: REQUIRED_FRAMEWORK_IDS.length,
      postgresFractionsSkills: pgSkills.length,
      postgresMappings: await prisma.curriculumSkillMapping.count(),
      postgresPrerequisites: await prisma.skillPrerequisite.count(),
      postgresQuestionFamilies: pgFamilies.length,
      expectedPrimaryMappings: sgPrimaryRows.length,
      expectedQuestionFamilies: fractionQuestionFamilies.length,
    },
    missingSkills,
    missingUniversalSlug,
    badPathwayOrder,
    prerequisiteMismatches,
    missingPrimaryMappings,
    invalidPrimaryMappings,
    missingFamilies,
    invalidFamilySkillLinks,
  };

  const failures =
    missingSkills.length
    + missingUniversalSlug.length
    + badPathwayOrder.length
    + prerequisiteMismatches.length
    + missingPrimaryMappings.length
    + invalidPrimaryMappings.length
    + missingFamilies.length
    + invalidFamilySkillLinks.length;

  report.parityPass = failures === 0;
  console.log(JSON.stringify(report, null, 2));
  if (!report.parityPass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('Phase 1 parity check failed:', error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const { prisma } = await import('../../services/db/prismaClient.js');
      await prisma.$disconnect();
    } catch {
      // noop
    }
  });
