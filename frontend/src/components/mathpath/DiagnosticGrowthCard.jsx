import React from 'react';
import { ArrowRight, BarChart3, RefreshCw } from 'lucide-react';
import { Button, Card } from '../ui';

function score(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.round(n)}/100` : '-';
}

function dateText(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
}

export default function DiagnosticGrowthCard({
  growth = null,
  title = 'Diagnostic Growth',
  onViewHistory,
  onRunRecheck,
  onAssignRecovery,
  assigningRecovery = false,
  assignmentMessage = '',
}) {
  const baseline = growth?.baseline || null;
  const latest = growth?.latest || null;
  const topImproved = (growth?.perSkillGrowth || [])
    .filter((row) => Number(row.improvement) > 0)
    .sort((a, b) => Number(b.improvement || 0) - Number(a.improvement || 0))[0];
  const remainingWeak = growth?.remainingWeakSkills?.[0] || '';

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{title}</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-navy-700">
            {latest ? `Improvement ${Number(growth?.overallImprovement || 0) >= 0 ? '+' : ''}${Math.round(Number(growth?.overallImprovement || 0))}` : 'No recheck yet'}
          </h3>
          <p className="mt-1 text-sm text-ink-600">
            Last diagnostic: {dateText(latest?.completedAt)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm sm:min-w-[300px]">
          <div className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-ink-500">Baseline</p>
            <p className="font-semibold text-ink-800">{score(baseline?.readinessScore)}</p>
          </div>
          <div className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-ink-500">Current</p>
            <p className="font-semibold text-ink-800">{score(latest?.readinessScore)}</p>
          </div>
          <div className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-ink-500">Change</p>
            <p className="font-semibold text-ink-800">{growth?.overallImprovement === null || growth?.overallImprovement === undefined ? '-' : `${Number(growth.overallImprovement) >= 0 ? '+' : ''}${Math.round(Number(growth.overallImprovement))}`}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-xl bg-mint-50 px-3 py-2 text-ink-700">
          Top improved skill: <span className="font-semibold">{topImproved?.skillName || topImproved?.skillId || 'Not enough data yet'}</span>
        </p>
        <p className="rounded-xl bg-gold-50 px-3 py-2 text-ink-700">
          Remaining weak skill: <span className="font-semibold">{remainingWeak || 'None flagged'}</span>
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="s" variant="secondary" icon={BarChart3} onClick={onViewHistory}>View Diagnostic History</Button>
        {onAssignRecovery && (
          <Button size="s" variant="secondary" onClick={onAssignRecovery} disabled={assigningRecovery}>
            {assigningRecovery ? 'Assigning...' : 'Assign Recovery Pack'}
          </Button>
        )}
        <Button size="s" variant="secondary" icon={RefreshCw} onClick={onRunRecheck}>Run Recheck</Button>
        {latest?.diagnosticSessionId && (
          <Button size="s" variant="ghost" icon={ArrowRight} to={`/student/mathpath/diagnostic/results/${latest.diagnosticSessionId}`}>Open Latest</Button>
        )}
      </div>
      {assignmentMessage && <p className="mt-2 text-sm font-semibold text-success-700">{assignmentMessage}</p>}
    </Card>
  );
}
