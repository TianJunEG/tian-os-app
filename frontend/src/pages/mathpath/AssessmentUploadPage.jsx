import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, FileUp, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { assessmentUploadAPI } from '../../services/api';
import { Alert, Badge, Button, Card, Checkbox, Field, PageHeader } from '../../components/ui';

const CONSENT_TEXT =
  'I understand the uploaded file will be automatically deleted after analysis.';

function defaultForm(userRole) {
  return {
    title: '',
    level: 'P6',
    subject: 'Math',
    school: '',
    assessmentType: '',
    durationMinutes: '',
    totalMarks: '',
    calculatorAllowed: false,
    timed: true,
    ownerType: userRole || '',
  };
}

export default function AssessmentUploadPage() {
  const { user } = useAuth();
  const params = useParams();

  const [form, setForm] = useState(defaultForm(user?.role));
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const role = user?.role || '';
  const target = useMemo(() => {
    if (role === 'parent') return { studentId: params.studentId || '' };
    if (role === 'tutor') return { studentId: params.id || '' };
    if (role === 'teacher') return { classId: params.id || '' };
    return {};
  }, [params.id, params.studentId, role]);

  const canUpload = Boolean(file) && consentAccepted && !loading;

  const onUpload = async () => {
    if (!canUpload) return;
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('paper', file);
      body.append('consentAccepted', 'true');
      body.append('ownerType', role);
      if (target.studentId) body.append('studentId', target.studentId);
      if (target.classId) body.append('classId', target.classId);

      if (form.title) body.append('title', form.title);
      if (form.level) body.append('level', form.level);
      if (form.subject) body.append('subject', form.subject);
      if (form.school) body.append('school', form.school);
      if (form.assessmentType) body.append('assessmentType', form.assessmentType);
      if (form.durationMinutes) body.append('durationMinutes', String(form.durationMinutes));
      if (form.totalMarks) body.append('totalMarks', String(form.totalMarks));
      body.append('calculatorAllowed', String(form.calculatorAllowed));
      body.append('timed', String(form.timed));

      const res = await assessmentUploadAPI.upload(body);
      setResult(res.data || null);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    const uploadId = result?.upload?.uploadId;
    if (!uploadId) return;
    setRefreshing(true);
    setError('');
    try {
      const [statusRes, metaRes] = await Promise.all([
        assessmentUploadAPI.status(uploadId),
        assessmentUploadAPI.metadata(uploadId),
      ]);
      setResult((prev) => ({
        ...(prev || {}),
        upload: statusRes.data?.upload || prev?.upload,
        analysisSummary: {
          ...(prev?.analysisSummary || {}),
          topicDistribution: metaRes.data?.topicsDetected || prev?.analysisSummary?.topicDistribution || [],
          diagramMetadata: metaRes.data?.diagramMetadata || prev?.analysisSummary?.diagramMetadata || [],
        },
      }));
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Could not refresh upload status.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Assessment Upload & Analysis"
        subtitle="Upload one assessment paper, extract metadata, and create a reusable blueprint."
      />

      {error && (
        <Alert tone="error">
          {error}
        </Alert>
      )}

      <Card className="p-5">
        <h2 className="mb-2 text-sm font-semibold text-ink-700">Consent</h2>
        <p className="mb-3 text-sm text-ink-600">
          This uploaded assessment paper will be analysed to identify topics tested, marks allocation, question types,
          diagram types, and assessment structure. The uploaded file will be automatically deleted after processing.
          Only extracted assessment metadata will be retained.
        </p>
        <Checkbox
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          label={CONSENT_TEXT}
        />
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-700">Upload Details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Test Title">
            <input
              className="w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Optional"
            />
          </Field>
          <Field label="Level">
            <select
              className="w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
              value={form.level}
              onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
            >
              {['P3', 'P4', 'P5', 'P6', 'Sec1', 'Sec2', 'Sec3', 'Sec4'].map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </Field>
          <Field label="School">
            <input
              className="w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
              value={form.school}
              onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))}
              placeholder="Optional"
            />
          </Field>
          <Field label="Assessment Type">
            <input
              className="w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
              value={form.assessmentType}
              onChange={(e) => setForm((p) => ({ ...p, assessmentType: e.target.value }))}
              placeholder="WA / Prelim / EOY"
            />
          </Field>
          <Field label="Duration (minutes)">
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
              value={form.durationMinutes}
              onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))}
            />
          </Field>
          <Field label="Total Marks">
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
              value={form.totalMarks}
              onChange={(e) => setForm((p) => ({ ...p, totalMarks: e.target.value }))}
            />
          </Field>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Checkbox
            checked={form.calculatorAllowed}
            onChange={(e) => setForm((p) => ({ ...p, calculatorAllowed: e.target.checked }))}
            label="Calculator allowed"
          />
          <Checkbox
            checked={form.timed}
            onChange={(e) => setForm((p) => ({ ...p, timed: e.target.checked }))}
            label="Timed assessment"
          />
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-line-soft p-4">
          <label className="mb-2 block text-sm font-medium text-ink-700">Assessment File (PDF or image)</label>
          <input
            type="file"
            accept=".pdf,application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-ink-600"
          />
          {file && <p className="mt-2 text-xs text-ink-500">{file.name} · {Math.round((file.size || 0) / 1024)} KB</p>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button icon={FileUp} onClick={onUpload} disabled={!canUpload}>
            {loading ? 'Processing…' : 'Upload and Analyse'}
          </Button>
          {!!result?.upload?.uploadId && (
            <Button variant="secondary" icon={RefreshCw} onClick={refreshStatus} disabled={refreshing}>
              {refreshing ? 'Refreshing…' : 'Refresh Status'}
            </Button>
          )}
        </div>
      </Card>

      {!!result && (
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink-700">Analysis Summary</h2>
            <div className="flex items-center gap-2">
              <Badge tone={result?.upload?.status === 'deleted' ? 'success' : 'navy'}>
                Status: {result?.upload?.status || 'unknown'}
              </Badge>
              {result?.originalFileDeleted && (
                <Badge tone="success">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  File deleted
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-line-soft p-3 text-sm">
              <p className="text-ink-500">Assessment Type</p>
              <p className="font-semibold text-ink-700">{result?.analysisSummary?.assessmentType || '-'}</p>
            </div>
            <div className="rounded-lg border border-line-soft p-3 text-sm">
              <p className="text-ink-500">Sections</p>
              <p className="font-semibold text-ink-700">{result?.analysisSummary?.sectionCount ?? 0}</p>
            </div>
            <div className="rounded-lg border border-line-soft p-3 text-sm">
              <p className="text-ink-500">Questions</p>
              <p className="font-semibold text-ink-700">{result?.analysisSummary?.questionCount ?? 0}</p>
            </div>
            <div className="rounded-lg border border-line-soft p-3 text-sm">
              <p className="text-ink-500">Marks</p>
              <p className="font-semibold text-ink-700">{result?.analysisSummary?.totalMarks ?? 0}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Topics Detected</h3>
              <div className="space-y-2">
                {(result?.analysisSummary?.topicDistribution || []).map((topic, idx) => (
                  <div key={`${topic.topic}-${idx}`} className="rounded-lg border border-line-soft p-2 text-sm">
                    <p className="font-semibold text-ink-700">{topic.topic}</p>
                    <p className="text-ink-500">{topic.marks} marks · {topic.weightage}%</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Diagram Types Detected</h3>
              <div className="space-y-2">
                {(result?.analysisSummary?.diagramMetadata || []).map((diagram, idx) => (
                  <div key={`${diagram.diagramType}-${idx}`} className="rounded-lg border border-line-soft p-2 text-sm">
                    <p className="font-semibold text-ink-700">{diagram.diagramType}</p>
                    <p className="text-ink-500">Count: {diagram.count}</p>
                  </div>
                ))}
                {!(result?.analysisSummary?.diagramMetadata || []).length && (
                  <p className="text-sm text-ink-500">No diagram metadata detected.</p>
                )}
              </div>
            </div>
          </div>

          <Alert tone={result?.originalFileDeleted ? 'success' : 'warning'} icon={result?.originalFileDeleted ? CheckCircle2 : ShieldCheck}>
            {result?.originalFileDeleted
              ? 'Original upload deleted and verified. Only extracted metadata is retained.'
              : 'File deletion verification is pending. Refresh status to confirm.'}
          </Alert>
        </Card>
      )}
    </div>
  );
}
