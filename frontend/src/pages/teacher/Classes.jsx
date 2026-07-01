import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { Card, Badge, ProgressBar, PageHeader, Spinner, ErrorState, EmptyState, Button } from '../../components/ui';

// All classes assigned to the teacher.
export default function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => { setLoadError(false); setClasses(null); teacherAPI.classes().then((r) => setClasses(r.data.classes || [])).catch(() => setLoadError(true)); };
  useEffect(() => { load(); }, []);

  async function createClass(e) {
    e?.preventDefault?.();
    if (!name.trim() || saving) return;
    setSaving(true);
    setFormError('');
    try {
      const { data } = await teacherAPI.createClass({ name: name.trim(), level: level.trim() });
      // Drop straight into the new class's students page to add the roster.
      navigate(`/teacher/classes/${data.class.id}/students`);
    } catch (err) {
      setFormError(err?.response?.data?.error || 'Could not create the class.');
      setSaving(false);
    }
  }

  if (loadError) return <ErrorState message="Couldn't load classes." onRetry={load} />;
  if (!classes) return <Spinner />;
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Classes" subtitle="Tap a class to see mastery and group students." />
        <Button size="s" onClick={() => setShowForm((v) => !v)} className="mt-1 shrink-0">
          <Plus size={16} className="mr-1" /> New class
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4 p-4">
          <form onSubmit={createClass} className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-600">Class name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Primary 5 Maths" autoFocus
                className="w-56 rounded-lg border border-border-subtle px-3 py-2 text-ink-800" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-600">Level (optional)</span>
              <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. Primary 5"
                className="w-44 rounded-lg border border-border-subtle px-3 py-2 text-ink-800" />
            </label>
            <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Creating…' : 'Create & add students'}</Button>
          </form>
          {formError && <p className="mt-2 text-sm text-rose-600">{formError}</p>}
        </Card>
      )}

      {classes.length === 0 ? (
        <EmptyState icon={LayoutGrid} message="No classes yet. Create one to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {classes.map((c) => (
            <Link key={c.classId} to={`/teacher/classes/${c.classId}`} className="block">
              <Card interactive className="p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div><h3 className="font-semibold text-ink-700">{c.name}</h3><p className="text-sm text-ink-500">{c.level} · {c.studentCount} students</p></div>
                  <div className="flex items-center gap-2">
                    <Badge tone="navy">{c.overallMastery}%</Badge>
                    <button
                      type="button"
                      title="Delete class"
                      className="text-ink-300 hover:text-rose-600"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!window.confirm(`Delete “${c.name}”? Its announcements and quick-marks are removed; students are kept.`)) return;
                        teacherAPI.deleteClass(c.classId).then(load).catch(() => {});
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <ProgressBar value={c.overallMastery} />
                <div className="mt-2 flex items-center justify-between text-xs text-ink-400">
                  <span>Completion {c.completionRate}%</span>
                  {c.weakestTopic && <span>Weakest: {c.weakestTopic}</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
