import React, { useEffect, useState } from 'react';
import { Sprout, CheckCircle2 } from 'lucide-react';
import { lifelabAPI } from '../../services/api';
import { Card, Button, Textarea, StatusBadge, PageHeader, Spinner, EmptyState, Alert } from '../../components/ui';
import E21ccTags from '../../components/LifeLab/E21ccTags';
import CompetencyGrowth from '../../components/LifeLab/CompetencyGrowth';

// Student LifeLab: assigned applied activities + a simple submit form.
export default function StudentLifeLab() {
  const [subs, setSubs] = useState(null);
  const [comps, setComps] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ dataRecorded: '', reflectionResponse: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => lifelabAPI.me()
    .then((r) => { setSubs(r.data.submissions || []); setComps(r.data.competencies || []); })
    .catch(() => setSubs([]));
  useEffect(() => { load(); }, []);

  const submit = async (id) => {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      await lifelabAPI.submit(id, form);
      setOpenId(null); setForm({ dataRecorded: '', reflectionResponse: '' }); load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not submit your activity. Please try again.');
    } finally { setBusy(false); }
  };

  if (!subs) return <Spinner />;
  return (
    <>
      <PageHeader title="LifeLab" subtitle="Real-life Math & Science activities." />
      <CompetencyGrowth competencies={comps} title="Competencies you're building" className="mb-4" />
      {subs.length === 0 ? (
        <EmptyState icon={Sprout} message="No LifeLab activities assigned yet." />
      ) : (
        <div className="space-y-4">
          {subs.map((s) => {
            const a = s.activity || {};
            return (
              <Card key={s.id} className="p-5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink-700">{a.title}</h3>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-sm text-ink-500">{a.subject} · {a.topic}</p>
                <E21ccTags primary={a.primaryE21cc} secondary={a.secondaryE21cc} className="mt-2" />
                {a.instructions && <p className="mt-2 text-sm text-ink-700">{a.instructions}</p>}
                {a.materials?.length > 0 && <p className="mt-1 text-xs text-ink-400">Materials: {a.materials.join(', ')}</p>}

                {s.status === 'reviewed' && s.teacherFeedback && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-success-700"><CheckCircle2 className="h-4 w-4" /> Teacher: {s.teacherFeedback}</p>
                )}

                {s.status === 'not_started' && (
                  openId === s.id ? (
                    <div className="mt-4 space-y-3">
                      {a.dataRecording && <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Record: {a.dataRecording}</p>}
                      <Textarea rows={2} value={form.dataRecorded} onChange={(e) => setForm((f) => ({ ...f, dataRecorded: e.target.value }))} placeholder="What did you measure / observe?" />
                      <Textarea rows={2} value={form.reflectionResponse} onChange={(e) => setForm((f) => ({ ...f, reflectionResponse: e.target.value }))} placeholder={a.reflectionQuestions?.[0] || 'What did you learn?'} />
                      {err && <Alert tone="error">{err}</Alert>}
                      <Button size="m" disabled={busy} onClick={() => submit(s.id)} className="w-full">{busy ? 'Submitting…' : 'Submit'}</Button>
                    </div>
                  ) : (
                    <div className="mt-4"><Button size="s" onClick={() => { setOpenId(s.id); setForm({ dataRecorded: '', reflectionResponse: '' }); }}>Start activity</Button></div>
                  )
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
