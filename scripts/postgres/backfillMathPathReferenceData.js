import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subject from '../../models/Subject.js';
import Topic from '../../models/Topic.js';
import Skill from '../../models/Skill.js';
import {
  fractionUniversalSkills,
} from '../../frontend/src/mathpath/curriculum/fractionUniversalSkills.js';
import {
  fractionCurriculumMappings,
} from '../../frontend/src/mathpath/curriculum/fractionCurriculumMappings.js';
import {
  fractionQuestionFamilies,
} from '../../frontend/src/mathpath/fractions/fractionQuestionFamilies.js';

dotenv.config();

const DOMAIN = 'fractions';
const DEFAULT_SUBJECT_KEY = 'math';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutor-match';

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

function toUniversalSlug(row) {
  const skillId = String(row?.skillId || '').trim();
  if (!skillId) return '';
  if (skillId.startsWith('fr.')) return skillId;
  if (skillId.startsWith('fractions.')) return `fr.${skillId.slice('fractions.'.length)}`;
  return `fr.${skillId.replace(/[^\w]+/g, '_')}`;
}

function asLevelBand(mapping) {
  if (Array.isArray(mapping?.levelBand) && mapping.levelBand.length) return mapping.levelBand;
  const set = new Set();
  if (mapping?.introducedLevel) {
    String(mapping.introducedLevel).split('/').forEach((v) => set.add(v.trim().toUpperCase()));
  }
  if (mapping?.masteryLevel) {
    String(mapping.masteryLevel).split('/').forEach((v) => set.add(v.trim().toUpperCase()));
  }
  return [...set].filter(Boolean);
}

async function connectMongoBestEffort() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    return true;
  } catch {
    return false;
  }
}

function skillLookupByFramework(universalRows = []) {
  return new Map(universalRows.map((row) => [String(row.frameworkSkillId).toUpperCase(), row]));
}

