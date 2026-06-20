import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ComicReader from './ComicReader';

// Regression: finishing the last panel advances currentPanel past the panels
// array (to show the end card), so `panel` becomes undefined. The reader must
// not dereference `panel.problem` in that state — it threw
// "Cannot read properties of undefined (reading 'problem')" and tripped the
// ErrorBoundary on EVERY episode's final "Finish" click in production.

const completeMock = vi.fn().mockResolvedValue({});
const recommendedMock = vi.fn().mockResolvedValue({ data: { recommended: null } });
const recordEventMock = vi.fn().mockResolvedValue({});
vi.mock('../../../services/api', () => ({
  comicsAPI: { complete: (...a) => completeMock(...a), recommended: (...a) => recommendedMock(...a) },
  learningTelemetryAPI: { recordEvent: (...a) => recordEventMock(...a) },
}));
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { studentLevel: 'P4' } }) }));
// Deterministic problems so this reader-flow test is stable; the engine's own
// level-scaling of numbers is covered by comicDifficulty.test.js.
vi.mock('../../../data/comics/comicDifficulty', () => ({
  resolveTier: () => 1,
  generateEpisodeProblems: (episode) => {
    const fixed = { 'p1-q1': 20, 'p2-q1': 9, 'p3-q1': 11 };
    const problems = episode.panels.map((p) => (p.problem ? { ...p.problem, question: 'Q', hint: 'H', answer: fixed[p.problem.id] ?? 1 } : null));
    return { problems, ctx: {} };
  },
}));

function renderReader(slug = 'hawker-heroes') {
  return render(
    <MemoryRouter initialEntries={[`/student/comics/${slug}`]}>
      <Routes>
        <Route path="/student/comics/:slug" element={<ComicReader />} />
      </Routes>
    </MemoryRouter>
  );
}

// Ep 1 "Hawker Heroes": three panels, answers 20 / 9 / 11.
const ANSWERS = [20, 9, 11];

function solveCurrentPanel(container, answer) {
  const input = container.querySelector('input[type="number"]');
  fireEvent.change(input, { target: { value: String(answer) } });
  fireEvent.click(screen.getByRole('button', { name: 'Check' }));
}

describe('ComicReader', () => {
  beforeEach(() => {
    completeMock.mockClear();
    recordEventMock.mockClear();
    recommendedMock.mockReset();
    recommendedMock.mockResolvedValue({ data: { recommended: null } });
  });

  function finishEpisode(container) {
    solveCurrentPanel(container, ANSWERS[0]);
    fireEvent.click(screen.getByRole('button', { name: /Next panel/ }));
    solveCurrentPanel(container, ANSWERS[1]);
    fireEvent.click(screen.getByRole('button', { name: /Next panel/ }));
    solveCurrentPanel(container, ANSWERS[2]);
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }));
  }

  it('walks to the end card without crashing after the final answer', async () => {
    const { container } = renderReader();

    // Panels 1 & 2: solve, then "Next panel".
    solveCurrentPanel(container, ANSWERS[0]);
    fireEvent.click(screen.getByRole('button', { name: /Next panel/ }));
    solveCurrentPanel(container, ANSWERS[1]);
    fireEvent.click(screen.getByRole('button', { name: /Next panel/ }));

    // Final panel: solve, then "Finish" — the path that previously threw.
    solveCurrentPanel(container, ANSWERS[2]);
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }));

    // End card renders instead of the ErrorBoundary.
    expect(await screen.findByText('Episode complete!')).toBeInTheDocument();
    // And completion was reported with every solved problem.
    await waitFor(() => expect(completeMock).toHaveBeenCalledTimes(1));
    const [episodeId, problems] = completeMock.mock.calls[0];
    expect(episodeId).toBe('ep-001');
    expect(problems).toHaveLength(3);
    expect(problems.every((p) => p.correct === true)).toBe(true);
  });

  it('shows a friendly message for an unknown episode slug', () => {
    renderReader('does-not-exist');
    expect(screen.getByText('Episode not found.')).toBeInTheDocument();
  });

  it('emits telemetry: comic_episode_opened on mount and comic_episode_completed on finish', async () => {
    const { container } = renderReader();

    await waitFor(() => expect(recordEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'comic_episode_opened',
        domain: 'comics',
        metadata: expect.objectContaining({ episodeId: 'ep-001' }),
      }),
    ));

    finishEpisode(container);
    await screen.findByText('Episode complete!');

    await waitFor(() => expect(recordEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'comic_episode_completed',
        domain: 'comics',
        metadata: expect.objectContaining({ episodeId: 'ep-001', problemsTotal: 3, problemsCorrect: 3 }),
      }),
    ));
  });

  it('offers an adaptive "Play next" on the end card and navigates to it', async () => {
    // recommend a different episode (ep-005) targeting a weak skill
    recommendedMock.mockResolvedValue({
      data: { recommended: { episodeId: 'ep-005', skillName: 'Length', skillSlug: 'mea.length' } },
    });
    const { container } = renderReader();
    finishEpisode(container);

    await screen.findByText('Episode complete!');
    // It asked for a recommendation and surfaced the reason + the chained CTA.
    await waitFor(() => expect(recommendedMock).toHaveBeenCalled());
    expect(await screen.findByText((t) => /Next, let.?s practise Length/.test(t))).toBeInTheDocument();
    const playNext = screen.getByRole('button', { name: /Play next · Ep 5/ });

    fireEvent.click(playNext);
    // The reader chains into Ep 5 and resets to its first panel.
    expect(await screen.findByText('Ep 5: Measure Up')).toBeInTheDocument();
  });

  it('does not show Play next when there is no recommendation', async () => {
    recommendedMock.mockResolvedValue({ data: { recommended: null } });
    const { container } = renderReader();
    finishEpisode(container);

    await screen.findByText('Episode complete!');
    await waitFor(() => expect(recommendedMock).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /Play next/ })).not.toBeInTheDocument();
  });
});
