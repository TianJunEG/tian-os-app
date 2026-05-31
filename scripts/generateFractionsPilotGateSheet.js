import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import fractionsDomain from './domains/fractions.js';
import { getQuestionFamiliesBySkill } from '../frontend/src/mathpath/fractions/fractionQuestionFamilies.js';
import { fractionCurriculumMappings } from '../frontend/src/mathpath/curriculum/fractionCurriculumMappings.js';

dotenv.config();

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs/mathpath/pilot/logs');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const OUT_PATH = path.join(OUT_DIR, `fractions-skill-gate-sheet-${stamp}.md`);

const URI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';

const BASELINE = {
  total: 12,
  families: 3,
  practice: 4,
  remediation: 2,
  worksheet: 2,
};

const PRIORITY_STRONG = {
  F001: { total: 18, families: 5 },
  F002: { total: 18, families: 5 },
  F011: { total: 18, families: 5 },
  F012: { total: 18, families: 5 },
  F015: { total: 18, families: 5 },
  F018: { total: 18, families: 6 },
  F023: { total: 18, families: 6 },
};

const SEC1_MAPPED = new Set(['F010', 'F013', 'F014', 'F017', 'F018', 'F021', 'F022', 'F023', 'F025', 'F026']);

function domainFrameworkSkills() {
  return (fractionsDomain.skills || [])
    .map((s) => ({
      frameworkSkillId: s.frameworkCode,
      skillName: s.mathPathSkillName || s.name,
      slug: s.slug,
    }))
    .filter((s) => s.frameworkSkillId);
}

function verdictFor(row) {
  if (row.total === 0) return 'MISSING';
  const strong = PRIORITY_STRONG[row.skillId] || {};
  const totalNeed = strong.total || BASELINE.total;
  const familyNeed = strong.families || BASELINE.families;
  const passBaseline =
    row.total >= totalNeed &&
    row.familyCount >= familyNeed &&
    row.practice >= BASELINE.practice &&
    row.remediation >= BASELINE.remediation &&
    row.worksheet >= BASELINE.worksheet;
  if (passBaseline) return 'READY';
  const partialCore = row.total >= BASELINE.total && row.familyCount >= BASELINE.families;
  if (partialCore) return 'PARTIAL';
  return 'SHALLOW';
}

function countByCategory(questions, category) {
  return questions.filter((q) => String(q.questionCategory || '').toLowerCase() === category).length;
}

