import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SkillGraph from './SkillGraph';

const graph = vi.fn();
const startSession = vi.fn();

vi.mock('../../services/api', () => ({
  mathpathAPI: {
    graph: (...args) => graph(...args),
    startSession: (...args) => startSession(...args),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'student-1', visualMode: 'upper_primary' } }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <SkillGraph />
    </MemoryRouter>
  );
}

describe('SkillGraph persisted progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the real Fractions denominator and status groups from persisted graph data', async () => {
    graph.mockResolvedValue({
      data: {
        summary: {
          total: 26,
          mastered: 1,
          inProgress: 2,
          notStarted: 23,
          locked: 20,
          ready: 3,
          avgScore: 70,
        },
        readyNext: [],
        topics: [
          {
            topicId: 'fractions-foundations',
            name: 'Foundations',
            skills: [
              {
                skillId: 'F001',
                name: 'Recognise Fractions',
                status: 'mastered',
                lastPracticedAt: '2026-06-04T01:00:00.000Z',
                ready: true,
                locked: false,
              },
              {
                skillId: 'F002',
                name: 'Numerator and Denominator',
                status: 'learning',
                lastPracticedAt: '2026-06-04T01:10:00.000Z',
                ready: true,
                locked: false,
              },
              {
                skillId: 'F003',
                name: 'Fraction of a Whole',
                status: 'needs_review',
                lastPracticedAt: '2026-06-04T01:20:00.000Z',
                ready: true,
                locked: false,
              },
            ],
          },
          {
            topicId: 'fractions-ahead',
            name: 'Still Ahead',
            skills: Array.from({ length: 23 }, (_, index) => ({
              skillId: `F${String(index + 4).padStart(3, '0')}`,
              name: `Future Skill ${index + 4}`,
              status: 'not_started',
              ready: index === 0,
              locked: index !== 0,
              lastPracticedAt: null,
            })),
          },
        ],
      },
    });

    renderPage();

    expect(await screen.findByText('Progress')).toBeInTheDocument();
    expect(screen.getAllByText('Mastered Skills').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Working On').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Needs Review').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not Started').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('23').length).toBeGreaterThan(0);
    expect(screen.getByText('Recognise Fractions')).toBeInTheDocument();
    expect(screen.getByText('Numerator and Denominator')).toBeInTheDocument();
    expect(screen.getAllByText('Fraction of a Whole').length).toBeGreaterThan(0);
    expect(screen.queryByText('0 / 1')).not.toBeInTheDocument();
  });
});
