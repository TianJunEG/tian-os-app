import fs from 'fs/promises';
import path from 'path';
import { fractionSkillGraph } from '../frontend/src/mathpath/fractions/fractionSkillGraph.js';
import { getQuestionFamiliesBySkill } from '../frontend/src/mathpath/fractions/fractionQuestionFamilies.js';
import {
  checkFractionAnswer,
  generateFractionQuestion,
  validateFractionQuestionGenerator,
} from '../frontend/src/mathpath/fractions/fractionQuestionGenerator.js';

const DEFAULT_MODES = ['diagnostic', 'practice', 'remediation', 'assessment'];
const DEFAULT_VARIANTS = 12;
const DEFAULT_OUT = 'docs/mathpath/Fractions_Question_Quality_Audit.md';

function argValue(name, fallback = '') {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function hasBadDenominator(value) {
  if (Array.isArray(value)) return value.some(hasBadDenominator);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => {
    if (key === 'denominator') {
      const denominator = Number(child);
      return !Number.isFinite(denominator) || denominator <= 0;
    }
    return hasBadDenominator(child);
  });
}

function hasPrimaryLevel(question = {}) {
  const mappings = question.singaporeMetadata?.mappings || [];
  return mappings.some((mapping) => /^P[1-6]$/i.test(String(mapping.level || mapping.masteryLevel || mapping.introducedLevel || '')));
}

function hasNegativeFraction(text = '') {
  return /-\d+\s*\/\s*\d+/.test(String(text || '')) || /\(\s*-\d+\s*\/\s*\d+\s*\)/.test(String(text || ''));
}

function requiresVisual(prompt = '') {
  return /\b(number line|shape|shaded|bar|strip|area model|diagram|graph)\b/i.test(String(prompt || ''));
}

function checkOrderingAlreadySorted(question = {}) {
  if (question.answer?.type !== 'list') return false;
  const match = String(question.prompt || '').match(/largest:\s*(.+)\./i);
  if (!match) return false;
  const shown = match[1].split(',').map((part) => part.trim()).join(', ');
  const sorted = String(question.answer?.display || '').trim();
  return Boolean(shown && sorted && shown === sorted);
}

function answerForCheck(question = {}) {
  return question.answer?.display
    ?? question.answer?.value
    ?? question.acceptedAnswers?.[0]
    ?? '';
}

function generatedItemSignature(question = {}) {
  return [
    String(question.prompt || '').trim(),
    String(answerForCheck(question)).trim(),
    JSON.stringify(question.diagramSpec || question.visual || null),
  ].join('|');
}

function addIssue(list, issue) {
  list.push({
    severity: issue.severity || 'fail',
    type: issue.type,
    skillId: issue.skillId,
    familyId: issue.familyId,
    mode: issue.mode,
    variant: issue.variant,
    prompt: issue.prompt,
    detail: issue.detail || '',
  });
}

export function runFractionsQuestionQualityAudit(options = {}) {
  const variantCount = Number(options.variantCount || DEFAULT_VARIANTS);
  const modes = options.modes?.length ? options.modes : DEFAULT_MODES;
  const generated = [];
  const issues = [];
  const generatedItemSignatures = new Map();

  for (const skillId of fractionSkillGraph.skillIds) {
    for (const family of getQuestionFamiliesBySkill(skillId)) {
      for (const mode of modes) {
        for (let variant = 0; variant < variantCount; variant += 1) {
          let question;
          try {
            question = generateFractionQuestion({
              skillId,
              questionFamilyId: family.id,
              mode,
              difficulty: family.difficulty || 2,
              variant,
            });
          } catch (err) {
            addIssue(issues, {
              type: 'generation_throw',
              skillId,
              familyId: family.id,
              mode,
              variant,
              detail: err?.message || String(err),
            });
            continue;
          }

          generated.push(question);
          const prompt = String(question.prompt || '');
          const signatureKey = `${skillId}|${family.id}|${mode}|${generatedItemSignature(question)}`;
          const firstSeen = generatedItemSignatures.get(signatureKey);
          if (firstSeen) {
            addIssue(issues, {
              severity: 'warn',
              type: 'repeated_generated_item',
              skillId,
              familyId: family.id,
              mode,
              variant,
              prompt,
              detail: `Same prompt, answer and visual as variant ${firstSeen.variant}.`,
            });
          } else {
            generatedItemSignatures.set(signatureKey, { variant, prompt });
          }

          const check = checkFractionAnswer({
            studentAnswer: String(answerForCheck(question)),
            correctAnswer: question.answer,
            acceptedAnswers: question.acceptedAnswers,
          });
          if (!check.correct) {
            addIssue(issues, {
              type: 'answer_check_mismatch',
              skillId,
              familyId: family.id,
              mode,
              variant,
              prompt,
              detail: `Correct answer display was not accepted: ${answerForCheck(question)}`,
            });
          }

          if (hasBadDenominator(question.answer) || hasBadDenominator(question.diagramSpec)) {
            addIssue(issues, { type: 'bad_denominator', skillId, familyId: family.id, mode, variant, prompt });
          }

          if (question.answer?.type === 'whole' && !Number.isInteger(Number(question.answer.whole))) {
            addIssue(issues, {
              type: 'non_integer_whole_answer',
              skillId,
              familyId: family.id,
              mode,
              variant,
              prompt,
              detail: `Generated whole answer: ${question.answer.whole}`,
            });
          }

          if (hasPrimaryLevel(question) && hasNegativeFraction(prompt)) {
            addIssue(issues, { type: 'primary_negative_fraction', skillId, familyId: family.id, mode, variant, prompt });
          }

          if (requiresVisual(prompt) && !question.diagramSpec && !question.visual) {
            addIssue(issues, { type: 'visual_reference_without_diagram', skillId, familyId: family.id, mode, variant, prompt });
          }

          if (checkOrderingAlreadySorted(question)) {
            addIssue(issues, { type: 'ordering_already_sorted', skillId, familyId: family.id, mode, variant, prompt });
          }
        }
      }
    }
  }

  const validation = validateFractionQuestionGenerator();
  if (!validation.isValid) {
    addIssue(issues, {
      type: 'built_in_validation_failed',
      detail: JSON.stringify(validation.checks),
    });
  }

  const failures = issues.filter((issue) => issue.severity !== 'warn');
  const warnings = issues.filter((issue) => issue.severity === 'warn');
  const byType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});
  const bySkill = issues.reduce((acc, issue) => {
    const key = issue.skillId || 'global';
    acc[key] = acc[key] || { fail: 0, warn: 0 };
    acc[key][issue.severity === 'warn' ? 'warn' : 'fail'] += 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    modes,
    variantCount,
    totalGenerated: generated.length,
    pass: failures.length === 0,
    failureCount: failures.length,
    warningCount: warnings.length,
    byType,
    bySkill,
    validation: validation.checks,
    issues,
  };
}

