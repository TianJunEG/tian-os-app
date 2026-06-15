// Phase 1 WS3: worksheet-reinforce worker + shared service. Deps mocked so we
// assert the status machine (pending → ready / failed) and handler delegation.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  generate: vi.fn(),
  findById: vi.fn(),
  buildSessions: vi.fn(() => [{ sessionNumber: 1, questions: [{ prompt: 'q' }] }]),
  recompute: vi.fn(),
}));

vi.mock('../models/Worksheet.js', () => ({ default: { findById: (...a) => h.findById(...a) } }));
vi.mock('../utils/aiService.js', () => ({ generateReinforcement: (...a) => h.generate(...a) }));
vi.mock('../utils/practiceSchedule.js', () => ({
  buildSessions: (...a) => h.buildSessions(...a),
  recomputeSchedule: (...a) => h.recompute(...a),
}));

function fakeWorksheet() {
  return { _id: 'ws_r', generationStatus: 'pending', save: vi.fn().mockResolvedValue(undefined) };
}

let processReinforce;
beforeEach(async () => {
  Object.values(h).forEach((fn) => fn.mockReset());
  h.buildSessions.mockReturnValue([{ sessionNumber: 1, questions: [{ prompt: 'q' }] }]);
  ({ processReinforce } = await import('../workers/reinforceWorksheetWorker.js'));
});

describe('processReinforce', () => {
  it('generates questions, fills the worksheet, and marks it ready', async () => {
    const ws = fakeWorksheet();
    h.findById.mockResolvedValueOnce(ws);
    h.generate.mockResolvedValueOnce([{ prompt: 'q', answer: '1' }]);

    const out = await processReinforce({ data: {
      worksheetId: 'ws_r', topic: 'Fractions', misconceptions: [{ title: 'm' }], gradeLevel: 'P5', totalQuestions: 10,
    } });

    expect(h.generate).toHaveBeenCalledWith(expect.objectContaining({ topic: 'Fractions', numQuestions: 10 }));
    expect(ws.generationStatus).toBe('ready');
    expect(ws.practiceSessions).toEqual([{ sessionNumber: 1, questions: [{ prompt: 'q' }] }]);
    expect(ws.save).toHaveBeenCalled();
    expect(out).toMatchObject({ worksheetId: 'ws_r', status: 'ready' });
  });

  it('marks failed and rethrows when generation fails', async () => {
    const ws = fakeWorksheet();
    h.findById.mockResolvedValueOnce(ws);
    h.generate.mockRejectedValueOnce(new Error('gen down'));

    await expect(processReinforce({ data: { worksheetId: 'ws_r' } })).rejects.toThrow('gen down');
    expect(ws.generationStatus).toBe('failed');
    expect(ws.generationError).toBe('gen down');
    expect(ws.save).toHaveBeenCalled();
  });

  it('throws on a job missing worksheetId', async () => {
    await expect(processReinforce({ data: {} })).rejects.toThrow(/worksheetId/);
    expect(h.findById).not.toHaveBeenCalled();
  });
});
