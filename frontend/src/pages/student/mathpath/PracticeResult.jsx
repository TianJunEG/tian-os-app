import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Wrench } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, StatTile, ProgressBar, PageHeader, Spinner, EmptyState, CollapsibleSection } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import { getUniversalSkillByFrameworkId } from '../../../mathpath/curriculum';

function canonicalSkillName(skillId, fallback = '') {
  const normalized = String(skillId || '').toUpperCase();
  if (!/^F\d{3}$/.test(normalized)) return fallback || String(skillId || '');
  return getUniversalSkillByFrameworkId(normalized)?.title || fallback || normalized;
}

// End-of-session summary: score, skills practised, mistakes, recommended next.
export default function PracticeResult() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const [data, setData] = useState(null);
  const [recommended, setRecommended] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, m] = await Promise.all([mathpathAPI.getSession(sessionId), mathpathAPI.mastery()]);
        setData(s.data);
        setRecommended(m.data.recommended);
      } finally { setLoading(false); }
    })();
  }, [sessionId]);

  if (loading) return <Spinner label="Scoring…" />;
  if (!data) return <EmptyState message="Could not load these results." />;

  const { stats, skills, mistakes } = data;
  // Route follow-on actions by module/feature so a session returns where it began
  // (Science → Science, an assigned Mastery Worksheet → the worksheets list).
  const isScience = data.session?.module === 'Science Adaptive Revision';
  const isWorksheet = data.session?.feature === 'Mastery Worksheet';
  const isFluency = data.session?.mode === 'fluency' || data.session?.feature === 'Fluency Practice';
  const explicitHomeBase = state.homeBase || state.backTo;
  const homeBase = explicitHomeBase || (isScience ? '/student/science' : isWorksheet ? '/student/worksheets' : '/student/mathpath');
  const defaultHomeLabel = isScience ? 'Continue Science Revision' : isWorksheet ? 'Back to worksheets' : 'Continue MathPath';
  const homeLabel = state.homeLabel || (explicitHomeBase
    ? explicitHomeBase.includes('/mistakes') ? 'Back to mistake review'
      : explicitHomeBase.includes('/fluency') ? 'Continue Fluency'
      : defaultHomeLabel
    : defaultHomeLabel);
  const mistakesBase = state.mistakesBase || (isScience ? '/student/science/mistakes' : '/student/mathpath/mistakes');

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Session complete" subtitle="Nice work — here's how it went." />

      <Card className="mb-5 p-6 text-center">
        <div className="font-mono text-5xl font-semibold tabular-nums text-navy-700">{stats.accuracy}%</div>
        <p className="mt-1 text-sm text-ink-500">{stats.correct} of {stats.total} correct</p>
        <ProgressBar value={stats.correct} max={Math.max(stats.total, 1)} className="mt-4" />
      </Card>

      <Card className="mb-5 p-5">
        <div className="flex items-center gap-6">
          <StatTile label="Correct" value={stats.correct} />
          <StatTile label="To review" value={stats.incorrect} />
          <StatTile label="Avg time" value={stats.avgTimeMs ? Math.round(stats.avgTimeMs / 1000) : '—'} suffix={stats.avgTimeMs ? 's' : ''} />
        </div>
      </Card>

      {isFluency && stats.fluencyScore !== null && stats.fluencyScore !== undefined && (
        <Card className="mb-5 border-l-4 border-l-violet-400 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">Fluency Score</div>
          <div className="mt-1 font-mono text-2xl sm:text-3xl font-semibold text-navy-700">{Math.round(Number(stats.fluencyScore))}</div>
          <p className="mt-1 text-sm text-ink-500">Your fluency score combines accuracy and speed.</p>
        </Card>
      )}

      <CollapsibleSection
        title="Skills practised"
        summary={`${skills.length} skill${skills.length === 1 ? '' : 's'} covered in this session`}
        className="mb-5"
      >
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => <Badge key={s.id} tone="navy">{s.name}</Badge>)}
        </div>
      </CollapsibleSection>

      {mistakes.length > 0 && (
        <CollapsibleSection
          title={`Mistakes to review (${mistakes.length})`}
          summary="Open when you are ready to check the exact questions."
          className="mb-5"
        >
          <ul className="space-y-3">
            {mistakes.map((m) => (
              <li key={m.id} className="text-sm">
                <div className="text-ink-700"><MathText text={m.stem} /></div>
                <div className="mt-0.5 text-ink-500">You: <MathText text={m.yourAnswer} className="font-mono" /> · Answer: <MathText text={m.correctAnswer} className="font-mono text-success-700" /></div>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {recommended && (
        <Card className="mb-5 border-l-4 border-l-gold-400 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700">Recommended next</div>
          <p className="mt-0.5 text-sm text-ink-700">{canonicalSkillName(recommended.skillId, recommended.skillName)} <span className="text-ink-500">· {recommended.topicName}</span></p>
        </Card>
      )}

      {mistakes.length > 0 && (
        <Card className="mb-5 border-l-4 border-l-amber-400 p-4">
          <p className="text-sm font-medium text-amber-800">
            You have {mistakes.length} mistake{mistakes.length === 1 ? '' : 's'} to learn from before continuing.
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Review each mistake, reflect on what went wrong, and correct it.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {mistakes.length > 0 && (
          <Button icon={Wrench} onClick={() => navigate(mistakesBase)} className="flex-1">Review mistakes</Button>
        )}
        {!isScience && !isWorksheet && (
          <Button variant="secondary" onClick={() => navigate('/student/progress')} className="flex-1">View progress</Button>
        )}
        <Button
          variant={mistakes.length > 0 ? 'ghost' : 'primary'}
          icon={ArrowRight}
          disabled={mistakes.length > 0}
          onClick={() => navigate(homeBase)}
          className="flex-1"
          title={mistakes.length > 0 ? 'Review your mistakes first' : undefined}
        >
          {homeLabel}
        </Button>
      </div>
    </div>
  );
}
