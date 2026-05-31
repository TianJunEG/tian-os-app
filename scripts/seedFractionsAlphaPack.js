import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import GeneratedQuestion from '../models/mathpath/GeneratedQuestion.js';
import fractionsDomain from './domains/fractions.js';
import { seedDomain } from './seedDomain.js';
import {
  generateQuestionsForSkill,
  getCoverageBySkill,
  validateGeneratedQuestion,
} from '../services/mathpath/fractionContentGenerationEngine.js';
import { getCanonicalFractionSkillLinks } from '../services/mathpath/fractionSkillResolver.js';

dotenv.config();

const LOCAL_URI = process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';
const URI = process.env.MONGODB_URI || LOCAL_URI;
const DOMAIN_ID = 'fractions';
const SOURCE = 'generated';
const SOURCE_REF = process.env.MATHPATH_SOURCE_REF || 'fractions-alpha-pack-v1';

const DEFAULT_PRIORITY_SKILLS = Array.from({ length: 26 }, (_, i) => `F${String(i + 1).padStart(3, '0')}`);
const PRIORITY_SKILLS = (process.env.MATHPATH_SKILLS
  ? process.env.MATHPATH_SKILLS.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
  : DEFAULT_PRIORITY_SKILLS);

const LEGACY_SKILL_SLUG_FALLBACKS = {
  F001: ['fr.meaning.parts'],
  F002: ['fr.meaning.num-den'],
  F003: ['fr.meaning.whole'],
  F004: ['fr.meaning.unit'],
  F005: ['fr.meaning.number-line'],
  F006: ['fr.compare.unit'],
  F007: ['fr.compare.same-denom'],
  F008: ['fr.compare.same-num'],
  F009: ['fr.order'],
  F010: ['fr.equivalent'],
  F011: ['fr.equivalent.generate', 'fr.equivalent'],
  F012: ['fr.simplify'],
  F013: ['fr.mixed-improper'],
  F014: ['fr.mixed-proper', 'fr.mixed-improper'],
  F015: ['fr.mixed-convert', 'fr.mixed-proper', 'fr.mixed-improper'],
  F016: ['fr.add.same-denom', 'fr.add.like'],
  F017: ['fr.sub.like', 'fr.add.like'],
  F018: ['fr.add.unlike'],
  F019: ['fr.sub.unlike', 'fr.add.unlike'],
  F020: ['fr.of-quantity'],
  F021: ['fr.mult.fraction'],
  F022: ['fr.div.fraction'],
  F023: ['fr.word-problems'],
  F024: ['fr.word-multi-step', 'fr.word-problems'],
  F025: ['fr.exam-applications', 'fr.word-multi-step'],
  F026: ['fr.mastery-challenge', 'fr.exam-applications'],
};

const ALPHA_TARGETS = {
  diagnostic: 10,
  practice: 30,
  fluency: 15,
  assessment: 10,
  remediation: 3,
  challenge: 0,
};

const REQUIRED_TOTAL = 65;

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function slugForSkillId(skillId) {
  const row = (fractionsDomain.skills || []).find((s) => s.frameworkCode === skillId);
  return row?.slug || null;
}

function difficultyToQuestionDifficulty(level = 3, category = 'practice') {
  if (category === 'fluency') return 'easy';
  if (level <= 2) return 'easy';
  if (level === 3) return 'medium';
  return 'hard';
}

function visualFromPrompt(prompt = '') {
  const lower = String(prompt).toLowerCase();
  if (!lower.includes('table')) return undefined;
  return {
    type: 'table',
    version: 'v1',
    alt: 'Table-based fraction question',
    payload: { headers: ['Value'], rows: [['See prompt']] },
  };
}

function makeQuestionFingerprint(dbSkillId, question) {
  return crypto
    .createHash('sha256')
    .update([
      DOMAIN_ID,
      dbSkillId,
      question.questionCategory,
      question.questionFamilyId,
      String(question.prompt || '').trim().toLowerCase(),
      String(question.finalAnswer || '').trim().toLowerCase(),
    ].join('|'))
    .digest('hex');
}

