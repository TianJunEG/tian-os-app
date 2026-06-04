import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FluencyHome from './FluencyHome';
import { mathpathAPI, skillsAPI } from '../../../../services/api';

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Demo', profile: { studentVisualMode: 'upper_primary' } } }),
}));

vi.mock('../../../../services/api', () => ({
  skillsAPI: {
    list: vi.fn(),
  },
  mathpathAPI: {
    mastery: vi.fn(),
    fluency: vi.fn(),
    retention: vi.fn(),
    startFluencySession: vi.fn(),
  },
}));

describe('FluencyHome content state', () => {
  it('does not show the empty state when usable fluency skills exist', async () => {
    skillsAPI.list.mockResolvedValueOnce({
      data: {
        skills: [
          {
            skillId: 'skill_1',
            name: 'Times tables',
            topicName: 'Number Fluency',
            status: 'learning',
            statusLabel: 'needs practice',
            score: 20,
            availableQuestionCount: 12,
          },
        ],
      },
    });
    mathpathAPI.mastery.mockResolvedValueOnce({ data: { recentMistakeCount: 0 } });
    mathpathAPI.fluency.mockResolvedValueOnce({
      data: {
        fluentSkills: [],
        developingSkills: [],
        needsPracticeSkills: [],
        emptyState: 'Complete more practice to begin fluency tracking.',
      },
    });
    mathpathAPI.retention.mockResolvedValueOnce({ data: { upcomingReviews: [] } });

    render(
      <MemoryRouter>
        <FluencyHome />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByText('Times tables').length).toBeGreaterThan(0));
    expect(screen.queryByText('No fluency practice is available yet. Continue learning to unlock fluency challenges.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start fluency session/i })).toBeInTheDocument();
  });
});
