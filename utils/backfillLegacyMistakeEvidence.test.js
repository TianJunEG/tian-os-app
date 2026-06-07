import { describe, expect, it } from 'vitest';
import { runBackfillLegacyMistakeEvidence } from '../scripts/backfillLegacyMistakeEvidence.js';

function makeModel(records = []) {
  return {
    lastFilter: null,
    find(filter) {
      this.lastFilter = filter;
      return {
        sort() { return this; },
        limit() { return this; },
        async exec() { return records; },
      };
    },
  };
}

function mistake(overrides = {}) {
  return {
    _id: 'mistake_1',
    module: 'MathPath',
    reviewed: true,
    resolved: false,
    status: 'reviewed',
    learningStatus: '',
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
    ...overrides,
  };
}

describe('backfillLegacyMistakeEvidence script runner', () => {
  it('defaults to dry-run and does not mutate', async () => {
    const legacy = mistake();
    const model = makeModel([legacy]);

    const report = await runBackfillLegacyMistakeEvidence({ MistakeModel: model });

    expect(model.lastFilter).toEqual({ module: 'MathPath' });
    expect(report.dryRun).toBe(true);
    expect(report.wouldUpdate).toBe(1);
    expect(legacy.learningStatus).toBe('');
    expect(legacy.saveCalls).toBe(0);
  });

  it('applies safe legacy state updates in apply mode', async () => {
    const legacy = mistake({ status: 'resolved', resolved: true, learningStatus: 'mastered' });
    const model = makeModel([legacy]);

    const report = await runBackfillLegacyMistakeEvidence({ MistakeModel: model, apply: true });

    expect(report.dryRun).toBe(false);
    expect(report.updated).toBe(1);
    expect(legacy.learningStatus).toBe('acknowledged');
    expect(legacy.status).toBe('reviewed');
    expect(legacy.resolved).toBe(false);
    expect(legacy.saveCalls).toBe(1);
  });
});
