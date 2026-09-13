import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Clock3, FileText, Search, Users } from 'lucide-react';
import { teacherAPI, mathpathAPI } from '../../services/api';
import FEATURE_FLAGS from '../../config/featureFlags';
import ClassNav from './ClassNav';
import { useClass } from './useClass';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Spinner, CollapsibleSection } from '../../components/ui';
import AdultWorkingReviewPanel from '../../components/mathpath/working/AdultWorkingReviewPanel';
import DiagnosticGrowthCard from '../../components/mathpath/DiagnosticGrowthCard';

function toneForSeverity(severity) {
  if (severity === 'high') return 'error';
  if (severity === 'medium') return 'gold';
  return 'neutral';
}

function masteryTone(pct) {
  if (pct >= 70) return 'navy';
  if (pct >= 55) return 'gold';
  return 'error';
}

// The hero of the page: students who need the teacher's attention this week,
// sorted by severity, each with the exact skill to target and why.
function NeedsAttentionCard({ rows = [], onOpenStudent }) {
  return (
    <Card className="p-5 border-l-4 border-l-gold">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-semibold text-ink-700">Needs you this week</h3>
        {rows.length ? <Badge tone="error">{rows.length}</Badge> : null}
      </div>
      {rows.length ? (
        <div className="space-y-2">
          {rows.map((s) => (
            <button
              key={s.studentId}
              type="button"
              onClick={() => onOpenStudent?.(s.studentId)}
              className="w-full rounded-lg border border-line-soft p-3 text-left transition hover:border-emerald-border hover:bg-emerald-tint/40"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-700">{s.name}</p>
                <div className="flex items-center gap-2">
                  {s.needsInPersonRemediation ? <Badge tone="error">In-person</Badge> : null}
                  <Badge tone={toneForSeverity(s.severity)}>{s.overallMastery}%</Badge>
                </div>
              </div>
              {s.focusSkill ? (
                <p className="mt-1 text-sm text-ink-600">
                  Focus: <span className="font-medium text-ink-700">{s.focusSkill.skillName}</span> ({s.focusSkill.score}%)
                </p>
              ) : null}
              <ul className="mt-1 list-disc pl-5 text-sm text-ink-500">
                {s.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-ink-500">No students flagged for remediation right now. 🎉</p>
      )}
    </Card>
  );
}

function ClassOverviewCard({ data }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Class Readiness</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div><p className="text-xs text-ink-500">Students</p><p className="font-mono text-xl text-emerald-deep">{data.totalStudents}</p></div>
        <div><p className="text-xs text-ink-500">On Track</p><p className="font-mono text-xl text-emerald">{data.studentsOnTrack}</p></div>
        <div><p className="text-xs text-ink-500">Need Support</p><p className="font-mono text-xl text-gold-deep">{data.studentsNeedingSupport}</p></div>
        <div><p className="text-xs text-ink-500">Extension</p><p className="font-mono text-xl text-emerald-deep">{data.studentsReadyForExtension}</p></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-ink-600 sm:grid-cols-3">
        <p>Avg mastery: {data.averageMastery}%</p>
        <p>Avg fluency: {data.averageFluency}%</p>
        <p>With data: {data.studentsWithData}/{data.totalStudents}</p>
      </div>
    </Card>
  );
}

// Per-domain grasp at a glance — one chip per domain, sorted weakest first.
function DomainGraspCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Grasp by Domain</h3>
      {rows.length ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map((d) => (
            <div key={d.domain} className="rounded-lg border border-line-soft p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink-700">{d.domain}</p>
                <Badge tone={masteryTone(d.averageMastery)}>{d.averageMastery}%</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-500">{d.skillCount} skills · {d.weakCount} weak</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No domain data yet.</p>}
    </Card>
  );
}

function SkillMasteryHeatmapCard({ rows = [], onOpenStudent }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Skill Mastery Heatmap</h3>
      {!rows.length ? (
        <p className="mt-2 text-sm text-ink-500">No MathPath data available for this class yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-2 py-2">Skill</th>
                <th className="px-2 py-2">Mastered</th>
                <th className="px-2 py-2">Fluent</th>
                <th className="px-2 py-2">Retained</th>
                <th className="px-2 py-2">Weak</th>
                <th className="px-2 py-2">Class %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.skillId)} className="border-t border-line-soft">
                  <td className="px-2 py-2 text-ink-700">{row.skillName}</td>
                  <td className="px-2 py-2">{row.masteredCount}</td>
                  <td className="px-2 py-2">{row.fluentCount}</td>
                  <td className="px-2 py-2">{row.retainedCount}</td>
                  <td className="px-2 py-2 text-gold-deep">{row.weakCount}</td>
                  <td className="px-2 py-2"><Badge tone={masteryTone(row.classMasteryPercentage)}>{row.classMasteryPercentage}%</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

const STATUS_FILTERS = [
  ['all', 'All'],
  ['flagged', 'Needs support'],
  ['on_track', 'On track'],
  ['extension', 'Extension'],
  ['no_data', 'No data'],
];

function statusBadge(s) {
  if (s.status === 'flagged') return <Badge tone={s.severity === 'high' ? 'error' : 'gold'}>Needs support</Badge>;
  if (s.status === 'extension') return <Badge tone="navy">Extension</Badge>;
  if (s.status === 'on_track') return <Badge tone="success">On track</Badge>;
  return <Badge tone="neutral">No data</Badge>;
}

// Searchable, filterable class roster — the per-student view a teacher scans.
function StudentRosterCard({ students = [], onOpenStudent }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => {
    const c = { all: students.length, flagged: 0, on_track: 0, extension: 0, no_data: 0 };
    for (const s of students) c[s.status] = (c[s.status] || 0) + 1;
    return c;
  }, [students]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (filter !== 'all' && s.status !== filter) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, query, filter]);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Students</h3>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-line-soft px-3 py-2">
        <Search className="h-4 w-4 text-ink-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by student name…"
          className="w-full bg-transparent text-sm text-ink-700 outline-none placeholder:text-ink-400"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {STATUS_FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter === key ? 'border-emerald-deep bg-emerald-tint text-emerald-deep' : 'border-line-soft text-ink-500 hover:text-emerald-deep'}`}
          >
            {label} ({counts[key] || 0})
          </button>
        ))}
      </div>
      <div className="mt-3 divide-y divide-line-soft">
        {rows.length ? rows.map((s) => (
          <button
            key={s.studentId}
            type="button"
            onClick={() => onOpenStudent?.(s.studentId)}
            className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition hover:bg-emerald-tint/40"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-700">{s.name}</p>
              {s.focusSkillName ? <p className="truncate text-xs text-ink-500">Focus: {s.focusSkillName}</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono text-sm text-ink-600">{s.hasData ? `${s.overallMastery}%` : '—'}</span>
              {statusBadge(s)}
            </div>
          </button>
        )) : <p className="py-3 text-sm text-ink-500">No students match “{query || filter}”.</p>}
      </div>
    </Card>
  );
}

// Lets a teacher with more than one class jump between dashboards.
function ClassSwitcher({ classes = [], currentId, onChange }) {
  if (!classes || classes.length < 2) return null;
  return (
    <div className="mb-4 flex items-center gap-2">
      <Users className="h-4 w-4 text-ink-400" />
      <select
        value={currentId}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line-soft bg-surface-white px-3 py-1.5 text-sm font-semibold text-ink-700 outline-none focus:border-emerald-border"
      >
        {classes.map((c) => (
          <option key={c.classId} value={c.classId}>
            {c.name}{c.level ? ` · ${c.level}` : ''} ({c.studentCount})
          </option>
        ))}
      </select>
    </div>
  );
}

export default function TeacherMathPathDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useClass(id);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(false);
  const [placedCount, setPlacedCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [workingReview, setWorkingReview] = useState(null);
  const [classDiagnosticGrowth, setClassDiagnosticGrowth] = useState(null);
  const [classes, setClasses] = useState([]);

  const openStudent = useCallback((sid) => navigate(`/teacher/students/${sid}`), [navigate]);

  useEffect(() => {
    let alive = true;
    teacherAPI.classes().then((r) => { if (alive) setClasses(r?.data?.classes || []); }).catch((e) => console.warn("TeacherMathPathDashboardPage: fetch failed", e));
    return () => { alive = false; };
  }, []);

  const load = useCallback(async () => {
    setError(false);
    setDashboard(null);
    try {
      const [dashRes, studentsRes, workingRes] = await Promise.all([
        teacherAPI.classDashboard(id),
        teacherAPI.classStudents(id),
        // Class-wide working review is workspace-scoped on the backend and can fail
        // (or be unsupported) without the rest of the dashboard being unusable — make
        // it non-fatal so one panel's data source never blanks the whole page.
        mathpathAPI.workingReviewSummary({ limit: 100 }).catch(() => null),
      ]);
      setDashboard(dashRes?.data || null);
      setWorkingReview(workingRes?.data || null);
      const list = studentsRes?.data?.students || [];
      setStudentCount(list.length);

      // Real diagnostic placement + growth (these endpoints are already real).
      const placementRows = await Promise.all(
        list.map(async (s) => {
          try {
            const r = await mathpathAPI.getLatestDiagnostic({ studentId: s.studentId });
            return Boolean(r?.data?.hasPlacement);
          } catch (_) { return false; }
        })
      );
      setPlacedCount(placementRows.filter(Boolean).length);

      const growthRows = await Promise.all(
        list.slice(0, 30).map(async (s) => {
          try {
            const r = await mathpathAPI.getDiagnosticGrowth({ studentId: s.studentId });
            return r?.data || null;
          } catch (_) { return null; }
        })
      );
      const validGrowth = growthRows.filter((row) => row?.latest);
      const avg = (rows, key) => {
        const values = rows.map((row) => Number(row?.[key]?.readinessScore)).filter(Number.isFinite);
        if (!values.length) return null;
        return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
      };
      const avgImprovement = validGrowth.map((row) => Number(row.overallImprovement)).filter(Number.isFinite);
      setClassDiagnosticGrowth(validGrowth.length ? {
        baseline: { readinessScore: avg(validGrowth, 'baseline') },
        latest: { readinessScore: avg(validGrowth, 'latest'), completedAt: validGrowth[0]?.latest?.completedAt },
        overallImprovement: avgImprovement.length
          ? Math.round(avgImprovement.reduce((sum, n) => sum + n, 0) / avgImprovement.length)
          : null,
        perSkillGrowth: validGrowth.flatMap((row) => row.perSkillGrowth || []),
        remainingWeakSkills: [...new Set(validGrowth.flatMap((row) => row.remainingWeakSkills || []))],
      } : null);
    } catch (_) {
      setError(true);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const hasData = useMemo(
    () => Boolean(dashboard?.classOverview?.studentsWithData),
    [dashboard]
  );

  if (error) return <ErrorState message="Couldn't load Teacher MathPath dashboard." onRetry={load} />;
  if (!dashboard) return <Spinner label="Loading Teacher MathPath dashboard…" />;

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      <ClassSwitcher classes={classes} currentId={id} onChange={(cid) => navigate(`/teacher/classes/${cid}/mathpath`)} />
      <PageHeader
        title="Teacher MathPath Dashboard"
        subtitle="Class-level mastery, fluency, per-domain grasp, and the students who need you most this week."
        action={<Button onClick={() => navigate(`/teacher/classes/${id}/assign`)}>Assign Intervention</Button>}
      />
      {placedCount > 0 ? (
        <Card className="mb-4 p-4">
          <p className="text-sm text-ink-600">Students with a saved Fractions placement check: <span className="font-semibold text-ink-700">{placedCount}/{studentCount}</span></p>
        </Card>
      ) : (
        <Card className="mb-4 p-4">
          <p className="text-sm text-ink-500">No placement check yet. Fractions placement results appear here once students complete the diagnostic.</p>
        </Card>
      )}

      <div className="space-y-4">
        <NeedsAttentionCard rows={dashboard.flaggedStudents || []} onOpenStudent={openStudent} />
        <ClassOverviewCard data={dashboard.classOverview} />

        {classDiagnosticGrowth ? (
          <DiagnosticGrowthCard
            title="Class Diagnostic Growth"
            growth={classDiagnosticGrowth}
            onViewHistory={() => navigate(`/teacher/classes/${id}/mathpath`)}
            onRunRecheck={() => navigate(`/teacher/classes/${id}/assign?task=diagnostic_recheck`)}
            onAssignRecovery={() => navigate(`/teacher/classes/${id}/assign?task=recovery_pack`)}
          />
        ) : null}

        {!hasData ? (
          <EmptyState message="No MathPath activity for this class yet. Once students complete work, their grasp and flags appear here." />
        ) : (
          <>
            <DomainGraspCard rows={dashboard.domains || []} />
            <StudentRosterCard students={dashboard.students || []} onOpenStudent={openStudent} />
            <AdultWorkingReviewPanel review={workingReview || {}} title="Class Working and Help Requests" />

            <CollapsibleSection
              title="Skill detail"
              summary="Per-skill mastery heatmap across the class."
              surface={false}
              action={FEATURE_FLAGS.assessments ? <Button size="s" variant="secondary" onClick={() => navigate(`/teacher/classes/${id}/mathpath/test-spec`)}>School Test</Button> : null}
            >
              <SkillMasteryHeatmapCard rows={dashboard.skillHeatmap || []} onOpenStudent={openStudent} />
            </CollapsibleSection>

            <CollapsibleSection title="Secondary actions" summary="Review groups and mini lesson tools." surface={false}>
              <div className="flex flex-wrap gap-2">
                <Button size="s" variant="secondary" icon={FileText} onClick={() => navigate(`/teacher/classes/${id}/assign?module=Mastery%20Worksheet&worksheetType=class`)}>Generate Worksheet</Button>
                <Button size="s" variant="secondary" icon={Users} onClick={() => navigate(`/teacher/classes/${id}/groups`)}>Assign Review Groups</Button>
                <Button size="s" variant="secondary" icon={Clock3} onClick={() => navigate(`/teacher/classes/${id}/interventions`)}>Start Mini Lesson</Button>
              </div>
            </CollapsibleSection>
          </>
        )}
      </div>
    </>
  );
}
