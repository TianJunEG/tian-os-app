// Phase 1 WS3: mark-answers worker + shared markSession service. Deps mocked so
// we assert item-building, the marking status machine, and handler delegation.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  mark: vi.fn(),
  findById: vi.fn(),
  applyMarks: vi.fn(),
  recompute: vi.fn(),
}));

vi.mock('../models/Worksheet.js', () => ({ default: { findById: (...a) => h.findById(...a) } }));
vi.mock('../utils/aiService.js', () => ({ markAnswers: (...a) => h.mark(...a) }));
vi.mock('../utils/practiceSchedule.js', () => ({ recomputeSchedule: (...a) => h.recompute(...a) }));
vi.mock('../utils/marking.js', () => ({ applyMarks: (...a) => h.applyMarks(...a) }));

function fakeWorksheet(session) {
  return { _id: 'ws_1', practiceSessions: [session], save: vi.fn().mockResolvedValue(undefined) };
}
const session = (over = {}) => ({
  sessionNumber: 1,
  markingStatus: 'marking',
  questions: [{ prompt: 'q0', answer: '4' }, { prompt: 'q1', answer: '2' }],
  ...over,
});

let svc; let processMarkAnswers;
beforeEach(async () => {
  Object.values(h).forEach((fn) => fn.mockReset());
  svc = await import('../services/worksheets/markSession.js');
  ({ processMarkAnswers } = await import('../workers/markAnswersWorker.js'));
});

describe('buildMarkItems', () => {
  it('builds text + image items and tags response types, skipping blanks', () => {
    const s = session();
    const items = svc.buildMarkItems(s, [
      { questionIndex: 0, type: 'text', text: '4' },
      { questionIndex: 1, type: 'image', imageDataUrl: 'data:image/png;base64,AAA' },
      { questionIndex: 0, type: 'text', text: '   ' }, // skipped
    ]);
    expect(items).toEqual([
      { index: 0, prompt: 'q0', correctAnswer: '4', type: 'text', text: '4' },
      { index: 1, prompt: 'q1', correctAnswer: '2', type: 'image', mimeType: 'image/png', imageBase64: 'AAA' },
    ]);
    expect(s.questions[0].studentResponse).toBe('4');
    expect(s.questions[1].studentResponseType).toBe('image');
  });
});

describe('runSessionMarking', () => {
  it('marks the session and persists status marked', async () => {
    const s = session();
    const ws = fakeWorksheet(s);
    h.findById.mockResolvedValueOnce(ws);
    h.mark.mockResolvedValueOnce({ results: [{ index: 0, correct: true }] });

    const out = await processMarkAnswers({ data: {
      worksheetId: 'ws_1', sessionNumber: 1, answers: [{ questionIndex: 0, type: 'text', text: '4' }],
    } });

    expect(h.mark).toHaveBeenCalled();
    expect(h.applyMarks).toHaveBeenCalledWith(s, [{ index: 0, correct: true }]);
    expect(s.markingStatus).toBe('marked');
    expect(h.recompute).toHaveBeenCalledWith(ws);
    expect(ws.save).toHaveBeenCalled();
    expect(out).toMatchObject({ worksheetId: 'ws_1', sessionNumber: 1, status: 'marked' });
  });

  it('marks the session failed and rethrows when AI marking fails', async () => {
    const s = session();
    const ws = fakeWorksheet(s);
    h.findById.mockResolvedValueOnce(ws);
    h.mark.mockRejectedValueOnce(new Error('marker down'));

    await expect(processMarkAnswers({ data: { worksheetId: 'ws_1', sessionNumber: 1, answers: [{ questionIndex: 0, type: 'text', text: '4' }] } }))
      .rejects.toThrow('marker down');
    expect(s.markingStatus).toBe('failed');
    expect(s.markingError).toBe('marker down');
    expect(ws.save).toHaveBeenCalled();
  });

  it('handler throws on a job missing ids', async () => {
    await expect(processMarkAnswers({ data: { worksheetId: 'ws_1' } })).rejects.toThrow(/sessionNumber/);
    expect(h.findById).not.toHaveBeenCalled();
  });
});