async function main() {
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 10000 });
  try {
    const skills = domainFrameworkSkills();
    const slugs = skills.map((s) => s.slug);
    const dbSkills = await Skill.find({
      $or: [{ slug: { $in: slugs } }, { 'metadata.mathPathSkillId': { $in: skills.map((s) => s.frameworkSkillId) } }],
    }).lean();

    const byFramework = new Map();
    for (const row of skills) {
      const hits = dbSkills.filter(
        (s) => s.slug === row.slug || String(s?.metadata?.mathPathSkillId || '').toUpperCase() === row.frameworkSkillId
      );
      byFramework.set(row.frameworkSkillId, hits);
    }

    const dbSkillIds = [...new Set(dbSkills.map((s) => String(s._id)))];
    const questions = dbSkillIds.length ? await Question.find({ skillId: { $in: dbSkillIds } }).lean() : [];

    const perSkill = [];
    for (const skill of skills) {
      const dbRows = byFramework.get(skill.frameworkSkillId) || [];
      const idSet = new Set(dbRows.map((s) => String(s._id)));
      const rows = questions.filter((q) => idSet.has(String(q.skillId)));
      const families = getQuestionFamiliesBySkill(skill.frameworkSkillId);
      const familyIdsPresent = new Set(rows.map((q) => String(q.questionFamilyId || '').trim()).filter(Boolean));
      const familyCount = familyIdsPresent.size || families.length;
      const practice = countByCategory(rows, 'practice');
      const remediation = countByCategory(rows, 'remediation');
      const diagnostic = countByCategory(rows, 'diagnostic');
      const worksheet = rows.filter((q) => q.worksheetCompatible !== false).length;
      const answerCheck = rows.filter((q) => String(q.answer || '').trim().length > 0).length;
      const metadataCoverage = rows.filter(
        (q) => String(q.questionCategory || '').trim() && String(q.questionFamilyId || '').trim()
      ).length;
      const sec1Mappings = fractionCurriculumMappings.filter(
        (m) =>
          m.curriculum === 'MOE_SECONDARY_G1_MATH_2021' &&
          m.frameworkSkillId === skill.frameworkSkillId
      );
      const sec1RefSet = [...new Set(sec1Mappings.map((m) => m.syllabusRef).filter(Boolean))];
      perSkill.push({
        skillId: skill.frameworkSkillId,
        skillName: skill.skillName,
        total: rows.length,
        familyCount,
        diagnostic,
        practice,
        remediation,
        worksheet,
        answerCheck,
        metadataCoverage,
        sec1CompatibleCount: SEC1_MAPPED.has(skill.frameworkSkillId) ? rows.length : 0,
        sec1Refs: sec1RefSet,
      });
    }

    perSkill.forEach((r) => {
      r.verdict = verdictFor(r);
      const strong = PRIORITY_STRONG[r.skillId] || {};
      const totalNeed = strong.total || BASELINE.total;
      const familyNeed = strong.families || BASELINE.families;
      const misses = [];
      if (r.total < totalNeed) misses.push(`total<${totalNeed}`);
      if (r.familyCount < familyNeed) misses.push(`families<${familyNeed}`);
      if (r.practice < BASELINE.practice) misses.push(`practice<${BASELINE.practice}`);
      if (r.remediation < BASELINE.remediation) misses.push(`remediation<${BASELINE.remediation}`);
      if (r.worksheet < BASELINE.worksheet) misses.push(`worksheet<${BASELINE.worksheet}`);
      r.gaps = misses;
    });

    const counts = perSkill.reduce((acc, r) => {
      acc[r.verdict] = (acc[r.verdict] || 0) + 1;
      return acc;
    }, {});

    const below = perSkill.filter((r) => r.verdict !== 'READY');

    await fs.mkdir(OUT_DIR, { recursive: true });
    const lines = [
      '# Fractions Strict Skill Gate Sheet',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Thresholds',
      `- Baseline: total>=${BASELINE.total}, families>=${BASELINE.families}, practice>=${BASELINE.practice}, remediation>=${BASELINE.remediation}, worksheet>=${BASELINE.worksheet}`,
      '- Priority strong: F001/F002/F011/F012/F015 total>=18 families>=5; F018/F023 total>=18 families>=6',
      '',
      '| Skill | Name | Total | Families | Diagnostic | Practice | Remediation | Worksheet | Sec1-Compatible | Verdict | Gaps |',
      '|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|',
      ...perSkill.map((r) => `| ${r.skillId} | ${r.skillName} | ${r.total} | ${r.familyCount} | ${r.diagnostic} | ${r.practice} | ${r.remediation} | ${r.worksheet} | ${r.sec1CompatibleCount} | ${r.verdict} | ${r.gaps.join(', ') || '—'} |`),
      '',
      '## Verdict Summary',
      `- READY: ${counts.READY || 0}`,
      `- PARTIAL: ${counts.PARTIAL || 0}`,
      `- SHALLOW: ${counts.SHALLOW || 0}`,
      `- MISSING: ${counts.MISSING || 0}`,
      `- BLOCKED: 0`,
      '',
      '## Skills Below Threshold',
      ...(below.length
        ? below.map((r) => `- ${r.skillId} ${r.skillName}: ${r.gaps.join(', ')}`)
        : ['- None']),
      '',
      '## Sec 1 G1 Mapping Coverage',
      ...perSkill
        .filter((r) => SEC1_MAPPED.has(r.skillId))
        .map((r) => `- ${r.skillId}: refs=${r.sec1Refs.join(', ') || '—'}; seeded=${r.sec1CompatibleCount}`),
      '',
      '## Metadata Integrity Snapshot',
      `- Questions with answer-check field (non-empty answer): ${perSkill.reduce((n, r) => n + r.answerCheck, 0)}`,
      `- Questions with both questionCategory and questionFamilyId: ${perSkill.reduce((n, r) => n + r.metadataCoverage, 0)}`,
      '',
    ];

    await fs.writeFile(OUT_PATH, lines.join('\n'), 'utf8');

    console.log(
      JSON.stringify(
        {
          outPath: OUT_PATH,
          summary: {
            READY: counts.READY || 0,
            PARTIAL: counts.PARTIAL || 0,
            SHALLOW: counts.SHALLOW || 0,
            MISSING: counts.MISSING || 0,
          },
          skillsBelowThreshold: below.map((r) => ({ skillId: r.skillId, gaps: r.gaps })),
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('Failed to generate strict gate sheet:', err?.message || err);
  process.exit(1);
});

