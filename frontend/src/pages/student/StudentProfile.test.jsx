import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StudentProfile from './StudentProfile';

vi.mock('../../services/api', () => ({
  studentProfileAPI: {
    overview: vi.fn(() => Promise.resolve({
      data: {
        summary: {
          student: { name: 'Jas Tan', level: 'Primary 4' },
          xp: 1240,
          streak: 5,
          questionsSolved: 523,
          skillsMastered: 9,
          practiceSessions: 31,
          workingSubmissions: 18,
          currentDomain: 'Fractions',
          currentSkill: 'Equivalent Fractions',
          progress: { mastered: 9, total: 26, label: '9 / 26 Skills Mastered' },
          recommendedAction: { label: 'Continue Equivalent Fractions', href: '/student/mathpath' },
        },
        achievements: [
          {
            code: 'first_practice',
            title: 'First Practice Session',
            description: 'Completed a focused practice session.',
            icon: 'practice',
            category: 'Learning Milestones',
            unlocked: true,
            unlockedAt: '2026-06-04T01:00:00.000Z',
          },
          {
            code: 'seven_day_streak',
            title: 'Seven Day Streak',
            description: 'Keep a full week of learning activity.',
            icon: 'streak',
            category: 'Consistency',
            unlocked: false,
            unlockedAt: null,
          },
        ],
        timeline: [
          {
            id: 'event_1',
            title: 'Completed Equivalent Fractions Practice',
            description: 'Practised F010',
            xpAwarded: 10,
            occurredAt: new Date().toISOString(),
          },
        ],
      },
    })),
  },
}));

describe('StudentProfile', () => {
  it('renders learning identity, achievements, timeline, and continue CTA', async () => {
    render(
      <MemoryRouter>
        <StudentProfile />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading your profile…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jas Tan' })).toBeInTheDocument();
    });

    expect(screen.getAllByText('Fractions').length).toBeGreaterThan(0);
    expect(screen.getByText('1,240')).toBeInTheDocument();
    expect(screen.getByText('523')).toBeInTheDocument();
    expect(screen.getByText('9 / 26 Skills Mastered')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue Learning/i })).toHaveAttribute('href', '/student/mathpath');
    expect(screen.getByText('First Practice Session')).toBeInTheDocument();
    expect(screen.getByText('Seven Day Streak')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('Completed Equivalent Fractions Practice')).toBeInTheDocument();
    expect(screen.getByText('Earned 10 XP')).toBeInTheDocument();
  });
});
