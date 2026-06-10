import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, GraduationCap, FileText } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import { Card, Button, Badge, StatTile, PageHeader, Spinner, ErrorState, EmptyState } from '../../components/ui';

const CERT_LABEL = { not_started: 'Not started', in_training: 'In training', assessment_pending: 'Assessment pending', interview_pending: 'Interview pending', approved: 'Approved', suspended: 'Suspended' };

// Tutor home — the day's picture + students needing attention. Single primary
// action: prepare the next lesson.
export default function TutorHome() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    setData(null);
    tutorAPI.home().then((r) => setData(r.data)).catch((e) => setError(e.response?.data?.error || 'Could not load.'));
  };
  useEffect(() => { load(); }, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;

  const prepTarget = data.attention[0]?.studentId;

  return (
    <>
      <PageHeader title="Good day" subtitle="Your students and what needs attention." />

      <Card className="mb-6 p-5">
        <div className="flex items-center gap-6">
          <StatTile label="Students" value={data.studentCount} />
          <StatTile label="Overdue" value={data.overdueCount} />
          <StatTile label="Need attention" value={data.attention.length} />
        </div>
        {prepTarget && (
          <div className="mt-4">
            <Button icon={ArrowRight} onClick={() => navigate(`/tutor/students/${prepTarget}/lesson-prep`)}>Prepare next lesson</Button>
          </div>
        )}
      </Card>

      {data.certificationStatus !== 'approved' && (
        <Link to="/tutor/training" className="mb-6 block">
          <Card interactive className="flex items-center justify-between gap-3 border-l-4 border-l-gold-400 p-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-gold-700" />
              <div>
                <p className="text-sm font-semibold text-ink-700">Certification: {CERT_LABEL[data.certificationStatus]}</p>
                <p className="text-sm text-ink-500">Continue training to unlock more levels and modules.</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-ink-300" />
          </Card>
        </Link>
      )}

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Students needing attention</h3>
      {data.attention.length === 0 ? (
        <EmptyState message="No students need attention right now." />
      ) : (
        <div className="mb-6 space-y-2">
          {data.attention.map((s) => (
            <Link key={s.studentId} to={`/tutor/students/${s.studentId}`} className="block">
              <Card interactive className="flex items-center justify-between gap-3 p-4">
                <div><p className="font-medium text-ink-700">{s.name}</p><p className="text-sm text-ink-500">Weak: {s.weakestSkill}</p></div>
                <Badge tone="error">Review</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data.recentNotes.length > 0 && (
        <>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent lesson notes</h3>
          <div className="space-y-2">
            {data.recentNotes.map((n) => (
              <Card key={n.id} className="flex items-center gap-3 p-4">
                <FileText className="h-4 w-4 shrink-0 text-ink-300" />
                <p className="min-w-0 flex-1 truncate text-sm text-ink-700">{n.covered || 'Lesson note'}</p>
                <span className="text-xs text-ink-300">{new Date(n.createdAt).toLocaleDateString()}</span>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
