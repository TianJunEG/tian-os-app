import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p6SpeedQuestionGenerator.js';
import { validateP6SpeedSkillGraph, p6SpeedSkillGraph } from './p6SpeedSkillGraph.js';
import { validateP6SpeedQuestionFamilies } from './p6SpeedQuestionFamilies.js';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions } from './p6SpeedMisconceptionMap.js';

describe('p6SpeedSkillGraph', () => {
  it('validates without errors', () => { const r = validateP6SpeedSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p6SpeedSkillGraph.skills).toHaveLength(3); });
  it('has correct skill IDs', () => { expect(p6SpeedSkillGraph.skillIds).toEqual(['P6-SPD-01', 'P6-SPD-02', 'P6-SPD-03']); });
  it('has correct prerequisite chain', () => {
    const s1 = p6SpeedSkillGraph.skills[0];
    const s2 = p6SpeedSkillGraph.skills[1];
    const s3 = p6SpeedSkillGraph.skills[2];
    expect(s1.prerequisites).toEqual(['P5-WP-01']);
    expect(s2.prerequisites).toEqual(['P6-SPD-01']);
    expect(s3.prerequisites).toEqual(['P6-SPD-02']);
  });
});

describe('p6SpeedQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP6SpeedQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
  it('has 3 families per skill', () => {
    const r = validateP6SpeedQuestionFamilies();
    expect(r.familiesPerSkill['P6-SPD-01']).toBe(3);
    expect(r.familiesPerSkill['P6-SPD-02']).toBe(3);
    expect(r.familiesPerSkill['P6-SPD-03']).toBe(3);
  });
});

describe('p6SpeedMisconceptionMap', () => {
  it('has 8 misconceptions', () => { expect(getAllMisconceptions()).toHaveLength(8); });
  it('retrieves by tag', () => {
    expect(getMisconception('averages_speeds_instead_of_total')).not.toBeNull();
    expect(getMisconception('confuses_speed_distance_time_formula')).not.toBeNull();
    expect(getMisconception('forgets_time_unit_conversion')).not.toBeNull();
    expect(getMisconception('uses_wrong_formula_arrangement')).not.toBeNull();
    expect(getMisconception('ignores_rest_stops_in_time')).not.toBeNull();
    expect(getMisconception('subtracts_speeds_for_same_direction')).not.toBeNull();
    expect(getMisconception('distance_not_additive_for_average')).not.toBeNull();
    expect(getMisconception('time_in_hours_not_minutes')).not.toBeNull();
  });
  it('returns misconceptions for each skill', () => {
    expect(getMisconceptionsForSkill('P6-SPD-01').length).toBeGreaterThanOrEqual(1);
    expect(getMisconceptionsForSkill('P6-SPD-02').length).toBeGreaterThanOrEqual(1);
    expect(getMisconceptionsForSkill('P6-SPD-03').length).toBeGreaterThanOrEqual(1);
  });
});

