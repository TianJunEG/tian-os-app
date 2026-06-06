import { describe, expect, it } from 'vitest';
import { createWorksheetPdf } from '../routes/worksheets.js';

describe('worksheet PDF export', () => {
  it('includes worksheet rationale, sections and answer key in the generated PDF buffer', () => {
    const pdf = createWorksheetPdf({
      studentName: 'Pilot Student',
      createdAt: new Date('2026-06-06T00:00:00.000Z'),
      interventionRationale: {
        whyGenerated: 'Generated from confirmed wrong questions in an uploaded paper.',
      },
      generatedContent: {
        title: 'Paper Review Recovery Worksheet',
        skillNames: ['Fraction of a remainder'],
        sections: [{
          title: 'Section A: Foundation Practice',
          questions: [{ n: 1, stem: 'Find 1/2 of 12.' }],
        }],
        reflection: { prompt: 'Which question was most difficult?' },
      },
      answerKey: [{ n: 1, answer: '6', workedSolution: 'Half of 12 is 6.' }],
    }, { includeAnswers: true });

    const text = pdf.toString('utf8');
    expect(text).toContain('%PDF-1.4');
    expect(text).toContain('Paper Review Recovery Worksheet');
    expect(text).toContain('Section A: Foundation Practice');
    expect(text).toContain('Answer Key');
    expect(text).toContain('Half of 12 is 6');
  });
});
