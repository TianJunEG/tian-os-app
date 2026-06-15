import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Badge, Button, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';

const STAFF_ROLES = ['owner', 'manager', 'student_care_staff', 'tutor', 'teacher', 'admin'];
const RELATIONSHIPS = ['enrolled', 'pilot', 'tuition', 'student_care'];

function label(value) {
  return String(value || '').replace(/_/g, ' ');
}

function Row({ label: title, value }) {
  return <div className="flex justify-between gap-3 text-sm"><span className="text-ink-500">{title}</span><strong className="text-right text-ink-900">{value || 0}</strong></div>;
}

export default function PartnerDetailPage() {
  const { partnerId } = useParams();
  const [state, setState] = useState({ loading: true, error: '', data: null, report: null, billing: null });
  const [staffForm, setStaffForm] = useState({ userId: '', role: 'student_care_staff' });
  const [studentForm, setStudentForm] = useState({ studentId: '', relationshipType: 'pilot' });
  const [edit, setEdit] = useState({ name: '', status: '', notes: '' });
  const [message, setMessage] = useState('');

  const load = () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    Promise.all([
      adminAPI.getPartner(partnerId),
      adminAPI.getPartnerImpactReport(partnerId),
      adminAPI.getPartnerBilling(partnerId).catch(() => ({ data: { billing: null } })),
    ])
      .then(([partnerRes, reportRes, billingRes]) => {
        const partner = partnerRes.data.partner || {};
        setEdit({ name: partner.name || '', status: partner.status || 'prospect', notes: partner.notes || '' });
        setState({ loading: false, error: '', data: partnerRes.data, report: reportRes.data, billing: billingRes.data.billing || null });
      })
      .catch((err) => setState({ loading: false, error: err?.response?.data?.error || 'Could not load partner.', data: null, report: null, billing: null }));
  };

  useEffect(() => { load(); }, [partnerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn, success) => {
    setMessage('');
    try {
      await fn();
      setMessage(success);
      load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Action failed.');
    }
  };

  if (state.loading) return <Spinner label="Loading partner…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  const { partner, staff = [], students = [] } = state.data || {};
  const report = state.report || {};
  const metrics = partner?.metrics || {};
  const billing = state.billing || null;

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <Link to="/admin/partners" className="mb-3 inline-block text-sm font-semibold text-emerald-deep">Back to partners</Link>
      <PageHeader title={partner?.name || 'Partner'} subtitle={`${label(partner?.type)} · ${label(partner?.status)}`} />
      {message && <Card className="mb-4 border-l-4 border-navy-400 p-4 text-sm text-ink-700">{message}</Card>}

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Partner Profile</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="rounded-xl border border-line-soft px-3 py-2 text-sm" value={edit.name} onChange={(event) => setEdit((prev) => ({ ...prev, name: event.target.value }))} />
            <select className="rounded-xl border border-line-soft px-3 py-2 text-sm" value={edit.status} onChange={(event) => setEdit((prev) => ({ ...prev, status: event.target.value }))}>
              {['prospect', 'pilot', 'active', 'paused', 'archived'].map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </select>
            <textarea className="min-h-[100px] rounded-xl border border-line-soft px-3 py-2 text-sm md:col-span-2" value={edit.notes} onChange={(event) => setEdit((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Notes" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="s" onClick={() => run(() => adminAPI.updatePartner(partnerId, edit), 'Partner updated.')}>Save Profile</Button>
            <Button size="s" variant="secondary" onClick={() => run(() => adminAPI.archivePartner(partnerId), 'Partner archived.')}>Archive Partner</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Intervention Metrics</h2>
          <div className="mt-4 space-y-3">
            <Row label="Students" value={metrics.totalStudents} />
            <Row label="Active students 7d" value={metrics.activeStudents7d} />
            <Row label="Baseline diagnostics" value={metrics.baselineDiagnosticsCompleted} />
            <Row label="Recovery packs completed" value={metrics.recoveryPacksCompleted} />
            <Row label="Rechecks completed" value={metrics.rechecksCompleted} />
            <Row label="Average readiness gain" value={metrics.averageReadinessImprovement} />
            <Row label="Papers uploaded" value={metrics.papersUploaded} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Billing Readiness</h2>
          {billing ? (
            <div className="mt-4 space-y-3">
              <Row label="Current plan" value={label(billing.plan?.planType)} />
              <Row label="Subscription" value={billing.subscription?.status || billing.plan?.source || 'role default'} />
              <Row label="Student limit" value={billing.plan?.limits?.students ?? 'Unlimited'} />
              <Row label="Staff limit" value={billing.plan?.limits?.staff ?? 'Unlimited'} />
              <Row label="Students used" value={billing.usage?.students} />
              <Row label="Staff used" value={billing.usage?.staff} />
              <Row label="Trial ends" value={billing.subscription?.trialEnd ? new Date(billing.subscription.trialEnd).toLocaleDateString('en-SG') : 'Not set'} />
              {billing.pilotOverrideActive && <Badge tone="navy">{label(billing.subscription?.pilotOverride?.type)}</Badge>}
            </div>
          ) : <p className="mt-4 text-sm text-ink-500">Billing has not been configured for this partner yet.</p>}
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Staff</h2>
          <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => {
            event.preventDefault();
            run(() => adminAPI.addPartnerStaff(partnerId, staffForm), 'Staff link saved.');
          }}>
            <input className="min-w-0 flex-1 rounded-xl border border-line-soft px-3 py-2 text-sm" placeholder="User ID" value={staffForm.userId} onChange={(event) => setStaffForm((prev) => ({ ...prev, userId: event.target.value }))} required />
            <select className="rounded-xl border border-line-soft px-3 py-2 text-sm" value={staffForm.role} onChange={(event) => setStaffForm((prev) => ({ ...prev, role: event.target.value }))}>
              {STAFF_ROLES.map((role) => <option key={role} value={role}>{label(role)}</option>)}
            </select>
            <Button size="s">Add</Button>
          </form>
          <div className="mt-4 space-y-2">
            {staff.length === 0 ? <p className="text-sm text-ink-500">No staff linked yet.</p> : staff.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-line-soft p-3 text-sm">
                <div><p className="font-semibold text-ink-800">{row.name || row.userId}</p><p className="text-ink-500">{row.email} · {label(row.role)}</p></div>
                <Button size="s" variant="secondary" onClick={() => run(() => adminAPI.removePartnerStaff(partnerId, row.id), 'Staff link removed.')}>Remove</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Students</h2>
          <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => {
            event.preventDefault();
            run(() => adminAPI.linkPartnerStudent(partnerId, studentForm), 'Student link saved.');
          }}>
            <input className="min-w-0 flex-1 rounded-xl border border-line-soft px-3 py-2 text-sm" placeholder="Student ID" value={studentForm.studentId} onChange={(event) => setStudentForm((prev) => ({ ...prev, studentId: event.target.value }))} required />
            <select className="rounded-xl border border-line-soft px-3 py-2 text-sm" value={studentForm.relationshipType} onChange={(event) => setStudentForm((prev) => ({ ...prev, relationshipType: event.target.value }))}>
              {RELATIONSHIPS.map((relationship) => <option key={relationship} value={relationship}>{label(relationship)}</option>)}
            </select>
            <Button size="s">Link</Button>
          </form>
          <div className="mt-4 space-y-2">
            {students.length === 0 ? <p className="text-sm text-ink-500">No students linked yet.</p> : students.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-line-soft p-3 text-sm">
                <div><p className="font-semibold text-ink-800">{row.name || row.studentId}</p><p className="text-ink-500">{row.level} · {label(row.relationshipType)}</p></div>
                <Button size="s" variant="secondary" onClick={() => run(() => adminAPI.removePartnerStudent(partnerId, row.id), 'Student link removed.')}>Remove</Button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Impact Evidence</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Pilot size" value={report.pilotSize} />
            <Row label="Intervention completion" value={`${report.interventionCompletionRate || 0}%`} />
            <Row label="Recheck completion" value={`${report.recheckCompletionRate || 0}%`} />
            <Row label="Average readiness gain" value={report.averageReadinessGain} />
          </div>
          {(report.dataQualityWarnings || []).length > 0 && (
            <div className="mt-4 rounded-xl bg-tianPeach p-3 text-sm text-error-700">
              {report.dataQualityWarnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Skill Evidence</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Top improved</p>
              {(report.topImprovedSkills || []).length ? report.topImprovedSkills.map((skill) => (
                <p key={skill.skillId} className="mt-2 text-sm text-ink-700">{skill.skillName || skill.skillId}: +{skill.averageImprovement}</p>
              )) : <p className="mt-2 text-sm text-ink-500">No improvement data yet.</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Remaining weak</p>
              {(report.topRemainingWeakSkills || []).length ? report.topRemainingWeakSkills.map((skill) => (
                <p key={skill.skillId} className="mt-2 text-sm text-ink-700">{skill.skillId} <Badge tone="error">{skill.count}</Badge></p>
              )) : <p className="mt-2 text-sm text-ink-500">No weak skill data yet.</p>}
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
