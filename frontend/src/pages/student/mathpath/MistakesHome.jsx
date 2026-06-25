import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Dumbbell, ChevronRight, PartyPopper } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState, ErrorState } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import { useAuth } from '../../../context/AuthContext';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../../design-os/studentVisualMode';
import { MascotBubble } from '../../../components/MascotAvatar';
import { getMascotForModule } from '../../../config/mascots';

function formatMistakeDate(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const LEARNING_STATUS_LABEL = {
  new: 'New',
  acknowledged: 'Found',
  corrected: 'Corrected',
  understood: 'Understood',
  mastered: 'Mastered',
};

// MathPath › Mistake-to-Mastery — home. Recent mistakes, weak skills from
// mistakes, recommended mastery practice. Reuses the shared practice screens.
export default function MistakesHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const visualStyles = getVisualModeStyles(resolveStudentVisualMode(user || {}));
  const [data, setData] = useState(null);
  const [mastery, setMastery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [fallbackMessage, setFallbackMessage] = useState('');

  const load = useCallback(async () => {
    try {
      // 'mathpath' surfaces curriculum mistakes across all domains (fractions +
      // decimals, circles, algebra, …) while excluding fluency/times-table slips.
      const [mk, ms] = await Promise.all([mathpathAPI.mistakes({ domain: 'mathpath' }), mathpathAPI.mastery()]);
      console.info('[mistakes] loaded', {
        count: mk.data?.mistakes?.length || 0,
        weakSkillCount: mk.data?.weakSkills?.length || 0,
      });
      setData(mk.data); setMastery(ms.data);
    } catch (e) { setError(e.response?.data?.error || 'Could not load mistakes.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const practise = async (skillRef) => {
    const skillId = typeof skillRef === 'string'
      ? skillRef
      : (skillRef?.skillId || skillRef?.skillCode || skillRef?.id || '');
    if (!skillId) {
      setFallbackMessage('No recommended skill is available yet. Opening MathPath so you can choose the next practice.');
      navigate('/student/mathpath', {
        state: { message: 'No recommended skill is available yet. Choose a skill to practise.' },
      });
      return;
    }
    if (starting) return;
    setStarting(true);
    try {
      const isFrameworkSkillId = /^F\d{3}$/i.test(String(skillId || ''));
      if (isFrameworkSkillId) {
        navigate('/student/mathpath/practice/recommended-pathway', {
          state: {
            skillId: String(skillId).toUpperCase(),
            questionCount: 5,
            sessionType: 'remediation',
            source: 'mistakes-home',
            backTo: '/student/mathpath/mistakes',
            homeBase: '/student/mathpath/mistakes',
            homeLabel: 'Back to mistake review',
          },
        });
        return;
      }
      const { data: s } = await mathpathAPI.startSession({ feature: 'Mistake-to-Mastery', skillId, questionCount: 5 });
      navigate(`/student/mathpath/practice/${s.session_id}`, {
        state: {
          items: s.items,
          resultsBase: '/student/mathpath',
          backTo: '/student/mathpath/mistakes',
          homeBase: '/student/mathpath/mistakes',
          homeLabel: 'Back to mistake review',
          mistakesBase: '/student/mathpath/mistakes',
        },
      });
    } catch (e) {
      const msg = e.response?.data?.error || 'Could not start practice.';
      setStarting(false);
      // Don't dead-end on a recommended skill that has no questions in the practice
      // bank yet (e.g. generator-only skills like "Place value to 100 000"): send the
      // student to MathPath to pick a skill that works, instead of a stuck error screen.
      if (/no questions/i.test(msg)) {
        const name = (typeof skillRef === 'object' && skillRef?.skillName) || 'that skill';
        navigate('/student/mathpath', {
          state: { message: `We don't have practice questions for ${name} yet — pick another skill to practise.` },
        });
        return;
      }
      setError(msg);
    }
  };

  if (loading) return <Spinner label="Loading mistakes…" />;
  if (error) return <ErrorState message={error} onRetry={() => { setError(null); setLoading(true); load(); }} />;

  const recent = data?.mistakes || [];
  const weak = data?.weakSkills || [];
  const hasMistakes = (data?.mistakes || []).length > 0;
  const recommendedRaw = weak[0] || mastery?.recommended || null;
  const recommended = recommendedRaw ? {
    ...recommendedRaw,
    skillId: recommendedRaw.skillId || recommendedRaw.skillCode || recommendedRaw.id || '',
    skillCode: recommendedRaw.skillCode || '',
    skillName: recommendedRaw.skillName || recommendedRaw.name || recommendedRaw.title || 'the recommended skill',
  } : null;

  const mascot = getMascotForModule('mistakes');
  const firstName = (user?.name || 'there').split(' ')[0];
  const mascotMessage = hasMistakes
    ? `Hey ${firstName}, mistakes are how we grow. Let's turn these into wins!`
    : `No mistakes to review, ${firstName} — you're on fire!`;

  return (
    <div className={`${visualStyles.page} space-y-6 overflow-x-hidden`}>
      <PageHeader title="Mistake-to-Mastery" subtitle="MathPath · turn recent slips into mastery" />

      {mascot && (
        <MascotBubble name={mascot.key} message={mascotMessage} size="sm" voiced />
      )}

      <Card className={`p-5 ${visualStyles.heroCard}`}>
        <div className={`mb-1 flex items-center gap-2 ${visualStyles.accent}`}><Wrench className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Turn slips into mastery</span></div>
        <div className="font-display text-2xl font-semibold text-ink-900">{data ? data.mistakes.length : 0} to review</div>
        {recommended && <p className="mb-4 mt-1 text-sm text-ink-600">Recommended: practise <b className={`font-semibold ${visualStyles.accent}`}>{recommended.skillName}</b></p>}
        {fallbackMessage && <p className="mb-3 rounded-xl bg-gold-tint px-3 py-2 text-sm font-semibold text-gold-deep">{fallbackMessage}</p>}
        <div className="flex flex-wrap gap-2">
          {hasMistakes ? (
            <Button className={visualStyles.primaryCta} to="/student/mathpath/mistakes/review">Review mistakes</Button>
          ) : recommended?.skillId ? (
            <Button className={visualStyles.primaryCta} disabled={starting} onClick={() => practise(recommended)}>Complete more practice</Button>
          ) : (
            <Button className={visualStyles.primaryCta} to="/student/mathpath">Complete more practice</Button>
          )}
          {recommended && <Button variant="secondary" icon={Dumbbell} disabled={starting} onClick={() => practise(recommended)}>Practise similar</Button>}
        </div>
      </Card>

      {!hasMistakes && (
        <EmptyState
          icon={PartyPopper}
          message="No mistakes to review yet. Complete more practice and Tian OS will show questions to review here."
        />
      )}

      {hasMistakes && (
        <>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Weak skills from mistakes</h3>
          <div className="space-y-2">
            {weak.length === 0 && <Card className={`p-4 text-sm text-ink-500 ${visualStyles.accentCard}`}>No weak-skill clusters yet.</Card>}
            {weak.map((w) => (
              <Card key={w.skillId} interactive tabIndex={0} className={`flex items-center justify-between p-4 ${visualStyles.accentCard}`} role="button" onClick={() => navigate('/student/mathpath/mistakes/review')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/student/mathpath/mistakes/review'); } }}>
                <div>
                  <div className="font-semibold text-ink-700">{w.skillName}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-500">
                    <span>Latest {formatMistakeDate(w.latestMistakeDate)}</span>
                    {w.confidenceRiskCount > 0 && <span>{w.confidenceRiskCount} confident slip{w.confidenceRiskCount > 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2"><Badge tone="error">{w.count} mistake{w.count > 1 ? 's' : ''}</Badge><ChevronRight className="h-4 w-4 text-ink-300" /></div>
              </Card>
            ))}
          </div>
        </>
      )}

      {recent.length > 0 && (
        <>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent mistakes</h3>
          <div className="space-y-2">
            {recent.map((m) => (
              <Card key={m.id} interactive tabIndex={0} className={`p-4 ${visualStyles.accentCard}`} role="button" onClick={() => navigate(`/student/mathpath/mistakes/${m.id}`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/student/mathpath/mistakes/${m.id}`); } }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                      <span className="font-semibold text-ink-700">{m.skillName || m.skillCode || 'MathPath'}</span>
                      <span>{formatMistakeDate(m.timestamp || m.occurredAt)}</span>
                      <Badge tone={m.learningStatus === 'mastered' ? 'success' : m.learningStatus === 'new' ? 'gold' : 'navy'}>
                        {LEARNING_STATUS_LABEL[m.learningStatus || 'new']}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-ink-800"><MathText text={m.questionStem} /></p>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <p className="rounded-lg bg-error-100 px-3 py-2 text-error-700">
                        Your answer: <MathText text={m.studentAnswer || '-'} className="font-mono" />
                      </p>
                      <p className="rounded-lg bg-success-100 px-3 py-2 text-success-700">
                        Correct: <MathText text={m.correctAnswer || '-'} className="font-mono" />
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-300" />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
