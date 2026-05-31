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
  const [loading, setLoading] = useState(!location.state?.result);

  useEffect(() => {
    let mounted = true;
    if (result) return () => { mounted = false; };
    (async () => {
      try {
        const { data } = await mathpathAPI.getDiagnostic(diagnosticSessionId);
        if (!mounted) return;
        const persisted = data?.result || null;
        setResult(persisted ? { ...persisted, sessionId: data.sessionId, mode: data.mode } : null);
      } catch (_) {
        if (mounted) setResult(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [diagnosticSessionId, result]);

  const shaped = useMemo(() => {
    if (!result) return null;
    if (result.recommendedStartingSkill) return result;
    return {
      ...result,
      recommendedStartingSkill: {
        skillId: result.recommendedStartingSkillId || 'F001',
        name: skillName(result.recommendedStartingSkillId || 'F001'),
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
    };
  }, [result]);

  if (loading) return <Spinner label="Loading placement…" />;

  if (!shaped) {
    return <ErrorState message="No diagnostic result found. Please run the diagnostic again." onRetry={() => navigate('/student/mathpath/diagnostic')} />;
  }

  const startingSkillId = shaped.recommendedStartingSkill?.skillId || shaped.recommendedStartingSkillId || 'F001';
  const startingSkillName = shaped.recommendedStartingSkill?.name || skillName(startingSkillId);
  const masteredNames = (shaped.masteredSkills || []).slice(0, 5).map((s) => s.name || skillName(s.skillId));
  const weakNames = (shaped.weakSkills || []).slice(0, 5).map((s) => s.name || skillName(s.skillId));
  const score = shaped.overallFractionReadinessScore ?? 0;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Diagnostic Results" subtitle="Your fractions placement is ready." />
      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Current Fractions Readiness</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="font-mono text-3xl font-semibold text-navy-700">{score}</p>
            <Badge tone="navy">{readinessBand(score)}</Badge>
          </div>
          <p className="mt-3 text-sm text-ink-600">{shaped.studentFriendlySummary || 'Your diagnostic is complete. Let’s begin at the recommended skill.'}</p>
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
                Readiness level: <span className="font-semibold">{shaped.readinessLevel || readinessBand(score)}</span>
                {' '}· Confidence score: <span className="font-semibold">{Math.round((Number(shaped.confidenceScore || 0) || 0) * 100)}%</span>
              </p>
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