async function main() {
  const prisma = await loadPrisma();
  const mongoConnected = await connectMongoBestEffort();

  const mongoSubjects = mongoConnected
    ? await Subject.find({}).lean()
    : [];
  const mongoTopics = mongoConnected
    ? await Topic.find({}).lean()
    : [];
  const mongoSkills = mongoConnected
    ? await Skill.find({}).lean()
    : [];

  const subjectByKey = new Map(mongoSubjects.map((s) => [s.key, s]));
  const topicByName = new Map(mongoTopics.map((t) => [String(t.name || '').toLowerCase(), t]));
  const skillByFramework = new Map(
    mongoSkills
      .map((s) => [String(s?.metadata?.mathPathSkillId || s?.metadata?.frameworkCode || '').toUpperCase(), s])
      .filter(([k]) => k)
  );

  // Subject
  const mathSubject = subjectByKey.get(DEFAULT_SUBJECT_KEY);
  const pgSubject = await prisma.subjectRef.upsert({
    where: { key: DEFAULT_SUBJECT_KEY },
    update: {
      name: mathSubject?.name || 'Mathematics',
      displayOrder: Number(mathSubject?.order || 1),
      legacyMongoId: mathSubject?._id ? String(mathSubject._id) : null,
      metadata: {
        domain: DOMAIN,
        source: mathSubject ? 'mongo' : 'fallback',
      },
    },
    create: {
      key: DEFAULT_SUBJECT_KEY,
      name: mathSubject?.name || 'Mathematics',
      displayOrder: Number(mathSubject?.order || 1),
      legacyMongoId: mathSubject?._id ? String(mathSubject._id) : null,
      metadata: {
        domain: DOMAIN,
        source: mathSubject ? 'mongo' : 'fallback',
      },
    },
  });

  // Topic
  const fractionsTopic = topicByName.get('fractions');
  const pgTopic = await prisma.topicRef.upsert({
    where: { subjectId_name: { subjectId: pgSubject.id, name: 'Fractions' } },
    update: {
      moeLevel: fractionsTopic?.moeLevel || 'Primary',
      displayOrder: Number(fractionsTopic?.order || 1),
      legacyMongoId: fractionsTopic?._id ? String(fractionsTopic._id) : null,
      metadata: {
        domain: DOMAIN,
        source: fractionsTopic ? 'mongo' : 'fallback',
      },
    },
    create: {
      subjectId: pgSubject.id,
      name: 'Fractions',
      moeLevel: fractionsTopic?.moeLevel || 'Primary',
      displayOrder: Number(fractionsTopic?.order || 1),
      legacyMongoId: fractionsTopic?._id ? String(fractionsTopic._id) : null,
      metadata: {
        domain: DOMAIN,
        source: fractionsTopic ? 'mongo' : 'fallback',
      },
    },
  });

  const universalByFramework = skillLookupByFramework(fractionUniversalSkills);
  let skillsUpserted = 0;
  for (const row of fractionUniversalSkills) {
    const fw = String(row.frameworkSkillId).toUpperCase();
    const mongoSkill = skillByFramework.get(fw);
    await prisma.skillRef.upsert({
      where: { frameworkSkillId: fw },
      update: {
        universalSkillSlug: toUniversalSlug(row),
        domain: DOMAIN,
        title: row.title,
        description: row.description || '',
        pathwayOrder: Number(row.pathwayOrder || 1),
        difficultyBand: row.difficultyBand || null,
        questionTypes: row.questionTypes || [],
        mistakeTypes: row.mistakeTypes || [],
        topicId: pgTopic.id,
        legacyMongoId: mongoSkill?._id ? String(mongoSkill._id) : null,
        metadata: {
          universalSkillId: row.skillId,
          source: mongoSkill ? 'mongo+static' : 'static',
        },
      },
      create: {
        frameworkSkillId: fw,
        universalSkillSlug: toUniversalSlug(row),
        domain: DOMAIN,
        title: row.title,
        description: row.description || '',
        pathwayOrder: Number(row.pathwayOrder || 1),
        difficultyBand: row.difficultyBand || null,
        questionTypes: row.questionTypes || [],
        mistakeTypes: row.mistakeTypes || [],
        topicId: pgTopic.id,
        legacyMongoId: mongoSkill?._id ? String(mongoSkill._id) : null,
        metadata: {
          universalSkillId: row.skillId,
          source: mongoSkill ? 'mongo+static' : 'static',
        },
      },
    });
    skillsUpserted += 1;
  }

  // Prerequisites
  let prerequisiteUpserts = 0;
  for (const row of fractionUniversalSkills) {
    const pgSkill = await prisma.skillRef.findUnique({ where: { frameworkSkillId: String(row.frameworkSkillId).toUpperCase() } });
    if (!pgSkill) continue;
    for (const prereqFramework of row.prerequisites || []) {
      const pgPrereq = await prisma.skillRef.findUnique({ where: { frameworkSkillId: String(prereqFramework).toUpperCase() } });
      if (!pgPrereq) continue;
      await prisma.skillPrerequisite.upsert({
        where: {
          skillId_prerequisiteSkillId: {
            skillId: pgSkill.id,
            prerequisiteSkillId: pgPrereq.id,
          },
        },
        update: {
          relationshipType: 'required',
          legacySource: 'fractionUniversalSkills',
          metadata: { frameworkSkillId: row.frameworkSkillId, prerequisiteFrameworkSkillId: prereqFramework },
        },
        create: {
          skillId: pgSkill.id,
          prerequisiteSkillId: pgPrereq.id,
          relationshipType: 'required',
          legacySource: 'fractionUniversalSkills',
          metadata: { frameworkSkillId: row.frameworkSkillId, prerequisiteFrameworkSkillId: prereqFramework },
        },
      });
      prerequisiteUpserts += 1;
    }
  }

  // Curriculum mappings
  let mappingUpserts = 0;
  for (const mapping of fractionCurriculumMappings) {
    const fw = String(mapping.frameworkSkillId || '').toUpperCase();
    const universal = universalByFramework.get(fw);
    if (!universal) continue;
    const pgSkill = await prisma.skillRef.findUnique({ where: { frameworkSkillId: fw } });
    if (!pgSkill) continue;
    const mappingKey = `${fw}::${mapping.country}::${mapping.curriculum}::${mapping.phase}::${mapping.level || ''}::${mapping.stream || ''}::${mapping.syllabusRef || ''}`;
    await prisma.curriculumSkillMapping.upsert({
      where: { mappingKey },
      update: {
        country: mapping.country,
        curriculum: mapping.curriculum,
        subject: mapping.subject,
        phase: mapping.phase,
        stream: mapping.stream || null,
        level: mapping.level || null,
        strand: mapping.strand || null,
        subStrand: mapping.subStrand || null,
        syllabusTopic: mapping.syllabusTopic || null,
        syllabusOutcome: mapping.syllabusOutcome || null,
        introducedLevel: mapping.introducedLevel || null,
        masteryLevel: mapping.masteryLevel || null,
        levelBand: asLevelBand(mapping),
        sourceDocument: mapping.sourceDocument || null,
        syllabusRef: mapping.syllabusRef || null,
        notes: mapping.notes || null,
        metadata: {
          frameworkSkillId: fw,
          universalSkillSlug: toUniversalSlug(universal),
          title: mapping.title || universal.title,
          domain: mapping.domain || DOMAIN,
          topic: mapping.topic || 'Fractions',
        },
      },
      create: {
        mappingKey,
        skillId: pgSkill.id,
        country: mapping.country,
        curriculum: mapping.curriculum,
        subject: mapping.subject,
        phase: mapping.phase,
        stream: mapping.stream || null,
        level: mapping.level || null,
        strand: mapping.strand || null,
        subStrand: mapping.subStrand || null,
        syllabusTopic: mapping.syllabusTopic || null,
        syllabusOutcome: mapping.syllabusOutcome || null,
        introducedLevel: mapping.introducedLevel || null,
        masteryLevel: mapping.masteryLevel || null,
        levelBand: asLevelBand(mapping),
        sourceDocument: mapping.sourceDocument || null,
        syllabusRef: mapping.syllabusRef || null,
        notes: mapping.notes || null,
        metadata: {
          frameworkSkillId: fw,
          universalSkillSlug: toUniversalSlug(universal),
          title: mapping.title || universal.title,
          domain: mapping.domain || DOMAIN,
          topic: mapping.topic || 'Fractions',
        },
      },
    });
    mappingUpserts += 1;
  }

  // Question families
  let familyUpserts = 0;
  for (const family of fractionQuestionFamilies) {
    const pgSkill = await prisma.skillRef.findUnique({
      where: { frameworkSkillId: String(family.skillId).toUpperCase() },
    });
    if (!pgSkill) continue;
    const categorySupport = ['diagnostic', 'practice', 'fluency', 'assessment', 'remediation'];
    await prisma.questionFamilyRef.upsert({
      where: { questionFamilyId: family.id },
      update: {
        domain: DOMAIN,
        skillId: pgSkill.id,
        name: family.name,
        description: family.description || null,
        categorySupport,
        recommendedCount: family.recommendedQuestionCount || null,
        masteryTargetAccuracy: family.masteryTargetAccuracy || null,
        mentalMathEligible: Boolean(family.mentalMathEligible),
        workingRequired: Boolean(family.workingRequired),
        assessmentRelevant: Boolean(family.assessmentRelevant),
        metadata: {
          fluencyTargetSeconds: family.fluencyTargetSeconds || null,
          fluencyBenchmarks: family.fluencyBenchmarks || {},
          misconceptionTags: family.misconceptionTags || [],
        },
      },
      create: {
        questionFamilyId: family.id,
        domain: DOMAIN,
        skillId: pgSkill.id,
        name: family.name,
        description: family.description || null,
        categorySupport,
        recommendedCount: family.recommendedQuestionCount || null,
        masteryTargetAccuracy: family.masteryTargetAccuracy || null,
        mentalMathEligible: Boolean(family.mentalMathEligible),
        workingRequired: Boolean(family.workingRequired),
        assessmentRelevant: Boolean(family.assessmentRelevant),
        metadata: {
          fluencyTargetSeconds: family.fluencyTargetSeconds || null,
          fluencyBenchmarks: family.fluencyBenchmarks || {},
          misconceptionTags: family.misconceptionTags || [],
        },
      },
    });
    familyUpserts += 1;
  }

  const totals = {
    mongoConnected,
    subjects: await prisma.subjectRef.count(),
    topics: await prisma.topicRef.count(),
    skills: await prisma.skillRef.count(),
    mappings: await prisma.curriculumSkillMapping.count(),
    prerequisites: await prisma.skillPrerequisite.count(),
    questionFamilies: await prisma.questionFamilyRef.count(),
    upserts: {
      skillsUpserted,
      mappingUpserts,
      prerequisiteUpserts,
      familyUpserts,
    },
  };

  console.log(JSON.stringify(totals, null, 2));
}

main()
  .catch((error) => {
    console.error('Phase 1 backfill failed:', error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch {
      // noop
    }
    try {
      const { prisma } = await import('../../services/db/prismaClient.js');
      await prisma.$disconnect();
    } catch {
      // noop
    }
  });
