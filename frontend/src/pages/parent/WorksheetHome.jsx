import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, TrendingDown, BookOpen, FileText, Plus } from 'lucide-react';
import { worksheetGenAPI } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { useChild } from './useChild';
import ChildNav from './ChildNav';

const MODES = [
  { key: 'recent_mistakes', label: 'From recent mistakes', desc: 'Target the slips your child just made.', Icon: AlertCircle },
  { key: 'weak_skills', label: 'From weak skills', desc: 'Practise the lowest-mastery skills.', Icon: TrendingDown },
  { key: 'selected_topic', label: 'From a topic / skill', desc: 'Choose exactly what to practise.', Icon: BookOpen },
];

// Parent › Mastery Worksheet Generator — home. Three modes + recent worksheets.
export default function WorksheetHome() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const child = useChild(studentId);
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const base = `/parent/children/${studentId}/worksheets`;

  useEffect(() => {
    worksheetGenAPI.list({ studentId }).then((r) => setWorksheets(r.data.worksheets || [])).catch(() => {}).finally(() => setLoading(false));
  }, [studentId]);

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      <h2 className="mb-1 font-display text-xl font-semibold text-navy-700">Worksheet Generator</h2>
      <p className="mb-5 text-sm text-ink-500">Create targeted Math practice — digital first.</p>

      <div className="mb-6 space-y-2.5">
        {MODES.map(({ key, label, desc, Icon }) => (
          <Card key={key} interactive role="button" className="flex items-center gap-3 p-4" onClick={() => navigate(`${base}/new?mode=${key}`)}>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-navy-700 shrink-0"><Icon className="h-5 w-5" /></span>
            <span className="flex-1">
              <span className="block font-semibold text-ink-700">{label}</span>
              <span className="block text-xs text-ink-500">{desc}</span>
            </span>
            <Plus className="h-4 w-4 text-ink-300" />
          </Card>
        ))}
      </div>

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent worksheets</h3>
      {loading ? <Spinner label="Loading…" /> : (
        <div className="space-y-2">
          {worksheets.length === 0 && <Card className="p-4 text-sm text-ink-500">No worksheets yet — generate your first above.</Card>}
          {worksheets.map((w) => (
            <Card key={w.id} interactive role="button" className="flex items-center gap-3 p-4" onClick={() => navigate(`${base}/${w.id}`)}>
              <FileText className="h-4 w-4 shrink-0 text-navy-500" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink-700">{w.title}</span>
                <span className="block text-xs text-ink-500">{w.questionCount} questions · {w.difficulty}</span>
              </span>
              <Badge tone={w.assignedStatus === 'assigned' ? 'success' : 'neutral'}>{w.assignedStatus}</Badge>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
