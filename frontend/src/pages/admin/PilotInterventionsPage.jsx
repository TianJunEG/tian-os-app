import React, { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, FileText, RefreshCw, Target, Users } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Badge, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';

function number(value, suffix = '') {
  const n = Number(value || 0);
  return `${new Intl.NumberFormat().format(Number.isFinite(n) ? n : 0)}${suffix}`;
}

function MetricCard({ icon: Icon, label, value, suffix = '', tone = 'navy' }) {
  const toneClass = {
    navy: 'bg-navy-50 text-navy-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone] || 'bg-navy-50 text-navy-700';
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-2xl font-semibold text-ink-900 tabular-nums">{number(value, suffix)}</p>
          <p className="mt-1 text-sm font-semibold text-ink-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function SectionCard({ title, children }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-ink-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function RowList({ rows = [], labelKey, valueKey = 'count', empty = 'No data yet.' }) {
  if (!rows.length) return <p className="text-sm text-ink-500">{empty}</p>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 8).map((row) => (
        <div key={`${row[labelKey]}-${row[valueKey]}`} className="flex items-center justify-between gap-3 border-b border-hairline pb-3 last:border-b-0 last:pb-0">
          <span className="truncate text-sm font-semibold text-ink-800">{row[labelKey]}</span>
          <Badge tone="navy">{number(row[valueKey])}</Badge>
        </div>
      ))}
    </div>
  );
}