function sampleRows(issues = [], severity, limit = 30) {
  return issues
    .filter((issue) => (severity ? issue.severity === severity : true))
    .slice(0, limit)
    .map((issue) => `| ${issue.severity.toUpperCase()} | ${issue.type} | ${issue.skillId || '-'} | ${issue.familyId || '-'} | ${issue.mode || '-'} | ${issue.variant ?? '-'} | ${String(issue.prompt || issue.detail || '').replaceAll('|', '\\|')} |`);
}

export function buildFractionsQuestionQualityMarkdown(report) {
  const typeRows = Object.entries(report.byType)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, count]) => `| ${type} | ${count} |`);
  const skillRows = Object.entries(report.bySkill)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([skillId, counts]) => `| ${skillId} | ${counts.fail || 0} | ${counts.warn || 0} |`);

  return [
    '# Fractions Question Quality Audit',
    '',
    `Generated: ${report.generatedAt}`,
    `Modes: ${report.modes.join(', ')}`,
    `Variants per family/mode: ${report.variantCount}`,
    `Questions generated: ${report.totalGenerated}`,
    '',
    '## Summary',
    '',
    `- Status: **${report.pass ? 'PASS' : 'FAIL'}**`,
    `- Blocking failures: **${report.failureCount}**`,
    `- Warnings: **${report.warningCount}**`,
    '',
    '## Issue Types',
    '',
    '| Issue Type | Count |',
    '|---|---:|',
    ...(typeRows.length ? typeRows : ['| None | 0 |']),
    '',
    '## Skill Breakdown',
    '',
    '| Skill | Blocking Failures | Warnings |',
    '|---|---:|---:|',
    ...(skillRows.length ? skillRows : ['| All | 0 | 0 |']),
    '',
    '## Built-In Generator Validation',
    '',
    '| Check | Status |',
    '|---|---|',
    ...Object.entries(report.validation).map(([key, value]) => `| ${key} | ${value ? 'PASS' : 'FAIL'} |`),
    '',
    '## Blocking Failure Samples',
    '',
    '| Severity | Type | Skill | Family | Mode | Variant | Prompt / Detail |',
    '|---|---|---|---|---|---:|---|',
    ...(sampleRows(report.issues, 'fail').length ? sampleRows(report.issues, 'fail') : ['| - | None | - | - | - | - | No blocking failures. |']),
    '',
    '## Warning Samples',
    '',
    '| Severity | Type | Skill | Family | Mode | Variant | Prompt / Detail |',
    '|---|---|---|---|---|---:|---|',
    ...(sampleRows(report.issues, 'warn').length ? sampleRows(report.issues, 'warn') : ['| - | None | - | - | - | - | No warnings. |']),
    '',
  ].join('\n');
}

async function main() {
  const variantCount = Number(argValue('variants', DEFAULT_VARIANTS));
  const modesArg = argValue('modes', '');
  const modes = modesArg ? modesArg.split(',').map((mode) => mode.trim()).filter(Boolean) : DEFAULT_MODES;
  const out = path.resolve(argValue('out', DEFAULT_OUT));
  const report = runFractionsQuestionQualityAudit({ variantCount, modes });
  const markdown = buildFractionsQuestionQualityMarkdown(report);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, markdown, 'utf8');

  const summary = {
    out,
    pass: report.pass,
    totalGenerated: report.totalGenerated,
    failureCount: report.failureCount,
    warningCount: report.warningCount,
    byType: report.byType,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (!hasFlag('no-fail') && !report.pass) process.exit(1);
}

main().catch((err) => {
  console.error('Fractions question quality audit failed:', err?.message || err);
  process.exit(1);
});
