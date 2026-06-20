import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StudentDashboard from './StudentDashboard';

// Freeze feature flags so this test isn't affected by FLUENCY_PILOT default changes.
vi.mock('../../config/featureFlags', () => ({
  default: { fluency: false, worksheets: true, science: false },
  FEATURE_FLAGS: { fluency: false, worksheets: true, science: false },
}));

const getLatestDiagnostic = vi.fn();
const studentAnalytics = vi.fn();
const recordEvent = vi.fn();
const profileSummary = vi.fn();
const profileTimeline = vi.fn();
const mastery = vi.fn();

const DEFAULT_USER = {
  id: 'student-1',
  name: 'Demo Student',
  email: 'demo.student@tianos.test',
  role: 'student',
  visualMode: 'upper_primary',
};

const authState = vi.hoisted(() => ({ user: null }));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: authState.user }),
}));

vi.mock('../../services/api', () => ({
  mathpathAPI: {
    getLatestDiagnostic: (...args) => getLatestDiagnostic(...args),
    mastery: (...args) => mastery(...args),
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
  diagnosticsAPI: {
    domains: vi.fn().mockResolvedValue({ data: { domains: [{ subjectId: 'math', domainId: 'fractions', displayName: 'Fractions' }] } }),
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
    authState.user = { ...DEFAULT_USER };
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
    mastery.mockResolvedValue({
      data: {
        records: [
          { skillCode: 'F001', status: 'mastered' },
          { skillCode: 'F002', status: 'mastered' },
          { skillCode: 'F003', status: 'mastered' },
        ],
        weakSkills: [],
        recommended: { skillCode: 'F010', reason: 'Continue current skill' },
        recentMistakeCount: 0,
      },
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
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Questions answered')).toBeInTheDocument();
    expect(screen.getByText('Working submitted')).toBeInTheDocument();
    expect(screen.getByText('Confidence insight')).toBeInTheDocument();
    expect(screen.getByText('Learning insight')).toBeInTheDocument();
    expect(screen.getByText(/confident but answered incorrectly/i)).toBeInTheDocument();
    expect(screen.queryByText('Fluency Challenge')).not.toBeInTheDocument();
    expect(screen.queryByText('Mastery Check')).not.toBeInTheDocument();
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

    await waitFor(() => expect(screen.getByText('Accuracy')).toBeInTheDocument());
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText('Confidence insight')).toBeInTheDocument();
    expect(screen.getByText('Learning insight')).toBeInTheDocument();
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
    mastery.mockResolvedValue({
      data: {
        records: [],
        weakSkills: [],
        recommended: null,
        recentMistakeCount: 0,
      },
    });

    renderDashboard();

    await waitFor(() => expect(screen.getByText('Accuracy')).toBeInTheDocument());
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText('Questions answered')).toBeInTheDocument();
    expect(screen.getByText('Working submitted')).toBeInTheDocument();
    expect(screen.getByText('Learning insight')).toBeInTheDocument();
    expect(screen.queryByText('+120 XP today')).not.toBeInTheDocument();
    expect(screen.queryByText('Earned 120 XP')).not.toBeInTheDocument();
  });

  it('renders the playful lower-primary layout for P1-P3 students', async () => {
    authState.user = { ...DEFAULT_USER, id: 'student-lp', visualMode: 'lower_primary' };
    studentAnalytics.mockResolvedValue({
      data: {
        questionsAnswered: 3,
        accuracyRate: 67,
        workingSubmissionRate: 33,
        confidenceBuckets: { confidentCorrect: 1 },
      },
    });

    renderDashboard();

    expect(await screen.findByText("Today's Plan")).toBeInTheDocument();
    // Four stat cards, including the Brain Power / Level card unique to lower primary.
    expect(screen.getByText('Skills Mastered')).toBeInTheDocument();
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('Learning XP')).toBeInTheDocument();
    expect(screen.getByText('Brain Power')).toBeInTheDocument();
    expect(screen.getByText('Amazing progress!')).toBeInTheDocument();
    // Recommended Next with descriptions + encouragement banner.
    expect(screen.getByText('Recommended Next')).toBeInTheDocument();
    expect(screen.getByText('Continue Learning')).toBeInTheDocument();
    expect(screen.getByText('Review Mistakes')).toBeInTheDocument();
    expect(screen.getByText("You've got this! 💪")).toBeInTheDocument();
    // The upper-primary-only analytics panel should not render here.
    expect(screen.queryByText('Learning Insight')).not.toBeInTheDocument();
  });
});
