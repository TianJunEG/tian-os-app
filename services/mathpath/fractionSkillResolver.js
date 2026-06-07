import fractionsDomain from '../../scripts/domains/fractions.js';
import {
  fractionUniversalSkills,
  getUniversalSkillByFrameworkId,
} from '../../frontend/src/mathpath/curriculum/fractionUniversalSkills.js';

const LEGACY_ALIASES = {
  F001: ['fr.meaning.parts'],
  F002: ['fr.meaning.num-den'],
  F003: ['fr.meaning.unit', 'fr.meaning.whole'],
  F004: ['fr.meaning.whole'],
  F005: ['fr.meaning.number-line'],
  F006: ['fr.compare.unit'],
  F007: ['fr.equivalent', 'fr.compare.same-denom'],
  F008: ['fr.equivalent.generate'],
  F009: ['fr.simplify'],
  F010: ['fr.simplify'],
  F011: ['fr.compare.same-denom'],
  F012: ['fr.compare.same-num'],
  F013: ['fr.equivalent', 'fr.compare.same-denom'],
  F014: ['fr.order'],
  F015: ['fr.add.same-denom'],
  F016: ['fr.sub.like'],
  F017: ['fr.add.unlike'],
  F018: ['fr.sub.unlike', 'fr.add.unlike'],
  F019: ['fr.mixed-improper'],
  F020: ['fr.mixed-proper'],
  F021: ['fr.mixed-convert'],
  F022: ['fr.mixed-convert', 'fr.add.unlike', 'fr.sub.unlike'],
  F023: ['fr.of-quantity', 'fr.word-problems'],
  F024: ['fr.word-multi-step'],
  F025: ['fr.exam-applications', 'fr.word-problems'],
  F026: ['fr.mastery-challenge', 'fr.word-multi-step'],
};

function toKey(v) {
  return String(v || '').trim();
}

function upper(v) {
  return toKey(v).toUpperCase();
}

const byFramework = new Map();
const bySlug = new Map();

for (const row of fractionUniversalSkills) {
  const f = upper(row.frameworkSkillId);
  if (!f) continue;
  const existing = byFramework.get(f) || {
    frameworkSkillId: f,
    universalSkillSlug: '',
    domainSkillSlug: '',
    aliases: new Set(),
  };
  existing.universalSkillSlug = row.skillId || existing.universalSkillSlug;
  if (Array.isArray(row.aliases)) {
    row.aliases.forEach((alias) => {
      if (alias) existing.aliases.add(alias);
    });
  }
  byFramework.set(f, existing);
}

for (const row of fractionsDomain.skills || []) {
  const f = upper(row.frameworkCode || row.mathPathSkillId || '');
  if (!f) continue;
  const existing = byFramework.get(f) || {
    frameworkSkillId: f,
    universalSkillSlug: '',
    domainSkillSlug: '',
    aliases: new Set(),
  };
  existing.domainSkillSlug = row.slug || existing.domainSkillSlug;
  if (row.slug) existing.aliases.add(row.slug);
  byFramework.set(f, existing);
}

for (const [f, aliases] of Object.entries(LEGACY_ALIASES)) {
  const entry = byFramework.get(upper(f));
  if (!entry) continue;
  for (const alias of aliases || []) {
    if (alias) entry.aliases.add(alias);
  }
}

for (const [f, entry] of byFramework.entries()) {
  const universal = entry.universalSkillSlug;
  const domain = entry.domainSkillSlug;
  const aliases = Array.from(entry.aliases || []);
  const tokens = [f, universal, domain, ...aliases].filter(Boolean);
  for (const token of tokens) {
    bySlug.set(token, f);
  }
}

export function resolveFractionSkillId(value) {
  const raw = toKey(value);
  if (!raw) return null;
  const byDirect = byFramework.get(upper(raw));
  if (byDirect) return byDirect.frameworkSkillId;
  return bySlug.get(raw) || bySlug.get(raw.toLowerCase()) || null;
}

export function getFractionSkillRecordByFrameworkId(frameworkSkillId) {
  const f = resolveFractionSkillId(frameworkSkillId);
  if (!f) return null;
  const row = byFramework.get(f);
  if (!row) return null;
  const universal = getUniversalSkillByFrameworkId(f);
  return {
    frameworkSkillId: f,
    universalSkillSlug: universal?.skillId || row.universalSkillSlug || '',
    domainSkillSlug: row.domainSkillSlug || '',
    aliases: Array.from(row.aliases || []),
  };
}

export function getFractionSkillRecordByAnyId(value) {
  const frameworkSkillId = resolveFractionSkillId(value);
  return frameworkSkillId ? getFractionSkillRecordByFrameworkId(frameworkSkillId) : null;
}

export function getCanonicalFractionSkillLinks(frameworkSkillId) {
  const row = getFractionSkillRecordByFrameworkId(frameworkSkillId);
  if (!row) return null;
  return {
    frameworkSkillId: row.frameworkSkillId,
    officialSkillCode: row.frameworkSkillId,
    universalSkillSlug: row.universalSkillSlug || '',
    domainSkillSlug: row.domainSkillSlug || '',
    allKnownSlugs: Array.from(new Set([row.universalSkillSlug, row.domainSkillSlug, ...(row.aliases || [])].filter(Boolean))),
  };
}

export function getFrameworkSkillIdFromQuestion(question = {}) {
  const direct = resolveFractionSkillId(
    question.frameworkSkillId ||
    question.officialSkillCode ||
    question.universalSkillSlug ||
    question.skillId
  );
  if (direct) return direct;
  return null;
}

export function getAllFractionSkillMappings() {
  return Array.from(byFramework.values()).map((row) => getCanonicalFractionSkillLinks(row.frameworkSkillId));
}

export function validateFractionSkillResolver() {
  const required = ['F025', 'F026'];
  const missing = required.filter((f) => !getFractionSkillRecordByFrameworkId(f));
  const checks = {
    F025_from_framework: resolveFractionSkillId('F025') === 'F025',
    F026_from_framework: resolveFractionSkillId('F026') === 'F026',
    F025_from_domain_slug: resolveFractionSkillId('fr.exam-applications') === 'F025',
    F026_from_domain_slug: resolveFractionSkillId('fr.mastery-challenge') === 'F026',
    F025_from_universal_slug: resolveFractionSkillId(getUniversalSkillByFrameworkId('F025')?.skillId) === 'F025',
    F026_from_universal_slug: resolveFractionSkillId(getUniversalSkillByFrameworkId('F026')?.skillId) === 'F026',
  };
  return {
    valid: missing.length === 0 && Object.values(checks).every(Boolean),
    missing,
    checks,
  };
}

export default {
  resolveFractionSkillId,
  getFractionSkillRecordByFrameworkId,
  getFractionSkillRecordByAnyId,
  getCanonicalFractionSkillLinks,
  getFrameworkSkillIdFromQuestion,
  getAllFractionSkillMappings,
  validateFractionSkillResolver,
};
