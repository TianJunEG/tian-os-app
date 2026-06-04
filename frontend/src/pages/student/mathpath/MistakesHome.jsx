import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Dumbbell, ChevronRight, AlertTriangle } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import { useAuth } from '../../../context/AuthContext';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../../student/studentVisualMode';

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

  useEffect(() => {
    (async () => {
      try {
        const [mk, ms] = await Promise.all([mathpathAPI.mistakes(), mathpathAPI.mastery()]);
        setData(mk.data); setMastery(ms.data);
      } catch (e) { setError(e.response?.data?.error || 'Could not load mistakes.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const practise = async (skillId) => {
    if (!skillId || starting) return;
    setStarting(true);
    try {
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
    } catch (e) { setError(e.response?.data?.error || 'Could not start practice.'); setStarting(false); }
  };

  if (loading) return <Spinner label="Loading mistakes…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  const recent = (data?.mistakes || []).slice(0, 3);
  const weak = data?.weakSkills || [];
  const recommended = weak[0]
    ? { skillId: weak[0].skillId, skillName: weak[0].skillName }
    : mastery?.recommended;

  return (
    <div className={`${visualStyles.page} space-y-6`}>
      <PageHeader title="Mistake-to-Mastery" subtitle="MathPath · turn recent slips into mastery" />

      <Card className={`border-violet-100 p-5 ${visualStyles.heroCard}`}>
        <div className="mb-1 flex items-center gap-2 text-violet-700"><Wrench className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Turn slips into mastery</span></div>
        <div className="font-display text-2xl font-semibold text-ink-900">{data ? data.mistakes.length : 0} to review</div>
        {recommended && <p className="mb-4 mt-1 text-sm text-ink-600">Recommended: practise <b className="font-semibold text-violet-700">{recommended.skillName}</b></p>}
        <div className="flex flex-wrap gap-2">
          <Button className={visualStyles.primaryCta} to="/student/mathpath/mistakes/review">Review mistakes</Button>
          {recommended && <Button variant="secondary" icon={Dumbbell} disabled={starting} onClick={() => practise(recommended.skillId)}>Practise similar</Button>}
        </div>
      </Card>

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Weak skills from mistakes</h3>
      <div className="space-y-2">
        {weak.length === 0 && <Card className={`p-4 text-sm text-ink-500 ${visualStyles.accentCard}`}>No outstanding mistakes — nice work.</Card>}
        {weak.map((w) => (
          <Card key={w.skillId} interactive className={`flex items-center justify-between p-4 ${visualStyles.accentCard}`} role="button" onClick={() => practise(w.skillId)}>
            <div className="font-semibold text-ink-700">{w.skillName}</div>
            <div className="flex items-center gap-2"><Badge tone="error">{w.count} mistake{w.count > 1 ? 's' : ''}</Badge><ChevronRight className="h-4 w-4 text-ink-300" /></div>
          </Card>
        ))}
      </div>

      {recent.length > 0 && (
        <>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent mistakes</h3>
          <div className="space-y-2">
            {recent.map((m) => (
              <Card key={m.id} interactive className={`flex items-center justify-between p-4 ${visualStyles.accentCard}`} role="button" onClick={() => navigate(`/student/mathpath/mistakes/${m.id}`)}>
                <span className="min-w-0 truncate text-ink-700"><MathText text={m.questionStem} /></span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
