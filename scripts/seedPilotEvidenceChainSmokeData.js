import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Lightweight smoke seeding script that writes a JSON snapshot
// of the seeded pilot evidence-chain described in the report.
// This is intentionally self-contained so it can be used without
// requiring DB connectivity; adapt to your real DB clients as needed.

export function buildSample() {
  return {
    parents: [
      {
        id: 'parentA',
        children: [
          {
            id: 'childA1',
            baselineDiagnostic: { id: 'diag-A1-1', score: 42 },
            recoveryPacks: [
              { id: 'rp-A1-1', questionRefs: ['q-A1-1', 'q-A1-2'], warningCount: 0 }
            ],
            teachingFlows: [{ id: 'tf-A1-1' }],
            rechecks: [{ id: 'recheck-A1-1' }],
            parentSuccessReport: { id: 'psr-A1-1' }
          },
          {
            id: 'childA2',
            baselineDiagnostic: { id: 'diag-A2-1', score: 70 }
          }
        ]
      },
      {
        id: 'parentB',
        children: [
          {
            id: 'childB1',
            baselineDiagnostic: { id: 'diag-B1-1', score: 58 }
          }
        ]
      }
    ],
    questions: [
      { id: 'q-A1-1', text: 'Question A1.1' },
      { id: 'q-A1-2', text: 'Question A1.2' }
    ],
    meta: {
      generatedAt: new Date().toISOString(),
      note: 'Smoke seed for pilot evidence chain — safe snapshot file'
    }
  };
}

export function writeSnapshot(targetPath) {
  const data = buildSample();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Wrote seed snapshot to', targetPath);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const out = path.resolve(process.cwd(), 'data/seededPilotEvidenceChainSmokeData.json');
  writeSnapshot(out);
}
