import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sprout, CheckCircle2, MessageSquare } from 'lucide-react';
import { lifelabAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Badge, StatusBadge, Spinner, EmptyState } from '../../components/ui';

// Teacher LifeLab: assign a library activity to the class + review submissions.
export default function LifeLab() {
  const { id } = useParams();
  const meta = useClass(id);
  const [activities, setActivities] = useState([]);
  const [activityId, setActivityId] = useState('');
  const [subs, setSubs] = useState(null);
  const [assigned, setAssigned] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const loadSubs = () => lifelabAPI.submissions(id).then((r) => setSubs(r.data.submissions || [])).catch(() => setSubs([]));
  useEffect(() => {
    lifelabAPI.activities().then((r) => { setActivities(r.data.activities || []); if (r.data.activities?.[0]) setActivityId(r.data.activities[0]._id); }).catch(() => {});
    loadSubs();
  }, [id]); // eslint-disable-line

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
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Activity</label>
            <select value={activityId} onChange={(e) => setActivityId(e.target.value)} className="w-full rounded-xl border border-hairline px-3 py-2.5">
              {activities.map((a) => <option key={a._id} value={a._id}>{a.subject} · {a.title}</option>)}
            </select>
          </div>
          <Button onClick={assign} disabled={!activityId}>Assign to class</Button>
        </div>
        {assigned && <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-success-700"><CheckCircle2 className="h-4 w-4" /> Assigned to the class.</p>}
      </Card>

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
                      <input value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Write feedback…" className="flex-1 rounded-xl border border-hairline px-3 py-2 text-sm" />
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
