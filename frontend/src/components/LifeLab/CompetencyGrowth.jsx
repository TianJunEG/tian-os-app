import React from 'react';
import { Award } from 'lucide-react';
import { Card, ProgressBar } from '../ui';

// Per-competency growth from completed LifeLab activities — the `competencies`
// array returned by GET /lifelab/me, /lifelab/student/:id and /lifelab/submissions
// (each item: { competency, primary, secondary, activities, score }). Bars are
// scaled to the top score so the strongest competency fills the bar. Renders
// nothing until at least one activity is completed.
export default function CompetencyGrowth({ competencies = [], title = 'Competencies being built', className = '' }) {
  if (!competencies.length) return null;
  const maxScore = Math.max(1, ...competencies.map((c) => c.score));
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        <Award className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="space-y-2.5">
        {competencies.map((c) => (
          <div key={c.competency}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-ink-700">{c.competency}</span>
              <span className="text-xs text-ink-400">{c.activities} {c.activities === 1 ? 'activity' : 'activities'}</span>
            </div>
            <ProgressBar value={c.score} max={maxScore} />
          </div>
        ))}
      </div>
    </Card>
  );
}
