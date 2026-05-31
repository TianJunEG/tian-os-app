import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fractionSkillGraph } from '../frontend/src/mathpath/fractions/fractionSkillGraph.js';
import { fractionQuestionFamilies } from '../frontend/src/mathpath/fractions/fractionQuestionFamilies.js';
import {
  upsertMathPathSkills,
  upsertQuestionFamilies,
  getMathPathSkillsByDomain,
  getQuestionFamiliesByDomain,
} from '../services/mathpath/mathPathRepository.js';

dotenv.config();

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const DOMAIN_ID = 'fractions';

function buildDependents(skills) {
  const bySkill = new Map(skills.map((s) => [s.id, []]));
  skills.forEach((skill) => {
    (skill.prerequisites || []).forEach((pre) => {
      if (!bySkill.has(pre)) bySkill.set(pre, []);
      bySkill.get(pre).push(skill.id);
    });
  });
  return bySkill;
}

function toSkillDocs() {
  const dependentsMap = buildDependents(fractionSkillGraph.skills);
  return fractionSkillGraph.skills.map((skill) => ({
    domainId: DOMAIN_ID,
    skillId: skill.id,
    universalSkillId: skill.universalSkillId || '',
    universalDomain: 'fractions',
    universalTitle: skill.universalSkillTitle || skill.name,
    universalDescription: skill.universalDescription || skill.description || '',
    difficultyBand: skill.difficultyBand || '',
    questionTypes: skill.questionTypes || [],
    mistakeTypes: skill.mistakeTypes || [],
    pathwayOrder: skill.pathwayOrder || Number(String(skill.id || '').replace(/\D/g, '')) || 1,
    name: skill.name,
    description: skill.description || '',
    strand: skill.strand || '',
    difficulty: skill.difficulty ?? 1,
    singaporeLevel: skill.singaporeLevel || [],
    introducedLevel: skill.introducedLevel || '',
    masteryLevel: skill.masteryLevel || '',
    curriculumMappings: skill.curriculumMappings || [],
    prerequisites: skill.prerequisites || [],
    dependents: dependentsMap.get(skill.id) || [],
    mastery: skill.mastery || { minimumAccuracy: 90, minimumQuestions: 20 },
    fluency: skill.fluency || { targetAccuracy: 90, targetAverageSeconds: 20 },
    retention: skill.retention || { reviewDays: [3, 7, 30, 90] },
    remediationTargets: skill.remediationIfWeak || [],
    questionFamilies: skill.questionFamilies || [],
    isActive: true,
  }));
}

function toQuestionFamilyDocs() {
  return fractionQuestionFamilies.map((family) => ({
    domainId: DOMAIN_ID,
    skillId: family.skillId,
    questionFamilyId: family.id,
    name: family.name,
    description: family.description || '',
    difficulty: family.difficulty ?? 1,
    recommendedQuestionCount: family.recommendedQuestionCount ?? 20,
    fluencyBenchmarks: family.fluencyBenchmarks || { bronze: 30, silver: 20, gold: 12, platinum: 8 },
    masteryTargetAccuracy: family.masteryTargetAccuracy ?? 90,
    mentalMathEligible: Boolean(family.mentalMathEligible),
    workingRequired: Boolean(family.workingRequired),
    misconceptionTags: family.misconceptionTags || [],
    assessmentRelevant: family.assessmentRelevant !== false,
    isActive: true,
  }));
}

export async function seedMathPathFractions(options = {}) {
  const { manageConnection = true } = options;
  if (manageConnection && mongoose.connection.readyState === 0) {
    await mongoose.connect(URI);
  }
  try {
    const skillDocs = toSkillDocs();
    const familyDocs = toQuestionFamilyDocs();

    const skillResult = await upsertMathPathSkills(skillDocs);
    const familyResult = await upsertQuestionFamilies(familyDocs);

    const seededSkills = await getMathPathSkillsByDomain(DOMAIN_ID);
    const seededFamilies = await getQuestionFamiliesByDomain(DOMAIN_ID);

    return {
      domainId: DOMAIN_ID,
      inputSkills: skillDocs.length,
      inputQuestionFamilies: familyDocs.length,
      dbSkills: seededSkills.length,
      dbQuestionFamilies: seededFamilies.length,
      bulk: {
        skills: {
          matched: skillResult.matchedCount ?? 0,
          modified: skillResult.modifiedCount ?? 0,
          upserted: skillResult.upsertedCount ?? 0,
        },
        questionFamilies: {
          matched: familyResult.matchedCount ?? 0,
          modified: familyResult.modifiedCount ?? 0,
          upserted: familyResult.upsertedCount ?? 0,
        },
      },
    };
  } finally {
    if (manageConnection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seedMathPathFractions({ manageConnection: true })
    .then((summary) => {
      console.log('✅ MathPath fractions seed complete');
      console.log(JSON.stringify(summary, null, 2));
      // Future integration note:
      // Engines currently use static in-repo graphs/families as runtime source-of-truth.
      // This seed persists the same structures for API/repository-backed runtime migration.
    })
    .catch((error) => {
      console.error('❌ MathPath fractions seed failed');
      console.error(error);
      process.exit(1);
    });
}
