import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ComicReader from './ComicReader';

// Drive the narration UI by mocking TTS as "supported" and capturing what gets
// played. Comic vocals now run through utils/sound's mascot speaker (per-mascot
// Kokoro voice + Web Speech fallback), so we mock createMascotSpeaker. (In real
// jsdom the vocals UI visibility depends on engine support — exercised by the
// other ComicReader test.)
const play = vi.fn();
const stop = vi.fn();
vi.mock('../../../utils/tts', () => ({ ttsSupported: () => true }));
vi.mock('../../../utils/sound', () => ({ createMascotSpeaker: () => ({ play, stop }) }));
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
    // the per-bubble (playLine) path must also carry the mascot's chosen Kokoro
    // voice — not just pitch — so tapping a bubble isn't the generic voice.
    expect(typeof steps[0].kokoro).toBe('string');
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
