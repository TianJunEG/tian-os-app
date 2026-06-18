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
vi.mock('../../../services/api', () => ({ comicsAPI: { complete: (...a) => completeMock(...a) } }));

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
  beforeEach(() => completeMock.mockClear());

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
});
