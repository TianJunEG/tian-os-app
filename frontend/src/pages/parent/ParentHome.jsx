import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Eye, Users } from 'lucide-react';
import { familyAPI, assignmentsAPI, parentInvitesAPI } from '../../services/api';
import { Card, Button, StatTile, ProgressBar, PageHeader, Spinner, EmptyState, Badge, Alert } from '../../components/ui';
import { TrialBanner, RenewalBanner, UpgradeButton } from '../../components/PremiumHomeUpgrade';

const PRIORITY_TONE = { high: 'error', medium: 'gold', low: 'success' };

// School-invited children: view-only progress (no assign/worksheet actions).
// Premium Home is the upsell that turns this into full control at home.
function SchoolChildrenSection({ rows = [] }) {
  if (!rows.length) return null;
  return (
    <div className="mb-4">
      <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        <Eye className="h-4 w-4" /> School progress (view-only)
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((c) => (
          <Card key={String(c.studentId)} className="p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-ink-700">{c.name} <span className="font-normal text-ink-500">· {c.level}</span></p>
              <Badge tone="navy">View-only</Badge>
            </div>
            <div className="mt-2 font-display text-xl font-semibold text-emerald-deep">{c.hasData ? `${c.overallMastery}%` : '—'}</div>
            <ProgressBar value={c.overallMastery} className="mt-2" />
            {c.weakestSkill ? <p className="mt-2 text-sm text-ink-500">Needs work: {c.weakestSkill}</p> : null}
          </Card>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <p className="text-xs text-ink-400">Upgrade to a Premium Home plan to assign practice and unlock the full dashboard at home.</p>
        <UpgradeButton size="s" variant="secondary" />
      </div>
    </div>
  );
}

// Parent home — clear, confidence-building, action-oriented. Child selector +
// overall status + the single top recommended action.
//
// IA: this page is per-child by design. With a single child it's the natural
// landing. With multiple children, landing on /parent without picking one
// would default to "first child" silently — confusing. So when multi-child
// and no ?child= is set, we redirect to /parent/children (the explicit
// "all children" grid). Once a child is picked there, the user arrives back
// here with ?child=… set.
export default function ParentHome() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [children, setChildren] = useState(null);
  const [recs, setRecs] = useState([]);
  const [recsError, setRecsError] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsError, setAssignmentsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schoolChildren, setSchoolChildren] = useState([]);

  const activeId = params.get('child');

  useEffect(() => {
    let alive = true;
    parentInvitesAPI.myChildren()
      .then((r) => { if (alive) setSchoolChildren(r.data?.children || []); })
      .catch((e) => console.warn("ParentHome: fetch failed", e));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    familyAPI.children().then((r) => {
      if (!alive) return;
      const list = r.data.children || [];
      setChildren(list);
      if (!activeId) {
        if (list.length > 1) {
          navigate('/parent/children', { replace: true });
          return;
        }
        if (list[0]) setParams({ child: String(list[0].studentId) }, { replace: true });
      }
      setLoading(false);
    }).catch(() => { if (alive) { setChildren([]); setLoading(false); } });
    return () => { alive = false; };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!children || !activeId) return;
    const allowed = children.some((c) => String(c.studentId) === String(activeId));
    if (!allowed && children.length > 0) {
      setRecs([]);
      setAssignments([]);
      setRecsError(false);
      setAssignmentsError(false);
      setParams({ child: String(children[0].studentId) }, { replace: true });
    }
  }, [activeId, children, setParams]);

  useEffect(() => {
    if (!activeId) return;
    let alive = true;
    setRecs([]);
    setAssignments([]);
    setRecsError(false);
    setAssignmentsError(false);
    familyAPI.recommendations(activeId)
      .then((r) => { if (alive) setRecs(r.data.recommendations || []); })
      .catch(() => {
        if (!alive) return;
        setRecsError(true);
        setRecs([]);
      });
    assignmentsAPI.list({ studentId: activeId })
      .then((r) => { if (alive) setAssignments(r.data.assignments || []); })
      .catch(() => {
        if (!alive) return;
        setAssignmentsError(true);
        setAssignments([]);
      });
    return () => { alive = false; };
  }, [activeId]);

  if (loading) return <Spinner label="Loading…" />;
  if (!children || children.length === 0) {
    return (
      <>
        <PageHeader title="Your children" />
        <TrialBanner />
        <RenewalBanner />
        <SchoolChildrenSection rows={schoolChildren} />
        {schoolChildren.length === 0 && (
          <EmptyState icon={Users} message="No children linked yet. Once a child is added to your family, their progress appears here." />
        )}
      </>
    );
  }

  const child = children.find((c) => String(c.studentId) === String(activeId)) || children[0];
  const top = recs[0];
  const completed = assignments.filter((a) => a.status === 'completed').length;

  const multiChild = children.length > 1;
  return (
    <>
      <PageHeader
        title={multiChild ? 'Family overview' : child.name}
        subtitle="A calm, clear picture of how learning is going."
        action={multiChild ? (
          <select value={child.studentId} onChange={(e) => setParams({ child: e.target.value })}
            className="rounded-xl border border-line-soft bg-surface-white px-3 py-2 text-sm font-semibold text-emerald-deep">
            {children.map((c) => <option key={c.studentId} value={c.studentId}>{c.name}</option>)}
          </select>
        ) : null}
      />

      <TrialBanner />
      <RenewalBanner />
      <SchoolChildrenSection rows={schoolChildren} />

      {/* Overall status — kept as the cross-subject headline */}
      <Card className="mb-4 p-4 sm:p-5">
        <div className="mb-1 text-sm font-semibold text-ink-700">{child.name} <span className="font-normal text-ink-500">· {child.level}</span></div>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:gap-6">
          <StatTile label="Overall mastery" value={child.overallMastery} suffix="%" />
          <StatTile label="Mastered" value={child.masteredCount} />
          <StatTile label="Skills seen" value={child.skillsSeen} />
        </div>
        <ProgressBar value={child.overallMastery} className="mt-4" />
        <div className="mt-3">
          <Link to={`/parent/children/${child.studentId}/mathpath`} className="text-sm font-semibold text-emerald-deep">
            Open Parent MathPath dashboard →
          </Link>
          <Link to={`/parent/success-centre?child=${child.studentId}`} className="ml-4 text-sm font-semibold text-gold-700">
            Open Success Centre →
          </Link>
        </div>
      </Card>

      {/* By subject — surfaces Maths / Science / English separately so the
          headline "Overall mastery" isn't quietly hiding a strong-in-one,
          weak-in-another picture. Each card links to that subject's screen
          when one exists. Subjects with no activity are omitted server-side. */}
      {(child.subjects?.length || 0) > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {child.subjects.map((s) => {
            const to = subjectLink(child.studentId, s.subject);
            const Body = (
              <Card className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-700">{s.subject}</p>
                  <span className="font-mono text-xs tabular-nums text-ink-500">{s.mastered}/{s.total}</span>
                </div>
                <div className="mt-1 font-display text-xl font-semibold text-emerald-deep">{s.overall}%</div>
                <ProgressBar value={s.overall} className="mt-2" />
              </Card>
            );
            return to ? <Link key={s.subject} to={to} className="block">{Body}</Link> : <div key={s.subject}>{Body}</div>;
          })}
        </div>
      )}

      {/* Today's recommended action (top of the list — full list on the actions page) */}
      <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        <span>Today's recommended action</span>
        {recs.length > 1 && <span className="font-mono text-ink-300">1 of {recs.length}</span>}
      </h3>
      {recsError && <Alert tone="error" className="mb-4">Couldn’t load recommendations.</Alert>}
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
                  <Link to={`/parent/children/${child.studentId}/weak-topics`} className="text-sm font-semibold text-emerald-deep">View weak topics →</Link>
                  <Link to={`/parent/children/${child.studentId}/worksheets/new?mode=weak_skills`} className="text-sm font-semibold text-gold-700">Generate worksheet for {child.weakestSkill} →</Link>
                </div>
              </div>
            </div>
          </Card>
        )}
        {assignmentsError && (
          <Alert tone="error" className="p-4 text-sm text-ink-700">Couldn’t load practice tasks.</Alert>
        )}
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink-700">Practice Tasks</p>
          <p className="mt-1 text-sm text-ink-500">{completed} of {assignments.length} completed</p>
          <div className="mt-1 flex flex-col gap-1">
            <Link to={`/parent/children/${child.studentId}/assignments`} className="text-sm font-semibold text-emerald-deep">View practice tasks →</Link>
            <Link to={`/parent/children/${child.studentId}/worksheets`} className="text-sm font-semibold text-gold-700">Mastery worksheet generator →</Link>
          </div>
        </Card>
      </div>
    </>
  );
}

// Per-subject card destinations. Math + Science have parent surfaces; English
// (Spelling Practice) is assign-only today, so leave it unlinked rather than
// 404-routing the parent through a non-existent page.
function subjectLink(studentId, subject) {
  const base = `/parent/children/${studentId}`;
  if (subject === 'Math') return `${base}/progress`;
  if (subject === 'Science') return `${base}/science`;
  return null;
}
