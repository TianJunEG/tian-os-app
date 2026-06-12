import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Brain, Clock3, Search, Target } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui';
import TutorStudentNav from './TutorStudentNav';
import { useTutorStudent } from './useTutorStudent';
import { tutorAPI } from '../../services/api';

function scoreTone(pct) {
  if (pct >= 70) return 'navy';
  if (pct >= 50) return 'gold';
  return 'error';
}

function OverviewCard({ data }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Overview</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div><p className="text-xs text-ink-500">Sessions</p><p className="font-mono text-xl text-navy-700">{data.totalSessions}</p></div>
        <div><p className="text-xs text-ink-500">Skills Attempted</p><p className="font-mono text-xl text-navy-700">{data.skillsAttempted}</p></div>
        <div><p className="text-xs text-ink-500">Skills Mastered</p><p className="font-mono text-xl text-emerald-600">{data.skillsMastered}</p></div>
        <div><p className="text-xs text-ink-500">Avg Accuracy</p><p className="font-mono text-xl text-navy-700">{data.averageAccuracy}%</p></div>
      </div>
    </Card>
  );
}

function HeuristicCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Performance by Heuristic</h3>
      {rows.length ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((h) => (
            <div key={h.heuristic} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink-700 capitalize">{h.heuristic.replace(/-/g, ' ')}</p>
                <Badge tone={scoreTone(h.avgScore)}>{h.avgScore}%</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-500">{h.sessions} sessions</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No heuristic data yet.</p>}
    </Card>
  );
}

function StepAnalyticsCard({ rows = [] }) {
  const maxError = Math.max(...rows.map((r) => r.errorRate), 1);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Step-Level Performance</h3>
      <p className="mt-1 text-xs text-ink-500">Where this student struggles in the 6-step scaffold</p>
      {rows.every((r) => r.total === 0) ? (
        <p className="mt-3 text-sm text-ink-500">No step data yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((step) => (
            <div key={step.stepId} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-700">{step.label}</p>
                <Badge tone={step.errorRate >= 40 ? 'error' : step.errorRate >= 20 ? 'gold' : 'navy'}>
                  {step.errorRate}% errors
                </Badge>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-ink-100">
                <div
                  className={`h-2 rounded-full transition-all ${step.errorRate >= 40 ? 'bg-red-400' : step.errorRate >= 20 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.round((step.errorRate / maxError) * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-500">
                <span>Avg {step.avgTimeSec}s</span>
                {step.hintRate > 0 && <span>Hints {step.hintRate}%</span>}
                {step.retryRate > 0 && <span>Retries {step.retryRate}%</span>}
                {step.misconceptionRate > 0 && <span>Misconceptions {step.misconceptionRate}%</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TopMisconceptionsCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 text-ink-500" />
        <h3 className="text-sm font-semibold text-ink-700">Top Misconceptions</h3>
      </div>
      {rows.length ? (
        <div className="space-y-1.5">
          {rows.map((m) => (
            <div key={m.tag} className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2">
              <p className="text-sm text-ink-700">{m.tag}</p>
              <Badge tone="neutral">{m.count}</Badge>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-ink-500">No misconceptions recorded yet.</p>}
    </Card>
  );
}

function RecentSessionsCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-ink-500" />
        <h3 className="text-sm font-semibold text-ink-700">Recent Sessions</h3>
      </div>
      {rows.length ? (
        <div className="space-y-2">
          {rows.map((s) => (
            <div key={s.sessionId} className="flex items-center justify-between rounded-lg border border-hairline p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-700">{s.skillName}</p>
                <p className="text-xs text-ink-500 capitalize">{s.heuristic?.replace(/-/g, ' ')} &middot; {s.problems} problems &middot; {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
              </div>
              <Badge tone={scoreTone(s.score)}>{s.score}%</Badge>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-ink-500">No completed sessions yet.</p>}
    </Card>
  );
}

function SkillBreakdownCard({ rows = [] }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.heuristic.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Skill Breakdown</h3>
      {!rows.length ? (
        <p className="mt-2 text-sm text-ink-500">No PSL skill data yet.</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-hairline px-3 py-2">
            <Search className="h-4 w-4 text-ink-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter skills…" className="w-full bg-transparent text-sm text-ink-700 outline-none placeholder:text-ink-400" />
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-2 py-2">Skill</th>
                  <th className="px-2 py-2">Heuristic</th>
                  <th className="px-2 py-2">Level</th>
                  <th className="px-2 py-2">Sessions</th>
                  <th className="px-2 py-2">Mastered</th>
                  <th className="px-2 py-2">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sk) => (
                  <tr key={sk.skillId} className="border-t border-hairline">
                    <td className="px-2 py-2 text-ink-700">{sk.name}</td>
                    <td className="px-2 py-2 capitalize">{sk.heuristic.replace(/-/g, ' ')}</td>
                    <td className="px-2 py-2">{sk.level}</td>
                    <td className="px-2 py-2">{sk.sessions}</td>
                    <td className="px-2 py-2">{sk.mastered ? <Badge tone="navy">Yes</Badge> : '—'}</td>
                    <td className="px-2 py-2"><Badge tone={scoreTone(sk.averageScore)}>{sk.averageScore}%</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

export default function TutorPSLDashboardPage() {
  const { id } = useParams();
  const meta = useTutorStudent(id);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setDashboard(null);
    try {
      const res = await tutorAPI.pslDashboard(id);
      setDashboard(res?.data || null);
    } catch (_) {
      setError(true);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message="Couldn't load PSL dashboard." onRetry={load} />;
  if (!dashboard) return <Spinner label="Loading Problem Solving Lab dashboard…" />;

  const hasData = dashboard.overview?.totalSessions > 0;

  return (
    <>
      <TutorStudentNav studentId={id} name={meta?.name || dashboard.student?.name || 'Student'} level={meta?.level || dashboard.student?.level} />
      <PageHeader
        title="Problem Solving Lab"
        subtitle="Heuristic performance, step-level analytics, and misconception patterns for this student."
      />
      <div className="space-y-4">
        <OverviewCard data={dashboard.overview} />
        {!hasData ? (
          <EmptyState message="No Problem Solving Lab activity for this student yet. Once they complete sessions, their data appears here." />
        ) : (
          <>
            <HeuristicCard rows={dashboard.heuristics || []} />
            <StepAnalyticsCard rows={dashboard.stepAnalytics || []} />
            <TopMisconceptionsCard rows={dashboard.topMisconceptions || []} />
            <RecentSessionsCard rows={dashboard.recentSessions || []} />
            <SkillBreakdownCard rows={dashboard.skills || []} />
          </>
        )}
      </div>
    </>
  );
}
