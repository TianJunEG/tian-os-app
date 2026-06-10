import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { runFractionsContentCoverageAudit, buildFractionsCoverageMarkdown, coverageReportQuestionTotal } from '../services/mathpath/contentCoverageEngine.js';

dotenv.config();

async function main() {
  const report = await runFractionsContentCoverageAudit({ domainId: 'fractions' });
  const totalQuestions = coverageReportQuestionTotal(report);
  const allowEmpty = process.argv.includes('--allow-empty') || process.env.MATHPATH_ALLOW_EMPTY_COVERAGE === '1';

  // Guard: the report's data source is the database. Running against an unseeded
  // DB returns zero content and would otherwise overwrite the committed report
  // (e.g. 100/100 pilot-ready) with an empty 0/100 one. Refuse rather than clobber.
  if (totalQuestions === 0 && !allowEmpty) {
    console.error([
      'Refusing to overwrite the coverage report: the audit found 0 fraction questions.',
      'This usually means the database has no seeded content (e.g. running against an',
      'empty or local DB). Seed the pilot content first, then re-run.',
      'Pass --allow-empty (or MATHPATH_ALLOW_EMPTY_COVERAGE=1) to override intentionally.',
    ].join('\n'));
    process.exit(2);
  }

  const md = buildFractionsCoverageMarkdown(report);
  const out = path.resolve(process.env.MATHPATH_REPORT_PATH || 'docs/mathpath/Fractions_Content_Coverage_Report.md');
  await fs.writeFile(out, md, 'utf8');
  console.log(JSON.stringify({
    out,
    totalQuestions,
    pilotReadinessScore: report.pilotReadinessScore,
    fullCoverageScore: report.fullCoverageScore,
    skillsBelowPilotMinimum: report.skillsBelowPilotMinimum?.length || 0,
    skillsBelowFullCoverageTarget: report.skillsBelowFullCoverageTarget?.length || 0,
  }, null, 2));
}

main().catch((err) => {
  console.error('Failed to update coverage report:', err?.message || err);
  process.exit(1);
});
