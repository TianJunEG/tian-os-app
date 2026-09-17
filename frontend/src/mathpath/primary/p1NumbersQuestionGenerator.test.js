import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p1NumbersQuestionGenerator.js';
import { validateP1NumbersSkillGraph, p1NumbersSkillGraph } from './p1SkillGraph.js';
import { validateP1NumbersQuestionFamilies } from './p1NumbersQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p1NumbersSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP1NumbersSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 16 P1-NUM skills', () => {
    expect(p1NumbersSkillGraph.skills).toHaveLength(16);
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p1NumbersQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP1NumbersQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(32);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p1NumbersQuestionGenerator', () => {
  it('supports all 16 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(16);
    for (let i = 1; i <= 16; i++) {
      const skillId = `P1-NUM-${String(i).padStart(2, '0')}`;
      expect(ids).toContain(skillId);
    }
  });

  // -------------------------------------------------------------------------
  // P1-NUM-01: Count Objects to 10
  // -------------------------------------------------------------------------

  describe('P1-NUM-01: Count Objects to 10', () => {
    it('generates valid counting questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-01');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(10);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('picture_collections');
      }
    });

    it('pluralizes "is/are" and the object noun correctly when the count is 1', () => {
      let sawSingular = false;
      for (let i = 0; i < 300 && !sawSingular; i++) {
        const q = generateQuestion('P1-NUM-01');
        if (q.answer === 1) {
          sawSingular = true;
          expect(q.solutionText).toMatch(/^There is 1 \S+\.$/);
          expect(q.solutionText).not.toContain('There are 1');
        } else {
          expect(q.solutionText).toMatch(/^There are \d+ \S+\.$/);
        }
      }
      expect(sawSingular).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-02: Read/Write Numerals 0-10
  // -------------------------------------------------------------------------

  describe('P1-NUM-02: Read/Write Numerals 0-10', () => {
    it('generates numeral-from-word questions', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-02', { questionFamilyId: 'QF_P1-NUM-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-02');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(10);
      }
    });

    it('generates word-from-numeral choice questions', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-02', { questionFamilyId: 'QF_P1-NUM-02_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(q.options).toBeDefined();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options).toContain(q.answer);
      }
    });

    it('diagramSpec may be undefined for read/write skills', () => {
      // These skills are visual: 'optional', so diagramSpec is not required
      const q = generateQuestion('P1-NUM-02');
      expect(q).not.toBeNull();
      // diagramSpec can be undefined for read/write questions
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-03: Count Objects to 20
  // -------------------------------------------------------------------------

  describe('P1-NUM-03: Count Objects to 20', () => {
    it('generates valid counting questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-03');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-03');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(11);
        expect(q.answer).toBeLessThanOrEqual(20);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('picture_collections');
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-04: Read/Write Numerals 11-20
  // -------------------------------------------------------------------------

  describe('P1-NUM-04: Read/Write Numerals 11-20', () => {
    it('generates valid questions in the 11-20 range', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-04', { questionFamilyId: 'QF_P1-NUM-04_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-04');
        expect(q.answer).toBeGreaterThanOrEqual(11);
        expect(q.answer).toBeLessThanOrEqual(20);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-05: Count Objects to 40
  // -------------------------------------------------------------------------

  describe('P1-NUM-05: Count Objects to 40', () => {
    it('generates valid counting questions with picture collections', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-05');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-05');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(21);
        expect(q.answer).toBeLessThanOrEqual(40);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('picture_collections');
      }
    });

    it('the scattered family shows an ungrouped diagram, distinct from the grouped family', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-NUM-05', { questionFamilyId: 'QF_P1-NUM-05_002' });
        const cats = q.diagramSpec.data.categories;
        expect(cats.some((c) => String(c.label).includes('group of 10'))).toBe(false);
        expect(cats.reduce((sum, c) => sum + c.count, 0)).toBe(q.answer);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-06: Read/Write Numerals to 40
  // -------------------------------------------------------------------------

  describe('P1-NUM-06: Read/Write Numerals to 40', () => {
    it('generates valid questions in the 21-40 range', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-06', { questionFamilyId: 'QF_P1-NUM-06_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-06');
        expect(q.answer).toBeGreaterThanOrEqual(21);
        expect(q.answer).toBeLessThanOrEqual(40);
      }
    });

    it('never produces "undefined" in the number word for 21-29 (WORDS_TENS was missing 20)', () => {
      for (let i = 0; i < 300; i++) {
        const q = generateQuestion('P1-NUM-06');
        expect(q.prompt).not.toContain('undefined');
        expect(String(q.answer)).not.toContain('undefined');
        if (q.options) {
          for (const opt of q.options) expect(opt).not.toContain('undefined');
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-07: Count Objects to 100
  // -------------------------------------------------------------------------

  describe('P1-NUM-07: Count Objects to 100', () => {
    it('generates valid counting questions with picture collections', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-07');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-07');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(41);
        expect(q.answer).toBeLessThanOrEqual(100);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('picture_collections');
      }
    });

    it('the scattered family shows an ungrouped diagram, distinct from the grouped family', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-NUM-07', { questionFamilyId: 'QF_P1-NUM-07_002' });
        const cats = q.diagramSpec.data.categories;
        expect(cats.some((c) => String(c.label).includes('group of 10'))).toBe(false);
        expect(cats.reduce((sum, c) => sum + c.count, 0)).toBe(q.answer);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-08: Read/Write Numerals to 100
  // -------------------------------------------------------------------------

  describe('P1-NUM-08: Read/Write Numerals to 100', () => {
    it('generates valid questions in the 41-100 range', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-08', { questionFamilyId: 'QF_P1-NUM-08_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-08');
        expect(q.answer).toBeGreaterThanOrEqual(41);
        expect(q.answer).toBeLessThanOrEqual(100);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-09: Number Bonds to 10
  // -------------------------------------------------------------------------

  describe('P1-NUM-09: Number Bonds to 10', () => {
    it('generates missing addend questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-09', { questionFamilyId: 'QF_P1-NUM-09_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-09');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(9);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('picture_collections');
      }
    });

    // Regression for the same bug class as commit 423465c5 (family_002's fix):
    // family_001's diagram used to split the 10 counters via crossedOut:part,
    // so the un-crossed count WAS the missing answer, readable directly off
    // the picture instead of requiring any addition/subtraction reasoning.
    it('missing addend MCQ does NOT split the 10-counter whole', () => {
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion('P1-NUM-09', { questionFamilyId: 'QF_P1-NUM-09_001' });
        const cats = q.diagramSpec.data.categories;
        expect(cats.length).toBe(1);
        expect(cats[0].count).toBe(10);
        expect(String(cats[0].label || '')).not.toMatch(/crossed/i);
      }
    });

    it('generates find-the-pair choice questions', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-09', { questionFamilyId: 'QF_P1-NUM-09_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(q.options).toBeDefined();
        // Verify the correct answer pair sums to 10
        const parts = q.answer.split(' and ').map(Number);
        expect(parts[0] + parts[1]).toBe(10);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-10: Compare/Order Numbers to 20
  // -------------------------------------------------------------------------

  describe('P1-NUM-10: Compare/Order Numbers to 20', () => {
    it('generates comparison questions with number line', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-10', { questionFamilyId: 'QF_P1-NUM-10_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-10');
        expect(q.answerType).toBe('choice');
        expect(['>', '<', '=']).toContain(q.answer);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates ordering questions', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-10', { questionFamilyId: 'QF_P1-NUM-10_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    // Regression: the old third distractor was a fresh random shuffle, which
    // had a ~1/3 chance of coincidentally matching the sorted or reversed
    // order and getting deduped away, silently shrinking options to 2.
    it('ordering questions always have exactly 3 distinct options including the answer', () => {
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion('P1-NUM-10', { questionFamilyId: 'QF_P1-NUM-10_002' });
        expect(q.options.length).toBe(3);
        expect(new Set(q.options).size).toBe(3);
        expect(q.options).toContain(q.answer);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-11: Compare/Order Numbers to 100
  // -------------------------------------------------------------------------

  describe('P1-NUM-11: Compare/Order Numbers to 100', () => {
    it('generates comparison questions with number line', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-11', { questionFamilyId: 'QF_P1-NUM-11_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-11');
        expect(q.answerType).toBe('choice');
        expect(['>', '<', '=']).toContain(q.answer);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('ordering questions always have exactly 3 distinct options including the answer', () => {
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion('P1-NUM-11', { questionFamilyId: 'QF_P1-NUM-11_002' });
        expect(q.options.length).toBe(3);
        expect(new Set(q.options).size).toBe(3);
        expect(q.options).toContain(q.answer);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-12: Number Patterns by 1s
  // -------------------------------------------------------------------------

  describe('P1-NUM-12: Number Patterns by 1s', () => {
    it('generates forward pattern questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-12', { questionFamilyId: 'QF_P1-NUM-12_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-12');
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('?');
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates backward pattern questions', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-12', { questionFamilyId: 'QF_P1-NUM-12_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.solutionText).toContain('backward');
      }
    });

    // Regression: the diagram used to plot every number in the sequence with
    // its real label (including the one hidden as "?" in the prompt text),
    // and the axis-tick loop independently labelled every integer from start
    // to end — either of which handed the answer away on the diagram.
    it('the diagram never labels a point or tick at the missing (answer) value', () => {
      for (const questionFamilyId of ['QF_P1-NUM-12_001', 'QF_P1-NUM-12_002']) {
        for (let i = 0; i < 30; i++) {
          const q = generateQuestion('P1-NUM-12', { questionFamilyId });
          const { points, start, end, step } = q.diagramSpec.data;
          expect(points.some((p) => Number(p.value) === q.answer)).toBe(false);
          // No axis tick should land on the answer either.
          for (let v = start; v <= end + 1e-9; v += step) {
            expect(Math.round(v)).not.toBe(q.answer);
          }
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-13: Number Patterns by 2s, 5s, 10s
  // -------------------------------------------------------------------------

  describe('P1-NUM-13: Number Patterns by 2s, 5s, 10s', () => {
    it('generates skip counting forward questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-13', { questionFamilyId: 'QF_P1-NUM-13_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-13');
        expect(q.answerType).toBe('number');
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates identify-rule choice questions', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-13', { questionFamilyId: 'QF_P1-NUM-13_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(['Counting by 2s', 'Counting by 5s', 'Counting by 10s']).toContain(q.answer);
      }
    });

    // Regression: the "what comes next?" diagram used to append the answer
    // itself as a labeled point AND extend the axis's `end` to the answer,
    // so the renderer's own tick loop labelled it a second way even if the
    // point were removed.
    it('the "what comes next" diagram never shows the answer as a point or axis end', () => {
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion('P1-NUM-13', { questionFamilyId: 'QF_P1-NUM-13_001' });
        const { points, end } = q.diagramSpec.data;
        expect(points.some((p) => Number(p.value) === q.answer)).toBe(false);
        expect(end).not.toBe(q.answer);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-14: Place Value tens/ones to 40
  // -------------------------------------------------------------------------

  describe('P1-NUM-14: Place Value tens/ones to 40', () => {
    it('generates decompose questions with place value blocks', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-14', { questionFamilyId: 'QF_P1-NUM-14_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-14');
        expect(q.answerType).toBe('number');
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('place_value_blocks');
      }
    });

    it('generates compose questions', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-14', { questionFamilyId: 'QF_P1-NUM-14_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(10);
        expect(q.answer).toBeLessThanOrEqual(49);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('place_value_blocks');
      }
    });

    // Regression: the shared place-value-blocks renderer used to always draw
    // the composed total as text on the diagram, handing away the answer to
    // "X tens and Y ones = ?" questions before the student computed it.
    it('compose questions do not ask the diagram to show the total', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P1-NUM-14', { questionFamilyId: 'QF_P1-NUM-14_002' });
        expect(q.diagramSpec.data.showTotal).toBeFalsy();
      }
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-15: Place Value tens/ones to 100
  // -------------------------------------------------------------------------

  describe('P1-NUM-15: Place Value tens/ones to 100', () => {
    it('generates decompose questions with place value blocks', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-15', { questionFamilyId: 'QF_P1-NUM-15_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-15');
        expect(q.answerType).toBe('number');
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('place_value_blocks');
      }
    });

    it('generates compose questions in 50-100 range', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-15', { questionFamilyId: 'QF_P1-NUM-15_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(50);
        expect(q.answer).toBeLessThanOrEqual(100);
      }
    });

    it('compose questions do not ask the diagram to show the total', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P1-NUM-15', { questionFamilyId: 'QF_P1-NUM-15_002' });
        expect(q.diagramSpec.data.showTotal).toBeFalsy();
      }
    });

    it('represents 100 (10 tens, 0 ones) without clamping the tens block count', () => {
      let saw100 = false;
      for (let i = 0; i < 50 && !saw100; i++) {
        const q = generateQuestion('P1-NUM-15', { questionFamilyId: 'QF_P1-NUM-15_002' });
        if (q.answer === 100) {
          saw100 = true;
          expect(q.diagramSpec.data.tens).toBe(10);
          expect(q.diagramSpec.data.ones).toBe(0);
        }
      }
      expect(saw100).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // P1-NUM-16: Ordinal Numbers 1st-10th
  // -------------------------------------------------------------------------

  describe('P1-NUM-16: Ordinal Numbers 1st-10th', () => {
    it('generates from-left questions with number line diagram', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-NUM-16', { questionFamilyId: 'QF_P1-NUM-16_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-NUM-16');
        expect(q.answerType).toBe('choice');
        expect(q.options).toBeDefined();
        expect(q.prompt).toContain('from the left');
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates from-right questions', () => {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion('P1-NUM-16', { questionFamilyId: 'QF_P1-NUM-16_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('from the right');
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    // Regression: the diagram used to show only bare position numbers, never
    // the actual animal names from the prompt's row — it didn't visually
    // represent the described scenario at all.
    it('the diagram shows the actual animal names, with the target hidden as "[?]"', () => {
      for (const questionFamilyId of ['QF_P1-NUM-16_001', 'QF_P1-NUM-16_002']) {
        for (let i = 0; i < 15; i++) {
          const q = generateQuestion('P1-NUM-16', { questionFamilyId });
          const labels = q.diagramSpec.data.points.map((p) => p.label);
          expect(labels).toContain('[?]');
          // The answer's name must never appear as a plain (un-hidden) label.
          expect(labels).not.toContain(q.answer);
          // Every other point should be a real animal name, not a bare number.
          const nonHidden = labels.filter((l) => l !== '[?]');
          expect(nonHidden.every((l) => Number.isNaN(Number(l)))).toBe(true);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // Diagram type assertions across all skills
  // -------------------------------------------------------------------------

  describe('diagram types per skill', () => {
    const diagramExpectations = {
      'P1-NUM-01': 'picture_collections',
      'P1-NUM-03': 'picture_collections',
      'P1-NUM-05': 'picture_collections',
      'P1-NUM-07': 'picture_collections',
      'P1-NUM-09': 'picture_collections',
      'P1-NUM-10': 'number_line',
      'P1-NUM-11': 'number_line',
      'P1-NUM-12': 'number_line',
      'P1-NUM-13': 'number_line',
      'P1-NUM-14': 'place_value_blocks',
      'P1-NUM-15': 'place_value_blocks',
      'P1-NUM-16': 'number_line',
    };

    for (const [skillId, expectedType] of Object.entries(diagramExpectations)) {
      it(`${skillId} uses ${expectedType} diagrams`, () => {
        for (let i = 0; i < 3; i++) {
          const q = generateQuestion(skillId);
          expect(q.diagramSpec).toBeDefined();
          expect(q.diagramSpec.type).toBe(expectedType);
        }
      });
    }

    const noDiagramSkills = ['P1-NUM-02', 'P1-NUM-04', 'P1-NUM-06', 'P1-NUM-08'];
    for (const skillId of noDiagramSkills) {
      it(`${skillId} may have undefined diagramSpec`, () => {
        // The numeral-from-word family has no diagram
        const q = generateQuestion(skillId, {
          questionFamilyId: `QF_${skillId}_001`,
        });
        expect(q).not.toBeNull();
        // diagramSpec is undefined for these — just confirm the question itself is valid
        expect(q.skillId).toBe(skillId);
      });
    }
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P1-NUM-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P1-NUM-01'));
    });

    it('defaults to 5 questions', () => {
      const set = generateQuestionSet('P1-NUM-09');
      expect(set).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------------------
  // generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateDiagnosticSet', () => {
    it('generates questions across multiple skills', () => {
      const skills = ['P1-NUM-01', 'P1-NUM-09', 'P1-NUM-14'];
      const set = generateDiagnosticSet(skills, 2);
      expect(set).toHaveLength(6);
      const skillIds = new Set(set.map((q) => q.skillId));
      expect(skillIds.size).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases and cross-cutting concerns
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
    expect(generateQuestion('P1-NUM-99')).toBeNull();
  });

  it('every question has a unique questionId', () => {
    const ids = new Set();
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(skillId);
        expect(ids.has(q.questionId)).toBe(false);
        ids.add(q.questionId);
      }
    }
  });

  it('every question has misconceptionTraps', () => {
    for (const skillId of getSupportedSkillIds()) {
      const q = generateQuestion(skillId);
      expect(q.misconceptionTraps).toBeDefined();
      expect(q.misconceptionTraps.length).toBeGreaterThan(0);
    }
  });

  it('every question has solutionText', () => {
    for (const skillId of getSupportedSkillIds()) {
      const q = generateQuestion(skillId);
      expect(q.solutionText).toBeDefined();
      expect(q.solutionText.length).toBeGreaterThan(0);
    }
  });

  it('no question uses visualHint (uses diagramSpec instead)', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(skillId);
        expect(q.visualHint).toBeUndefined();
      }
    }
  });

  // Regression for the same bug class as commit 105c765f (AddSub/Money leaks):
  // the "Which two numbers add to 10?" MCQ family (P1-NUM-09 _002) used to pass
  // one HALF of the correct pair as `crossedOut`, so the un-crossed counter
  // count = the other half. Any student answering by counting the picture
  // instead of reasoning about number bonds would land on the correct pair.
  it('P1-NUM-09 find-the-pair MCQ does NOT split the 10-counter whole', () => {
    for (let i = 0; i < 60; i += 1) {
      const q = generateQuestion('P1-NUM-09', { questionFamilyId: 'QF_P1-NUM-09_002' });
      if (q.answerType !== 'choice') continue;
      const data = q.diagramSpec?.data;
      const cats = Array.isArray(data?.categories) ? data.categories : [];
      // A single "10 counters" category — no crossed-out split that leaks the answer.
      expect(cats.length).toBe(1);
      expect(cats[0].count).toBe(10);
      expect(String(cats[0].label || '')).not.toMatch(/crossed/i);
    }
  });
});
