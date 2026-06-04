import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PracticeResult from './PracticeResult';
import { mathpathAPI } from '../../../services/api';

vi.mock('../../../services/api', () => ({
  mathpathAPI: {
    getSession: vi.fn(),
    mastery: vi.fn(),
  },
}));

function renderResult(state = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/student/mathpath/results/session_1', state }]}>
      <Routes>
        <Route path="/student/mathpath/results/:sessionId" element={<PracticeResult />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PracticeResult fluency summary', () => {
  it('shows score, accuracy, average time, Fluency Score, and Continue Fluency', async () => {
    mathpathAPI.getSession.mockResolvedValueOnce({
      data: {
        session: { id: 'session_1', module: 'MathPath', mode: 'fluency', feature: 'Fluency Practice' },
        skills: [{ id: 'skill_1', name: 'Times tables' }],
        stats: {
          total: 12,
          correct: 9,
          incorrect: 3,
          accuracy: 75,
          avgTimeMs: 4000,
          totalTimeMs: 48000,
          fluencyScore: 82,
          fluencyStatus: 'developing',
        },
        mistakes: [],
      },
    });
    mathpathAPI.mastery.mockResolvedValueOnce({ data: { recommended: null } });

    renderResult({ backTo: '/student/mathpath/fluency' });

    await waitFor(() => expect(screen.getByText('75%')).toBeInTheDocument());
    expect(screen.getByText('9 of 12 correct')).toBeInTheDocument();
    expect(screen.getByText('Avg time')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Fluency Score')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('Your fluency score combines accuracy and speed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue Fluency/i })).toBeInTheDocument();
  });
});
