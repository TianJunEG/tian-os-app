import { describe, it, expect } from 'vitest';
import { gradeAnswer, normalizeForCompare } from './testPaperGrading.js';

describe('test-paper grading', () => {
  it('accepts an exact canonical answer', () => {
    expect(gradeAnswer('90', { answer: '90' })).toBe(true);
    expect(gradeAnswer('700 000', { answer: '700 000' })).toBe(true);
  });

  it('accepts fractions and decimals', () => {
    expect(gradeAnswer('13/5', { answer: '13/5' })).toBe(true);
    expect(gradeAnswer('7/12', { answer: '7/12' })).toBe(true);
    expect(gradeAnswer('0.875', { answer: '0.875' })).toBe(true);
  });

  it('tolerates ratio spacing (3:4 === 3 : 4)', () => {
    expect(gradeAnswer('3:4', { answer: '3 : 4' })).toBe(true);
    expect(gradeAnswer('3 : 4', { answer: '3 : 4' })).toBe(true);
    expect(gradeAnswer('3 :4', { answer: '3 : 4' })).toBe(true);
  });

  it('tolerates a leading currency symbol', () => {
    expect(gradeAnswer('$60', { answer: '60', unit: '$' })).toBe(true);
    expect(gradeAnswer('60', { answer: '60', unit: '$' })).toBe(true);
  });

  it('tolerates a trailing unit', () => {
    expect(gradeAnswer('38 cm', { answer: '38', unit: 'cm' })).toBe(true);
    expect(gradeAnswer('154 cm²', { answer: '154', unit: 'cm²' })).toBe(true);
    expect(gradeAnswer('90 min', { answer: '90', unit: 'min' })).toBe(true);
  });

  it('marks a blank or wrong answer incorrect', () => {
    expect(gradeAnswer('', { answer: '27' })).toBe(false);
    expect(gradeAnswer('   ', { answer: '27' })).toBe(false);
    expect(gradeAnswer('28', { answer: '27' })).toBe(false);
    expect(gradeAnswer('4 : 3', { answer: '3 : 4' })).toBe(false); // order matters for ratio
  });

  it('does not let the unit-strip swallow a wrong number', () => {
    expect(gradeAnswer('40 cm', { answer: '38', unit: 'cm' })).toBe(false);
  });

  it('every seeded paper answer self-grades (canonical answer marks itself correct)', () => {
    // Representative canonical answers from P4/P5/P6 mock papers. Each must mark
    // itself correct — a guard against a typo'd answer field shipping a paper
    // that can never be passed.
    const seeded = [
      { answer: '700 000' }, { answer: '13/5' }, { answer: '7', unit: 'books' },
      { answer: '0.875' }, { answer: '38', unit: 'cm' }, { answer: '90' },
      { answer: '3 : 4' }, { answer: '60', unit: '$' }, { answer: '27' }, { answer: '96' },
      { answer: '3 800' }, { answer: '6' }, { answer: '4/8' }, { answer: '252' },
      { answer: '36', unit: 'cm²' }, { answer: '24' }, { answer: '7.45' },
      { answer: '30' }, { answer: '14', unit: '$' }, { answer: '97' },
      { answer: '60' }, { answer: '5' }, { answer: '154', unit: 'cm²' },
      { answer: '80', unit: 'km/h' }, { answer: '34', unit: '$' }, { answer: '7/12' },
      { answer: '64' }, { answer: '600' }, { answer: '90', unit: 'min' },
    ];
    for (const q of seeded) {
      expect(gradeAnswer(q.answer, q), `"${q.answer}" should self-grade`).toBe(true);
    }
  });

  it('normalizeForCompare strips currency, unit and ratio spacing', () => {
    expect(normalizeForCompare('$60', '$')).toBe('60');
    expect(normalizeForCompare('38 cm', 'cm')).toBe('38');
    expect(normalizeForCompare('3 : 4')).toBe('3:4');
  });
});
