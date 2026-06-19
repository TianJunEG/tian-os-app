import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ComicReader from './ComicReader';

// Drive the narration UI by mocking the Web Speech wrapper as "supported" and
// capturing what gets played. (In real jsdom, ttsSupported() is false, so the
// vocals UI is hidden — that's exercised by the other ComicReader test.)
const play = vi.fn();
const stop = vi.fn();
vi.mock('../../../utils/tts', () => ({
  ttsSupported: () => true,
  createSpeaker: () => ({ play, stop }),
}));
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { studentLevel: 'P4' } }) }));
vi.mock('../../../services/api', () => ({
  comicsAPI: { complete: vi.fn().mockResolvedValue({}), recommended: vi.fn().mockResolvedValue({ data: { recommended: null } }) },
  learningTelemetryAPI: { recordEvent: vi.fn().mockResolvedValue({}) },
}));

function renderReader() {
  return render(
    <MemoryRouter initialEntries={['/student/comics/hawker-heroes']}>
      <Routes>
        <Route path="/student/comics/:slug" element={<ComicReader />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ComicReader narration UI', () => {
  beforeEach(() => {
    play.mockClear();
    stop.mockClear();
    localStorage.clear();
  });

  it('shows a per-bubble speaker that plays just that line', () => {
    renderReader();
    const speakers = screen.getAllByLabelText('Read aloud');
    expect(speakers.length).toBeGreaterThan(0);

    fireEvent.click(speakers[0]);
    expect(play).toHaveBeenCalledTimes(1);
    const [steps] = play.mock.calls[0];
    expect(steps).toHaveLength(1); // a single line, not the whole panel
    expect(typeof steps[0].text).toBe('string');
    expect(typeof steps[0].pitch).toBe('number');
  });

  it('auto-narrates the whole panel only after the toggle is switched on', () => {
    renderReader();
    // Off by default → nothing auto-played on mount.
    expect(play).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Narrate/ }));
    // Toggling on narrates the current panel (multiple lines).
    expect(play).toHaveBeenCalled();
    const [steps] = play.mock.calls[play.mock.calls.length - 1];
    expect(steps.length).toBeGreaterThan(1);
    // Preference persisted.
    expect(JSON.parse(localStorage.getItem('comicsAutoNarrate'))).toBe(true);
  });
});
