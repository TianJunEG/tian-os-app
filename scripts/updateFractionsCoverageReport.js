import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { runFractionsContentCoverageAudit, buildFractionsCoverageMarkdown } from '../services/mathpath/contentCoverageEngine.js';

dotenv.config();

async function main() {
  const report = await runFractionsContentCoverageAudit({ domainId: 'fractions' });
  const md = buildFractionsCoverageMarkdown(report);
  const out = path.resolve(process.env.MATHPATH_REPORT_PATH || 'docs/mathpath/Fractions_Content_Coverage_Report.md');
  await fs.writeFile(out, md, 'utf8');
  console.log(JSON.stringify({
    out,
    pilotReadinessScore: report.pilotReadinessScore,
    skillsBelowThreshold: report.skillsBelowThreshold?.length || 0,
  }, null, 2));
}

main().catch((err) => {
  console.error('Failed to update coverage report:', err?.message || err);
  process.exit(1);
});

