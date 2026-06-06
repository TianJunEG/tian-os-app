import React from 'react';
import { ArrowRight, FileText, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ProgressBar } from '../ui';

function score(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.round(n)}%` : '-';
}

function dateText(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
}

function JourneyStep({ title, detail, muted = false }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${muted ? 'bg-paper text-ink-500' : 'bg-white text-ink-800'}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{title}</p>
      <p className="mt-1 text-sm font-semibold">{detail}</p>
    </div>
  );
}

export default function SuccessCentreDashboard({ data, onAction }) {
  const centre = data?.successCentre || data || {};
  const status = centre.currentStatus || {};
  const journey = centre.improvementJourney || {};
  const recommendations = centre.recommendedActions || [];
  const concerns = centre.currentConcerns || [];
  const improvements = centre.topImprovements || [];
  const reports = centre.recentReports || [];
  const rechecks = centre.upcomingRechecks || [];

  if (!centre.student) {
    return <EmptyState message="No MathPath success data is available yet." />;
  }

  return (
    <div className="space-y-4">
      <Card tone="lavender" className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Current Status</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-navy-700">
              {centre.student.name} is at {score(status.currentReadiness)} readiness
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Baseline {score(status.baselineReadiness)} · Improvement {status.improvement == null ? '-' : `+${Math.round(Number(status.improvement))}`}
            </p>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-white px-3 py-2">
              <p className="text-xs text-ink-500">Weak skills</p>
              <p className="font-mono text-xl font-semibold text-navy-700">{status.remainingWeakSkillCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2">
              <p className="text-xs text-ink-500">Recovery packs</p>
              <p className="font-mono text-xl font-semibold text-navy-700">{status.activeRecoveryPackCount || 0}</p>
            </div>
          </div>
        </div>
        <ProgressBar value={Number(status.currentReadiness || 0)} className="mt-4" />
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold text-ink-700">Improvement Journey</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <JourneyStep title="Baseline Diagnostic" detail={journey.baseline ? score(journey.baseline.readinessScore) : 'Not started'} muted={!journey.baseline} />
          <JourneyStep title="Recovery Pack" detail={journey.recoveryPack ? `${journey.recoveryPack.status} · ${journey.recoveryPack.questionsAttempted}/${journey.recoveryPack.targetQuestionCount || '-'}` : 'Not assigned'} muted={!journey.recoveryPack} />
          <JourneyStep title="Recheck" detail={journey.recheck ? score(journey.recheck.readinessScore) : 'Not yet'} muted={!journey.recheck} />
          <JourneyStep title="Current Status" detail={journey.current?.improvement == null ? score(journey.current?.readinessScore) : `+${Math.round(Number(journey.current.improvement))}`} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card tone="mint" className="p-5">
          <p className="text-sm font-semibold text-ink-700">Top Improvements</p>
          {improvements.length ? (
            <div className="mt-3 space-y-2">
              {improvements.slice(0, 5).map((item) => (
                <div key={item.skillId} className="rounded-2xl bg-white px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink-800">{item.skillName || item.skillId}</p>
                    <Badge tone="success">+{Math.round(Number(item.improvement || 0))}</Badge>
                  </div>
                  <p className="mt-1 text-ink-500">Before {score(item.beforeScore)} · After {score(item.currentScore)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">Complete a recheck to see improvement by skill.</p>
          )}
        </Card>

        <Card tone="peach" className="p-5">
          <p className="text-sm font-semibold text-ink-700">Current Concerns</p>
          {concerns.length ? (
            <div className="mt-3 space-y-2">
              {concerns.slice(0, 5).map((item) => (
                <div key={item.skillId} className="rounded-2xl bg-white px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink-800">{item.skillName || item.skillId}</p>
                    <Badge tone="gold">{score(item.currentReadiness)}</Badge>
                  </div>
                  <p className="mt-1 text-ink-500">Suggested action: {item.suggestedAction}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">No urgent MathPath concerns are flagged.</p>
          )}
        </Card>
      </div>

      <Card tone="sky" className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink-700">Recommended Actions</p>
          <Badge tone="navy">Top {recommendations.length || 0}</Badge>
        </div>
        {recommendations.length ? (
          <div className="mt-3 grid gap-2 lg:grid-cols-3">
            {recommendations.map((item) => (
              <div key={`${item.type}-${item.assignmentId || item.paperAnalysisId || item.skillId || item.title}`} className="rounded-2xl bg-white px-3 py-3 text-sm">
                <Badge tone={item.priority === 'critical' || item.priority === 'high' ? 'gold' : 'navy'}>{item.priority}</Badge>
                <p className="mt-2 font-semibold text-ink-800">{item.title}</p>
                <p className="mt-1 text-ink-500">{item.reason}</p>
                {onAction && (
                  <Button size="s" variant="secondary" className="mt-3" icon={ArrowRight} onClick={() => onAction(item)}>
                    {item.actionLabel || 'Open'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-500">No urgent next action right now.</p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Recent Reports</p>
          {reports.length ? (
            <div className="mt-3 space-y-2">
              {reports.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 text-sm">
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-ink-400" /> {item.title}</span>
                  <span className="text-ink-500">{dateText(item.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">No recent reports yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Upcoming Rechecks</p>
          {rechecks.length ? (
            <div className="mt-3 space-y-2">
              {rechecks.map((item) => (
                <div key={item.assignmentId} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 text-sm">
                  <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-ink-400" /> {item.title}</span>
                  <Badge tone={item.diagnosticSessionId ? 'success' : 'gold'}>{item.diagnosticSessionId ? 'Created' : 'Ready'}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">No rechecks are waiting.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
