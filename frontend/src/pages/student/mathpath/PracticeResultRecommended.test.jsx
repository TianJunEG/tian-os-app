import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PracticeResult from './PracticeResult';
import { mathpathAPI } from '../../../services/api';

vi.mock('../../../services/api', () => ({
  mathpathAPI: {
    getSession: vi.fn(),
    mastery: vi.fn(),
    startSession: vi.fn(),
  },
}));

function renderResult() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/student/mathpath/results/session_1', state: {} }]}>
      <Routes>
        <Route path="/student/mathpath/results/:sessionId" element={<PracticeResult />} />
        <Route path="/student/mathpath/practice/:sessionId" element={<div>practice screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const baseSession = {
  data: {
    session: { id: 'session_1', module: 'MathPath' },
    skills: [{ id: 'skill_1', name: 'Adding decimals' }],
    stats: { total: 6, correct: 5, incorrect: 1, accuracy: 83, avgTimeMs: 5000 },
    mistakes: [],
  },
};

describe('PracticeResult recommended-next CTA', () => {
  it('renders an actionable button + rationale and starts the recommended practice', async () => {
    mathpathAPI.getSession.mockResolvedValueOnce(baseSession);
    mathpathAPI.mastery.mockResolvedValueOnce({
      data: { recommended: { skillId: 'D4-NF-02', skillName: 'Subtract decimals', topicName: 'Decimals' } },
    });
    mathpathAPI.startSession.mockResolvedValueOnce({ data: { session_id: 'sess_next', items: [] } });

    renderResult();

    await waitFor(() => expect(screen.getByText('Recommended next')).toBeInTheDocument());
    expect(screen.getByText('Subtract decimals')).toBeInTheDocument();
    expect(screen.getByText(/best next step/i)).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /Start this practice/i });
    fireEvent.click(btn);

    await waitFor(() => expect(mathpathAPI.startSession).toHaveBeenCalledWith(
      expect.objectContaining({ skillId: 'D4-NF-02', feature: 'Recommended Practice' }),
    ));
    await waitFor(() => expect(screen.getByText('practice screen')).toBeInTheDocument());
  });
});
