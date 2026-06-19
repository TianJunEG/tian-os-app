import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FluencyHome from './FluencyHome';
import { mathpathAPI, skillsAPI } from '../../../../services/api';

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Demo', profile: { studentVisualMode: 'upper_primary' } } }),
}));

vi.mock('../../../../config/featureFlags', () => ({
  default: { fluency: false },
  FEATURE_FLAGS: { fluency: false },
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
  it('shows a safe pilot unavailable state when fluency is gated', async () => {
    render(
      <MemoryRouter>
        <FluencyHome />
      </MemoryRouter>
    );

    expect(screen.getByText('Fluency practice is not available yet. Continue learning to unlock it.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to MathPath/i })).toBeInTheDocument();
    expect(skillsAPI.list).not.toHaveBeenCalled();
    expect(mathpathAPI.mastery).not.toHaveBeenCalled();
  });
});
