import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PilotAnalyticsPage from './PilotAnalyticsPage';

// The Comics section renders the engagement metrics + the trial→paid funnel
// (with the conversion lift) from GET /admin/comic-analytics, and is resilient
// to a comics fetch failure (the rest of the page still loads).
const getPilotAnalytics = vi.fn();
const getComicAnalytics = vi.fn();
vi.mock('../../services/api', () => ({
  adminAPI: {
    getPilotAnalytics: (...a) => getPilotAnalytics(...a),
    getComicAnalytics: (...a) => getComicAnalytics(...a),
  },
}));

const COMIC = {
  windowDays: 30,
  engagement: { opens: 40, completions: 25, distinctReaders: 12, dailyCompletions: [{ date: '2026-06-15', count: 5 }] },
  trialFunnel: {
    trialUsers: 20,
    engagedDuringTrial: 12,
    engagedRate: 60,
    conversion: {
      engaged: { users: 12, converted: 9, rate: 75 },
      notEngaged: { users: 8, converted: 2, rate: 25 },
    },
  },
};

describe('PilotAnalyticsPage — comics section', () => {
  it('renders comic engagement + the trial→paid funnel with the conversion lift', async () => {
    getPilotAnalytics.mockResolvedValue({ data: {} });
    getComicAnalytics.mockResolvedValue({ data: COMIC });

    render(<PilotAnalyticsPage />);

    await screen.findByText('Comics — The Tian 7 Chronicles');
    expect(screen.getByText('Trial → Paid funnel')).toBeInTheDocument();
    // engaged 75% vs not-engaged 25% → +50pp lift
    expect(screen.getByText(/75% \(9\/12\)/)).toBeInTheDocument();
    expect(screen.getByText(/25% \(2\/8\)/)).toBeInTheDocument();
    expect(screen.getByText(/\+50 pp/)).toBeInTheDocument();
  });

  it('still renders the page when comics analytics fails', async () => {
    getPilotAnalytics.mockResolvedValue({ data: {} });
    getComicAnalytics.mockRejectedValue(new Error('boom'));

    render(<PilotAnalyticsPage />);

    await screen.findByText('Pilot Analytics');
    await waitFor(() => expect(getComicAnalytics).toHaveBeenCalled());
    expect(screen.queryByText('Comics — The Tian 7 Chronicles')).not.toBeInTheDocument();
  });
});
