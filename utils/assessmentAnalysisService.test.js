import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, expect, it } from 'vitest';
import {
  buildQuestionMetadata,
  deleteTemporaryUploadFile,
  detectDiagramMetadata,
  normalizeUploadConsent,
} from '../services/mathpath/assessmentAnalysisService.js';

describe('assessmentAnalysisService (unit)', () => {
  it('normalizes consent values consistently', () => {
    expect(normalizeUploadConsent(true)).toBe(true);
    expect(normalizeUploadConsent('true')).toBe(true);
    expect(normalizeUploadConsent('YES')).toBe(true);
    expect(normalizeUploadConsent('1')).toBe(true);
    expect(normalizeUploadConsent('false')).toBe(false);
    expect(normalizeUploadConsent('no')).toBe(false);
  });

  it('detects diagram metadata from blueprint + text heuristics', () => {
    const text = 'Use the number line to answer. Then read the bar graph and table.';
    const blueprintPayload = {
      requiredDiagramTypes: ['fraction_model'],
      topics: [
        { diagramTypes: ['table'] },
      ],
    };
    const detected = detectDiagramMetadata(text, blueprintPayload);
    const types = detected.map((row) => row.diagramType);
    expect(types).toContain('number_line');
    expect(types).toContain('bar_graph');
    expect(types).toContain('table');
    expect(types).toContain('fraction_model');
  });

  it('builds question metadata without question wording', () => {
    const metadata = buildQuestionMetadata(
      {
        sections: [
          {
            marks: 20,
            questionCount: 8,
            questionTypes: ['short_answer', 'word_problem'],
            cognitiveMix: { Procedural: 60, Application: 40 },
          },
        ],
        topics: [
          { topic: 'Fractions', weightage: 50, marks: 10, difficulty: 'standard', skillIds: ['F010'], diagramTypes: ['fraction_model'] },
          { topic: 'Ratio', weightage: 50, marks: 10, difficulty: 'advanced', skillIds: ['R001'] },
        ],
      },
      [{ diagramType: 'number_line', count: 2 }]
    );
    expect(metadata.length).toBeGreaterThan(0);
    expect(metadata[0]).toMatchObject({
      topic: expect.any(String),
      marks: expect.any(Number),
      difficulty: expect.any(String),
      questionStyle: expect.any(String),
      diagramType: expect.any(String),
      cognitiveLevel: expect.any(String),
    });
  });

  it('deletes temporary upload file and verifies removal', async () => {
    const filePath = path.join(os.tmpdir(), `qa_upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.txt`);
    await fs.writeFile(filePath, 'temporary');
    const out = await deleteTemporaryUploadFile(filePath);
    expect(out.deleted).toBe(true);
    expect(out.verified).toBe(true);
  });
});
