import { describe, expect, it } from 'vitest';
import { generateWorkedExample, listWorkedExamples } from '../services/mathpath/workedExampleEngine.js';

describe('workedExampleEngine', () => {
  it('generates a student-facing worked example for a major misconception', () => {
    const example = generateWorkedExample('adds_denominators_directly');

    expect(example.title).toMatch(/Adds denominators/i);
    expect(example.visualModelType).toBe('fraction_strip');
    expect(example.workedExample.incorrectMethod).toContain('1/2 + 1/3');
    expect(example.workedExample.whyIncorrect).toMatch(/denominators/i);
    expect(example.workedExample.correctMethod).toContain('5/6');
    expect(example.workedExample.keyTakeaway).toMatch(/common denominator/i);
  });

  it('provides worked examples for every mapped misconception', () => {
    const examples = listWorkedExamples();

    expect(examples.length).toBeGreaterThan(0);
    expect(examples.every((example) => example.workedExample?.incorrectMethod)).toBe(true);
    expect(examples.every((example) => example.visualModelType)).toBe(true);
  });
});
