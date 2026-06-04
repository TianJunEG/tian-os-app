import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StudentDashboard from './StudentDashboard';

const getLatestDiagnostic = vi.fn();
const studentAnalytics = vi.fn();
const recordEvent = vi.fn();
const profileSummary = vi.fn();
const profileTimeline = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'student-1',
      name: 'Demo Student',
      email: 'demo.student@tianos.test',
      role: 'student',
      visualMode: 'upper_primary',
    },
  }),
}));

vi.mock('../../services/api', () => ({
  mathpathAPI: {
    getLatestDiagnostic: (...args) => getLatestDiagnostic(...args),
    resetTestStudentState: vi.fn(),
  },
  studentProfileAPI: {
    summary: (...args) => profileSummary(...args),
    timeline: (...args) => profileTimeline(...args),
  },
  learningTelemetryAPI: {
    studentAnalytics: (...args) => studentAnalytics(...args),
    recordEvent: (...args) => recordEvent(...args),
  },
}));

vi.mock('../../mathpath/orchestration/mathPathDomainOrchestrator', () => ({
  runMathPathDomainPipeline: () => ({
    studentProgress: {
      currentSkill: 'F010',
      diagnosticCompleted: true,
      skillStatuses: { F010: 'learning' },
      masteryProgress: {
        percentageMastered: 12,
        percentageFluent: 4,
        percentageRetained: 0,
        totalSkills: 26,
        masteredSkills: ['F001', 'F002', 'F003'],
      },
      fluencyProgress: { accurateButSlowAreas: [], fluentSkillIds: [] },
      retentionProgress: { skillsDueForReview: [] },
      readinessLevel: { readinessBand: 'developing' },
      nextRecommendedAction: { action: 'continuePractice', skillId: 'F010' },
    },
    diagnostic: { summary: { recommendedStartingSkillId: 'F010' } },
    warnings: [],
  }),
}));

vi.mock('../../mathpath/orchestration/pipelineContract', () => ({
  validateStudentDashboardPayload: () => ({ valid: true, errors: [] }),
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <StudentDashboard />
    </MemoryRouter>
  );
}

describe('StudentDashboard analytics cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLatestDiagnostic.mockResolvedValue({
      data: {
        hasPlacement: true,
        result: {
          recommendedStartingSkillId: 'F010',
          masteredSkills: [{ skillId: 'F001' }],
          weakSkills: [],
        },
      },
    });
    recordEvent.mockResolvedValue({ data: { ok: true } });
    profileSummary.mockResolvedValue({
      data: {
        xp: 360,
        streak: 3,
        progress: { mastered: 3, total: 26, percentage: 12 },
      },
    });
    profileTimeline.mockResolvedValue({
      data: [
        {
          id: 'practice-1',
          eventType: 'practice_completed',
          title: 'Completed Fractions Practice',
          occurredAt: new Date().toISOString(),
        },
      ],
    });
  });

  it('renders real confidence and dashboard analytics from telemetry', async () => {
    studentAnalytics.mockResolvedValue({
      data: {
        questionsAnswered: 3,
        accuracyRate: 67,
        workingSubmissionRate: 33,
        confidenceBuckets: {
          confidentCorrect: 1,
          confidentIncorrect: 2,
          unsureCorrect: 0,
          unsureIncorrect: 0,
          needsHelpCorrect: 0,
          needsHelpIncorrect: 0,
        },
      },
    });

    renderDashboard();

    await waitFor(() => expect(screen.getByText('67%')).toBeInTheDocument());
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(screen.getByText('Confident but incorrect. Review these questions.')).toBeInTheDocument();
    expect(screen.queryByText("Good job! You're improving.")).not.toBeInTheDocument();
    expect(recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'recommendation_selected',
      metadata: expect.objectContaining({
        selectedSkill: 'F010',
        source: 'studentDashboard',
      }),
    }));
  });

  it('renders empty states instead of zero confidence metrics when analytics are unavailable', async () => {
    studentAnalytics.mockResolvedValue({
      data: {
        questionsAnswered: 0,
        accuracyRate: 0,
        workingSubmissionRate: 0,
        confidenceBuckets: {
          confidentCorrect: 0,
          confidentIncorrect: 0,
          unsureCorrect: 0,
          unsureIncorrect: 0,
          needsHelpCorrect: 0,
          needsHelpIncorrect: 0,
        },
      },
    });

    renderDashboard();

    expect(await screen.findByText('No practice completed this week.')).toBeInTheDocument();
    expect(screen.getByText('No questions answered this week.')).toBeInTheDocument();
    expect(screen.getByText('No working submitted yet.')).toBeInTheDocument();
    expect(screen.getByText('No confidence insights yet.')).toBeInTheDocument();
    expect(screen.getByText('Complete more questions to generate confidence insights.')).toBeInTheDocument();
    expect(screen.queryByText("Good job! You're improving.")).not.toBeInTheDocument();
  });

  it('renders a clean pilot-start dashboard when profile and analytics are reset', async () => {
    getLatestDiagnostic.mockResolvedValue({
      data: {
        hasPlacement: false,
        result: null,
      },
    });
    studentAnalytics.mockResolvedValue({
      data: {
        questionsAnswered: 0,
        accuracyRate: 0,
        workingSubmissionRate: 0,
        confidenceBuckets: {},
      },
    });
    profileSummary.mockResolvedValue({
      data: {
        xp: 0,
        streak: 0,
        progress: { mastered: 0, total: 26, percentage: 0 },
      },
    });
    profileTimeline.mockResolvedValue({ data: [] });

    renderDashboard();

    expect(await screen.findByText('No recent activity yet. Start your diagnostic to begin.')).toBeInTheDocument();
    expect(screen.getByText('0 / 26')).toBeInTheDocument();
    expect(screen.getByText('Learning XP')).toBeInTheDocument();
    expect(screen.getAllByText('0')[0]).toBeInTheDocument();
    expect(screen.queryByText('+120 XP today')).not.toBeInTheDocument();
    expect(screen.queryByText('Earned 120 XP')).not.toBeInTheDocument();
  });
});
