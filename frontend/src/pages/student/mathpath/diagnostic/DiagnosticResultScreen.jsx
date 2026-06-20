import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { Card, Button, Badge, ErrorState, PageHeader, Spinner, CollapsibleSection, Tooltip } from '../../../../components/ui';
import { getUniversalSkillByFrameworkId } from '../../../../mathpath/curriculum';
import { mathpathAPI } from '../../../../services/api';

function skillName(skillId) {
  const normalized = String(skillId || '').toUpperCase();
  if (!/^F\d{3}$/.test(normalized)) return skillId;
  return getUniversalSkillByFrameworkId(normalized)?.title || normalized;
}

function mapConfidenceLevel(level) {
  const v = String(level || '').toLowerCase();
  if (v === 'high' || v === 'i_know_this') return 0.85;
  if (v === 'medium' || v === 'pretty_sure' || v === 'not_sure') return 0.65;
  if (v === 'low' || v === 'i_need_help') return 0.45;
  return 0.45;
}

function readinessBand(score = 0) {
  if (score >= 85) return 'Super Strong';
  if (score >= 70) return 'On Track';
  if (score >= 55) return 'Getting There';
  return 'Just Starting';
}

function fluencySignal({ accuracyRate, speedScore, skipRate }) {
  const accuracy = Number(accuracyRate ?? 0);
  const skip = Number(skipRate ?? 0);
  const speed = Number(speedScore ?? 0);

  if (skip >= 35 && accuracy >= 70 && speed >= 55) return 'Skipped quickly';
  if (skip >= 35 && (speed === 0 || speed < 55)) return 'Tried then skipped';
  if (accuracy >= 85 && speed >= 65) return 'Quick and correct';
  if (accuracy >= 85 && speed < 65) return 'Got it — just take your time';
  if (accuracy < 70 && speed >= 55) return 'Fast but a tricky spot';
  return 'Needs more practice';
}

const FLUENCY_SIGNAL_EXPLANATIONS = {
  'Quick and correct': 'You got it right and fast — awesome!',
  'Got it — just take your time': "You know this — keep going and speed will come.",
  'Fast but a tricky spot': "You answered fast, but something here is tricky. Let's look again.",
  'Needs more practice': "This one is hard right now — a little practice will help a lot.",
  'Skipped quickly': 'You skipped this fast — give it a try next time!',
  'Tried then skipped': 'You had a go before skipping — nice effort.',
};

const FLUENCY_SIGNAL_LEGEND = ['Quick and correct', 'Got it — just take your time', 'Fast but a tricky spot', 'Needs more practice', 'Skipped quickly', 'Tried then skipped'].map((label) => ({
  label,
  meaning: FLUENCY_SIGNAL_EXPLANATIONS[label] || '',
}));

function formatPercent(value) {
  return value == null ? '-' : `${Number(value).toFixed(0)}%`;
}

function formatSeconds(value) {
  return value == null ? '-' : `${Number(value).toFixed(1)}s`;
}

