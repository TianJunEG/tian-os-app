import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui';
import { FEATURE_FLAGS } from '../../config/featureFlags';

// Shared header + tab strip for the parent's per-child screens. Keeps the child
// context visible and navigation consistent across progress / weak topics /
// actions / mistakes / practice tasks.
export default function ChildNav({ studentId, name, level, showAssign = true }) {
  const navigate = useNavigate();
  const base = `/parent/children/${studentId}`;
  // Ordered by parent intent, not by build order. "Actions" answers the most
  // common landing question — "what should I do?" — so it leads. The four
  // tabs that fit on a narrow viewport without horizontal scroll should each
  // be useful by themselves; subject-specific surfaces sit at the end.
  // [label, to, exactMatch?] — Worksheets has subroutes (/new, /:id) so it
  // matches by prefix, not exact path; the others match exactly.
  const tabs = [
    ['Actions', `${base}/actions`, true],
    ['Progress', `${base}/progress`, true],
    ['Mistakes', `${base}/mistakes`, true],
    ['Weak topics', `${base}/weak-topics`, true],
    ['Practice Tasks', `${base}/assignments`, true],
    ['Worksheets', `${base}/worksheets`, false],
    FEATURE_FLAGS.psl && ['Problem Solving', `${base}/psl`, true],
    FEATURE_FLAGS.science && ['Science', `${base}/science`, true],
    FEATURE_FLAGS.lifelab && ['LifeLab', `${base}/lifelab`, true],
  ].filter(Boolean);
  return (
    <div className="mb-5">
      <button onClick={() => navigate('/parent/children')} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep">
        <ArrowLeft className="h-4 w-4" /> All children
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-emerald-deep">{name}</h1>
          {level && <p className="mt-0.5 text-sm text-ink-500">{level}</p>}
        </div>
        {showAssign && (
          <Button size="m" icon={BookOpen} to={`${base}/assign-practice`}>Assign practice</Button>
        )}
      </div>
      <div className="relative mt-4 border-b border-line-soft">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map(([label, to, exact]) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) => `inline-flex min-h-[44px] items-center whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${isActive ? 'border-emerald-deep text-emerald-deep' : 'border-transparent text-ink-500 hover:text-emerald-deep'}`}>
              {label}
            </NavLink>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
      </div>
    </div>
  );
}
