import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import MistakesHome from './MistakesHome';

const mocks = vi.hoisted(() => ({
  mistakes: vi.fn(),
  mastery: vi.fn(),
  startSession: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../../../services/api', () => ({
  mathpathAPI: {
    mistakes: (...args) => mocks.mistakes(...args),
    mastery: (...args) => mocks.mastery(...args),
    startSession: (...args) => mocks.startSession(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'pilot-student-1', visualMode: 'upper_primary' } }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MistakesHome />
    </MemoryRouter>
  );
}

describe('MistakesHome pilot empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mastery.mockResolvedValue({ data: { recommended: null } });
    mocks.startSession.mockResolvedValue({
      data: {
        session_id: 'session-123',
        items: [{ questionId: 'q1', stem: 'Try this' }],
      },
    });
  });

  it('shows no fake mistakes when the API returns no records', async () => {
    mocks.mistakes.mockResolvedValue({ data: { mistakes: [], weakSkills: [] } });

    renderPage();

    expect(await screen.findByText('No mistakes to review yet. Complete more practice and Tian OS will show questions to review here.')).toBeInTheDocument();
    expect(screen.queryByText('Recent mistakes')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Review mistakes' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Complete more practice' })).toHaveAttribute('href', '/student/mathpath');
  });

  it('routes to review and displays actual aggregated mistake records', async () => {
    mocks.mistakes.mockResolvedValue({
      data: {
        mistakes: [
          {
            id: 'm1',
            skillId: 'skill-1',
            skillName: 'Equivalent Fractions',
            questionStem: 'Find x',
            studentAnswer: '5/5',
            correctAnswer: '7/6',
            timestamp: '2026-06-04T01:00:00.000Z',
          },
          {
            id: 'm2',
            skillId: 'skill-1',
            skillName: 'Equivalent Fractions',
            questionStem: 'Write an equivalent fraction',
            studentAnswer: '1/3',
            correctAnswer: '2/4',
            timestamp: '2026-06-04T01:05:00.000Z',
          },
          {
            id: 'm3',
            skillId: 'skill-2',
            skillName: 'Fraction of a Set',
            questionStem: 'Find part of a set',
            studentAnswer: '4',
            correctAnswer: '3',
            timestamp: '2026-06-04T01:10:00.000Z',
          },
        ],
        weakSkills: [
          { skillId: 'skill-1', skillName: 'Equivalent Fractions', count: 2 },
          { skillId: 'skill-2', skillName: 'Fraction of a Set', count: 1 },
        ],
      },
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('Recent mistakes')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Review mistakes' })).toHaveAttribute('href', '/student/mathpath/mistakes/review');
    expect(screen.getByText('3 to review')).toBeInTheDocument();
    expect(screen.getByText('2 mistakes')).toBeInTheDocument();
    expect(screen.getByText('1 mistake')).toBeInTheDocument();
    expect(screen.getByText('Find x')).toBeInTheDocument();
    expect(screen.getByText('Write an equivalent fraction')).toBeInTheDocument();
    expect(screen.getByText('Find part of a set')).toBeInTheDocument();
    expect(screen.getAllByText(/Your answer:/)).toHaveLength(3);
    expect(screen.getAllByText(/Correct:/)).toHaveLength(3);
  });

  it('starts targeted recommended practice from Complete more practice', async () => {
    mocks.mistakes.mockResolvedValue({ data: { mistakes: [], weakSkills: [] } });
    mocks.mastery.mockResolvedValue({
      data: {
        recommended: {
          skillId: 'skill-place-value',
          skillName: 'Place value to 100 000',
        },
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Place value to 100 000').length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Complete more practice' }));

    await waitFor(() => {
      expect(mocks.startSession).toHaveBeenCalledWith({
        feature: 'Mistake-to-Mastery',
        skillId: 'skill-place-value',
        questionCount: 5,
      });
    });
    expect(mocks.navigate).toHaveBeenCalledWith('/student/mathpath/practice/session-123', expect.objectContaining({
      state: expect.objectContaining({
        backTo: '/student/mathpath/mistakes',
        homeLabel: 'Back to mistake review',
      }),
    }));
  });

  it('starts the same targeted recommended practice from Practise similar', async () => {
    mocks.mistakes.mockResolvedValue({
      data: {
        mistakes: [],
        weakSkills: [{ skillId: 'skill-place-value', skillName: 'Place value to 100 000', count: 2 }],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Place value to 100 000').length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Practise similar' }));

    await waitFor(() => {
      expect(mocks.startSession).toHaveBeenCalledWith({
        feature: 'Mistake-to-Mastery',
        skillId: 'skill-place-value',
        questionCount: 5,
      });
    });
  });

  it('falls back safely when recommendation has no skill id', async () => {
    mocks.mistakes.mockResolvedValue({ data: { mistakes: [], weakSkills: [] } });
    mocks.mastery.mockResolvedValue({
      data: {
        recommended: {
          skillName: 'Place value to 100 000',
        },
      },
    });

    renderPage();

    expect(await screen.findByText('Place value to 100 000')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Practise similar' }));

    await waitFor(() => {
      expect(screen.getByText(/No recommended skill is available yet/i)).toBeInTheDocument();
    });
    expect(mocks.startSession).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith('/student/mathpath', expect.objectContaining({
      state: expect.objectContaining({ message: expect.stringMatching(/No recommended skill/i) }),
    }));
  });
});
