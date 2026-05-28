import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sprout, CheckCircle2, MessageSquare } from 'lucide-react';
import { lifelabAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Input, Select, StatusBadge, Spinner, EmptyState } from '../../components/ui';
import E21ccTags from '../../components/LifeLab/E21ccTags';
import CompetencyGrowth from '../../components/LifeLab/CompetencyGrowth';

// Teacher LifeLab: assign a library activity to the class + review submissions.
export default function LifeLab() {
  const { id } = useParams();
  const meta = useClass(id);
  const [activities, setActivities] = useState([]);
  const [activityId, setActivityId] = useState('');
  const [competency, setCompetency] = useState('');
  const [subs, setSubs] = useState(null);
  const [comps, setComps] = useState([]);
  const [competencyList, setCompetencyList] = useState([]);
  const [assigned, setAssigned] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Re-fetch the assignable library, optionally filtered by competency, and keep
  // a valid activity selected.
  const loadActivities = (comp) => lifelabAPI.activities(comp ? { competency: comp } : undefined)
    .then((r) => { const a = r.data.activities || []; setActivities(a); setActivityId(a[0]?._id || ''); })
    .catch(() => { setActivities([]); setActivityId(''); });

  const loadSubs = () => lifelabAPI.submissions(id)
    .then((r) => { setSubs(r.data.submissions || []); setComps(r.data.competencies || []); })
    .catch(() => setSubs([]));
  useEffect(() => {
    loadActivities(competency);
    loadSubs();
    lifelabAPI.competencies().then((r) => setCompetencyList(r.data.competencies || [])).catch(() => {});
  }, [id]); // eslint-disable-line

  const selected = activities.find((a) => a._id === activityId);

  const assign = async () => {
    if (!activityId) return;
    await lifelabAPI.assign({ classId: id, target: { type: 'class' }, activityId });
    setAssigned(true); loadSubs(); setTimeout(() => setAssigned(false), 2500);
  };
  const saveFeedback = async (sid) => {
    await lifelabAPI.feedback(sid, { feedback: feedbackText });
    setFeedbackFor(null); setFeedbackText(''); loadSubs();
  };

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />

      {/* Assign */}
      <Card className="mb-6 p-5">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500"><Sprout className="h-3.5 w-3.5" /> Assign a LifeLab activity</div>
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
          <Button onClick={assign} disabled={!activityId}>Assign to class</Button>
        </div>
        {selected && <E21ccTags primary={selected.primaryE21cc} secondary={selected.secondaryE21cc} className="mt-3" />}
        {assigned && <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-success-700"><CheckCircle2 className="h-4 w-4" /> Assigned to the class.</p>}
      </Card>

      {/* Class competency coverage from completed work */}
      <CompetencyGrowth competencies={comps} title="Class competency coverage" className="mb-6" />

      {/* Submissions */}
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Submissions</h3>
      {!subs ? <Spinner /> : subs.length === 0 ? (
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
                  {s.teacherFeedback && <p className="mt-1 text-sm text-success-700">Feedback: {s.teacherFeedback}</p>}
                  {feedbackFor === s.id ? (
                    <div className="mt-3 flex gap-2">
                      <Input value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Write feedback…" className="flex-1" />
                      <Button size="s" onClick={() => saveFeedback(s.id)}>Save</Button>
                    </div>
                  ) : (
                    <div className="mt-3"><Button size="s" variant="secondary" icon={MessageSquare} onClick={() => { setFeedbackFor(s.id); setFeedbackText(s.teacherFeedback || ''); }}>Give feedback</Button></div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
