import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import { resolveFractionSkillId, getCanonicalFractionSkillLinks } from '../services/mathpath/fractionSkillResolver.js';

dotenv.config();

const LOCAL_URI = process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';
const URI = process.env.MONGODB_URI || LOCAL_URI;

async function main() {
  let connectedUri = URI;
  try {
    await mongoose.connect(connectedUri, { serverSelectionTimeoutMS: 10000 });
  } catch (error) {
    const remoteSrvDown = String(error?.code || '') === 'ECONNREFUSED'
      && String(error?.hostname || '').includes('mongodb.net');
    const canFallback = connectedUri !== LOCAL_URI;
    if (!remoteSrvDown || !canFallback) throw error;
    console.warn(`⚠️ Remote Mongo unavailable (${error.hostname}). Falling back to local Mongo: ${LOCAL_URI}`);
    connectedUri = LOCAL_URI;
    await mongoose.connect(connectedUri, { serverSelectionTimeoutMS: 10000 });
  }

  try {
    const skills = await Skill.find({
      $or: [
        { slug: /^fr\./i },
        { slug: /^fractions\./i },
        { 'metadata.mathPathSkillId': /^F\d{3}$/ },
      ],
    }, { _id: 1, slug: 1, metadata: 1 }).lean();

    const skillIdToFramework = new Map();
    for (const skill of skills) {
      const framework = resolveFractionSkillId(
        skill?.metadata?.mathPathSkillId ||
        skill?.slug
      );
      if (framework) skillIdToFramework.set(String(skill._id), framework);
    }

    const questions = await Question.find({
      $or: [
        { frameworkSkillId: { $in: ['', null] } },
        { officialSkillCode: { $in: ['', null] } },
        { universalSkillSlug: { $in: ['', null] } },
      ],
    }, { _id: 1, skillId: 1, frameworkSkillId: 1, officialSkillCode: 1, universalSkillSlug: 1 }).lean();

    let updated = 0;
    for (const q of questions) {
      const resolved = resolveFractionSkillId(
        q.frameworkSkillId ||
        q.officialSkillCode ||
        q.universalSkillSlug ||
        skillIdToFramework.get(String(q.skillId))
      );
      if (!resolved) continue;
      const links = getCanonicalFractionSkillLinks(resolved);
      if (!links) continue;
      await Question.updateOne(
        { _id: q._id },
        {
          $set: {
            frameworkSkillId: links.frameworkSkillId,
            officialSkillCode: links.officialSkillCode,
            universalSkillSlug: links.universalSkillSlug,
          },
        }
      );
      updated += 1;
    }

    console.log(JSON.stringify({
      mongoUriUsed: connectedUri,
      totalCandidateSkills: skills.length,
      missingMetadataQuestionScan: questions.length,
      updatedQuestions: updated,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Failed to backfill fraction question skill links');
  console.error(error);
  process.exit(1);
});
