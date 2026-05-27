import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { assignmentsAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, StatusBadge, Spinner, EmptyState } from '../../components/ui';

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');

// Parent view of a child's assignments (active / completed / overdue).
export default function ChildAssignments() {
  const { studentId } = useParams();
  const child = useChild(studentId);
  const [items, setItems] = useState(null);

  useEffect(() => {
    assignmentsAPI.list({ studentId }).then((r) => setItems(r.data.assignments || [])).catch(() => setItems([]));
  }, [studentId]);

  const Row = ({ a }) => (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate font-medium text-ink-700">{a.module} · {a.skillNames?.join(', ') || a.subject}</p>
        <p className="mt-0.5 text-sm text-ink-500">{a.questionCount} questions · due {fmt(a.dueDate)}{a.score != null ? ` · scored ${a.score}%` : ''}</p>
      </div>
      <StatusBadge status={a.status} />
    </Card>
  );

  const group = (statuses) => (items || []).filter((a) => statuses.includes(a.status));

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      {!items ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={ClipboardList} message="No assignments yet. Use Assign practice to set targeted work.">
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {[['Active', ['not_started', 'in_progress']], ['Overdue', ['overdue']], ['Completed', ['completed']]].map(([label, statuses]) => {
            const rows = group(statuses);
            if (!rows.length) return null;
            return (
              <div key={label}>
                <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">{label} ({rows.length})</h3>
                <div className="space-y-2">{rows.map((a) => <Row key={a.id} a={a} />)}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
