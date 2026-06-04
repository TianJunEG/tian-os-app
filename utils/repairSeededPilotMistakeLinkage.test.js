import { describe, expect, it } from 'vitest';
import {
  isSeededPilotOrDemoRecord,
  repairAttemptIdForMistake,
} from '../scripts/repairSeededPilotMistakeLinkage.js';

describe('repairSeededPilotMistakeLinkage safety helpers', () => {
  it('detects pilot students by test account email', () => {
    expect(isSeededPilotOrDemoRecord({
      student: { name: 'Pilot Student 2 Weak Fractions', profile: {} },
      user: { email: 'pilot.student2@tianos.test', is_test_account: true },
    })).toBe(true);
  });

  it('detects seeded pilot profile records', () => {
    expect(isSeededPilotOrDemoRecord({
      student: { name: 'Learner', profile: { pilotProfile: 'weak_fractions_p4' } },
      user: { email: 'learner@example.com', is_test_account: false },
    })).toBe(true);
  });

  it('detects demo tianos test records', () => {
    expect(isSeededPilotOrDemoRecord({
      student: { name: 'Demo Student', profile: {} },
      user: { email: 'demo.student@tianos.test', is_test_account: false },
    })).toBe(true);
  });

  it('refuses ordinary non-test student records', () => {
    expect(isSeededPilotOrDemoRecord({
      student: { name: 'Real Student', profile: {} },
      user: { email: 'real.parent@example.com', is_test_account: false },
    })).toBe(false);
  });

  it('generates deterministic repair attempt IDs', () => {
    expect(repairAttemptIdForMistake('abc123')).toBe('attempt_repair_mistake_abc123');
    expect(repairAttemptIdForMistake(' abc123 ')).toBe('attempt_repair_mistake_abc123');
  });
});
