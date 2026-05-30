import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
  FRACTION_CONTENT_TARGETS,
  getCoverageBySkill,
  getMissingContent,
  seedFractionsGeneratedQuestions,
  validateFractionContentGenerationEngine,
} from '../services/mathpath/fractionContentGenerationEngine.js';

dotenv.config();

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

async function main() {
  await mongoose.connect(URI);
  try {
    const seedSummary = await seedFractionsGeneratedQuestions({
      connectIfNeeded: false,
      generationOptions: {
        targetByCategory: FRACTION_CONTENT_TARGETS,
      },
    });

    const [coverageBySkill, missingContent, validation] = await Promise.all([
      getCoverageBySkill({ domainId: 'fractions' }),
      getMissingContent({ domainId: 'fractions' }),
      validateFractionContentGenerationEngine({ domainId: 'fractions' }),
    ]);

    const pilotReadySkills = coverageBySkill.filter((row) => row.pilotReady).length;

    console.log('✅ Fractions content generation complete');
    console.log(JSON.stringify({
      seedSummary,
      totals: {
        skillsAudited: coverageBySkill.length,
        pilotReadySkills,
        missingSkills: missingContent.length,
      },
      topMissingSkills: missingContent.slice(0, 8).map((row) => ({
        skillId: row.skillId,
        skillName: row.skillName,
        missing: row.missingContent,
      })),
      validation,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((error) => {
    console.error('❌ Fractions content generation failed');
    console.error(error);
    process.exit(1);
  });
}

