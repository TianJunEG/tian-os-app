import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, StatusBadge, Spinner, ErrorState, EmptyState } from '../../components/ui';

export default function ClassStudents() {
  const { id } = useParams();
  const meta = useClass(id);
  const [students, setStudents] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [addError, setAddError] = useState('');

  const load = () => { setLoadError(false); setStudents(null); teacherAPI.classStudents(id).then((r) => setStudents(r.data.students || [])).catch(() => setLoadError(true)); };
  useEffect(() => { load(); }, [id]);

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ''));
    reader.readAsText(f);
  }

  async function importRoster() {
    if (!text.trim() || importing) return;
    setImporting(true);
    setAddError('');
    setResult(null);
    try {
      const { data } = await teacherAPI.importRoster(id, text);
      setResult(data.summary);
      setText('');
      load();
    } catch (err) {
      setAddError(err?.response?.data?.error || 'Could not import the roster.');
    } finally {
      setImporting(false);
    }
  }

  if (loadError) return <ErrorState message="Couldn't load class students." onRetry={load} />;
  if (!students) return <Spinner />;
  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-ink-500">{students.length} student{students.length === 1 ? '' : 's'}</p>
        <Button size="s" onClick={() => { setShowAdd((v) => !v); setResult(null); setAddError(''); }}>
          <UserPlus size={16} className="mr-1" /> Add students
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-4 p-4">
          <p className="mb-2 text-sm font-medium text-ink-700">Paste one name per line, or upload a CSV</p>
          <p className="mb-3 text-xs text-ink-500">CSV needs a header row with a <code>name</code> column (optional <code>level</code>). Re-importing skips names already in this class.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={'Ethan Wong\nFiona Lee\nGabriel Tan'}
            className="w-full rounded-lg border border-border-subtle px-3 py-2 font-mono text-sm text-ink-800"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button onClick={importRoster} disabled={importing || !text.trim()}>{importing ? 'Importing…' : 'Import students'}</Button>
            <label className="cursor-pointer text-sm text-emerald-700 hover:underline">
              Upload CSV
              <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} className="hidden" />
            </label>
          </div>
          {addError && <p className="mt-2 text-sm text-rose-600">{addError}</p>}
          {result && (
            <p className="mt-3 text-sm text-ink-600">
              Added <strong>{result.created}</strong>
              {result.skipped ? `, skipped ${result.skipped} (already in class)` : ''}
              {result.failed ? `, ${result.failed} failed` : ''}.
            </p>
          )}
        </Card>
      )}

      {students.length === 0 ? <EmptyState message="No students yet. Use “Add students” to paste or upload your roster." /> : (
        <div className="space-y-2">
          {students.map((s) => (
            <Card key={s.studentId} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-ink-700">{s.name}</p>
                <p className="text-sm text-ink-500">{s.level} · {s.overallMastery}%{s.weakestSkill ? ` · weak: ${s.weakestSkill}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.interventionStatus && <StatusBadge status={s.interventionStatus} />}
                <Button size="s" variant="secondary" to={`/teacher/students/${s.studentId}`}>View</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