function toQuestionDoc({ mathSubjectId, dbSkill, generated }) {
  const misconceptionTags = Array.isArray(generated.misconceptionTags) ? generated.misconceptionTags : [];
  const misconceptionTag = misconceptionTags[0] || 'M010';
  const acceptedAnswers = Array.isArray(generated.acceptedAnswers) ? generated.acceptedAnswers : [];
  const stem = String(generated.prompt || '').trim();
  const answer = String(generated.finalAnswer || acceptedAnswers[0] || '').trim();
  const workedSolution = (generated.solutionSteps || []).join(' ');
  const safeVisual = visualFromPrompt(stem);

  const links = getCanonicalFractionSkillLinks(generated.skillId);
  const doc = {
    subjectId: mathSubjectId,
    topicId: dbSkill.topicId,
    skillId: dbSkill._id,
    frameworkSkillId: links?.frameworkSkillId || generated.skillId || '',
    officialSkillCode: links?.officialSkillCode || generated.skillId || '',
    universalSkillSlug: links?.universalSkillSlug || '',
    moeLevel: dbSkill.moeLevel || '',
    difficulty: difficultyToQuestionDifficulty(generated.difficultyLevel, generated.questionCategory),
    type: 'short_answer',
    stem,
    choices: [],
    answer,
    workedSolution,
    explanation: generated.explanation || workedSolution,
    commonMistakes: misconceptionTags,
    misconceptionTag,
    questionFamilyId: generated.questionFamilyId || '',
    questionCategory: generated.questionCategory || '',
    worksheetCompatible: generated.questionCategory !== 'fluency',
    source: SOURCE,
    sourceRef: `${SOURCE_REF}:${generated.questionCategory}`,
  };
  if (safeVisual) doc.visual = safeVisual;
  return doc;
}

function summarizeSkill(row = {}) {
  const combined = row.combinedCoverage || {};
  const diagnostic = toNum(combined.diagnosticQuestions, 0);
  const practice = toNum(combined.practiceQuestions, 0);
  const fluency = toNum(combined.fluencyQuestions, 0);
  const assessment = toNum(combined.assessmentQuestions, 0);
  const total = toNum(combined.totalQuestions, 0);
  const alphaReady =
    diagnostic >= ALPHA_TARGETS.diagnostic &&
    practice >= ALPHA_TARGETS.practice &&
    fluency >= ALPHA_TARGETS.fluency &&
    assessment >= ALPHA_TARGETS.assessment &&
    total >= REQUIRED_TOTAL;
  return {
    skillId: row.skillId,
    skillName: row.skillName,
    diagnostic,
    practice,
    fluency,
    assessment,
    total,
    pilotReady: alphaReady,
    missing: row.missingContent || {},
  };
}

async function summarizeAlphaCoverageByPrioritySkills() {
  const rows = await GeneratedQuestion.aggregate([
    {
      $match: {
        domainId: DOMAIN_ID,
        isActive: true,
        skillId: { $in: PRIORITY_SKILLS },
        questionCategory: { $in: ['diagnostic', 'practice', 'fluency', 'assessment'] },
      },
    },
    {
      $group: {
        _id: { skillId: '$skillId', category: '$questionCategory' },
        count: { $sum: 1 },
      },
    },
  ]);

  const out = PRIORITY_SKILLS.map((skillId) => ({
    skillId,
    diagnostic: 0,
    practice: 0,
    fluency: 0,
    assessment: 0,
    total: 0,
    alphaReady: false,
    remaining: {
      diagnostic: ALPHA_TARGETS.diagnostic,
      practice: ALPHA_TARGETS.practice,
      fluency: ALPHA_TARGETS.fluency,
      assessment: ALPHA_TARGETS.assessment,
      total: REQUIRED_TOTAL,
    },
  }));

  const bySkill = new Map(out.map((r) => [r.skillId, r]));
  rows.forEach((r) => {
    const skillId = r?._id?.skillId;
    const category = r?._id?.category;
    const count = toNum(r?.count, 0);
    const row = bySkill.get(skillId);
    if (!row || row[category] === undefined) return;
    if (row[category] !== undefined) row[category] = count;
  });

  out.forEach((row) => {
    row.total = row.diagnostic + row.practice + row.fluency + row.assessment;
    row.remaining = {
      diagnostic: Math.max(0, ALPHA_TARGETS.diagnostic - row.diagnostic),
      practice: Math.max(0, ALPHA_TARGETS.practice - row.practice),
      fluency: Math.max(0, ALPHA_TARGETS.fluency - row.fluency),
      assessment: Math.max(0, ALPHA_TARGETS.assessment - row.assessment),
      total: Math.max(0, REQUIRED_TOTAL - row.total),
    };
    row.alphaReady =
      row.diagnostic >= ALPHA_TARGETS.diagnostic &&
      row.practice >= ALPHA_TARGETS.practice &&
      row.fluency >= ALPHA_TARGETS.fluency &&
      row.assessment >= ALPHA_TARGETS.assessment &&
      row.total >= REQUIRED_TOTAL;
  });

  return out;
}

