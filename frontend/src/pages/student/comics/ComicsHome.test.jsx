import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ComicsHome from './ComicsHome';
import { episodes, getFirstEpisode } from '../../../data/comics/episodes';

// Regression: the archive used to deep-link/lead with the LATEST episode, so a
// first-time student was dropped into the Ep 15 finale. It must lead with Ep 1
// and the Start button must resume at the first unfinished episode.

const progressMock = vi.fn();
const recommendedMock = vi.fn();
vi.mock('../../../services/api', () => ({
  comicsAPI: { progress: () => progressMock(), recommended: () => recommendedMock() },
}));

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/student/comics']}>
      <Routes>
        <Route path="/student/comics" element={<ComicsHome />} />
        <Route path="/student/comics/:slug" element={<div>reader: __SLUG__</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ComicsHome', () => {
  beforeEach(() => {
    progressMock.mockReset();
    recommendedMock.mockReset();
    // default: no adaptive recommendation → chronological fallback
    recommendedMock.mockResolvedValue({ data: { recommended: null } });
  });

  it('leads with Ep 1 and the Start button resumes at Ep 1 for a new reader', async () => {
    progressMock.mockResolvedValue({ data: { completed: [] } });
    renderHome();

    // Start button labelled for a fresh reader and pointing at Ep 1.
    const start = await screen.findByRole('button', { name: /Start reading · Ep 1/ });
    expect(start).toBeInTheDocument();

    // The first rendered episode card is Ep 1 (chronological), not the finale.
    const first = screen.getByText(getFirstEpisode().title);
    const last = screen.getByText(episodes[episodes.length - 1].title);
    expect(first.compareDocumentPosition(last) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('labels the button Continue and resumes at the first unfinished episode', async () => {
    progressMock.mockResolvedValue({ data: { completed: [{ episodeId: episodes[0].id }] } });
    renderHome();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: new RegExp(`Continue · Ep ${episodes[1].episode}`) })).toBeInTheDocument()
    );
  });

  it('prefers the adaptive recommendation (weakest skill) over chronological resume', async () => {
    progressMock.mockResolvedValue({ data: { completed: [] } });
    const target = episodes[4]; // ep-005, not the chronological "first unfinished" (Ep 1)
    recommendedMock.mockResolvedValue({
      data: { recommended: { episodeId: target.id, skillName: 'Length', skillSlug: 'mea.length' } },
    });
    renderHome();

    // CTA points at the recommended episode, labelled "Practise next", with the reason.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: new RegExp(`Practise next · Ep ${target.episode}`) })).toBeInTheDocument()
    );
    expect(screen.getByText(/Picked to help with: Length/)).toBeInTheDocument();
  });
});
