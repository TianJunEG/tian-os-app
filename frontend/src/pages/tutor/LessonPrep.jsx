import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { tutorAPI, assignmentsAPI } from '../../services/api';
import { useTutorStudent } from './useTutorStudent';
import TutorStudentNav from './TutorStudentNav';
import { Card, Button, Badge, Spinner, ErrorState } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';

// Rule-based lesson prep from the student's mastery + mistakes.
export default function LessonPrep() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useTutorStudent(id);
  const [prep, setPrep] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [assigned, setAssigned] = useState(false);

  const load = () => {
    setLoadError(false);
    setPrep(null);
    tutorAPI.lessonPrep(id).then((r) => setPrep(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, [id]);

  const assignSuggested = async () => {
    if (!prep?.suggestedHomework) return;
    await assignmentsAPI.create({
      studentId: id, module: 'MathPath', subject: 'Math', assignedByRole: 'tutor',
      skillIds: [prep.suggestedHomework.skillId], questionCount: prep.suggestedHomework.questionCount, difficulty: 'medium',
    });
    setAssigned(true);
  };

  if (loadError) return <ErrorState message="Couldn’t load lesson prep." onRetry={load} />;
  if (!prep) return <Spinner />;

  return (
    <>
      <TutorStudentNav studentId={id} name={meta?.name || 'Student'} level={meta?.level} />

      {/* Suggested focus */}
      <Card className="mb-5 border-l-4 border-l-gold-400 p-5">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700">
          <Lightbulb className="h-3.5 w-3.5" /> Suggested focus
        </div>
        <h2 className="font-display text-xl font-semibold text-navy-700">{prep.focus?.skillName || 'Pick a skill'}</h2>
        <p className="mt-1 text-sm text-ink-500">{prep.reason}</p>
        {prep.notes?.map((n, i) => <p key={i} className="mt-2 text-sm text-error-700">{n}</p>)}
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Weak topics to address</h3>
          {prep.weakTopics.length === 0 ? <p className="text-sm text-ink-500">No weak topics.</p> : (
            <ul className="space-y-2">
              {prep.weakTopics.map((w) => (
                <li key={w.skillId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-ink-700">{w.skillName} <span className="text-ink-400">· {w.topicName}</span></span>
                  <Badge tone="error">{w.score}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent mistakes</h3>
          {prep.recentMistakes.length === 0 ? <p className="text-sm text-ink-500">None.</p> : (
            <ul className="space-y-2 text-sm">
              {prep.recentMistakes.map((m, i) => (
                <li key={i}><span className="font-medium text-ink-700">{m.skillName}: </span><span className="text-ink-500"><MathText text={m.questionStem} /></span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Suggested teaching sequence</h3>
        <ol className="space-y-2">
          {prep.teachingSequence.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink-700">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-50 font-mono text-xs text-navy-700">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </Card>

      {prep.suggestedHomework && (
        <Card className="mt-5 flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold text-ink-700">Suggested homework</p>
            <p className="text-sm text-ink-500">{prep.suggestedHomework.questionCount} questions on {prep.suggestedHomework.skillName}</p>
          </div>
          {assigned ? <Badge tone="success">Assigned</Badge> : <Button size="s" variant="secondary" onClick={assignSuggested}>Assign</Button>}
        </Card>
      )}

      <div className="mt-6">
        <Button icon={ArrowRight} onClick={() => navigate(`/tutor/students/${id}/lesson-notes`)}>Record lesson notes</Button>
      </div>
    </>
  );
}
