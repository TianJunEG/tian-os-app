import React, { useEffect, useState } from 'react';
import { Sprout, CheckCircle2, Upload, Image as ImageIcon } from 'lucide-react';
import { lifelabAPI, SERVER_ORIGIN } from '../../services/api';
import { Card, Button, Textarea, StatusBadge, PageHeader, Spinner, EmptyState, Alert, ErrorState } from '../../components/ui';
import E21ccTags from '../../components/LifeLab/E21ccTags';
import CompetencyGrowth from '../../components/LifeLab/CompetencyGrowth';

export default function StudentLifeLab() {
  const [subs, setSubs] = useState(null);
  const [comps, setComps] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ dataRecorded: '', reflectionResponse: '' });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false);
    setSubs(null);
    return lifelabAPI.me()
      .then((r) => { setSubs(r.data.submissions || []); setComps(r.data.competencies || []); })
      .catch(() => { setLoadError(true); setSubs(null); });
  };
  useEffect(() => { load(); }, []);

  const submit = async (id) => {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      if (evidenceFile) {
        setUploading(true);
        await lifelabAPI.uploadEvidence(id, evidenceFile);
        setUploading(false);
      }
      await lifelabAPI.submit(id, form);
      setOpenId(null);
      setForm({ dataRecorded: '', reflectionResponse: '' });
      setEvidenceFile(null);
      load();
    } catch (e) {
      setUploading(false);
      setErr(e.response?.data?.error || 'Could not submit your activity. Please try again.');
    } finally { setBusy(false); }
  };

  if (loadError) return <ErrorState message="Couldn't load LifeLab activities." onRetry={load} />;
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
                {a.realLifeContext && <p className="mt-2 text-sm text-ink-500 italic">{a.realLifeContext}</p>}
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

                      {/* Evidence upload */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                          {a.evidencePrompt || 'Upload evidence (photo, file, etc.)'}
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink-200 px-4 py-3 text-sm text-ink-500 transition hover:border-primary-400 hover:text-primary-600">
                          {evidenceFile ? <ImageIcon className="h-4 w-4 shrink-0 text-primary-500" /> : <Upload className="h-4 w-4 shrink-0" />}
                          <span className="truncate">{evidenceFile ? evidenceFile.name : 'Choose a file…'}</span>
                          <input type="file" className="hidden" accept="image/*,video/*,.pdf" onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)} />
                        </label>
                      </div>

                      {err && <Alert tone="error">{err}</Alert>}
                      <Button size="m" disabled={busy} onClick={() => submit(s.id)} className="w-full">
                        {uploading ? 'Uploading evidence…' : busy ? 'Submitting…' : 'Submit'}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4"><Button size="s" onClick={() => { setOpenId(s.id); setForm({ dataRecorded: '', reflectionResponse: '' }); setEvidenceFile(null); }}>Start activity</Button></div>
                  )
                )}

                {/* Show existing evidence thumbnail for submitted/reviewed items */}
                {s.status !== 'not_started' && s.evidenceUrl && (
                  <div className="mt-3">
                    <a href={SERVER_ORIGIN + s.evidenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline">
                      <ImageIcon className="h-3.5 w-3.5" /> View evidence
                    </a>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
