import React, { useState } from 'react';
import { Link2 } from 'lucide-react';
import { studentLinksAPI } from '../../services/api';
import { Card, Button, PageHeader, Field, Input, Alert } from '../../components/ui';

// Tutor requests access to a student who already has an account (e.g. a school
// student). The student's guardian must approve before the tutor sees anything.
export default function RequestStudentLink() {
  const [studentId, setStudentId] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await studentLinksAPI.tutorRequest(studentId.trim());
      setMsg({ tone: 'success', text: "Request sent. The student's guardian will be asked to approve." });
      setStudentId('');
    } catch (err) {
      setMsg({ tone: 'error', text: err.response?.data?.error || 'Could not send the request.' });
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Request student access" subtitle="Connect to a student who already has an account." />
      <Card className="p-5">
        <p className="mb-4 text-sm text-ink-500">
          Enter the student's ID (e.g. shared by their school or parent). A request is sent to the
          guardian; once approved, the student appears in your dashboard with their math progress.
          You won't see school teacher notes.
        </p>
        {msg && <Alert tone={msg.tone} className="mb-4">{msg.text}</Alert>}
        <form onSubmit={submit} className="flex items-end gap-2">
          <Field label="Student ID" className="flex-1">
            <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student ID" />
          </Field>
          <Button type="submit" icon={Link2} disabled={!studentId.trim() || busy}>{busy ? 'Sending…' : 'Send request'}</Button>
        </form>
      </Card>
    </>
  );
}
