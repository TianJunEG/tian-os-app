import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, '../../../data/seededPilotEvidenceChainSmokeData.json');

// Smoke test for the seeded pilot evidence-chain snapshot.
// This file should only validate the local data file and not run the full frontend e2e suite.

test.describe('Seeded pilot evidence chain smoke test', () => {
  test('verify seeded data snapshot exists and basic invariants', async () => {
    const exists = fs.existsSync(dataPath);
    expect(exists).toBeTruthy();

    const raw = fs.readFileSync(dataPath, 'utf8');
    const snapshot = JSON.parse(raw);

    expect(Array.isArray(snapshot.parents)).toBeTruthy();
    expect(snapshot.parents.length).toBeGreaterThanOrEqual(2);

    const parentA = snapshot.parents.find((p) => p.id === 'parentA');
    expect(parentA).toBeTruthy();

    const childA1 = parentA.children.find((c) => c.id === 'childA1');
    expect(childA1).toBeTruthy();
    expect(childA1.recoveryPacks && childA1.recoveryPacks.length).toBeGreaterThan(0);

    const qIds = childA1.recoveryPacks.flatMap((rp) => rp.questionRefs || []);
    qIds.forEach((qid) => {
      const q = (snapshot.questions || []).find((x) => x.id === qid);
      expect(q).toBeTruthy();
    });
  });
});