function buildMarkdownReport({ generatedBySkill = [], before = [], after = [] }) {
  const beforeMap = new Map(before.map((r) => [r.skillId, r]));
  const afterMap = new Map(after.map((r) => [r.skillId, r]));
  const now = new Date().toISOString();

  const header = [
    '# Fractions Alpha Content Pack Report',
    '',
    `Generated: ${now}`,
    `Scope: ${PRIORITY_SKILLS.join(', ')}`,
    '',
    '## Targets Per Priority Skill',
    '',
    '- Diagnostic: 10',
    '- Practice: 30',
    '- Fluency: 15',
    '- Assessment: 10',
    '- Total: 65',
    '',
    '## Questions Generated by Skill',
    '',
    '| Skill ID | Generated |',
    '|---|---:|',
  ];

  const generatedRows = generatedBySkill.map((row) => `| ${row.skillId} | ${row.generated} |`);

  const coverageHeader = [
    '',
    '## Coverage Improvement (Before vs After)',
    '',
    '| Skill ID | Before Total | After Total | Before Status | After Status |',
    '|---|---:|---:|---|---|',
  ];

  const coverageRows = PRIORITY_SKILLS.map((skillId) => {
    const b = beforeMap.get(skillId) || { total: 0, pilotReady: false };
    const a = afterMap.get(skillId) || { total: 0, pilotReady: false };
    return `| ${skillId} | ${b.total || 0} | ${a.total || 0} | ${b.pilotReady ? 'ready' : 'not-ready'} | ${a.pilotReady ? 'ready' : 'not-ready'} |`;
  });

  const remainingHeader = [
    '',
    '## Remaining Content Gaps',
    '',
    '| Skill ID | Missing Diagnostic | Missing Practice | Missing Fluency | Missing Assessment | Missing Total |',
    '|---|---:|---:|---:|---:|---:|',
  ];

  const remainingRows = PRIORITY_SKILLS.map((skillId) => {
    const a = afterMap.get(skillId) || { missing: {} };
    const m = a.missing || {};
    return `| ${skillId} | ${toNum(m.diagnostic, 0)} | ${toNum(m.practice, 0)} | ${toNum(m.fluency, 0)} | ${toNum(m.assessment, 0)} | ${toNum(m.total, 0)} |`;
  });

  const notReady = PRIORITY_SKILLS.filter((skillId) => !(afterMap.get(skillId)?.pilotReady));
  const tail = [
    '',
    '## Skills Still Not Ready',
    '',
    notReady.length ? `- ${notReady.join(', ')}` : '- None',
    '',
    '## Recommended Next Content Batch',
    '',
    '- Add additional non-duplicate assessment-style questions for any remaining not-ready skills.',
    '- Expand F023 word-problem context variants (single-step, multi-step, remainder, comparison) where gaps remain.',
    '- Increase fluency density for operation-heavy skills where speed-target sets are still below target.',
  ];

  return [
    ...header,
    ...generatedRows,
    ...coverageHeader,
    ...coverageRows,
    ...remainingHeader,
    ...remainingRows,
    ...tail,
    '',
  ].join('\n');
}

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
    const math = await Subject.findOne({ key: 'math' });
    if (!math) throw new Error('Math subject not found. Run foundation seed first.');
    await seedDomain(fractionsDomain, { subjectId: math._id });

    const allCandidateSlugs = Array.from(new Set(
      PRIORITY_SKILLS.flatMap((skillId) => {
        const links = getCanonicalFractionSkillLinks(skillId);
        const canonical = slugForSkillId(skillId);
        const fallbacks = LEGACY_SKILL_SLUG_FALLBACKS[skillId] || [];
        return [links?.domainSkillSlug, links?.universalSkillSlug, canonical, ...fallbacks].filter(Boolean);
      })
    ));
    const dbSkills = await Skill.find({
      slug: { $in: allCandidateSlugs },
    }).lean();
    const bySlug = new Map(dbSkills.map((s) => [s.slug, s]));

    const missingSkillMappings = [];
    const targetSkillRows = PRIORITY_SKILLS.map((skillId) => {
      const links = getCanonicalFractionSkillLinks(skillId);
      const canonical = slugForSkillId(skillId);
      const fallbacks = LEGACY_SKILL_SLUG_FALLBACKS[skillId] || [];
      const candidateSlugs = [links?.domainSkillSlug, links?.universalSkillSlug, canonical, ...fallbacks].filter(Boolean);
      const dbSkill = candidateSlugs.map((s) => bySlug.get(s)).find(Boolean) || null;
      if (!dbSkill) missingSkillMappings.push({ skillId, slug: canonical || '' });
      return { skillId, slug: canonical, dbSkill, candidateSlugs };
    }).filter((r) => r.dbSkill);

    const beforeCoverage = (await getCoverageBySkill({ domainId: DOMAIN_ID, connectIfNeeded: false }))
      .map(summarizeSkill)
      .filter((row) => PRIORITY_SKILLS.includes(row.skillId));

    const generatedBySkill = [];
    const generatedDocs = [];
    const questionDocs = [];
    const seenQuestionFingerprint = new Set();
    const validationErrors = [];

    for (const row of targetSkillRows) {
      const skillId = row.skillId;
      const generated = generateQuestionsForSkill(skillId, {
        targetByCategory: ALPHA_TARGETS,
        categories: ['diagnostic', 'practice', 'fluency', 'assessment', 'remediation'],
      });

      const valid = [];
      for (const item of generated) {
        const check = validateGeneratedQuestion(item);
        if (!check.isValid) {
          validationErrors.push({ skillId, questionFamilyId: item.questionFamilyId, errors: check.errors });
          continue;
        }
        valid.push(item);
      }

      generatedBySkill.push({ skillId, generated: valid.length });
      for (const item of valid) {
        generatedDocs.push(item);

        const qFingerprint = makeQuestionFingerprint(String(row.dbSkill._id), item);
        if (seenQuestionFingerprint.has(qFingerprint)) continue;
        seenQuestionFingerprint.add(qFingerprint);

        questionDocs.push(toQuestionDoc({ mathSubjectId: math._id, dbSkill: row.dbSkill, generated: item }));
      }
    }

    // Idempotent refresh for this alpha pack in Question collection.
    await Question.deleteMany({
      source: SOURCE,
      sourceRef: new RegExp(`^${SOURCE_REF}:`),
      skillId: { $in: targetSkillRows.map((r) => r.dbSkill._id) },
    });
    if (questionDocs.length) await Question.insertMany(questionDocs, { ordered: false });

    // Upsert generated canonical records (fingerprint-unique) and keep only active current pack items.
    if (generatedDocs.length) {
      const ops = generatedDocs.map((doc) => ({
        updateOne: {
          filter: { domainId: DOMAIN_ID, fingerprint: doc.fingerprint },
          update: {
            $set: {
              ...doc,
              domainId: DOMAIN_ID,
              isActive: true,
              metadata: { ...(doc.metadata || {}), sourceRef: SOURCE_REF },
            },
          },
          upsert: true,
        },
      }));
      await GeneratedQuestion.bulkWrite(ops, { ordered: false });
    }

    const afterCoverage = (await getCoverageBySkill({ domainId: DOMAIN_ID, connectIfNeeded: false }))
      .map(summarizeSkill)
      .filter((row) => PRIORITY_SKILLS.includes(row.skillId));
    const alphaCoverage = await summarizeAlphaCoverageByPrioritySkills();

    const reportPath = path.resolve(process.env.MATHPATH_REPORT_PATH || 'docs/mathpath/Fractions_Alpha_Content_Pack_Report.md');
    const markdown = buildMarkdownReport({
      generatedBySkill,
      before: beforeCoverage,
      after: afterCoverage,
    });
    await fs.writeFile(reportPath, markdown, 'utf8');

    const notReady = alphaCoverage.filter((row) => !row.alphaReady).map((row) => row.skillId);
    const below65 = alphaCoverage.filter((row) => row.total < REQUIRED_TOTAL).map((row) => `${row.skillId}(${row.total})`);

    console.log('✅ Fractions alpha content pack seeded');
    console.log(JSON.stringify({
      mongoUriUsed: connectedUri,
      sourceRef: SOURCE_REF,
      prioritySkills: PRIORITY_SKILLS,
      targets: ALPHA_TARGETS,
      generatedBySkill,
      insertedQuestionDocs: questionDocs.length,
      generatedCanonicalDocs: generatedDocs.length,
      validationErrors: validationErrors.length,
      missingSkillMappings,
      alphaCoverage,
      skillsStillNotReady: notReady,
      skillsBelow65: below65,
      reportPath,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((error) => {
    console.error('❌ Fractions alpha content pack failed');
    console.error(error);
    process.exit(1);
  });
}
