import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function MisconceptionCoveragePage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    adminAPI.getMisconceptionCoverage()
      .then((response) => {
        if (mounted) setReport(response.data || response);
      })
      .catch(() => {
        if (mounted) setError('Unable to load misconception coverage.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) return <main className="p-6 text-body-soft">Loading misconception coverage...</main>;
  if (error) return <main className="p-6"><div className="rounded-lg border border-danger-border bg-danger-tint p-4 text-rose-800">{error}</div></main>;

  const rows = report?.rows || [];

  return (
    <main className="min-h-screen bg-surface-raised px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">MathPath</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Misconception Coverage</h1>
          <p className="mt-2 max-w-3xl text-sm text-body-soft">
            Coverage by skill for diagnostic evidence, misconception tagging, remediation, and recheck readiness.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Summary label="Skills" value={report?.skillCount || 0} />
            <Summary label="Misconceptions" value={report?.misconceptionCount || 0} />
            <Summary label="Coverage" value={`${report?.coveragePercent || 0}%`} />
            <Summary label="Weak Skills" value={report?.weakSkills?.length || 0} />
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-surface-raised text-left text-xs font-semibold uppercase tracking-wide text-body-soft">
                <tr>
                  <th className="px-4 py-3">Skill</th>
                  <th className="px-4 py-3">Coverage</th>
                  <th className="px-4 py-3">Misconceptions</th>
                  <th className="px-4 py-3">Diagnostic</th>
                  <th className="px-4 py-3">Remediation</th>
                  <th className="px-4 py-3">Gaps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.skillId} className="align-top">
                    <td className="px-4 py-4 font-semibold text-slate-950">
                      {row.skillId}
                      <div className="mt-1 font-normal text-body-soft">{row.skillName}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${row.coverageScore >= 85 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {row.coverageScore >= 85 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                        {row.coverageScore}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-body">{row.misconceptionsCurrentlyCovered.join(', ')}</td>
                    <td className="px-4 py-4 text-body">{row.diagnosticCoverage.join(', ') || 'Missing'}</td>
                    <td className="px-4 py-4 text-body">{row.remediationCoverage.join(', ') || 'Missing'}</td>
                    <td className="px-4 py-4 text-body">{row.misconceptionsMissing.join(', ') || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-lg bg-surface-raised p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-body-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}
