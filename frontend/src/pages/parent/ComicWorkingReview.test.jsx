import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ComicWorkingReview from './ComicWorkingReview';

const workingMock = vi.fn();
vi.mock('../../services/api', () => ({
  comicsAPI: { working: (...a) => workingMock(...a) },
}));
// The replay canvas is heavy + canvas-based (jsdom can't render it); stub it.
vi.mock('../../components/learning/StrokeReplayPlayer', () => ({
  default: ({ strokes }) => <div data-testid="replay">{strokes?.length || 0} strokes</div>,
}));

describe('ComicWorkingReview', () => {
  beforeEach(() => workingMock.mockReset());

  it('fetches a child episode and renders each problem with skill, correctness and the replay', async () => {
    workingMock.mockResolvedValue({ data: { episodeId: 'ep-001', problems: [
      { problemId: 'p1-q1', correct: true, skillName: 'Adding money', workingStrokes: [{ points: [{ x: 0, y: 0 }] }] },
      { problemId: 'p3-q1', correct: false, skillName: 'Giving change', workingStrokes: [{ points: [{ x: 1, y: 1 }] }, { points: [{ x: 2, y: 2 }] }] },
    ] } });

    render(<ComicWorkingReview studentId="child_9" episodeId="ep-001" />);

    expect(workingMock).toHaveBeenCalledWith('child_9', 'ep-001');
    expect(await screen.findByText(/Adding money/)).toBeInTheDocument();
    expect(screen.getByText(/Giving change/)).toBeInTheDocument();
    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText('Not yet')).toBeInTheDocument();
    // each problem's own strokes are passed to the (stubbed) replay
    const replays = await screen.findAllByTestId('replay');
    expect(replays.map((r) => r.textContent)).toEqual(['1 strokes', '2 strokes']);
  });

  it('shows an empty state when no working was drawn', async () => {
    workingMock.mockResolvedValue({ data: { episodeId: 'ep-002', problems: [] } });
    render(<ComicWorkingReview studentId="child_9" episodeId="ep-002" />);
    expect(await screen.findByText(/No working was drawn/)).toBeInTheDocument();
  });

  it('shows an error state when the fetch fails', async () => {
    workingMock.mockRejectedValueOnce({ response: { status: 500 } });
    render(<ComicWorkingReview studentId="child_9" episodeId="ep-001" />);
    await waitFor(() => expect(screen.getByText(/load the working/)).toBeInTheDocument());
  });
});
