import React, { useEffect, useState } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, Lightbulb, BookOpen, RefreshCw } from 'lucide-react';
import { mathpathAPI } from '../../services/api';
import { Button, Spinner, ProgressBar } from '../ui';
import { MathText } from '../ui/Fraction';
import QuestionDiagram from '../../pages/student/mathpath/components/QuestionDiagram';

const STEP_ICON = {
  reassure: Sparkles, hint: Lightbulb, 'reinforce-prerequisite': BookOpen,
  'worked-example': BookOpen, 'guided-replication': RefreshCw, retry: ChevronRight,
};
const STEP_TONE = {
  reassure: 'bg-tianSky', hint: 'bg-tianLavender', 'reinforce-prerequisite': 'bg-tianMint',
  'worked-example': 'bg-paper', 'guided-replication': 'bg-tianYellow', retry: 'bg-tianPeach',
};

export default function RemediationPanel({ skillId, skillSlug, recentAttempts = [], onPractise }) {
  const [plan, setPlan] = useState(null);
  const [page, setPage] = useState(0);
  const [revealed, setRevealed] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data } = await mathpathAPI.remediation(skillSlug || { skillId }, recentAttempts);
        if (live) { setPlan(data); setPage(0); setRevealed(1); }
      } catch { /* keep panel quiet on failure */ }
      finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [skillId, skillSlug]);

  if (loading) return <Spinner label="Preparing a little help…" />;
  if (!plan?.steps?.length) return null;

  const total = plan.steps.length;
  const s = plan.steps[page];
  const Icon = STEP_ICON[s.type] || Lightbulb;
  const tone = STEP_TONE[s.type] || 'bg-paper';
  const isLast = page === total - 1;
  const canGoNext = page < revealed - 1 || page < total - 1;

  const goNext = () => {
    const next = page + 1;
    if (next >= total) return;
    setPage(next);
    if (next >= revealed) setRevealed(next + 1);
  };

  return (
    <div className="mt-4">
      <ProgressBar value={page + 1} max={total} className="mb-4 h-2" barClassName="bg-navy-600" />
      <div className={`rounded-3xl border border-white/70 shadow-resting ${tone} px-6 py-8 sm:px-8 sm:py-10 transition-colors duration-300`}>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/60">
            <Icon className="h-5 w-5 text-navy-600" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-navy-500">
            Step {page + 1} of {total}
          </span>
        </div>
        <div className="min-h-[120px]">
          {s.text && <p className="text-xl leading-8 text-ink-900 sm:text-2xl sm:leading-10">{s.text}</p>}
          {s.skills?.length > 0 && (
            <p className="mt-3 text-base text-ink-600 sm:text-lg">Quick warm-up: {s.skills.join(', ')}</p>
          )}
          {s.stem && (
            <div className="mt-4 rounded-2xl bg-white/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400 mb-2">Question</p>
              <div className="text-xl leading-8 text-ink-900 sm:text-2xl sm:leading-10"><MathText text={s.stem} /></div>
              {s.diagramSpec && (
                <div className="mt-3">
                  <QuestionDiagram question={{ diagramSpec: s.diagramSpec, stem: s.stem }} />
                </div>
              )}
            </div>
          )}
          {s.solution && (
            <div className="mt-3 rounded-2xl bg-white/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400 mb-2">Solution</p>
              <div className="text-lg leading-8 text-ink-800 sm:text-xl sm:leading-9"><MathText text={s.solution} /></div>
            </div>
          )}
          {s.prompt && <p className="mt-4 text-base leading-7 text-ink-600 sm:text-lg sm:leading-8">{s.prompt}</p>}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="secondary"
          size="m"
          icon={ChevronLeft}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Back
        </Button>
        {isLast && page === revealed - 1
          ? (onPractise && <Button size="m" icon={RefreshCw} onClick={onPractise}>Try a fresh one</Button>)
          : (
            <Button size="m" icon={ChevronRight} onClick={goNext} disabled={!canGoNext}>
              {page < revealed - 1 ? 'Next' : 'Show next step'}
            </Button>
          )}
      </div>
    </div>
  );
}
