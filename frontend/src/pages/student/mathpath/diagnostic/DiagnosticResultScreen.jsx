import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, Button, Badge, ErrorState, PageHeader, Spinner, CollapsibleSection } from '../../../../components/ui';
import { getUniversalSkillByFrameworkId } from '../../../../mathpath/curriculum';
import { mathpathAPI } from '../../../../services/api';

function skillName(skillId) {
  const normalized = String(skillId || '').toUpperCase();
  if (!/^F\d{3}$/.test(normalized)) return skillId;
  return getUniversalSkillByFrameworkId(normalized)?.title || normalized;
}

function readinessBand(score = 0) {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'On Track';
  if (score >= 55) return 'Developing';
  return 'Needs Support';
}

export default function DiagnosticResultScreen() {
  const { diagnosticSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [timingAnalytics, setTimingAnalytics] = useState(location.state?.timingAnalytics || null);
  const [loading, setLoading] = useState(!location.state?.result || !location.state?.timingAnalytics);

  useEffect(() => {
    let mounted = true;
    const hasFreshResult = Boolean(location.state?.result && location.state?.timingAnalytics);
    if (hasFreshResult) return () => { mounted = false; };
    (async () => {
      try {
        const { data } = await mathpathAPI.getDiagnostic(diagnosticSessionId);
        if (!mounted) return;
        const persisted = data?.result || null;
        setResult(persisted ? { ...persisted, sessionId: data.sessionId, mode: data.mode } : null);
        setTimingAnalytics(data?.timingAnalytics || null);
      } catch (_) {
        if (mounted) setResult(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [diagnosticSessionId, location.state?.result, location.state?.timingAnalytics]);

  const shaped = useMemo(() => {
    if (!result) return null;
    if (result.recommendedStartingSkill) return result;
    const recommendedStartingSkillId = result.recommendedStartingSkillId || 'F001';
    return {
      ...result,
      recommendedStartingSkill: {
        skillId: recommendedStartingSkillId,
        name: skillName(recommendedStartingSkillId),
      },
      masteredSkills: (result.masteredSkillIds || []).map((skillId) => ({ skillId, name: skillName(skillId) })),
      weakSkills: (result.weakSkillIds || []).map((skillId) => ({ skillId, name: skillName(skillId) })),
      readinessLevel: readinessBand(result.overallFractionReadinessScore || 0),
      parentPlacementSummary: result.parentFriendlySummary,
      studentPlacementReport: {
        strengths: (result.masteredSkillIds || []).slice(0, 5).map(skillName),
        areasToImprove: (result.weakSkillIds || []).slice(0, 5).map(skillName),
        recommendedStartingPoint: skillName(result.recommendedStartingSkillId || 'F001'),
        estimatedDifficulty: readinessBand(result.overallFractionReadinessScore || 0),
        suggestedFirstSession: `Start with ${skillName(result.recommendedStartingSkillId || 'F001')} practice (6–10 questions).`,
      },
      confidenceScore: result.confidenceLevel === 'high' ? 0.85 : result.confidenceLevel === 'medium' ? 0.65 : 0.45,
      studentFriendlySummary: result.studentFriendlySummary,
      timingAnalytics,
    };
  }, [result, timingAnalytics]);

  const timingBySkill = useMemo(() => {
    if (!shaped?.timingAnalytics?.attemptsBySkill) return [];
    return [...shaped.timingAnalytics.attemptsBySkill]
      .sort((a, b) => Number(b.fluency_score || 0) - Number(a.fluency_score || 0))
      .slice(0, 4)
      .map((row) => ({
        skillId: row.skill_id || row.skillId,
        accuracy: row.accuracy_rate,
        avgSeconds: row.average_response_time,
        skipRate: row.skip_rate,
        fluency: row.fluency_score,
        consistency: row.consistency,
        attempts: row.total_attempts,
      }))
      .filter((row) => row.skillId);
  }, [shaped]);

  const timingOverall = shaped?.timingAnalytics?.overall || {};

  if (loading) return <Spinner label="Loading placement…" />;

  if (!shaped) {
    return <ErrorState message="No diagnostic result found. Please run the diagnostic again." onRetry={() => navigate('/student/mathpath/diagnostic')} />;
  }

  const startingSkillId = shaped.recommendedStartingSkill?.skillId || shaped.recommendedStartingSkillId || 'F001';
  const startingSkillName = shaped.recommendedStartingSkill?.name || skillName(startingSkillId);
  const masteredNames = (shaped.masteredSkills || []).slice(0, 5).map((s) => s.name || skillName(s.skillId));
  const weakNames = (shaped.weakSkills || []).slice(0, 5).map((s) => s.name || skillName(s.skillId));
  const score = shaped.overallFractionReadinessScore ?? 0;
  const correct = Number(shaped.questionsCorrect ?? shaped.correctCount ?? 0);
  const total = Number(shaped.totalQuestions ?? shaped.questionsAnswered ?? 0);
  const calibrated = shaped.confidenceCalibrationSummary || {};
  const summaryText = score <= 0
    ? 'This check-in did not show secure Fractions evidence yet. Start with the recommended skill and build from there.'
    : (shaped.studentFriendlySummary || 'Your diagnostic is complete. Let’s begin at the recommended skill.');

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Diagnostic Results" subtitle="Your fractions placement is ready." />
      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Current Fractions Readiness</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="font-mono text-3xl font-semibold text-navy-700">{score}/100</p>
            <Badge tone="navy">{readinessBand(score)}</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-navy-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Questions correct</p>
              <p className="mt-1 font-mono text-xl font-semibold text-navy-700">{correct}/{total || '-'}</p>
            </div>
            <div className="rounded-xl bg-bone px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Confidence calibration</p>
              <p className="mt-1 text-sm font-semibold text-ink-700">{Math.round((Number(shaped.confidenceScore || 0) || 0) * 100)}%</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-600">{summaryText}</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-700">Timing + fluency</p>
            <Badge tone="navy">{shaped.timingAnalytics?.overall ? 'Available' : 'Processing'}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-navy-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Question attempts</p>
              <p className="mt-1 font-mono text-xl font-semibold text-navy-700">{timingOverall.question_attempts ?? 0}</p>
            </div>
            <div className="rounded-xl bg-bone px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Avg response time</p>
              <p className="mt-1 text-xl font-semibold text-ink-700">{timingOverall.average_response_time == null ? '--' : `${Number(timingOverall.average_response_time).toFixed(1)}s`}</p>
            </div>
            <div className="rounded-xl bg-success-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Avg skip rate</p>
              <p className="mt-1 text-xl font-semibold text-success-800">{timingOverall.average_skip_rate == null ? '--' : `${Number(timingOverall.average_skip_rate).toFixed(1)}%`}</p>
            </div>
            <div className="rounded-xl bg-gold-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Avg fluency score</p>
              <p className="mt-1 text-xl font-semibold text-gold-800">{timingOverall.average_fluency_score == null ? '--' : `${Number(timingOverall.average_fluency_score).toFixed(1)}`}</p>
            </div>
          </div>
          {timingBySkill.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">By skill (top)</p>
              <div className="space-y-2">
                {timingBySkill.map((row) => (
                  <div key={row.skillId} className="grid gap-2 rounded-xl bg-white border border-hairline px-3 py-2 text-sm">
                    <p className="font-semibold text-ink-900">{skillName(row.skillId)}</p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <span>Accuracy: <b>{row.accuracy == null ? '-' : `${row.accuracy.toFixed(0)}%`}</b></span>
                      <span>Attempts: <b>{row.attempts}</b></span>
                      <span>Time: <b>{row.avgSeconds == null ? '-' : `${row.avgSeconds.toFixed(1)}s`}</b></span>
                      <span>Fluency: <b>{row.fluency == null ? '-' : `${row.fluency.toFixed(0)}`}</b></span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <span>Skip: <b>{row.skipRate == null ? '-' : `${row.skipRate.toFixed(0)}%`}</b></span>
                      <span>Consistency: <b>{row.consistency == null ? '-' : `${row.consistency.toFixed(0)}%`}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Recommended Starting Skill</p>
          <p className="mt-1 text-lg font-semibold text-navy-700">{startingSkillName}</p>
          <p className="mt-2 text-sm text-ink-600">
            {shaped.parentPlacementSummary || 'We recommend starting from this skill before moving to harder fraction operations.'}
          </p>
        </Card>

        <CollapsibleSection
          title="Detailed placement report"
          summary="Strengths, areas to work on, and placement confidence."
        >
          <div className="space-y-5">
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-ink-700">Strengths</p>
                  {masteredNames.length ? (
                    <ul className="mt-2 list-disc pl-5 text-sm text-ink-600">
                      {masteredNames.map((name) => <li key={name}>{name}</li>)}
                    </ul>
                  ) : <p className="mt-2 text-sm text-ink-500">Keep going — strengths will grow with practice.</p>}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-700">Areas to Work On</p>
                  {weakNames.length ? (
                    <ul className="mt-2 list-disc pl-5 text-sm text-ink-600">
                      {weakNames.map((name) => <li key={name}>{name}</li>)}
                    </ul>
                  ) : <p className="mt-2 text-sm text-ink-500">No major weak areas detected in this scan.</p>}
                </div>
              </div>
            </div>
            <div className="border-t border-hairline pt-4">
              <p className="text-sm font-semibold text-ink-700">Placement Confidence</p>
              <p className="mt-2 text-sm text-ink-600">
                Readiness score is based on correct answers, skipped questions, skill coverage, time spent, and confidence choices.
                Confidence calibration compares how sure you felt with whether the answer was correct.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <p className="rounded-lg bg-success-100 px-3 py-2 text-sm text-success-700">Mastery signals: {calibrated.masterySignals || 0}</p>
                <p className="rounded-lg bg-gold-100 px-3 py-2 text-sm text-gold-800">Lucky correct: {calibrated.luckyCorrect || 0}</p>
                <p className="rounded-lg bg-error-100 px-3 py-2 text-sm text-error-700">Misconception alerts: {calibrated.misconceptionAlerts || 0}</p>
                <p className="rounded-lg bg-bone px-3 py-2 text-sm text-ink-700">Learning gaps: {calibrated.learningGaps || 0}</p>
              </div>
              {shaped.studentPlacementReport?.suggestedFirstSession && (
                <p className="mt-2 text-sm text-ink-600">{shaped.studentPlacementReport.suggestedFirstSession}</p>
              )}
            </div>
          </div>
        </CollapsibleSection>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            size="l"
            icon={ArrowRight}
            onClick={() => navigate('/student/mathpath/practice/recommended-diagnostic', {
              state: {
                skillId: startingSkillId,
                questionCount: shaped.nextPracticePayload?.questionCount || 8,
                sessionType: 'practice',
                source: 'diagnostic-placement',
              },
            })}
          >
            Start Recommended Practice
          </Button>
          <Button size="l" variant="secondary" onClick={() => navigate('/student/mathpath')}>
            View Fractions Path
          </Button>
        </div>
      </div>
    </div>
  );
}
