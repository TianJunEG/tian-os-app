import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, TrendingDown, BookOpen, ClipboardCheck, FileText, Plus } from 'lucide-react';
import { worksheetGenAPI } from '../../services/api';
import { Card, Badge, Spinner, Alert, Button, EmptyState } from '../../components/ui';
import { useChild } from './useChild';
import ChildNav from './ChildNav';

const MODES = [
  { key: 'recommended', label: 'Recommended Practice', desc: 'One-click practice from weak skills, mistakes, fluency, and retention.', Icon: TrendingDown },
  { key: 'fluency', label: 'Fluency Practice', desc: 'Repetition for skills entering fluency training.', Icon: ClipboardCheck },
  { key: 'retention', label: 'Retention Review', desc: 'Refresh skills that are due for review.', Icon: AlertCircle },
  { key: 'custom', label: 'Custom Worksheet', desc: 'Choose exactly what to practise.', Icon: BookOpen },
];

// Parent › Mastery Worksheet Generator — home. Evidence-based modes + recent worksheets.
export default function WorksheetHome() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const child = useChild(studentId);
  const [worksheets, setWorksheets] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const base = `/parent/children/${studentId}/worksheets`;

  useEffect(() => {
    let alive = true;
    setError(false);
    setLoading(true);
    setWorksheets([]);
    worksheetGenAPI.list({ studentId })
      .then((r) => { if (alive) setWorksheets(r.data.worksheets || []); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [studentId]);

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      <h2 className="mb-1 font-display text-xl font-semibold text-navy-700">Worksheet Generator</h2>
      <p className="mb-5 text-sm text-ink-500">Create personalised practice from real learning evidence.</p>

      {error && (
        <Alert tone="error" className="mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Couldn’t load worksheets.</span>
            <Button size="s" variant="secondary" onClick={() => {
              setLoading(true);
              setError(false);
              worksheetGenAPI.list({ studentId })
                .then((r) => setWorksheets(r.data.worksheets || []))
                .catch(() => setError(true))
                .finally(() => setLoading(false));
            }}>Retry</Button>
          </div>
        </Alert>
      )}

      <div className="mb-6 space-y-2.5">
        {MODES.map(({ key, label, desc, Icon }) => (
          <Link key={key} to={`${base}/new?mode=${key}`} className="block focus-visible:outline-none">
            <Card interactive className="flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-navy-700 shrink-0"><Icon className="h-5 w-5" /></span>
            <span className="flex-1">
              <span className="block font-semibold text-ink-700">{label}</span>
              <span className="block text-xs text-ink-500">{desc}</span>
            </span>
              <Plus className="h-4 w-4 text-ink-300" />
            </Card>
          </Link>
        ))}
      </div>

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent worksheets</h3>
      {loading ? <Spinner label="Loading…" /> : (
        <div className="space-y-2">
          {worksheets.length === 0 && !error && <Card className="p-4 text-sm text-ink-500">No worksheets yet — generate your first above.</Card>}
          {worksheets.map((w) => (
            <Link key={w.id} to={`${base}/${w.id}`} className="block focus-visible:outline-none">
              <Card interactive className="flex items-center gap-3 p-4">
              <FileText className="h-4 w-4 shrink-0 text-navy-500" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink-700">{w.title}</span>
                <span className="block text-xs text-ink-500">{w.questionCount} questions · {w.difficulty}</span>
              </span>
              <Badge tone={w.assignedStatus === 'assigned' ? 'success' : 'neutral'}>{w.assignedStatus}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
