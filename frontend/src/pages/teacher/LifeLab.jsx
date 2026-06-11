import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sprout, CheckCircle2, MessageSquare } from 'lucide-react';
import { lifelabAPI, teacherAPI, SERVER_ORIGIN } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Input, Select, StatusBadge, Spinner, EmptyState, ErrorState, Alert } from '../../components/ui';
import E21ccTags from '../../components/LifeLab/E21ccTags';
import CompetencyGrowth from '../../components/LifeLab/CompetencyGrowth';

export default function LifeLab() {
  const { id } = useParams();
  const meta = useClass(id);
  const [activities, setActivities] = useState(null);
  const [activityId, setActivityId] = useState('');
  const [competency, setCompetency] = useState('');
  const [subs, setSubs] = useState(null);
  const [comps, setComps] = useState([]);
  const [competencyList, setCompetencyList] = useState([]);
  const [assigned, setAssigned] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [activityError, setActivityError] = useState(false);
  const [submissionsError, setSubmissionsError] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Assignment targeting
  const [targetType, setTargetType] = useState('class');
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [targetId, setTargetId] = useState('');

  const loadActivities = (comp) => {
    setActivityError(false);
    setActivities(null);
    return lifelabAPI.activities(comp ? { competency: comp } : undefined)
      .then((r) => { const a = r.data.activities || []; setActivities(a); setActivityId(a[0]?._id || ''); })
      .catch(() => { setActivityError(true); setActivities(null); setActivityId(''); });
  };

  const loadSubs = () => {
    setSubmissionsError(false);
    setSubs(null);
    return lifelabAPI.submissions(id)
      .then((r) => { setSubs(r.data.submissions || []); setComps(r.data.competencies || []); })
      .catch(() => { setSubmissionsError(true); setSubs(null); });
  };

  useEffect(() => {
    loadActivities(competency);
    loadSubs();
    lifelabAPI.competencies().then((r) => setCompetencyList(r.data.competencies || [])).catch(() => {});
    teacherAPI.groups(id).then((r) => setGroups(r.data.groups || r.data || [])).catch(() => {});
    teacherAPI.classStudents(id).then((r) => setStudents(r.data.students || r.data || [])).catch(() => {});
  }, [id]); // eslint-disable-line

  const selected = activities?.find((a) => a._id === activityId);

  const assign = async () => {
    if (!activityId) return;
    setAssignError('');
    setAssigning(true);
    const target = targetType === 'class'
      ? { type: 'class' }
      : { type: targetType, id: targetId };
    if (targetType !== 'class' && !targetId) {
      setAssignError('Please select a ' + targetType + ' to assign to.');
      setAssigning(false);
      return;
    }
    try {
      await lifelabAPI.assign({ classId: id, target, activityId });
      setAssigned(true);
      loadSubs();
      setTimeout(() => setAssigned(false), 2500);
    } catch (e) {
      setAssignError(e.response?.data?.error || 'Could not assign activity. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const saveFeedback = async (sid) => {
    setFeedbackError('');
    setSavingFeedback(true);
    try {
      await lifelabAPI.feedback(sid, { feedback: feedbackText });
      setFeedbackFor(null); setFeedbackText(''); loadSubs();
    } catch (e) {
      setFeedbackError(e.response?.data?.error || 'Could not save feedback. Please try again.');
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />

      {/* Assign */}
      <Card className="mb-6 p-5">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500"><Sprout className="h-3.5 w-3.5" /> Assign a LifeLab activity</div>
        {activityError ? (
          <ErrorState message="Couldn't load LifeLab activities." onRetry={() => loadActivities(competency)} />
        ) : !activities ? (
          <Spinner />
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-56">
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Competency</label>
                <Select value={competency} onChange={(e) => { setCompetency(e.target.value); loadActivities(e.target.value); }}>
                  <option value="">All competencies</option>
                  {competencyList.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Activity</label>
                <Select value={activityId} onChange={(e) => setActivityId(e.target.value)} disabled={!activities.length}>
                  {activities.length ? activities.map((a) => <option key={a._id} value={a._id}>{a.subject} · {a.title}</option>) : <option value="">No activities match</option>}
                </Select>
              </div>
            </div>

            {/* Target picker */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-40">
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Assign to</label>
                <Select value={targetType} onChange={(e) => { setTargetType(e.target.value); setTargetId(''); }}>
                  <option value="class">Whole class</option>
                  <option value="group">Group</option>
                  <option value="student">Individual student</option>
                </Select>
              </div>
              {targetType === 'group' && (
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-semibold text-ink-700">Group</label>
                  <Select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                    <option value="">Select a group…</option>
                    {groups.map((g) => <option key={g._id} value={g._id}>{g.name || g.label || 'Group'}</option>)}
                  </Select>
                </div>
              )}
              {targetType === 'student' && (
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-semibold text-ink-700">Student</label>
                  <Select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                    <option value="">Select a student…</option>
                    {students.map((s) => <option key={s._id || s.studentId} value={s._id || s.studentId}>{s.name}</option>)}
                  </Select>
                </div>
              )}
              <Button onClick={assign} disabled={!activityId || assigning}>{assigning ? 'Assigning…' : 'Assign'}</Button>
            </div>

            {assignError && <Alert tone="error" className="mt-3">{assignError}</Alert>}
            {selected && <>
              <E21ccTags primary={selected.primaryE21cc} secondary={selected.secondaryE21cc} className="mt-3" />
              {selected.realLifeContext && <p className="mt-3 text-sm text-ink-500 italic">{selected.realLifeContext}</p>}
              {selected.materials?.length > 0 && <p className="mt-2 text-xs text-ink-400">Materials: {selected.materials.join(', ')}</p>}
            </>}
            {assigned && <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-success-700"><CheckCircle2 className="h-4 w-4" /> Assigned!</p>}
          </>
        )}
      </Card>

      {/* Class competency coverage from completed work */}
      <CompetencyGrowth competencies={comps} title="Class competency coverage" className="mb-6" />

      {/* Submissions */}
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Submissions</h3>
      {submissionsError ? (
        <ErrorState message="Couldn't load LifeLab submissions." onRetry={loadSubs} />
      ) : !subs ? (
        <Spinner />
      ) : subs.length === 0 ? (
        <EmptyState icon={Sprout} message="No LifeLab submissions yet." />
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-medium text-ink-700">{s.studentName} <span className="text-ink-400">· {s.activityTitle}</span></p>
                <StatusBadge status={s.status} />
              </div>
              {s.status !== 'not_started' && (
                <>
                  {s.dataRecorded && <p className="text-sm text-ink-700"><span className="text-ink-400">Data:</span> {s.dataRecorded}</p>}
                  {s.reflectionResponse && <p className="text-sm text-ink-500"><span className="text-ink-400">Reflection:</span> {s.reflectionResponse}</p>}
                  {s.evidenceUrl && (
                    <p className="mt-1 text-sm">
                      <a href={SERVER_ORIGIN + s.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">View evidence</a>
                    </p>
                  )}
                  {s.teacherFeedback && <p className="mt-1 text-sm text-success-700">Feedback: {s.teacherFeedback}</p>}
                  {feedbackFor === s.id ? (
                    <div className="mt-3 flex gap-2">
                      <Input value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Write feedback…" className="flex-1" />
                      <Button size="s" onClick={() => saveFeedback(s.id)} disabled={savingFeedback}>{savingFeedback ? 'Saving…' : 'Save'}</Button>
                    </div>
                  ) : (
                    <div className="mt-3"><Button size="s" variant="secondary" icon={MessageSquare} onClick={() => { setFeedbackFor(s.id); setFeedbackText(s.teacherFeedback || ''); }}>Give feedback</Button></div>
                  )}
                  {feedbackFor === s.id && feedbackError && <Alert tone="error" className="mt-3">{feedbackError}</Alert>}
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
