import React, { useEffect, useState } from 'react';
import { GraduationCap, CheckCircle2, Circle, Clock } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import { Card, Button, Badge, StatusBadge, PageHeader, Spinner, ErrorState } from '../../components/ui';

const STATUS_LABEL = { not_started: 'Not started', in_training: 'In training', assessment_pending: 'Assessment pending', interview_pending: 'Interview pending', approved: 'Approved', suspended: 'Suspended' };
const ICON = { completed: CheckCircle2, in_progress: Clock, not_started: Circle };

// Certified-tutor route status. MVP: seeded modules, no full LMS.
export default function Training() {
  const [cert, setCert] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const load = () => { setLoadError(false); setCert(null); tutorAPI.certification().then((r) => setCert(r.data.certification)).catch(() => setLoadError(true)); };
  useEffect(() => { load(); }, []);

  if (loadError) return <ErrorState message="Couldn't load training status." onRetry={load} />;
  if (!cert) return <Spinner />;
  const nextModule = cert.trainingModules.find((m) => m.status !== 'completed');

  return (
    <>
      <PageHeader title="Training & certification" subtitle="Your path to certified tutor." />

      <Card className="mb-5 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-tint text-emerald-deep"><GraduationCap className="h-5 w-5" /></span>
          <div>
            <p className="text-sm text-ink-500">Certification status</p>
            <p className="font-semibold text-ink-700">{STATUS_LABEL[cert.status]}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="navy">Assessment: {cert.assessmentStatus.replace(/_/g, ' ')}</Badge>
          <Badge tone="navy">Interview: {cert.interviewStatus.replace(/_/g, ' ')}</Badge>
          {cert.trainingFeeStatus !== 'not_required' && <Badge tone="gold">Fee: {cert.trainingFeeStatus}</Badge>}
        </div>
      </Card>

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Training modules</h3>
      <div className="mb-5 space-y-2">
        {cert.trainingModules.map((m, i) => {
          const I = ICON[m.status] || Circle;
          return (
            <Card key={i} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <I className={`h-5 w-5 ${m.status === 'completed' ? 'text-success-500' : m.status === 'in_progress' ? 'text-gold-deep' : 'text-ink-300'}`} />
                <span className="text-ink-700">{m.title}</span>
              </div>
              <StatusBadge status={m.status} />
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Approved levels</p>
          <div className="flex flex-wrap gap-2">{cert.approvedLevels.length ? cert.approvedLevels.map((l) => <Badge key={l} tone="navy">{l}</Badge>) : <span className="text-sm text-ink-400">None yet</span>}</div>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Approved modules</p>
          <div className="flex flex-wrap gap-2">{cert.approvedModules.length ? cert.approvedModules.map((m) => <Badge key={m} tone="navy">{m}</Badge>) : <span className="text-sm text-ink-400">None yet</span>}</div>
        </Card>
      </div>

      {nextModule && (
        <Card className="mt-6 p-4">
          <p className="font-semibold text-ink-700">Training modules are tracked here.</p>
          <p className="mt-1 text-sm text-ink-500">Full training content will be added during the certification phase. For now, progress and module status are displayed above.</p>
          <div className="mt-3"><Button disabled variant="secondary">Training content coming soon</Button></div>
        </Card>
      )}
    </>
  );
}
