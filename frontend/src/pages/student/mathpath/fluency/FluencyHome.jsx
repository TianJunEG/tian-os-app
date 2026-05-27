import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, ListChecks, AlertTriangle } from 'lucide-react';
import { mathpathAPI, skillsAPI } from '../../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../../components/ui';

// MathPath › Fluency — home. Recommended skill, weak fluency skills, quick practice.
// Fluency is a FEATURE of MathPath: it reuses the shared practice/result screens.
const TONE = { mastered: 'success', fluent: 'success', learning: 'gold', needs_review: 'error', not_started: 'neutral' };
// Speed labels for the fluency (timed) skills.
const FLUENCY_LABEL = { automatic: 'fast & accurate', developing: 'getting quicker', effortful: 'building speed' };

export default function FluencyHome() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [mastery, setMastery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, m] = await Promise.all([skillsAPI.list({ group: 'fluency' }), mathpathAPI.mastery()]);
        setSkills(s.data.skills || []); setMastery(m.data);
      } catch (e) { setError(e.response?.data?.error || 'Could not load Fluency.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const start = async (skillId) => {
    if (!skillId || starting) return;
    setStarting(true);
    try {
      const { data } = await mathpathAPI.startSession({ feature: 'Fluency Practice', mode: 'fluency', skillId, questionCount: 8 });
      navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items, backTo: '/student/mathpath/fluency' } });
    } catch (e) { setError(e.response?.data?.error || 'Could not start practice.'); setStarting(false); }
  };

  if (loading) return <Spinner label="Loading Fluency…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  // Recommend the weakest skill you have NOT yet mastered — never a mastered one,
  // even when it happens to be the lowest-scored. Mirrors the `weak` list below.
  const weak = skills.filter((s) => s.status !== 'mastered');
  const recommended = [...weak].sort((a, b) => a.score - b.score)[0] || null;

  return (
    <>
      <PageHeader title="Fluency Practice" subtitle="MathPath · quick timed drills for speed and accuracy" />

      <Card className="mb-6 bg-gradient-to-br from-navy-700 to-navy-900 p-5 text-paper">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold-300">Recommended now</div>
        {recommended ? (
          <>
            <div className="font-display text-xl font-semibold">{recommended.name}</div>
            <p className="mb-4 mt-1 text-sm text-paper/70">A short drill tuned to where you are.</p>
            <Button variant="gold" icon={Zap} disabled={starting} onClick={() => start(recommended.skillId)}>
              {starting ? 'Starting…' : 'Start quick practice'}
            </Button>
          </>
        ) : (
          <p className="mt-1 text-sm text-paper/70">Every fluency skill is sharp. Come back later to keep them fresh.</p>
        )}
      </Card>

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Skills to sharpen</h3>
      <div className="mb-6 space-y-2">
        {weak.length === 0 && <Card className="p-4 text-sm text-ink-500">All your fluency skills are sharp. Nice work.</Card>}
        {weak.map((s) => (
          <Card key={s.skillId} interactive className="flex items-center justify-between p-4" onClick={() => start(s.skillId)} role="button">
            <div>
              <div className="font-semibold text-ink-700">{s.name}</div>
              <div className="text-xs text-ink-500">
                {s.topicName}
                {FLUENCY_LABEL[s.fluencyStatus] && <> · {FLUENCY_LABEL[s.fluencyStatus]}</>}
                {s.streak > 1 && <> · 🔥 {s.streak} in a row</>}
              </div>
            </div>
            <Badge tone={TONE[s.status] || 'neutral'}>{s.statusLabel}</Badge>
          </Card>
        ))}
      </div>

      <Button variant="secondary" icon={ListChecks} to="/student/mathpath/fluency/skills" className="w-full">View all fluency skills</Button>
      {mastery?.recentMistakeCount > 0 && (
        <p className="mt-4 text-center text-xs text-ink-500">
          {mastery.recentMistakeCount} mistakes waiting · <a className="font-semibold text-navy-700" href="/student/mathpath/mistakes">review them</a>
        </p>
      )}
    </>
  );
}
