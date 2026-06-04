import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, CheckCircle2, PenLine, Users } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Badge, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';

function number(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function MetricCard({ icon: Icon, label, value, suffix = '' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-2xl font-semibold text-ink-900 tabular-nums">{number(value)}{suffix}</p>
          <p className="mt-1 text-sm font-semibold text-ink-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function SkillList({ title, rows = [], valueKey = 'missed', empty = 'No data yet.' }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-ink-900">{title}</h2>
      {rows.length ? (
        <div className="mt-4 space-y-3">
          {rows.slice(0, 8).map((row) => (
            <div key={`${title}-${row.skillCode}`} className="flex items-center justify-between gap-3 border-b border-hairline pb-3 last:border-b-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-semibold text-ink-800">{row.skillCode}</p>
                <p className="text-xs text-ink-500">{number(row.answered)} answered</p>
              </div>
              <Badge tone={Number(row[valueKey] || 0) > 0 ? 'error' : 'neutral'}>{number(row[valueKey] || 0)}</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-500">{empty}</p>
      )}
    </Card>
  );
}

export default function PilotAnalyticsPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    adminAPI.getPilotAnalytics({ days: 30 })
      .then((res) => {
        if (active) setState({ loading: false, error: '', data: res.data });
      })
      .catch((err) => {
        if (active) setState({ loading: false, error: err?.response?.data?.error || 'Could not load pilot analytics.', data: null });
      });
    return () => { active = false; };
  }, []);

  if (state.loading) return <Spinner label="Loading pilot analytics…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;

  const data = state.data || {};
  const studentOverview = data.studentOverview || {};
  const pilotMetrics = data.pilotMetrics || {};
  const working = data.workingBehaviour || {};
  const overconfidence = data.overconfidence || {};
  const skillMetrics = data.skillMetrics || {};
  const mostActiveStudents = data.mostActiveStudents || [];
  const telemetryCoverage = data.telemetryCoverage || {};

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader
        title="Pilot Analytics"
        subtitle="Internal view of learning telemetry, confidence signals, working evidence, and skill risk."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Active Students" value={pilotMetrics.activeStudents} />
        <MetricCard icon={Activity} label="Daily Active Student Days" value={pilotMetrics.dailyActiveStudents} />
        <MetricCard icon={CheckCircle2} label="Completion Rate" value={pilotMetrics.completionRate} suffix="%" />
        <MetricCard icon={AlertTriangle} label="Abandonment Rate" value={pilotMetrics.abandonmentRate} suffix="%" />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BarChart3} label="Questions Answered" value={studentOverview.questionsAnswered} />
        <MetricCard icon={Activity} label="Practice Sessions" value={pilotMetrics.practiceSessions} />
        <MetricCard icon={CheckCircle2} label="Diagnostic Completions" value={pilotMetrics.diagnosticCompletions} />
        <MetricCard icon={PenLine} label="No-Working Declarations" value={working.noWorkingDeclarationRate} suffix="%" />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CheckCircle2} label="Questions Correct" value={studentOverview.questionsCorrect} />
        <MetricCard icon={PenLine} label="Working Usage" value={working.workingUsageRate} suffix="%" />
        <MetricCard icon={AlertTriangle} label="Overconfidence Rate" value={overconfidence.overconfidenceRate} suffix="%" />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Working Behaviour</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-ink-500">Accuracy with working</span><strong>{number(working.accuracyWithWorking)}%</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Accuracy without working</span><strong>{number(working.accuracyWithoutWorking)}%</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Working not needed</span><strong>{number(studentOverview.workingNotNeededRate)}%</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">High-risk no-working errors</span><strong>{number(working.highRiskNoWorkingErrors)}</strong></div>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Confidence Signal</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-ink-500">Average confidence</span><strong>{studentOverview.averageConfidence || 'No data'}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Overconfident wrong answers</span><strong>{number(overconfidence.overconfidentWrongAnswers)}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Overconfidence rate</span><strong>{number(overconfidence.overconfidenceRate)}%</strong></div>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Session Shape</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-ink-500">Average session length</span><strong>{number(pilotMetrics.averageSessionLengthSeconds)}s</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Questions per session</span><strong>{number(pilotMetrics.averageQuestionsPerSession)}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Skills mastered</span><strong>{number(studentOverview.skillsMastered)}</strong></div>
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <SkillList title="Most Missed Skills" rows={skillMetrics.mostMissedSkills || []} valueKey="missed" />
        <SkillList title="High-Confidence Wrong" rows={skillMetrics.highestConfidenceWrongAnswers || []} valueKey="overconfidentWrong" />
        <SkillList title="Most Requested Help" rows={skillMetrics.mostRequestedHelpSkills || []} valueKey="helpRequested" />
        <SkillList title="Most Skipped Skills" rows={skillMetrics.mostSkippedSkills || []} valueKey="skipped" />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Most Active Students</h2>
          {mostActiveStudents.length ? (
            <div className="mt-4 space-y-3">
              {mostActiveStudents.slice(0, 8).map((student) => (
                <div key={student.studentId} className="flex items-center justify-between gap-3 border-b border-hairline pb-3 last:border-b-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-800">{student.studentId}</p>
                    <p className="text-xs text-ink-500">{number(student.questionsAnswered)} questions · {number(student.sessionsCompleted)} completed sessions</p>
                  </div>
                  <Badge tone="navy">{number(student.events)} events</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-500">No student activity yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Telemetry Coverage</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(telemetryCoverage.requiredPilotEvents || []).map((row) => (
              <div key={row.eventType} className="flex items-center justify-between gap-2 rounded-lg border border-hairline px-3 py-2 text-sm">
                <span className="min-w-0 truncate text-ink-700">{row.eventType}</span>
                <Badge tone={row.present ? 'success' : 'error'}>{number(row.count)}</Badge>
              </div>
            ))}
          </div>
          {(telemetryCoverage.missingEvents || []).length ? (
            <p className="mt-3 text-sm text-error-700">Missing: {telemetryCoverage.missingEvents.join(', ')}</p>
          ) : (
            <p className="mt-3 text-sm text-success-700">All required pilot telemetry events are present in this window.</p>
          )}
        </Card>
      </section>
    </main>
  );
}
