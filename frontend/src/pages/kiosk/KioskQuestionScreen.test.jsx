import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import KioskQuestionScreen from './KioskQuestionScreen';
import { kioskAPI } from '../../services/kioskApi';

// The kiosk runs on shared iPads/phones in class; every tap control must meet
// the ≥44px WCAG 2.5.5 target. These render the real screen and assert the
// confidence + MCQ-option buttons carry the minHeight floor, and that the
// confidence row is allowed to wrap so labels never clip on a narrow phone.
vi.mock('../../services/kioskApi', () => ({
  kioskAPI: { answer: vi.fn(), resume: vi.fn() },
  clearAttempt: vi.fn(),
  getAttemptToken: () => null,
}));

function renderScreen() {
  const state = {
    studentName: 'Sam',
    currentQuestion: { questionId: 'q1', stem: '2 + 2 = ?', type: 'mcq', choices: ['3', '4'] },
    progress: { answeredCount: 0 },
  };
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/kiosk/ABC/session/sid1', state }]}>
      <Routes>
        <Route path="/kiosk/:code/session/:sessionId" element={<KioskQuestionScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

const px = (v) => parseInt(String(v || '0'), 10);

describe('KioskQuestionScreen touch targets', () => {
  it('confidence buttons meet the ≥44px target and can wrap', () => {
    renderScreen();
    for (const label of ['I know it', 'Not sure', "Don't know"]) {
      const btn = screen.getByRole('button', { name: new RegExp(label, 'i') });
      expect(px(btn.style.minHeight)).toBeGreaterThanOrEqual(44);
      expect(px(btn.style.minWidth)).toBeGreaterThanOrEqual(44);
      // wrap is set on the row so labels never clip on a narrow phone
      expect(btn.parentElement.style.flexWrap).toBe('wrap');
    }
  });

  it('MCQ option buttons meet the ≥44px target', () => {
    renderScreen();
    for (const choice of ['3', '4']) {
      const btn = screen.getByRole('button', { name: choice });
      expect(px(btn.style.minHeight)).toBeGreaterThanOrEqual(44);
    }
  });
});

describe('KioskQuestionScreen submit failure messaging', () => {
  // A classroom-WiFi blip means the request never reached the server (or its
  // reply was lost) — axios surfaces that as a rejection with NO `.response`.
  // That must read differently from a real server-side rejection, and it must
  // never trigger an automatic resend — the student still has to tap Submit.
  it('shows a connectivity-specific message when the request never reached the server', async () => {
    const user = userEvent.setup();
    kioskAPI.answer.mockRejectedValueOnce(new Error('Network Error'));
    renderScreen();
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/couldn't reach the server/i)).toBeInTheDocument();
    expect(kioskAPI.answer).toHaveBeenCalledTimes(1); // no auto-retry
  });

  it('shows the server-provided message when the server actually responded with an error', async () => {
    const user = userEvent.setup();
    kioskAPI.answer.mockRejectedValueOnce({ response: { data: { error: 'This class session is closed.' } } });
    renderScreen();
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText('This class session is closed.')).toBeInTheDocument();
    expect(screen.queryByText(/couldn't reach the server/i)).not.toBeInTheDocument();
  });
});
