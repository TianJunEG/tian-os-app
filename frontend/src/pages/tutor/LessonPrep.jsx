import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Lightbulb, RefreshCw, Upload } from 'lucide-react';
import { tutorAPI } from '../../services/api';
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
  const [assignError, setAssignError] = useState('');

  const load = () => {
    setLoadError(false);
    setPrep(null);
    tutorAPI.lessonPrep(id).then((r) => setPrep(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, [id]);

  const assignSuggested = async () => {
    if (!prep?.suggestedHomework?.skillIds?.length) return;
    setAssignError('');
    try {
      await tutorAPI.assignLessonPrepRecoveryPack(id, {
        skillIds: prep.suggestedHomework.skillIds,
        title: prep.suggestedHomework.title || 'Tutor Recovery Pack',
        subjectId: 'math',
        domainId: 'fractions',
      });
      setAssigned(true);
      load();
    } catch (err) {
      setAssignError(err?.response?.data?.error || 'Could not assign Recovery Pack.');
    }
  };

  if (loadError) return <ErrorState message="Couldn’t load lesson prep." onRetry={load} />;
  if (!prep) return <Spinner />;

  return (
    <>
      <TutorStudentNav studentId={id} name={meta?.name || 'Student'} level={meta?.level} />

      <Card className="mb-5 p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Baseline</p>
            <p className="mt-1 font-mono text-xl font-semibold text-navy-700">{prep.baselineReadiness ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Current</p>
            <p className="mt-1 font-mono text-xl font-semibold text-navy-700">{prep.currentReadiness ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Improvement</p>
            <p className="mt-1 font-mono text-xl font-semibold text-navy-700">{prep.improvement ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Recheck</p>
            <p className="mt-1 text-sm font-semibold text-navy-700">{prep.recheckReadiness?.ready ? 'Ready' : 'Not ready yet'}</p>
          </div>
        </div>
      </Card>

      <Card className="mb-5 border-l-4 border-l-gold-400 p-5">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700">
          <Lightbulb className="h-3.5 w-3.5" /> Suggested focus
        </div>
        <h2 className="font-display text-xl font-semibold text-navy-700">{prep.recommendedLessonFocus?.[0]?.title || prep.focus?.skillName || 'Pick a skill'}</h2>
        <p className="mt-1 text-sm text-ink-500">{prep.reason}</p>
        {(prep.recommendedLessonFocus || []).slice(0, 3).map((focus) => (
          <div key={focus.skillId || focus.title} className="mt-3 rounded-xl bg-paper px-3 py-2 text-sm">
            <p className="font-semibold text-ink-800">{focus.title}</p>
            {(focus.why || []).map((why, i) => <p key={i} className="mt-1 text-ink-500">{why}</p>)}
          </div>
        ))}
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
          {(prep.recentMistakes || []).length === 0 ? <p className="text-sm text-ink-500">None.</p> : (
            <ul className="space-y-2 text-sm">
              {prep.recentMistakes.map((m, i) => (
                <li key={i}><span className="font-medium text-ink-700">{m.skillName || m.mistakeName || m.skillId}: </span><span className="text-ink-500"><MathText text={m.questionStem || `${m.frequency || 1} recent occurrence(s)`} /></span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent paper findings</h3>
          {(prep.recentPaperFindings || []).length ? prep.recentPaperFindings.map((paper) => (
            <div key={paper.paperAnalysisId} className="mb-2 rounded-xl bg-paper px-3 py-2 text-sm">
              <p className="font-semibold text-ink-800">{paper.title}</p>
              <p className="text-ink-500">Weak skills: {(paper.weakSkillIds || []).join(', ') || 'None confirmed'}</p>
            </div>
          )) : <p className="text-sm text-ink-500">No reviewed paper findings yet.</p>}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Active recovery packs</h3>
          {(prep.activeAssignments || []).length ? prep.activeAssignments.map((assignment) => (
            <div key={assignment.assignmentId} className="mb-2 rounded-xl bg-paper px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-800">{assignment.title}</p>
                <Badge tone={assignment.recheck?.recommended ? 'success' : 'navy'}>{assignment.recheck?.recommended ? 'Recheck ready' : assignment.status}</Badge>
              </div>
              <p className="text-ink-500">{assignment.completion?.questionsAttempted || 0}/{assignment.completion?.questionsAssigned || assignment.targetQuestionCount || '—'} questions · {assignment.completion?.accuracy || 0}%</p>
            </div>
          )) : <p className="text-sm text-ink-500">No active Recovery Packs yet.</p>}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Working evidence</h3>
          {(prep.workingEvidence || []).length ? prep.workingEvidence.map((working) => (
            <div key={working.workingId} className="mb-2 rounded-xl bg-paper px-3 py-2 text-sm">
              <p className="font-semibold text-ink-800">{working.skillId || 'Working'}</p>
              <p className="text-ink-500">{working.detectedIssue || working.detectedMethod || 'Working saved for review.'}</p>
            </div>
          )) : <p className="text-sm text-ink-500">No working evidence flagged yet.</p>}
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Suggested teaching sequence</h3>
        <ol className="space-y-2">
          {(prep.teachingSequence || []).map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink-700">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-50 font-mono text-xs text-navy-700">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </Card>

      {prep.suggestedHomework && (
        <Card className="mt-5 flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-ink-700">Suggested homework</p>
            <p className="text-sm text-ink-500">{prep.suggestedHomework.targetQuestionCount || prep.suggestedHomework.questionCount} questions on {(prep.suggestedHomework.skillIds || [prep.suggestedHomework.skillId]).filter(Boolean).join(', ')}</p>
            {assignError && <p className="mt-1 text-sm text-error-700">{assignError}</p>}
          </div>
          {assigned ? <Badge tone="success">Assigned</Badge> : <Button size="s" variant="secondary" onClick={assignSuggested}>Assign</Button>}
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button icon={FileText} variant="secondary" onClick={() => navigate(`/tutor/mathpath/students/${id}/analyse-paper`)}>View Paper Analysis</Button>
        <Button icon={Upload} variant="secondary" onClick={() => navigate(`/tutor/students/${id}/lesson-notes`)}>View Working</Button>
        <Button icon={RefreshCw} variant="secondary" disabled={!prep.recheckReadiness?.ready}>Run Recheck</Button>
        <Button icon={ArrowRight} onClick={() => navigate(`/tutor/students/${id}/lesson-notes`)}>Record lesson notes</Button>
      </div>
    </>
  );
}
