import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, KeyRound, Upload, Users } from 'lucide-react';
import { schoolAdminAPI } from '../../../services/api';
import { Badge, Button, Card, ErrorState, PageHeader, Spinner } from '../../../components/ui';

function SeatUsageBar({ used, limit }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = pct >= 90 ? 'bg-error-500' : pct >= 70 ? 'bg-gold-400' : 'bg-navy-500';
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-ink-600">
        <span>Student seats</span>
        <span className="font-mono">{used}{limit ? ` / ${limit}` : ' (unlimited)'}</span>
      </div>
      {limit ? (
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-bone">
          <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function CreateClassForm({ onCreated }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try { await schoolAdminAPI.createClass({ name: name.trim(), level: level.trim() }); setName(''); setLevel(''); onCreated?.(); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[160px]">
        <label className="text-xs text-ink-500">Class name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="P5 Diligence" className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-navy-300" />
      </div>
      <div className="w-32">
        <label className="text-xs text-ink-500">Level</label>
        <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Primary 5" className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-navy-300" />
      </div>
      <Button type="submit" disabled={busy} icon={Building2}>Add class</Button>
    </form>
  );
}

function BulkImportCard({ classes, onImported }) {
  const [csv, setCsv] = useState('');
  const [createLogins, setCreateLogins] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result || ''));
    reader.readAsText(file);
  };

  const run = async () => {
    if (!csv.trim()) return;
    setBusy(true); setResult(null);
    try {
      const res = await schoolAdminAPI.bulkImport({ csv, createLogins, createMissingClasses: true });
      setResult(res.data);
      onImported?.();
    } catch (err) {
      setResult({ error: err?.response?.data?.error || 'Import failed.' });
    } finally { setBusy(false); }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2"><Upload className="h-4 w-4 text-ink-400" /><h3 className="text-sm font-semibold text-ink-700">Bulk import roster</h3></div>
      <p className="mt-1 text-xs text-ink-500">Upload or paste a CSV with a header row. Columns: <code>name</code> (required), <code>level</code>, <code>class</code>, <code>email</code>, <code>parent_email</code>.</p>
      <input type="file" accept=".csv,text/csv" onChange={onFile} className="mt-3 block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border file:border-hairline file:bg-paper file:px-3 file:py-1.5 file:text-sm" />
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={5} placeholder={'name,level,class,email\nAisha Tan,Primary 5,P5 Diligence,aisha@school.edu'} className="mt-2 w-full rounded-lg border border-hairline p-2 font-mono text-xs outline-none focus:border-navy-300" />
      <label className="mt-2 flex items-center gap-2 text-sm text-ink-600">
        <input type="checkbox" checked={createLogins} onChange={(e) => setCreateLogins(e.target.checked)} />
        Create student logins (requires an email column)
      </label>
      <div className="mt-3"><Button onClick={run} disabled={busy || !csv.trim()} icon={Upload}>{busy ? 'Importing…' : 'Import roster'}</Button></div>

      {result?.error ? <p className="mt-3 text-sm text-error-700">{result.error}</p> : null}
      {result?.summary ? (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge tone="success">{result.summary.created} created</Badge>
            <Badge tone="gold">{result.summary.skipped} skipped</Badge>
            <Badge tone={result.summary.failed ? 'error' : 'neutral'}>{result.summary.failed} failed</Badge>
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-hairline">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-bone text-ink-500"><tr><th className="px-2 py-1.5">#</th><th className="px-2 py-1.5">Name</th><th className="px-2 py-1.5">Status</th><th className="px-2 py-1.5">Note</th></tr></thead>
              <tbody>
                {(result.results || []).map((r) => (
                  <tr key={r.rowNum} className="border-t border-hairline">
                    <td className="px-2 py-1.5">{r.rowNum}</td>
                    <td className="px-2 py-1.5 text-ink-700">{r.name || '—'}</td>
                    <td className="px-2 py-1.5"><Badge tone={r.status === 'created' ? 'success' : r.status === 'skipped' ? 'gold' : 'error'}>{r.status}</Badge></td>
                    <td className="px-2 py-1.5 text-ink-500">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ClassRow({ cls, onCode }) {
  const [code, setCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const gen = async () => {
    setBusy(true);
    try { const res = await schoolAdminAPI.createJoinCode(cls.classId, { expiresInDays: 30 }); setCode(res.data?.joinCode?.code || null); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex items-center justify-between gap-3 border-t border-hairline py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-ink-700">{cls.name}</p>
        <p className="text-xs text-ink-500">{cls.level || '—'} · {cls.studentCount} students</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {code ? <Badge tone="navy"><KeyRound className="mr-1 inline h-3 w-3" />{code}</Badge> : null}
        <Button size="s" variant="secondary" onClick={gen} disabled={busy}>{busy ? '…' : 'Join code'}</Button>
      </div>
    </div>
  );
}

export default function SchoolAdminConsole() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false); setData(null);
    schoolAdminAPI.overview().then((r) => setData(r.data)).catch(() => setError(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  const classes = useMemo(() => data?.classes || [], [data]);

  if (error) return <ErrorState message="Couldn't load the school console. You need a School plan and administrator access." onRetry={load} />;
  if (!data) return <Spinner label="Loading school console…" />;

  return (
    <>
      <PageHeader
        title="School administration"
        subtitle={`${data.workspace?.name || 'School'} · ${data.planName || data.tier} plan`}
      />

      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-ink-400" /><h3 className="text-sm font-semibold text-ink-700">Seat usage</h3></div>
          <div className="mt-3"><SeatUsageBar used={data.seatUsage?.students || 0} limit={data.seatUsage?.studentLimit} /></div>
        </Card>

        <BulkImportCard classes={classes} onImported={load} />

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-ink-400" /><h3 className="text-sm font-semibold text-ink-700">Classes</h3></div>
          <CreateClassForm onCreated={load} />
          <div className="mt-3">
            {classes.length ? classes.map((c) => <ClassRow key={c.classId} cls={c} />) : <p className="text-sm text-ink-500">No classes yet. Add one above.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
