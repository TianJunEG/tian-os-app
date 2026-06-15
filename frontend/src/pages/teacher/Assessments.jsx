import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Users, Clock } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Badge, Spinner, EmptyState } from '../../components/ui';

function statusTone(s) {
  if (s === 'draft') return 'neutral';
  if (s === 'assigned') return 'success';
  return 'warning';
}

export default function Assessments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useClass(id);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherAPI.assessments(id)
      .then((r) => setItems(r.data.assessments || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <ClassNav classId={id} name={meta?.name} level={meta?.level} />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-emerald-deep">Assessments</h2>
        <Button size="s" onClick={() => navigate(`/teacher/classes/${id}/assessments/new`)}>
          <Plus className="mr-1 h-4 w-4" /> Create
        </Button>
      </div>

      {loading && <Spinner />}

      {!loading && (!items || items.length === 0) && (
        <EmptyState icon={ClipboardList} message="No assessments yet. Create a quick quiz to check your class's understanding." />
      )}

      {!loading && items?.length > 0 && (
        <div className="space-y-3">
          {items.map((a) => (
            <Card
              key={a._id}
              className="cursor-pointer p-4 transition-shadow hover:shadow-md"
              onClick={() => navigate(
                a.status === 'draft'
                  ? `/teacher/classes/${id}/assessments/new?edit=${a._id}`
                  : `/teacher/classes/${id}/assessments/${a._id}/results`
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-700">{a.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    <span>{a.module}</span>
                    <span>·</span>
                    <span>{a.questionCount} questions</span>
                    {a.timeLimitMinutes && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3" />{a.timeLimitMinutes}m</span>
                      </>
                    )}
                    {a.resultsSummary?.totalAssigned > 0 && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {a.resultsSummary.totalCompleted}/{a.resultsSummary.totalAssigned} done
                        </span>
                      </>
                    )}
                    {a.resultsSummary?.averageScore != null && (
                      <>
                        <span>·</span>
                        <span>avg {a.resultsSummary.averageScore}%</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge tone={statusTone(a.status)}>{a.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
