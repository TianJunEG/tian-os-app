import React, { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Eye, FileWarning, Layers, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Badge, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';

function number(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat().format(Number.isFinite(n) ? n : 0);
}

function MetricCard({ icon: Icon, label, value, tone = 'navy' }) {
  const toneClass = {
    navy: 'bg-emerald-tint text-emerald-deep',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-danger-tint text-danger-deep',
  }[tone] || 'bg-emerald-tint text-emerald-deep';

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-mono text-2xl font-semibold text-ink-900 tabular-nums">{number(value)}</p>
          <p className="mt-1 text-sm font-semibold text-ink-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function Section({ title, children }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-ink-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Empty({ children = 'No issues detected in this sample.' }) {
  return <p className="text-sm text-ink-500">{children}</p>;
}

function QualityTable({ rows = [] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.08em] text-ink-500">
          <tr>
            <th className="pb-2 pr-4">Skill</th>
            <th className="pb-2 pr-4">Score</th>
            <th className="pb-2 pr-4">Issue</th>
            <th className="pb-2">Question</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((row) => (
            <tr key={row.questionId} className="border-t border-line-soft">
              <td className="py-3 pr-4 font-semibold text-ink-800">{row.skillId || 'Unmapped'}</td>
              <td className="py-3 pr-4"><Badge tone={row.qualityScore < 60 ? 'error' : 'yellow'}>{row.qualityScore}</Badge></td>
              <td className="py-3 pr-4 text-ink-600">{(row.flags || []).slice(0, 2).join(', ') || 'Review recommended'}</td>
              <td className="max-w-xl py-3 text-ink-700">{row.questionText}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MissingDiagramTable({ rows = [] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="space-y-3">
      {rows.slice(0, 10).map((row) => (
        <div key={row.questionId} className="rounded-2xl border border-line-soft p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="yellow">{row.skillId}</Badge>
            {(row.missingVisuals || []).map((type) => <Badge key={type} tone="navy">{type}</Badge>)}
          </div>
          <p className="mt-2 text-sm text-ink-700">{row.questionText}</p>
        </div>
      ))}
    </div>
  );
}

function SimpleRows({ rows = [], labelKey, valueKey = 'count', empty = 'No issues detected.' }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 10).map((row) => (
        <div key={`${row[labelKey]}-${row[valueKey]}`} className="flex items-center justify-between gap-3 border-b border-line-soft pb-3 last:border-b-0 last:pb-0">
          <span className="text-sm font-semibold text-ink-800">{row[labelKey]}</span>
          <Badge tone="navy">{number(row[valueKey])}</Badge>
        </div>
      ))}
    </div>
  );
}

function MisconceptionGaps({ rows = [] }) {
  if (!rows.length) return <Empty>Misconception coverage is complete for the configured skill map.</Empty>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 10).map((row) => (
        <div key={row.skillId} className="border-b border-line-soft pb-3 last:border-b-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-ink-800">{row.skillId} · {row.skillName}</span>
            <Badge tone="yellow">{row.missing.length} gaps</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">{row.missing.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}

export default function QuestionQualityPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    adminAPI.getQuestionQuality({ domainId: 'fractions' })
      .then((res) => {
        if (active) setState({ loading: false, error: '', data: res.data });
      })
      .catch((err) => {
        if (active) setState({ loading: false, error: err?.response?.data?.error || 'Could not load question quality audit.', data: null });
      });
    return () => { active = false; };
  }, []);

  if (state.loading) return <Spinner label="Loading question quality audit..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;

  const data = state.data || {};
  const sourceCounts = data.sourceCounts || {};

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader
        title="Question Quality"
        subtitle="Internal audit of MathPath curriculum fit, diagrams, difficulty, templates, answer inputs, and misconception coverage."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BarChart3} label="Average Quality" value={data.averageQualityScore} tone={data.averageQualityScore >= 75 ? 'green' : 'amber'} />
        <MetricCard icon={Layers} label="Questions Audited" value={data.totalQuestions} />
        <MetricCard icon={Eye} label="Generated Questions" value={sourceCounts.generatedQuestions} />
        <MetricCard icon={AlertTriangle} label="Missing Diagrams" value={(data.missingDiagrams || []).length} tone="amber" />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Low-Quality Questions">
          <QualityTable rows={data.lowQualityQuestions || []} />
        </Section>
        <Section title="Missing Visual Models">
          <MissingDiagramTable rows={data.missingDiagrams || []} />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <Section title="Top Issue Types">
          <SimpleRows rows={data.topIssues || []} labelKey="flag" />
        </Section>
        <Section title="Repeated Templates">
          <SimpleRows rows={data.repeatedTemplates || []} labelKey="signature" empty="No repeated wording groups detected." />
        </Section>
        <Section title="Misconception Gaps">
          <MisconceptionGaps rows={data.misconceptionGaps || []} />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Difficulty / Scope Issues">
          <QualityTable rows={data.difficultyIssues || []} />
        </Section>
        <Section title="Answer Input Issues">
          <QualityTable rows={data.answerInputIssues || []} />
        </Section>
      </section>

      <Card className="mt-5 p-4">
        <div className="flex items-center gap-3 text-sm text-ink-600">
          <FileWarning className="h-5 w-5 text-amber-600" />
          <span>This audit is advisory. It does not change question selection or student delivery.</span>
          <RefreshCw className="ml-auto h-4 w-4 text-ink-400" />
        </div>
      </Card>
    </main>
  );
}
