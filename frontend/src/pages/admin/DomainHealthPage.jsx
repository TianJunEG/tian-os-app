import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleDashed, Layers } from 'lucide-react';
import { adminAPI } from '../../services/api';

const capabilityLabels = {
  diagnostics: 'Diagnostics',
  assignments: 'Assignments',
  worksheets: 'Worksheets',
  paperAnalysis: 'Paper Analysis',
  interventions: 'Interventions',
};

function statusIcon(capability) {
  if (capability?.enabled) return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
  if (capability?.status === 'not_registered') return <CircleDashed className="h-5 w-5 text-slate-400" aria-hidden="true" />;
  return <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />;
}

export default function DomainHealthPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    adminAPI.getDomainHealth()
      .then((response) => {
        if (mounted) setReport(response.data || response);
      })
      .catch(() => {
        if (mounted) setError('Unable to load domain health.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-600">Loading domain health...</div>;
  }

  if (error) {
    return (
      <main className="p-6">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</div>
      </main>
    );
  }

  const domains = report?.registeredDomains || [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Admin</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-950">Domain Health</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Registered subject domains and the platform contracts they currently support.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-3 text-indigo-900">
              <Layers className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-semibold">{domains.length} domains registered</span>
            </div>
          </div>
        </header>

        <section className="grid gap-4">
          {domains.map((domain) => (
            <article key={`${domain.subjectId}:${domain.domainId}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{domain.displayName}</h2>
                  <p className="text-sm text-slate-500">
                    {domain.subjectId} / {domain.domainId}
                    {domain.domainVersion ? ` · ${domain.domainVersion}` : ''}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Registered
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(domain.capabilities || {}).map(([key, capability]) => (
                  <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(capability)}
                      <span className="text-sm font-semibold text-slate-900">{capabilityLabels[key] || key}</span>
                    </div>
                    <p className="mt-2 text-xs capitalize text-slate-500">{capability?.status || 'unknown'}</p>
                    {capability?.notes ? <p className="mt-2 text-xs text-slate-600">{capability.notes}</p> : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Adapter Contracts</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(report?.platformContracts || {}).map(([name, contract]) => (
              <div key={name} className="rounded-lg bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{name}</h3>
                <p className="mt-2 text-xs text-slate-600">{(contract.required || []).join(', ')}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
