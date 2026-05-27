import React, { useEffect, useState } from 'react';
import { Sprout, CheckCircle2 } from 'lucide-react';
import { lifelabAPI } from '../../services/api';
import { Card, Button, StatusBadge, PageHeader, Spinner, EmptyState } from '../../components/ui';

// Student LifeLab: assigned applied activities + a simple submit form.
export default function StudentLifeLab() {
  const [subs, setSubs] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ dataRecorded: '', reflectionResponse: '' });

  const load = () => lifelabAPI.me().then((r) => setSubs(r.data.submissions || [])).catch(() => setSubs([]));
  useEffect(() => { load(); }, []);

  const submit = async (id) => {
    await lifelabAPI.submit(id, form);
    setOpenId(null); setForm({ dataRecorded: '', reflectionResponse: '' }); load();
  };

  if (!subs) return <Spinner />;
  return (
    <>
      <PageHeader title="LifeLab" subtitle="Real-life Math & Science activities." />
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
                {a.instructions && <p className="mt-2 text-sm text-ink-700">{a.instructions}</p>}
                {a.materials?.length > 0 && <p className="mt-1 text-xs text-ink-400">Materials: {a.materials.join(', ')}</p>}

                {s.status === 'reviewed' && s.teacherFeedback && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-success-700"><CheckCircle2 className="h-4 w-4" /> Teacher: {s.teacherFeedback}</p>
                )}

                {s.status === 'not_started' && (
                  openId === s.id ? (
                    <div className="mt-4 space-y-3">
                      {a.dataRecording && <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Record: {a.dataRecording}</p>}
                      <textarea rows={2} value={form.dataRecorded} onChange={(e) => setForm((f) => ({ ...f, dataRecorded: e.target.value }))} placeholder="What did you measure / observe?" className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm" />
                      <textarea rows={2} value={form.reflectionResponse} onChange={(e) => setForm((f) => ({ ...f, reflectionResponse: e.target.value }))} placeholder={a.reflectionQuestions?.[0] || 'What did you learn?'} className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm" />
                      <Button size="m" onClick={() => submit(s.id)} className="w-full">Submit</Button>
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
