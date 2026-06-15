import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Pencil, CheckCircle2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import TutorStudentNav from './TutorStudentNav';
import { Card, Button, Badge, StatusBadge, StatTile, Spinner, ErrorState } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';
import StudentSciencePanel from '../../components/StudentSciencePanel';

const MISTAKE_LEARNING_LABEL = {
  new: 'New',
  acknowledged: 'Reviewed',
  correction_attempted: 'Retry needed',
  corrected: 'Corrected',
  understood: 'Understood',
  mastered: 'Mastered',
};

// One student, understood quickly: mastery, recent mistakes, homework, notes.
export default function TutorStudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false);
    setData(null);
    tutorAPI.student(id).then((r) => setData(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, [id]);

  if (loadError) return <ErrorState message="Couldn’t load student profile." onRetry={load} />;
  if (!data) return <Spinner />;
  const { student, mastery, mistakes, assignments, lessonNotes } = data;

  return (
    <>
      <TutorStudentNav studentId={id} name={student.name} level={student.level} />

      <Card className="mb-4 p-4 sm:mb-5 sm:p-5">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <StatTile label="Overall mastery" value={mastery.overall} suffix="%" />
          <StatTile label="Mastered" value={mastery.masteredCount} />
          <StatTile label="Focus" value={student.focusArea} />
        </div>
        <div className="mt-4"><Button icon={ArrowRight} onClick={() => navigate(`/tutor/students/${id}/lesson-prep`)}>Plan lesson</Button></div>
        <div className="mt-2"><Button variant="secondary" onClick={() => navigate(`/tutor/students/${id}/mathpath`)}>Open MathPath dashboard</Button></div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent mistakes</h3>
          {mistakes.length === 0 ? <p className="text-sm text-ink-500">None recorded.</p> : (
            <ul className="space-y-3">
              {mistakes.slice(0, 5).map((m) => (
                <li key={m.id} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-ink-700">{m.skillName}</p>
                    <StatusBadge status={m.learningStatus === 'mastered' ? 'mastered' : m.learningStatus === 'new' ? 'needs_review' : 'learning'} />
                  </div>
                  <p className="text-xs font-semibold text-ink-500">{MISTAKE_LEARNING_LABEL[m.learningStatus || 'new'] || 'Learning'}</p>
                  <p className="text-ink-500"><MathText text={m.questionStem} /></p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => navigate(`/tutor/students/${id}/mistakes/${m.id}/explain`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-white px-2.5 py-1 text-xs font-semibold text-navy-700 transition hover:bg-navy-50"
                    >
                      {m.hasTutorExplanation ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 text-success-600" /> Edit explanation</>
                      ) : (
                        <><Pencil className="h-3.5 w-3.5" /> Record explanation</>
                      )}
                    </button>
                    {m.explanationFeedback === 'helpful' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-[11px] font-semibold text-success-700">
                        <ThumbsUp className="h-3 w-3" /> Parent found this helpful
                      </span>
                    )}
                    {m.explanationFeedback === 'not_helpful' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        <ThumbsDown className="h-3 w-3" /> Parent requested a new explanation
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Homework</h3>
          {assignments.length === 0 ? <p className="text-sm text-ink-500">No homework yet.</p> : (
            <ul className="space-y-2">
              {assignments.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-ink-700">{a.skillNames?.join(', ') || a.module}</span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <StudentSciencePanel studentId={id} />

      <Card className="mt-5 p-5">
        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Last lesson notes</h3>
        {lessonNotes.length === 0 ? <p className="text-sm text-ink-500">No lesson notes yet.</p> : (
          <ul className="space-y-2">
            {lessonNotes.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-ink-700">{n.covered || 'Lesson note'}</span>
                <Badge tone={n.parentUpdateStatus === 'sent' ? 'success' : 'neutral'}>{n.parentUpdateStatus}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
