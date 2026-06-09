import React, { useEffect, useState } from 'react';
import { Link2, ShieldCheck, X } from 'lucide-react';
import { studentLinksAPI } from '../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState, ErrorState, Field, Input, Alert } from '../../components/ui';

// Parent surface for Gap C: approve/decline tutor link requests, manage/revoke
// active links, and redeem a school-issued claim code (two-email case).
export default function LinkRequests() {
  const [requests, setRequests] = useState(null);
  const [links, setLinks] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState(null);

  const load = () => {
    setError(null);
    setRequests(null);
    Promise.all([studentLinksAPI.requests(), studentLinksAPI.mine()])
      .then(([r, m]) => { setRequests(r.data.requests || []); setLinks(m.data.links || []); })
      .catch((e) => setError(e.response?.data?.error || 'Could not load link requests.'));
  };
  useEffect(() => { load(); }, []);

  const act = async (fn, id) => {
    setBusyId(id);
    try { await fn(); load(); } catch (e) { setError(e.response?.data?.error || 'Action failed.'); }
    finally { setBusyId(null); }
  };

  const redeem = async (e) => {
    e.preventDefault();
    setCodeMsg(null);
    try {
      await studentLinksAPI.redeemClaimCode(code.trim());
      setCodeMsg({ tone: 'success', text: 'Code accepted — the school account is now linked to you.' });
      setCode('');
      load();
    } catch (err) {
      setCodeMsg({ tone: 'error', text: err.response?.data?.error || 'Invalid or expired code.' });
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!requests) return <Spinner />;

  return (
    <>
      <PageHeader title="Tutor access" subtitle="Approve who can see your child's math progress." />

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Pending requests</h3>
      {requests.length === 0 ? (
        <EmptyState icon={Link2} message="No pending requests." />
      ) : (
        <div className="mb-6 space-y-2">
          {requests.map((r) => (
            <Card key={r._id} className="p-4">
              <p className="font-medium text-ink-700">A tutor requested access</p>
              <p className="mt-0.5 text-sm text-ink-500">They'll see: math progress &amp; mastery. They cannot see school teacher notes.</p>
              <div className="mt-3 flex gap-2">
                <Button size="s" icon={ShieldCheck} disabled={busyId === r._id}
                  onClick={() => act(() => studentLinksAPI.consent(r._id), r._id)}>Approve</Button>
                <Button size="s" variant="secondary" disabled={busyId === r._id}
                  onClick={() => act(() => studentLinksAPI.decline(r._id), r._id)}>Decline</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Active tutor access</h3>
      {links.length === 0 ? (
        <EmptyState message="No tutors currently have access." />
      ) : (
        <div className="mb-6 space-y-2">
          {links.map((l) => (
            <Card key={l._id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-ink-700">Tutor access active</p>
                <p className="text-sm text-ink-500">{(l.sharedScopes || []).join(', ')}</p>
              </div>
              <Button size="s" variant="secondary" icon={X} disabled={busyId === l._id}
                onClick={() => act(() => studentLinksAPI.revoke(l._id), l._id)}>Revoke</Button>
            </Card>
          ))}
        </div>
      )}

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Have a school code?</h3>
      <Card className="p-4">
        <p className="mb-3 text-sm text-ink-500">If your child already has a school account, enter the code your school gave you to link it to your account.</p>
        {codeMsg && <Alert tone={codeMsg.tone} className="mb-3">{codeMsg.text}</Alert>}
        <form onSubmit={redeem} className="flex items-end gap-2">
          <Field label="School code" className="flex-1">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. ABCD2345" />
          </Field>
          <Button type="submit" disabled={!code.trim()}>Link account</Button>
        </form>
      </Card>
    </>
  );
}