function Funnel({ funnel = {} }) {
  const rows = [
    ['Total students', funnel.totalStudents],
    ['Baseline diagnostic', funnel.studentsWithBaselineDiagnostic],
    ['Recovery Pack assigned', funnel.studentsWithRecoveryPackAssigned],
    ['Practice started', funnel.studentsWithRecoveryPackStarted],
    ['Practice completed', funnel.studentsWithRecoveryPackCompleted],
    ['Recheck recommended', funnel.studentsWithRecheckRecommended],
    ['Recheck completed', funnel.studentsWithRecheckCompleted],
    ['Improvement measured', funnel.studentsWithMeasuredImprovement],
  ];
  return (
    <div className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-600">{label}</span>
          <strong className="font-mono text-ink-900">{number(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function AttentionTable({ rows = [] }) {
  if (!rows.length) return <p className="text-sm text-ink-500">No students need intervention follow-up right now.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.08em] text-ink-500">
          <tr>
            <th className="pb-2 pr-4">Student</th>
            <th className="pb-2 pr-4">Priority</th>
            <th className="pb-2 pr-4">Reason</th>
            <th className="pb-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((row) => (
            <tr key={`${row.studentId}-${row.linkedObjectId}-${row.reason}`} className="border-t border-hairline">
              <td className="py-3 pr-4 font-semibold text-ink-800">{row.studentName || row.studentId}</td>
              <td className="py-3 pr-4"><Badge tone={row.priority === 'high' ? 'error' : 'yellow'}>{row.priority}</Badge></td>
              <td className="py-3 pr-4 text-ink-600">{row.reason}</td>
              <td className="py-3 text-ink-800">{row.recommendedAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MistakeLearningAuditTable({ audit = {} }) {
  const rows = audit.rows || [];
  if (!rows.length) return <p className="text-sm text-success-700">No reviewed-without-evidence mistake chains found in this sample.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.08em] text-ink-500">
          <tr>
            <th className="pb-2 pr-4">Mistake</th>
            <th className="pb-2 pr-4">Student</th>
            <th className="pb-2 pr-4">Skill</th>
            <th className="pb-2 pr-4">Learning</th>
            <th className="pb-2">Risk</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((row) => (
            <tr key={`${row.mistakeId}-${row.riskType}`} className="border-t border-hairline">
              <td className="py-3 pr-4 font-mono text-xs text-ink-700">{row.mistakeId}</td>
              <td className="py-3 pr-4 font-mono text-xs text-ink-600">{row.studentId}</td>
              <td className="py-3 pr-4 text-ink-700">{row.skillCode || '—'}</td>
              <td className="py-3 pr-4"><Badge tone={row.learningStatus === 'mastered' ? 'success' : 'gold'}>{row.learningStatus}</Badge></td>
              <td className="py-3"><Badge tone={row.riskType === 'resolved_without_evidence' ? 'error' : 'yellow'}>{row.riskType}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditStat({ label, value, tone = 'ink' }) {
  const toneClass = {
    ink: 'bg-ink-50 text-ink-800',
    amber: 'bg-amber-50 text-amber-900',
    rose: 'bg-rose-50 text-rose-900',
  }[tone] || 'bg-ink-50 text-ink-800';
  return (
    <div className={`rounded-2xl px-4 py-3 ${toneClass}`}>
      <p className="font-mono text-2xl font-semibold tabular-nums">{number(value)}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
    </div>
  );
}

export default function PilotInterventionsPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    Promise.all([
      adminAPI.getPilotInterventionMetrics({ subjectId: 'math', domainId: 'fractions' }),
      adminAPI.getMistakeLearningAudit({ module: 'MathPath', limit: 100 }),
    ])
      .then(([metrics, mistakeAudit]) => {
        if (active) setState({ loading: false, error: '', data: { ...metrics.data, mistakeLearningAudit: mistakeAudit.data } });
      })
      .catch((err) => {
        if (active) setState({ loading: false, error: err?.response?.data?.error || 'Could not load intervention metrics.', data: null });
      });
    return () => { active = false; };
  }, []);

  if (state.loading) return <Spinner label="Loading intervention metrics..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;

  const data = state.data || {};
  const funnel = data.funnel || {};
  const growth = data.growth || {};
  const assignments = data.assignments || {};
  const paper = data.paperAnalysis || {};
  const rechecks = data.rechecks || {};
  const engagement = data.engagement || {};

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader
        title="Pilot Intervention Monitor"
        subtitle="Internal view of Recovery Packs, rechecks, paper review, and measured MathPath growth."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Students in Funnel" value={funnel.totalStudents} />
        <MetricCard icon={Target} label="Recovery Packs Assigned" value={assignments.totalRecoveryPacksAssigned} />
        <MetricCard icon={CheckCircle2} label="Pack Completion Rate" value={assignments.assignmentCompletionRate} suffix="%" tone="green" />
        <MetricCard icon={BarChart3} label="Avg Readiness Gain" value={growth.averageReadinessImprovement} tone="amber" />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={RefreshCw} label="Rechecks Recommended" value={rechecks.rechecksRecommended} />
        <MetricCard icon={CheckCircle2} label="Recheck Completion Rate" value={rechecks.recheckCompletionRate} suffix="%" tone="green" />
        <MetricCard icon={FileText} label="Papers Awaiting Review" value={paper.papersAwaitingReview} tone="amber" />
        <MetricCard icon={Users} label="Active Students 7d" value={engagement.activeStudents7d} />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <SectionCard title="Intervention Funnel"><Funnel funnel={funnel} /></SectionCard>
        <SectionCard title="Growth Summary">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-ink-500">Baseline readiness</span><strong>{number(growth.averageBaselineReadiness)}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Latest readiness</span><strong>{number(growth.averageLatestReadiness)}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Median gain</span><strong>{number(growth.medianReadinessImprovement)}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Targeted skill gain</span><strong>{number(growth.averageTargetedSkillImprovement)}</strong></div>
          </div>
        </SectionCard>
        <SectionCard title="Recovery Pack Completion">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-ink-500">Started</span><strong>{number(assignments.totalRecoveryPacksStarted)}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Completed</span><strong>{number(assignments.totalRecoveryPacksCompleted)}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Average accuracy</span><strong>{number(assignments.averageAssignmentAccuracy)}%</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Drop-off after assignment</span><strong>{number(assignments.dropOffAfterAssignment)}</strong></div>
          </div>
        </SectionCard>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Paper Analysis Queue">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-ink-500">Uploaded</span><strong>{number(paper.papersUploaded)}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Reviewed</span><strong>{number(paper.papersReviewed)}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-ink-500">Converted</span><strong>{number(paper.papersConvertedToRecoveryPacks)}</strong></div>
          </div>
        </SectionCard>
        <SectionCard title="Common Weak Skills">
          <RowList rows={data.commonWeakSkills || []} labelKey="skillId" />
        </SectionCard>
        <SectionCard title="Paper Weak Skills">
          <RowList rows={paper.mostCommonPaperWeakSkills || []} labelKey="skillId" />
        </SectionCard>
        <SectionCard title="Common Misconceptions">
          <RowList rows={data.misconceptions?.mostCommonMisconceptions || []} labelKey="misconception" />
        </SectionCard>
      </section>

      <section className="mt-5">
        <SectionCard title="Students Needing Attention">
          <AttentionTable rows={data.studentsNeedingAttention || []} />
        </SectionCard>
      </section>

      <section className="mt-5">
        <SectionCard title="Mistake Learning Evidence Audit">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <AuditStat label="Reviewed Without Evidence" value={data.mistakeLearningAudit?.reviewedWithoutEvidenceCount} tone="amber" />
            <AuditStat label="Resolved Without Evidence" value={data.mistakeLearningAudit?.resolvedWithoutEvidenceCount} tone="rose" />
            <AuditStat label="Mistakes Checked" value={data.mistakeLearningAudit?.checkedMistakes} />
          </div>
          <MistakeLearningAuditTable audit={data.mistakeLearningAudit || {}} />
        </SectionCard>
      </section>

      <section className="mt-5">
        <SectionCard title="Data Quality Warnings">
          {(data.dataQualityWarnings || []).length ? (
            <div className="space-y-3">
              {data.dataQualityWarnings.map((warning) => (
                <div key={warning.type} className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">{warning.message}</p>
                    <p className="text-xs">Type: {warning.type} · Count: {number(warning.count)} · Severity: {warning.severity}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-success-700">No intervention data quality warnings in this view.</p>
          )}
        </SectionCard>
      </section>
    </main>
  );
}
