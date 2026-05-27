import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Users } from 'lucide-react';
import { familyAPI, assignmentsAPI } from '../../services/api';
import { Card, Button, StatTile, ProgressBar, PageHeader, Spinner, EmptyState, Badge } from '../../components/ui';

const PRIORITY_TONE = { high: 'error', medium: 'gold', low: 'success' };

// Parent home — clear, confidence-building, action-oriented. Child selector +
// overall status + the single top recommended action.
export default function ParentHome() {
  const [params, setParams] = useSearchParams();
  const [children, setChildren] = useState(null);
  const [recs, setRecs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeId = params.get('child');

  useEffect(() => {
    familyAPI.children().then((r) => {
      const list = r.data.children || [];
      setChildren(list);
      if (!activeId && list[0]) setParams({ child: String(list[0].studentId) }, { replace: true });
      setLoading(false);
    }).catch(() => { setChildren([]); setLoading(false); });
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!activeId) return;
    familyAPI.recommendations(activeId).then((r) => setRecs(r.data.recommendations || [])).catch(() => setRecs([]));
    assignmentsAPI.list({ studentId: activeId }).then((r) => setAssignments(r.data.assignments || [])).catch(() => setAssignments([]));
  }, [activeId]);

  if (loading) return <Spinner label="Loading…" />;
  if (!children || children.length === 0) {
    return (
      <>
        <PageHeader title="Your children" />
        <EmptyState icon={Users} message="No children linked yet. Once a child is added to your family, their progress appears here." />
      </>
    );
  }

  const child = children.find((c) => String(c.studentId) === String(activeId)) || children[0];
  const top = recs[0];
  const completed = assignments.filter((a) => a.status === 'completed').length;

  return (
    <>
      <PageHeader
        title="Family overview"
        subtitle="A calm, clear picture of how learning is going."
        action={children.length > 1 ? (
          <select value={child.studentId} onChange={(e) => setParams({ child: e.target.value })}
            className="rounded-xl border border-hairline bg-paper px-3 py-2 text-sm font-semibold text-navy-700">
            {children.map((c) => <option key={c.studentId} value={c.studentId}>{c.name}</option>)}
          </select>
        ) : null}
      />

      {/* Overall status */}
      <Card className="mb-6 p-5">
        <div className="mb-1 text-sm font-semibold text-ink-700">{child.name} <span className="font-normal text-ink-500">· {child.level}</span></div>
        <div className="mt-3 flex items-center gap-6">
          <StatTile label="Overall mastery" value={child.overallMastery} suffix="%" />
          <StatTile label="Mastered" value={child.masteredCount} />
          <StatTile label="Skills seen" value={child.skillsSeen} />
        </div>
        <ProgressBar value={child.overallMastery} className="mt-4" />
      </Card>

      {/* Today's recommended action */}
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Today's recommended action</h3>
      {top ? (
        <Card className="mb-6 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={PRIORITY_TONE[top.priority]}>{top.priority}</Badge>
            {top.relatedSkillName && <span className="text-sm text-ink-500">{top.relatedSkillName}</span>}
          </div>
          <p className="font-semibold text-ink-700">{top.action}</p>
          <p className="mt-1 text-sm text-ink-500">{top.reason}</p>
          <div className="mt-4">
            <Button to={`/parent/children/${child.studentId}/actions`} icon={ArrowRight}>View recommended actions</Button>
          </div>
        </Card>
      ) : (
        <Card className="mb-6 p-5 text-sm text-ink-500">Nothing urgent right now. {child.name} is on track.</Card>
      )}

      {/* Quick summaries */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {child.weakestSkill && (
          <Card className="border-l-4 border-l-error-500 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error-500" />
              <div>
                <p className="text-sm font-semibold text-ink-700">Weak topic</p>
                <p className="text-sm text-ink-500">{child.weakestSkill} in {child.weakestTopic}</p>
                <div className="mt-2 flex flex-col gap-1">
                  <Link to={`/parent/children/${child.studentId}/weak-topics`} className="text-sm font-semibold text-navy-700">View weak topics →</Link>
                  <Link to={`/parent/children/${child.studentId}/worksheets/new?mode=weak_skills`} className="text-sm font-semibold text-gold-700">Generate worksheet for {child.weakestSkill} →</Link>
                </div>
              </div>
            </div>
          </Card>
        )}
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink-700">Assignments</p>
          <p className="mt-1 text-sm text-ink-500">{completed} of {assignments.length} completed</p>
          <div className="mt-1 flex flex-col gap-1">
            <Link to={`/parent/children/${child.studentId}/assignments`} className="text-sm font-semibold text-navy-700">View assignments →</Link>
            <Link to={`/parent/children/${child.studentId}/worksheets`} className="text-sm font-semibold text-gold-700">Mastery worksheet generator →</Link>
          </div>
        </Card>
      </div>
    </>
  );
}
