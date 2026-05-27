import React, { useEffect, useState } from 'react';
import { Sparkles, ChevronRight, Lightbulb, BookOpen, RefreshCw } from 'lucide-react';
import { mathpathAPI } from '../../services/api';
import { Card, Button, Spinner } from '../ui';
import { MathText } from '../ui/Fraction';

// Calm, progressively-disclosed remediation. Loads the plan from
// POST /api/mastery/remediation and reveals ONE step at a time (reassure → hint
// → prerequisite warm-up → worked example → guided try → retry) so the learner
// is never shown a wall of text. Pass either skillSlug or skillId.
const STEP_ICON = {
  reassure: Sparkles, hint: Lightbulb, 'reinforce-prerequisite': BookOpen,
  'worked-example': BookOpen, 'guided-replication': RefreshCw, retry: ChevronRight,
};

export default function RemediationPanel({ skillId, skillSlug, recentAttempts = [], onPractise }) {
  const [plan, setPlan] = useState(null);
  const [revealed, setRevealed] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data } = await mathpathAPI.remediation(skillSlug || { skillId }, recentAttempts);
        if (live) { setPlan(data); setRevealed(1); }
      } catch { /* keep panel quiet on failure */ }
      finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [skillId, skillSlug]);

  if (loading) return <Spinner label="Preparing a little help…" />;
  if (!plan?.steps?.length) return null;
  const steps = plan.steps.slice(0, revealed);
  const more = revealed < plan.steps.length;

  return (
    <Card className="mt-4 bg-navy-50 p-5">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-500">A little help — one step at a time</div>
      <div className="space-y-3">
        {steps.map((s, i) => {
          const Icon = STEP_ICON[s.type] || Lightbulb;
          return (
            <div key={i} className="flex gap-3">
              <Icon size={18} className="mt-0.5 shrink-0 text-navy-400" />
              <div className="min-w-0 text-sm text-ink-800">
                {s.text && <p>{s.text}</p>}
                {s.skills?.length > 0 && <p className="text-ink-500">Quick warm-up: {s.skills.join(', ')}</p>}
                {s.stem && <div className="mt-1 text-ink-900"><MathText text={s.stem} /></div>}
                {s.solution && <div className="mt-1 text-ink-600"><MathText text={s.solution} /></div>}
                {s.prompt && <p className="mt-1 text-ink-500">{s.prompt}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex gap-2">
        {more
          ? <Button variant="secondary" icon={ChevronRight} onClick={() => setRevealed((r) => r + 1)}>Show the next step</Button>
          : (onPractise && <Button icon={RefreshCw} onClick={onPractise}>Try a fresh one</Button>)}
      </div>
    </Card>
  );
}