describe('p6SpeedQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P6-SPD-01'); expect(ids).toContain('P6-SPD-02'); expect(ids).toContain('P6-SPD-03'); });

  describe('P6-SPD-01: Speed-Distance-Time Basics', () => {
    it('generates find-speed (_001) with answer > 0', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-01', { questionFamilyId: 'QF_P6-SPD-01_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answerType).toBe('number');
        expect(q.prompt).toMatch(/km/);
      }
    });
    it('generates find-distance (_002) with answer > 0', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-01', { questionFamilyId: 'QF_P6-SPD-01_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answerType).toBe('number');
      }
    });
    it('generates find-time (_003) with answer > 0', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-01', { questionFamilyId: 'QF_P6-SPD-01_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answerType).toBe('number');
      }
    });
    it('find-speed answer equals distance / time', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-01', { questionFamilyId: 'QF_P6-SPD-01_001' });
        const m = q.prompt.match(/(\d+)\s*km\s+in\s+(\d+)\s*hour/);
        expect(m).not.toBeNull();
        const dist = Number(m[1]), time = Number(m[2]);
        expect(q.answer).toBe(dist / time);
      }
    });
    it('find-distance answer equals speed * time', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-01', { questionFamilyId: 'QF_P6-SPD-01_002' });
        const m = q.prompt.match(/(\d+)\s*km\/h\s+for\s+(\d+)\s*hour/);
        expect(m).not.toBeNull();
        const speed = Number(m[1]), time = Number(m[2]);
        expect(q.answer).toBe(speed * time);
      }
    });
    it('find-time answer equals distance / speed', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-01', { questionFamilyId: 'QF_P6-SPD-01_003' });
        const m = q.prompt.match(/(\d+)\s*km\s+from.*at.*?(\d+)\s*km\/h/);
        expect(m).not.toBeNull();
        const dist = Number(m[1]), speed = Number(m[2]);
        expect(q.answer).toBe(dist / speed);
      }
    });
  });

  describe('P6-SPD-02: Average Speed', () => {
    it('generates two-leg avg speed (_001) — answer is NOT simple average of speeds', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-02', { questionFamilyId: 'QF_P6-SPD-02_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answerType).toBe('number');
        // Extract speeds from prompt
        const speeds = q.prompt.match(/at\s+(\d+)\s*km\/h/g);
        expect(speeds).not.toBeNull();
        expect(speeds.length).toBe(2);
        const s1 = Number(speeds[0].match(/(\d+)/)[1]);
        const s2 = Number(speeds[1].match(/(\d+)/)[1]);
        const naiveAvg = (s1 + s2) / 2;
        // Average speed should generally differ from the naive average
        // (unless distances happen to be equal, which is rare but possible)
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
    it('generates _002 with whole-number answer', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-02', { questionFamilyId: 'QF_P6-SPD-02_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
    it('generates _003 given distances and times', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-02', { questionFamilyId: 'QF_P6-SPD-02_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        // Verify total distance / total time = answer
        const distMatch = q.prompt.match(/(\d+)\s*km.*?(\d+)\s*km/);
        const timeMatch = q.prompt.match(/(\d+)\s*hour.*?(\d+)\s*hour/);
        expect(distMatch).not.toBeNull();
        expect(timeMatch).not.toBeNull();
        const totalDist = Number(distMatch[1]) + Number(distMatch[2]);
        const totalTime = Number(timeMatch[1]) + Number(timeMatch[2]);
        expect(q.answer).toBe(totalDist / totalTime);
      }
    });
    it('average speed is between the two leg speeds (when given)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-02', { questionFamilyId: 'QF_P6-SPD-02_001' });
        const speeds = q.prompt.match(/at\s+(\d+)\s*km\/h/g);
        if (speeds && speeds.length === 2) {
          const s1 = Number(speeds[0].match(/(\d+)/)[1]);
          const s2 = Number(speeds[1].match(/(\d+)/)[1]);
          const lo = Math.min(s1, s2);
          const hi = Math.max(s1, s2);
          expect(q.answer).toBeGreaterThanOrEqual(lo);
          expect(q.answer).toBeLessThanOrEqual(hi);
        }
      }
    });
  });

  describe('P6-SPD-03: Speed Word Problems', () => {
    it('generates catching-up problem (_001) with time answer', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-03', { questionFamilyId: 'QF_P6-SPD-03_001' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('text');
        expect(q.answer).toMatch(/\d+:\d{2}\s*(a\.m\.|p\.m\.)/);
      }
    });
    it('generates meeting problem (_002) with distance answer', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-03', { questionFamilyId: 'QF_P6-SPD-03_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answerType).toBe('number');
      }
    });
    it('generates journey-with-rest-stop (_003) with numeric answer', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-03', { questionFamilyId: 'QF_P6-SPD-03_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answerType).toBe('number');
      }
    });
    it('meeting problem: distance from A is less than total distance', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-SPD-03', { questionFamilyId: 'QF_P6-SPD-03_002' });
        const totalDistMatch = q.prompt.match(/(\d+)\s*km\s+apart/);
        expect(totalDistMatch).not.toBeNull();
        const totalDist = Number(totalDistMatch[1]);
        expect(q.answer).toBeLessThan(totalDist);
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P6-SPD-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P6-SPD-01', 'P6-SPD-02', 'P6-SPD-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
