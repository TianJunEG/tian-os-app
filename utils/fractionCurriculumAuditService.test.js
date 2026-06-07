import { describe, expect, it } from 'vitest';
import {
  auditFractionCurriculumMappings,
  auditFractionRuntimeReferences,
  auditStaticFractionCurriculumMap,
  buildCanonicalFractionMappingTable,
  confidenceLabelForEvidence,
} from '../services/mathpath/fractionCurriculumAuditService.js';
import { FRACTION_CANONICAL_SKILL_ROWS } from '../frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js';

describe('fractionCurriculumAuditService', () => {
  it('builds a complete parent-safe F001-F026 canonical mapping table', () => {
    const rows = buildCanonicalFractionMappingTable();

    expect(rows).toHaveLength(26);
    expect(rows[0]).toMatchObject({
      skillId: 'F001',
      canonicalSlug: 'fractions.recognise_fractions',
      studentFacingName: 'Recognising fractions',
      parentFacingName: 'Recognising fractions as equal parts',
    });
    expect(rows[25]).toMatchObject({
      skillId: 'F026',
      canonicalSlug: 'fractions.mastery_challenge',
    });
    for (const row of rows) {
      expect(row.studentFacingName).not.toMatch(/\bF\d{3}\b/);
      expect(row.parentFacingName).not.toMatch(/\bF\d{3}\b/);
      expect(row.diagnosticLinkage.length).toBeGreaterThan(0);
      expect(row.questionLinkage.length).toBeGreaterThan(0);
      expect(row.recoveryPackLinkage).toContain(row.skillId);
      expect(row.recheckLinkage).toContain(row.skillId);
      expect(row.worksheetLinkage).toContain(row.skillId);
    }
  });

  it('passes the current static canonical curriculum map', () => {
    const report = auditStaticFractionCurriculumMap();

    expect(report.ok).toBe(true);
    expect(report.canonicalSkillCount).toBe(26);
    expect(report.issueCounts.critical).toBe(0);
    expect(report.issueCounts.high).toBe(0);
  });

  it('detects slug and display-name conflicts', () => {
    const badRows = FRACTION_CANONICAL_SKILL_ROWS.map((row) => ({ ...row }));
    badRows[10] = {
      ...badRows[10],
      slug: 'fractions.add_different_denominators',
      displayName: 'Add Different Denominators',
    };

    const report = auditStaticFractionCurriculumMap({
      canonicalRows: badRows,
      skillGraph: { skills: [] },
      curriculumMappings: [],
      universalSkills: [],
      questionFamilies: [],
    });

    expect(report.ok).toBe(false);
    expect(report.issues.some((issue) => issue.type === 'duplicate_slug')).toBe(true);
    expect(report.issues.some((issue) => issue.type === 'skill_display_name_mismatch')).toBe(true);
  });

  it('detects invalid runtime mappings, raw parent report codes, and overclaims', () => {
    const report = auditFractionRuntimeReferences({
      recoveryPacks: [
        { id: 'rp-valid-but-sparse', skillIds: ['F018'] },
        { id: 'rp-invalid', skillIds: ['F099'], misconceptionIds: ['adds_denominators_directly'] },
      ],
      rechecks: [
        { id: 'recheck-sparse', targetSkillIds: ['F018'] },
      ],
      worksheets: [
        { id: 'worksheet-valid', skillIds: ['F020'] },
      ],
      reports: [
        { id: 'report-raw', parentFriendlySummary: 'Practise F018 next.' },
        { id: 'report-overclaim', parentFriendlySummary: 'Your child has mastered Fractions and MathPath identified all weak areas.' },
      ],
    });

    expect(report.ok).toBe(false);
    expect(report.issues.some((issue) => issue.type === 'invalid_skill_reference' && issue.actual === 'F099')).toBe(true);
    expect(report.issues.some((issue) => issue.type === 'recovery_pack_missing_misconception_target')).toBe(true);
    expect(report.issues.some((issue) => issue.type === 'recheck_missing_misconception_specificity')).toBe(true);
    expect(report.issues.some((issue) => issue.type === 'report_raw_f_code')).toBe(true);
    expect(report.issues.some((issue) => issue.type === 'report_overclaim')).toBe(true);
  });

  it('supports parent-safe evidence confidence labels', () => {
    expect(confidenceLabelForEvidence({ evidenceCount: 4, hasRecheck: true, hasIndependentEvidence: true })).toBe('High Confidence');
    expect(confidenceLabelForEvidence({ evidenceCount: 2, hasWorkingEvidence: true })).toBe('Moderate Confidence');
    expect(confidenceLabelForEvidence({ evidenceCount: 1 })).toBe('Limited Evidence');
  });

  it('combines static and runtime audit output', () => {
    const report = auditFractionCurriculumMappings({
      runtimeSources: {
        reports: [{ id: 'safe-report', parentFriendlySummary: 'Your child improved in adding fractions with different denominators.', confidenceLabel: 'Moderate Confidence' }],
      },
    });

    expect(report.ok).toBe(true);
    expect(report.pilotScope).toBe('Fractions intervention pilot');
    expect(report.canonicalMappingTable).toHaveLength(26);
  });
});