export default function DiagnosticResultScreen() {
  const { diagnosticSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [timingAnalytics, setTimingAnalytics] = useState(location.state?.timingAnalytics || null);
  const [loading, setLoading] = useState(!location.state?.result || !location.state?.timingAnalytics);
  const [recheckSummary, setRecheckSummary] = useState(location.state?.recheckSummary || null);
  const [recheckSummaryLoading, setRecheckSummaryLoading] = useState(false);
  const [assigningRecovery, setAssigningRecovery] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [startingRemediation, setStartingRemediation] = useState(false);
  const [remediationError, setRemediationError] = useState('');

  useEffect(() => {
    let mounted = true;
    const hasFreshResult = Boolean(location.state?.result && location.state?.timingAnalytics);
    if (hasFreshResult) return () => { mounted = false; };
    (async () => {
      try {
        const { data } = await mathpathAPI.getDiagnostic(diagnosticSessionId);
        if (!mounted) return;
        const persisted = data?.result || null;
        setResult(persisted ? {
          ...persisted,
          sessionId: data.sessionId,
          mode: data.mode,
          diagnosticPurpose: data.diagnosticPurpose,
          assignmentId: data.assignmentId,
        } : null);
        setTimingAnalytics(data?.timingAnalytics || null);
      } catch (_) {
        if (mounted) setResult(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [diagnosticSessionId, location.state?.result, location.state?.timingAnalytics]);

  useEffect(() => {
    let mounted = true;
    const purpose = result?.diagnosticPurpose || location.state?.diagnosticPurpose;
    if (purpose !== 'recheck' || recheckSummary || !diagnosticSessionId) return () => { mounted = false; };
    setRecheckSummaryLoading(true);
    mathpathAPI.getRecheckSummary(diagnosticSessionId, { assignmentId: result?.assignmentId || location.state?.assignmentId || '' })
      .then((res) => {
        if (mounted) setRecheckSummary(res.data?.summary || null);
      })
      .catch(() => {
        if (mounted) setRecheckSummary(null);
      })
      .finally(() => {
        if (mounted) setRecheckSummaryLoading(false);
      });
    return () => { mounted = false; };
  }, [diagnosticSessionId, location.state?.assignmentId, location.state?.diagnosticPurpose, recheckSummary, result?.assignmentId, result?.diagnosticPurpose]);

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
      confidenceScore: mapConfidenceLevel(result.confidenceLevel),
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
        confidenceCalibration: row.confidence_calibration,
        speedScore: row.speed_score,
      }))
      .filter((row) => row.skillId);
  }, [shaped]);

  const timingOverall = shaped?.timingAnalytics?.overall || {};

  if (loading) return <Spinner label="Getting your results ready…" />;

  if (!shaped) {
    return <ErrorState message="We couldn't find your check-in results. Let's try the check-in again." onRetry={() => navigate('/student/mathpath/diagnostic')} />;
  }

  const startingSkillId = shaped.recommendedStartingSkill?.skillId || shaped.recommendedStartingSkillId || 'F001';
  const startingSkillName = shaped.recommendedStartingSkill?.name || skillName(startingSkillId);
  const masteredNames = (shaped.masteredSkills || []).slice(0, 5).map((s) => s.name || skillName(s.skillId));
  const weakNames = (shaped.weakSkills || []).slice(0, 5).map((s) => s.name || skillName(s.skillId));
  const score = shaped.overallFractionReadinessScore ?? 0;
  const correct = Number(shaped.questionsCorrect ?? shaped.correctCount ?? 0);
  const total = Number(shaped.totalQuestions ?? shaped.questionsAnswered ?? 0);
  const calibrated = shaped.confidenceCalibrationSummary || {};
  const readinessComponents = shaped.readinessComponents || shaped.explainability?.readinessComponents || null;
  const rootCauses = shaped.rootCauses || shaped.explainability?.rootCauses || [];
  const misconceptions = shaped.misconceptions || shaped.explainability?.misconceptions || [];
  const skillEvidence = shaped.explainability?.skillEvidence || [];
  const recommendations = shaped.recommendations || shaped.explainability?.recommendations || {};
  const weakSkillIds = [
    ...(shaped.weakSkillIds || []),
    ...(shaped.weakSkills || []).map((skill) => skill.skillId || skill),
  ].map((skillId) => String(skillId || '').toUpperCase()).filter(Boolean);
  const summaryText = score <= 0
    ? "Great effort finishing your check-in! Fractions are still new for you, so let's start with the skill below and build up together."
    : (shaped.studentFriendlySummary || "Nice work — your check-in is done! Let's start with the skill below.");

  if ((shaped.diagnosticPurpose || location.state?.diagnosticPurpose) === 'recheck') {
    if (recheckSummaryLoading && !recheckSummary) {
      return <Spinner label="Loading your recheck progress..." />;
    }
    const summary = recheckSummary;
    if (summary) {
      return (
        <div className="mx-auto max-w-3xl">
          <PageHeader title={summary.title || 'Recheck Complete'} subtitle="Here is what changed after your Recovery Pack." />
          <div className="space-y-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Nice work</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-emerald-deep">{summary.encouragementMessage}</h2>
              {summary.recoveryPackContext?.message && (
                <p className="mt-3 rounded-xl bg-emerald-tint px-3 py-2 text-sm font-semibold text-emerald-deep">
                  {summary.recoveryPackContext.message}
                </p>
              )}
              {summary.overallImprovement !== null && summary.overallImprovement !== undefined && (
                <p className="mt-3 text-sm text-ink-600">
                  Overall improvement: <span className="font-semibold text-emerald-deep">{summary.overallImprovement > 0 ? '+' : ''}{summary.overallImprovement}</span>
                </p>
              )}
              <p className="mt-3 text-sm text-ink-700">{summary.coachingExplanation}</p>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <p className="font-semibold text-ink-800">What improved</p>
                {summary.improvedSkills?.length ? (
                  <div className="mt-3 space-y-2">
                    {summary.improvedSkills.map((skill) => (
                      <div key={skill.displayName} className="rounded-xl bg-success-100 px-3 py-2">
                        <p className="font-semibold text-success-700">{skill.displayName}</p>
                        <p className="mt-1 text-sm text-success-700">You improved by {skill.improvement > 0 ? '+' : ''}{skill.improvement} points.</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-ink-500">This recheck helps us choose the next practice step.</p>
                )}
              </Card>

              <Card className="p-5">
                <p className="font-semibold text-ink-800">Keep practising</p>
                {summary.stillNeedsWork?.length ? (
                  <div className="mt-3 space-y-2">
                    {summary.stillNeedsWork.map((skill) => (
                      <div key={skill.displayName} className="rounded-xl bg-gold-tint px-3 py-2">
                        <p className="font-semibold text-gold-deep">{skill.displayName}</p>
                        <p className="mt-1 text-sm text-gold-deep">You are getting better, and this still needs a little more practice.</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-ink-500">No major areas from this pack need extra practice right now.</p>
                )}
              </Card>
            </div>

            {summary.resolvedMisconceptions?.length ? (
              <Card className="p-5">
                <p className="font-semibold text-ink-800">A tricky mistake you are improving</p>
                <div className="mt-3 space-y-2">
                  {summary.resolvedMisconceptions.map((item) => (
                    <p key={item.title} className="rounded-xl bg-surface-white px-3 py-2 text-sm text-ink-700">{item.explanation}</p>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card className="p-5">
              <p className="font-semibold text-ink-800">Try this next</p>
              <p className="mt-2 text-lg font-semibold text-emerald-deep">{summary.nextRecommendedAction?.label || 'Continue Practice'}</p>
              <p className="mt-1 text-sm text-ink-600">{summary.nextRecommendedAction?.reason || 'This will help you keep building confidence.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button icon={ArrowRight} onClick={() => navigate('/student/mathpath/assignments')}>
                  Continue
                </Button>
                <Button variant="secondary" onClick={() => navigate('/student/progress')}>
                  View Progress
                </Button>
              </div>
            </Card>
          </div>
        </div>
      );
    }
  }
  const startRemediationJourney = async () => {
    setRemediationError('');
    setStartingRemediation(true);
    try {
      const { data } = await mathpathAPI.startRemediationSession({ diagnosticSessionId });
      const sessionId = data?.session?._id || data?.session?.id || data?._id || data?.id;
      if (sessionId) {
        navigate(`/student/mathpath/remediation/${sessionId}`);
      } else {
        setRemediationError('Session created but no ID returned.');
      }
    } catch (err) {
      setRemediationError(err?.response?.data?.error || "We couldn't start a catch-up journey just now. Please try again.");
    } finally {
      setStartingRemediation(false);
    }
  };

  const assignRecoveryPack = async () => {
    setAssignmentMessage('');
    setAssignmentError('');
    setAssigningRecovery(true);
    try {
      await mathpathAPI.createAssignmentFromDiagnostic({ diagnosticSessionId });
      setAssignmentMessage('Recovery Pack created.');
      navigate('/student/mathpath/assignments');
    } catch (err) {
      setAssignmentError(err?.response?.data?.error || 'Could not assign a Recovery Pack from this diagnostic yet.');
    } finally {
      setAssigningRecovery(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Your Check-in Results" subtitle="Here's where you're starting and what to practise next." />
      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">How you did</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-tint px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Questions Correct</p>
              <p className="mt-1 font-mono text-xl font-semibold text-emerald-deep">{correct}/{total || '-'}</p>
            </div>
            <div className="rounded-xl bg-emerald-tint px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Your Score</p>
              <p className="mt-1 font-mono text-xl font-semibold text-emerald-deep">{score}/100</p>
            </div>
            <div className="rounded-xl bg-bone px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">How sure you felt</p>
              <p className="mt-1 text-sm font-semibold text-ink-700">{Math.round((Number(shaped.confidenceScore || 0) || 0) * 100)}%</p>
            </div>
            <div className="rounded-xl bg-surface-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Where you're at</p>
              <p className="mt-1 text-sm font-semibold text-ink-700">{readinessBand(score)}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <p className="rounded-xl bg-surface-white px-3 py-2 text-sm text-ink-700 sm:col-span-2">{summaryText}</p>
          </div>
        </Card>

        {readinessComponents && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-700">What helped your score</p>
              <Badge tone="navy">Explained</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              {[
                ['What you know', readinessComponents.knowledge],
                ['How smoothly', readinessComponents.fluency],
                ['How sure', readinessComponents.confidence],
                ['Remembering', readinessComponents.retention == null ? 'Not yet' : readinessComponents.retention],
                ['Your working', readinessComponents.workingQuality],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-surface-white px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-emerald-deep">{value}{typeof value === 'number' ? '/100' : ''}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-600">{readinessComponents.explanation}</p>
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-700">What tripped you up</p>
            <Badge tone={rootCauses.length ? 'gold' : 'success'}>{rootCauses.length ? 'Let’s look' : 'Nothing big'}</Badge>
          </div>
          {rootCauses.length ? (
            <div className="space-y-3">
              {rootCauses.slice(0, 3).map((cause) => (
                <div key={cause.rootCauseId} className="rounded-xl border border-line-soft bg-white px-3 py-3 text-sm">
                  <p className="font-semibold text-ink-900">{cause.title}</p>
                  <p className="mt-1 text-ink-600">{cause.why}</p>
                  <p className="mt-2 text-emerald-deep"><span className="font-semibold">Let’s try:</span> {cause.suggestedIntervention}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-600">Nothing big got in your way! Keep practising the skill below and you'll only get stronger.</p>
          )}
          {misconceptions.length > 0 && (
            <div className="mt-4 rounded-xl bg-gold-tint2 px-3 py-3 text-sm text-gold-deep">
              <p className="font-semibold">A tricky spot to watch</p>
              <p className="mt-1">{misconceptions[0].description}</p>
            </div>
          )}
        </Card>

        {skillEvidence.length > 0 && (
          <CollapsibleSection
            title="A closer look at each skill"
            summary="How you did on each skill — questions, time, and your working."
          >
            <div className="space-y-2">
              {skillEvidence.slice(0, 6).map((row) => (
                <div key={row.skillId} className="rounded-xl border border-line-soft bg-white px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink-900">{row.skillName}</p>
                    <Badge tone={row.masteryBand === 'Mastered' || row.masteryBand === 'Secure' ? 'success' : 'gold'}>{row.masteryBand}</Badge>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-4">
                    <span>Got right: <b>{row.questionsCorrect}/{row.questionsAttempted}</b></span>
                    <span>To fix: <b>{row.questionsWrong}</b></span>
                    <span>Time: <b>{row.averageTimeSeconds == null ? '-' : `${row.averageTimeSeconds}s`}</b></span>
                    <span>Showed working: <b>{row.workingEvidenceRate}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-700">Speed and confidence</p>
            <Badge tone="navy">{shaped.timingAnalytics?.overall ? 'Ready' : 'Working on it'}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-tint px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Questions you tried</p>
              <p className="mt-1 font-mono text-xl font-semibold text-emerald-deep">{timingOverall.question_attempts ?? 0}</p>
            </div>
            <div className="rounded-xl bg-bone px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Time per question</p>
              <p className="mt-1 text-xl font-semibold text-ink-700">{timingOverall.average_response_time == null ? '--' : `${Number(timingOverall.average_response_time).toFixed(1)}s`}</p>
            </div>
            <div className="rounded-xl bg-success-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">How often you skipped</p>
              <p className="mt-1 text-xl font-semibold text-success-800">{timingOverall.average_skip_rate == null ? '--' : `${Number(timingOverall.average_skip_rate).toFixed(1)}%`}</p>
            </div>
            <div className="rounded-xl bg-gold-tint2 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">How smoothly you worked</p>
              <p className="mt-1 text-xl font-semibold text-gold-deep">{timingOverall.average_fluency_score == null ? '--' : `${Number(timingOverall.average_fluency_score).toFixed(1)}`}</p>
            </div>
          </div>
          {timingBySkill.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">A peek at your top skills</p>
              <div className="space-y-2">
                {timingBySkill.map((row) => {
                  const signal = fluencySignal(row);
                  return (
                    <div key={row.skillId} className="grid gap-2 rounded-xl bg-white border border-line-soft px-3 py-2 text-sm">
                    <p className="font-semibold text-ink-900">{skillName(row.skillId)}</p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <span>Got right: <b>{formatPercent(row.accuracy)}</b></span>
                      <span>Tries: <b>{row.attempts}</b></span>
                      <span>Time: <b>{formatSeconds(row.avgSeconds)}</b></span>
                      <span>Smooth-ness: <b>{row.fluency == null ? '-' : `${row.fluency.toFixed(0)}`}</b></span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <span>Skipped: <b>{formatPercent(row.skipRate)}</b></span>
                      <span>Steadiness: <b>{row.consistency == null ? '-' : `${row.consistency.toFixed(0)}%`}</b></span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <span>Sure-and-right: <b>{row.confidenceCalibration == null ? '-' : `${row.confidenceCalibration.toFixed(0)}%`}</b></span>
                      <span className="flex items-center gap-1">
                        How it went: <b>{signal}</b>
                        <Tooltip label={FLUENCY_SIGNAL_EXPLANATIONS[signal] || 'This looks at how many you got right, how fast you went, and what you skipped.'}>
                          <HelpCircle className="h-4 w-4 text-ink-400" aria-hidden="true" />
                        </Tooltip>
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-4 grid gap-2 rounded-xl border border-line-soft bg-white px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">What these mean</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {FLUENCY_SIGNAL_LEGEND.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg bg-surface-white px-2 py-1.5 text-xs">
                  <span className="font-semibold text-ink-700">{item.label}</span>
                  <Tooltip label={item.meaning}>
                    <HelpCircle className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Where to start</p>
          <p className="mt-1 text-lg font-semibold text-emerald-deep">{startingSkillName}</p>
          <p className="mt-2 text-sm text-ink-600">
            {recommendations.student || shaped.parentPlacementSummary || "Let's begin here, then move on to trickier fractions when you're ready."}
          </p>
          {recommendations.parent && (
            <p className="mt-2 rounded-xl bg-surface-white px-3 py-2 text-sm text-ink-700">{recommendations.parent}</p>
          )}
        </Card>

        <CollapsibleSection
          title="Your strengths and next steps"
          summary="What you're great at and what to practise next."
        >
          <div className="space-y-5">
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-ink-700">You're great at</p>
                  {masteredNames.length ? (
                    <ul className="mt-2 list-disc pl-5 text-sm text-ink-600">
                      {masteredNames.map((name) => <li key={name}>{name}</li>)}
                    </ul>
                  ) : <p className="mt-2 text-sm text-ink-500">Keep going — your strengths will grow with practice!</p>}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-700">Let's practise</p>
                  {weakNames.length ? (
                    <ul className="mt-2 list-disc pl-5 text-sm text-ink-600">
                      {weakNames.map((name) => <li key={name}>{name}</li>)}
                    </ul>
                  ) : <p className="mt-2 text-sm text-ink-500">Nothing tricky stood out this time — awesome!</p>}
                </div>
              </div>
            </div>
            <div className="border-t border-line-soft pt-4">
              <p className="text-sm font-semibold text-ink-700">How we worked this out</p>
              <p className="mt-2 text-sm text-ink-600">
                Your score looks at your correct answers, the questions you skipped, the skills you tried, how long you took, and how sure you felt.
                We also compare how sure you felt with how your answers turned out.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <p className="rounded-lg bg-success-100 px-3 py-2 text-sm text-success-700">Knew it and got it: {calibrated.masterySignals || 0}</p>
                <p className="rounded-lg bg-gold-tint px-3 py-2 text-sm text-gold-deep">Lucky guesses: {calibrated.luckyCorrect || 0}</p>
                <p className="rounded-lg bg-error-100 px-3 py-2 text-sm text-error-700">Tricky spots: {calibrated.misconceptionAlerts || 0}</p>
                <p className="rounded-lg bg-bone px-3 py-2 text-sm text-ink-700">Still to learn: {calibrated.learningGaps || 0}</p>
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
          {weakSkillIds.length > 0 && (
            <Button
              size="l"
              variant="secondary"
              onClick={startRemediationJourney}
              disabled={startingRemediation}
            >
              {startingRemediation ? 'Starting...' : 'Start a Catch-up Journey'}
            </Button>
          )}
          {weakSkillIds.length > 0 && (
            <Button
              size="l"
              variant="ghost"
              onClick={assignRecoveryPack}
              disabled={assigningRecovery}
            >
              {assigningRecovery ? 'Creating...' : 'Create Recovery Pack'}
            </Button>
          )}
          <Button size="l" variant="secondary" onClick={() => navigate('/student/mathpath')}>
            View Fractions Path
          </Button>
          <Button size="l" variant="ghost" onClick={() => navigate('/student/mathpath/assignments')}>
            View Recovery Packs
          </Button>
        </div>
        {assignmentMessage && <p className="text-sm font-semibold text-success-700">{assignmentMessage}</p>}
        {assignmentError && <p className="text-sm font-semibold text-error-700">{assignmentError}</p>}
        {remediationError && <p className="text-sm font-semibold text-error-700">{remediationError}</p>}
      </div>
    </div>
  );
}
