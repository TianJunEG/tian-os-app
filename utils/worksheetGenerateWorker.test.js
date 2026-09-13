// Phase 1 WS3: worksheet-generate worker + shared photo-worksheet service. Deps
// are mocked so we assert the status machine (pending → ready / failed) and that
// the handler delegates, without a DB or live AI.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  analyze: vi.fn(),
  findById: vi.fn(),
  buildSessions: vi.fn(() => [{ sessionNumber: 1, questions: [] }]),
  recompute: vi.fn(),
  logMc: vi.fn(),
  getUploadBuffer: vi.fn(),
}));

vi.mock('../models/Worksheet.js', () => ({ default: { findById: (...a) => h.findById(...a) } }));
vi.mock('../utils/aiService.js', () => ({ analyzeAndGenerateWorksheet: (...a) => h.analyze(...a) }));
vi.mock('../utils/practiceSchedule.js', () => ({
  buildSessions: (...a) => h.buildSessions(...a),
  recomputeSchedule: (...a) => h.recompute(...a),
}));
vi.mock('../utils/misconceptionLog.js', () => ({ logDiagnosedMisconceptions: (...a) => h.logMc(...a) }));
vi.mock('../services/storage/objectStore.js', () => ({ getUploadBuffer: (...a) => h.getUploadBuffer(...a) }));

function fakeWorksheet() {
  return { _id: 'ws_1', generationStatus: 'pending', save: vi.fn().mockResolvedValue(undefined) };
}

let processWorksheetGenerate;
beforeEach(async () => {
  Object.values(h).forEach((fn) => fn.mockReset?.());
  h.buildSessions.mockReturnValue([{ sessionNumber: 1, questions: [] }]);
  ({ processWorksheetGenerate } = await import('../workers/worksheetGenerateWorker.js'));
});

describe('processWorksheetGenerate', () => {
  it('fills the pending worksheet and marks it ready', async () => {
    const ws = fakeWorksheet();
    h.findById.mockResolvedValueOnce(ws);
    h.analyze.mockResolvedValueOnce({
      topic: 'Fractions', overallSummary: 's', misconceptions: [{ title: 'm' }],
      skillsToReinforce: ['F1'], questions: [{ prompt: 'q' }], modelUsed: 'haiku', escalated: false,
    });

    const out = await processWorksheetGenerate({ data: {
      worksheetId: 'ws_1', imageBase64: 'IMG', mimeType: 'image/png',
      gradeLevel: 'P5', topicHint: '', totalQuestions: 10, ownerUserId: 'u1', studentUserId: null, studentName: 'Mei',
    } });

    expect(h.analyze).toHaveBeenCalledWith(expect.objectContaining({ imageBase64: 'IMG', numQuestions: 10 }));
    expect(ws.generationStatus).toBe('ready');
    expect(ws.topic).toBe('Fractions');
    expect(ws.practiceSessions).toEqual([{ sessionNumber: 1, questions: [] }]);
    expect(h.recompute).toHaveBeenCalledWith(ws);
    expect(ws.save).toHaveBeenCalled();
    expect(h.logMc).toHaveBeenCalled(); // best-effort misconception logging ran
    expect(out).toMatchObject({ worksheetId: 'ws_1', status: 'ready' });
  });

  it('resolves the photo by reference (storageKey) when no inline base64 is given', async () => {
    const ws = fakeWorksheet();
    h.findById.mockResolvedValueOnce(ws);
    h.getUploadBuffer.mockResolvedValueOnce(Buffer.from('photo-bytes'));
    h.analyze.mockResolvedValueOnce({
      topic: 'Fractions', overallSummary: 's', misconceptions: [], skillsToReinforce: [],
      questions: [{ prompt: 'q' }], modelUsed: 'haiku', escalated: false,
    });

    const out = await processWorksheetGenerate({ data: {
      worksheetId: 'ws_1', storageKey: 'worksheets/abc.png', storageProvider: 'r2',
      mimeType: 'image/png', gradeLevel: 'P5', totalQuestions: 10,
    } });

    expect(h.getUploadBuffer).toHaveBeenCalledWith({ storageKey: 'worksheets/abc.png', storageProvider: 'r2' });
    // the fetched bytes are forwarded to the AI call as base64
    expect(h.analyze).toHaveBeenCalledWith(expect.objectContaining({
      imageBase64: Buffer.from('photo-bytes').toString('base64'),
    }));
    expect(out).toMatchObject({ worksheetId: 'ws_1', status: 'ready' });
  });

  it('fails when the referenced photo cannot be read from storage', async () => {
    const ws = fakeWorksheet();
    h.findById.mockResolvedValueOnce(ws);
    h.getUploadBuffer.mockResolvedValueOnce(null); // storage miss

    await expect(processWorksheetGenerate({ data: {
      worksheetId: 'ws_1', storageKey: 'worksheets/missing.png', storageProvider: 'r2',
    } })).rejects.toThrow(/could not be read from storage/);
    expect(h.analyze).not.toHaveBeenCalled();
    expect(ws.generationStatus).toBe('failed');
  });

  it('marks the worksheet failed and rethrows when the AI call fails', async () => {
    const ws = fakeWorksheet();
    h.findById.mockResolvedValueOnce(ws);
    h.analyze.mockRejectedValueOnce(Object.assign(new Error('AI down'), { status: 503 }));

    await expect(processWorksheetGenerate({ data: { worksheetId: 'ws_1', imageBase64: 'IMG' } }))
      .rejects.toThrow('AI down');
    expect(ws.generationStatus).toBe('failed');
    expect(ws.generationError).toBe('AI down');
    expect(ws.save).toHaveBeenCalled();
    expect(h.logMc).not.toHaveBeenCalled();
  });

  it('throws on a job missing worksheetId', async () => {
    await expect(processWorksheetGenerate({ data: {} })).rejects.toThrow(/worksheetId/);
    expect(h.findById).not.toHaveBeenCalled();
  });
});
