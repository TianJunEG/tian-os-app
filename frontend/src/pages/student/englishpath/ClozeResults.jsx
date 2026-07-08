import React, { useMemo } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { Card, Button, ProgressBar } from '../../../components/ui';
import { MascotBubble } from '../../../components/MascotAvatar';
import { useAuth } from '../../../context/AuthContext';
import { clozePassages, SKILL_LABELS, summarizeCloze } from '../../../../../shared/englishpath/cloze/index.js';
import { loadClozeState } from './clozeStore';

// Passage summary: score, per-skill breakdown for this passage, blanks to review
// with the answers that were accepted, and updated overall skill readiness.
export default function ClozeResults() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();
  const studentId = user?.id || user?._id;

  const summary = useMemo(
    () => summarizeCloze(loadClozeState(studentId), { passages: clozePassages }),
    [studentId]
  );

  if (!state || !Array.isArray(state.perBlank)) {
    return <Navigate to="/student/english/cloze" replace />;
  }

  const { title = 'Passage', score = 0, total = 0, bySkill = {}, perBlank = [] } = state;
  const pct = total ? Math.round((score / total) * 100) : 0;
  const message =
    pct >= 80 ? 'Excellent — you read that passage closely!' : pct >= 50 ? 'Good effort! Cloze rewards careful reading.' : "Tricky one — we'll bring it back for another go.";
  const toReview = perBlank.filter((r) => r.verdict !== 'correct');

  const skillRows = ['grammar', 'collocation', 'content']
    .filter((k) => bySkill[k] && bySkill[k].total)
    .map((k) => ({ key: k, label: SKILL_LABELS[k], ...bySkill[k] }));

  return (
    <div className="mx-auto max-w-xl">
      <MascotBubble name="lysa" message={message} size="sm" className="mb-5" />

      <Card className="mb-6 p-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">{title}</p>
        <p className="my-2 font-display text-4xl font-semibold text-emerald-deep">
          {score}<span className="text-2xl text-ink-400"> / {total}</span>
        </p>
        <p className="text-sm text-ink-500">{pct}% correct</p>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="mb-3 font-semibold text-ink-700">How you did by skill</h3>
        {skillRows.map((row) => {
          const p = row.total ? Math.round((row.correct / row.total) * 100) : 0;
          return (
            <div key={row.key} className="mb-3 last:mb-0">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink-700">{row.label}</span>
                <span className="font-mono text-sm tabular-nums text-ink-500">{row.correct}/{row.total}</span>
              </div>
              <ProgressBar value={p} max={100} />
            </div>
          );
        })}
      </Card>

      {toReview.length > 0 && (
        <Card className="mb-6 p-5">
          <h3 className="mb-3 font-semibold text-ink-700">Blanks to review</h3>
          <ul className="space-y-2">
            {toReview.map((r) => (
              <li key={r.n} className="flex gap-2 text-sm">
                <span className="flex-none font-semibold text-ink-700">{r.n}.</span>
                <span className="text-ink-600">
                  {r.verdict === 'typo'
                    ? r.note || `Check the spelling of “${r.matched}”.`
                    : <>accepted: <span className="text-ink-800">{(r.accepted || []).join(', ')}</span></>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-6 p-5">
        <h3 className="mb-3 font-semibold text-ink-700">Overall skill readiness</h3>
        {['grammar', 'collocation', 'content'].map((k) => (
          <div key={k} className="mb-3 last:mb-0">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink-700">{SKILL_LABELS[k]}</span>
              <span className="font-mono text-sm tabular-nums text-ink-500">{summary.readiness.bySkill[k] || 0}%</span>
            </div>
            <ProgressBar value={summary.readiness.bySkill[k] || 0} max={100} />
          </div>
        ))}
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="l" icon={ArrowRight} className="flex-1" onClick={() => navigate('/student/english/cloze/practice', { replace: true })}>
          Next passage
        </Button>
        <Button size="l" variant="secondary" className="flex-1" onClick={() => navigate('/student/english/cloze')}>
          Back to Cloze
        </Button>
      </div>
    </div>
  );
}
