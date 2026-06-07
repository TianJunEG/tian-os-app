import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Clock3, FileText, Users } from 'lucide-react';
import { teacherAPI, mathpathAPI } from '../../services/api';
import { buildTeacherMathPathDashboard } from '../../mathpath/dashboard/teacherMathPathDashboardEngine';
import ClassNav from './ClassNav';
import { useClass } from './useClass';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Spinner, CollapsibleSection } from '../../components/ui';
import AdultWorkingReviewPanel from '../../components/mathpath/working/AdultWorkingReviewPanel';
import DiagnosticGrowthCard from '../../components/mathpath/DiagnosticGrowthCard';

function toneForIssue(issueType) {
  if (issueType === 'accurateButSlow') return 'gold';
  if (issueType === 'fastButInaccurate' || issueType === 'inconsistent') return 'error';
  return 'neutral';
}

function toneForSeverity(severity) {
  if (severity === 'high') return 'error';
  if (severity === 'medium') return 'gold';
  return 'neutral';
}

function syntheticStatusFromMastery(overallMastery = 0) {
  const score = Number(overallMastery || 0);
  if (score >= 85) return 'retained';
  if (score >= 70) return 'fluent';
  if (score >= 55) return 'accurate';
  if (score >= 35) return 'learning';
  return 'needsReview';
}

function buildSyntheticStudentProgressStates(students = []) {
  return (students || []).map((s) => {
    const sid = s.studentId;
    const baseStatus = syntheticStatusFromMastery(s.overallMastery);
    const skillStatuses = {
      F001: baseStatus === 'needsReview' ? 'learning' : 'retained',
      F010: baseStatus === 'retained' ? 'fluent' : baseStatus === 'fluent' ? 'accurate' : 'needsReview',
      F018: baseStatus === 'retained' ? 'fluent' : baseStatus === 'fluent' ? 'learning' : 'needsReview',
      F020: baseStatus === 'retained' ? 'accurate' : 'learning',
      F023: baseStatus === 'retained' ? 'accurate' : 'learning',
      F026: baseStatus === 'retained' ? 'learning' : 'notStarted',
    };
    if (s.weakestSkill && typeof s.weakestSkill === 'string' && /^F\d{3}$/.test(s.weakestSkill)) {
      skillStatuses[s.weakestSkill] = 'needsReview';
    }
    return {
      studentId: sid,
      skillStatuses,
      masteryProgress: {
        percentageMastered: Math.max(0, Math.min(100, Number(s.overallMastery || 0))),
        percentageFluent: Math.max(0, Math.min(100, Number(s.overallMastery || 0) - 20)),
        percentageRetained: Math.max(0, Math.min(100, Number(s.overallMastery || 0) - 35)),
      },
      readinessLevel: {
        readinessScore: Math.max(0, Math.min(100, Number(s.overallMastery || 0))),
        readinessBand:
          Number(s.overallMastery || 0) >= 80 ? 'advanced'
            : Number(s.overallMastery || 0) >= 65 ? 'ready'
              : Number(s.overallMastery || 0) >= 45 ? 'progressing'
                : 'developing',
      },
      fluencyState: {
        questionFamilyResults: [
          {
            skillId: 'F020',
            questionFamilyId: 'QF_F020_001',
            status: Number(s.overallMastery || 0) >= 70 ? 'accurateButSlow' : 'weak',
            accuracy: Math.max(40, Math.min(98, Number(s.overallMastery || 0))),
            averageTime: Number(s.overallMastery || 0) >= 70 ? 24 : 31,
            benchmarkTime: 18,
            consistencyScore: Number(s.overallMastery || 0) >= 70 ? 64 : 45,
            attemptsCount: 6,
          },
        ],
      },
      retentionProgress: {
        retainedSkillIds: Number(s.overallMastery || 0) >= 80 ? ['F001', 'F010'] : ['F001'],
        skillsDueForReview: Number(s.overallMastery || 0) >= 55 ? ['F003'] : ['F003', 'F010'],
        skillsNeedingRefresh: Number(s.overallMastery || 0) < 55 ? ['F010'] : [],
      },
    };
  });
}

function buildSyntheticAssessment(students = []) {
  return (students || []).map((s) => ({
    studentId: s.studentId,
    latestScore: Number(s.overallMastery || 0),
    readinessBand:
      Number(s.overallMastery || 0) >= 80 ? 'strong'
        : Number(s.overallMastery || 0) >= 60 ? 'approaching'
          : Number(s.overallMastery || 0) >= 45 ? 'developing'
            : 'notReady',
    weakSkills: s.weakestSkill && /^F\d{3}$/.test(s.weakestSkill) ? [s.weakestSkill] : ['F010'],
  }));
}

function buildSyntheticMistakePlans(students = []) {
  return (students || [])
    .filter((s) => Number(s.overallMastery || 0) < 75)
    .map((s) => ({
      studentId: s.studentId,
      focusMistakes: [
        {
          mistakeCode: Number(s.overallMastery || 0) < 55 ? 'M001' : 'M007',
          count: Number(s.overallMastery || 0) < 55 ? 3 : 2,
          highestSeverity: Number(s.overallMastery || 0) < 55 ? 'high' : 'medium',
        },
      ],
      rootCauseSkillIds: Number(s.overallMastery || 0) < 55 ? ['F010'] : ['F011'],
    }));
}

function buildSyntheticWorkingSummaries(students = []) {
  return (students || []).map((s) => ({
    studentId: s.studentId,
    averageWorkingQuality: Math.max(45, Math.min(90, Number(s.overallMastery || 0))),
    missingWorkingCount: Number(s.overallMastery || 0) < 55 ? 2 : Number(s.overallMastery || 0) < 70 ? 1 : 0,
    missingWorkingQuestions: Number(s.overallMastery || 0) < 70 ? ['q1'] : [],
    unreadableWorkingQuestions: Number(s.overallMastery || 0) < 45 ? ['q2'] : [],
  }));
}

function TeacherClassOverviewCard({ data }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Class Readiness</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div><p className="text-xs text-ink-500">Total</p><p className="font-mono text-xl text-navy-700">{data.totalStudents}</p></div>
        <div><p className="text-xs text-ink-500">On Track</p><p className="font-mono text-xl text-navy-700">{data.studentsOnTrack}</p></div>
        <div><p className="text-xs text-ink-500">Need Support</p><p className="font-mono text-xl text-navy-700">{data.studentsNeedingSupport}</p></div>
        <div><p className="text-xs text-ink-500">Extension</p><p className="font-mono text-xl text-navy-700">{data.studentsReadyForExtension}</p></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-ink-600 sm:grid-cols-4">
        <p>Mastery: {data.averageMastery}%</p>
        <p>Fluency: {data.averageFluency}%</p>
        <p>Retention: {data.averageRetention}%</p>
        <p>Readiness: {data.averageReadiness}%</p>
      </div>
    </Card>
  );
}

function SkillMasteryHeatmapCard({ rows = [] }) {
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
                <th className="px-2 py-2">Mastery %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.skillId} className="border-t border-hairline">
                  <td className="px-2 py-2 text-ink-700">{row.skillName}</td>
                  <td className="px-2 py-2">{row.masteredCount}</td>
                  <td className="px-2 py-2">{row.fluentCount}</td>
                  <td className="px-2 py-2">{row.retainedCount}</td>
                  <td className="px-2 py-2">{row.weakCount}</td>
                  <td className="px-2 py-2">{row.classMasteryPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function InterventionGroupsCard({ groups = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Intervention Groups</h3>
      {groups.length ? (
        <div className="mt-3 space-y-2 text-sm">
          {groups.map((g) => (
            <div key={g.groupId} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-700">{g.groupName}</p>
                <Badge tone="navy">{g.estimatedDurationMinutes} min</Badge>
              </div>
              <p className="text-ink-600">Focus: {g.focusSkillName}</p>
              <p className="text-ink-600">Students: {g.studentIds.length}</p>
              <p className="text-ink-600">Reason: {g.reason}</p>
              <p className="text-ink-600">Activity: {g.recommendedActivity}</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No intervention groups generated yet.</p>}
    </Card>
  );
}

function ClassFluencyBottlenecksCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Fluency Bottlenecks</h3>
      {rows.length ? (
        <div className="mt-3 space-y-2 text-sm">
          {rows.map((row) => (
            <div key={`${row.skillId}-${row.issueType}`} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink-700">{row.skillName}</p>
                <Badge tone={toneForIssue(row.issueType)}>{row.issueType}</Badge>
              </div>
              <p className="text-ink-600">Affected students: {row.affectedStudentIds.length}</p>
              <p className="text-ink-600">Time: {row.averageTime}s vs benchmark {row.benchmarkTime}s</p>
              <p className="text-ink-600">{row.recommendation}</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No class fluency bottlenecks detected yet.</p>}
    </Card>
  );
}

function RetentionRisksCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Retention Risks</h3>
      {rows.length ? (
        <div className="mt-3 space-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.skillId} className="rounded-lg border border-hairline p-3">
              <p className="font-semibold text-ink-700">{row.skillName}</p>
              <p className="text-ink-600">Due: {row.studentsDueForReview.length} · At risk: {row.studentsAtRisk.length} · Forgotten: {row.studentsForgotten.length}</p>
              <p className="text-ink-600">{row.recommendation}</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No retention risk data available yet.</p>}
    </Card>
  );
}

function AssessmentReadinessCard({ data }) {
  const hasData = data.latestAssessmentAverage > 0 || (data.strongStudents?.length || data.developingStudents?.length || data.studentsNeedingSupport?.length);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Assessment Readiness</h3>
      {hasData ? (
        <div className="mt-2 space-y-2 text-sm text-ink-600">
          <p>Latest class average: {data.latestAssessmentAverage}%</p>
          <p>Distribution: notReady {data.readinessDistribution.notReady}, developing {data.readinessDistribution.developing}, approaching {data.readinessDistribution.approaching}, ready {data.readinessDistribution.ready}, strong {data.readinessDistribution.strong}</p>
          <p>Strong students: {data.strongStudents.length} · Developing: {data.developingStudents.length} · Need support: {data.studentsNeedingSupport.length}</p>
          <p>Weak skills across class: {data.weakSkillsAcrossClass?.join(', ') || 'None'}</p>
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No assessment results available yet.</p>}
    </Card>
  );
}

function CommonMistakePatternsCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Common Mistake Patterns</h3>
      {rows.length ? (
        <div className="mt-3 space-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.mistakeCode} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink-700">{row.mistakeCode} {row.mistakeName}</p>
                <Badge tone={toneForSeverity(row.severity)}>{row.severity}</Badge>
              </div>
              <p className="text-ink-600">Affected students: {row.affectedStudentCount}</p>
              <p className="text-ink-600">Affected skills: {(row.affectedSkills || []).join(', ') || '—'}</p>
              <p className="text-ink-600">{row.recommendedClassIntervention}</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No recurring mistake patterns detected yet.</p>}
    </Card>
  );
}

function WorkingQualityOverviewCard({ data }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Working Quality Overview</h3>
      <div className="mt-2 space-y-1 text-sm text-ink-600">
        <p>Average working quality: {data.averageWorkingQuality || 0}</p>
        <p>Students missing working: {data.studentsMissingWorking?.length || 0}</p>
        <p>Students with unreadable working: {data.studentsWithUnreadableWorking?.length || 0}</p>
        <p>Common issues: {(data.commonWorkingIssues || []).join(', ') || 'None'}</p>
      </div>
      <p className="mt-2 text-sm text-ink-600">{data.recommendation}</p>
    </Card>
  );
}

function RecommendedTeacherActionsCard({ rows = [], onAssign }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-700">Recommended Teacher Actions</h3>
        <Button size="s" icon={ArrowRight} onClick={onAssign}>Assign Intervention</Button>
      </div>
      {rows.length ? (
        <div className="space-y-2 text-sm">
          {rows.map((row) => (
            <div key={`${row.actionType}-${row.priority}-${row.title}`} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-700">P{row.priority}: {row.title}</p>
                <Badge tone="navy">{row.estimatedDurationMinutes} min</Badge>
              </div>
              <p className="text-ink-600">{row.actionType} · {row.description}</p>
              <p className="text-ink-600">Target students: {row.targetStudentIds?.length || 0}</p>
              <p className="text-ink-600">Target skills: {(row.targetSkillIds || []).join(', ') || '—'}</p>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-ink-500">No actions recommended yet.</p>}
    </Card>
  );
}

export default function TeacherMathPathDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useClass(id);
  const [students, setStudents] = useState(null);
  const [error, setError] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [placedCount, setPlacedCount] = useState(0);
  const [workingReview, setWorkingReview] = useState(null);
  const [classDiagnosticGrowth, setClassDiagnosticGrowth] = useState(null);

  const load = useCallback(async () => {
    setError(false);
    setStudents(null);
    setDashboard(null);
    try {
      const [studentsRes, workingRes] = await Promise.all([
        teacherAPI.classStudents(id),
        mathpathAPI.workingReviewSummary({ limit: 100 }),
      ]);
      const list = studentsRes?.data?.students || [];
      setStudents(list);
      setWorkingReview(workingRes?.data || null);
      const placementRows = await Promise.all(
        list.map(async (s) => {
          try {
            const r = await mathpathAPI.getLatestDiagnostic({ studentId: s.studentId });
            return Boolean(r?.data?.hasPlacement);
          } catch (_) {
            return false;
          }
        })
      );
      setPlacedCount(placementRows.filter(Boolean).length);
      const growthRows = await Promise.all(
        list.slice(0, 30).map(async (s) => {
          try {
            const r = await mathpathAPI.getDiagnosticGrowth({ studentId: s.studentId });
            return r?.data || null;
          } catch (_) {
            return null;
          }
        })
      );
      const validGrowth = growthRows.filter((row) => row?.latest);
      const avg = (rows, key) => {
        const values = rows.map((row) => Number(row?.[key]?.readinessScore)).filter(Number.isFinite);
        if (!values.length) return null;
        return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
      };
      const avgImprovement = validGrowth
        .map((row) => Number(row.overallImprovement))
        .filter(Number.isFinite);
      setClassDiagnosticGrowth(validGrowth.length ? {
        baseline: { readinessScore: avg(validGrowth, 'baseline') },
        latest: { readinessScore: avg(validGrowth, 'latest'), completedAt: validGrowth[0]?.latest?.completedAt },
        overallImprovement: avgImprovement.length
          ? Math.round(avgImprovement.reduce((sum, n) => sum + n, 0) / avgImprovement.length)
          : null,
        perSkillGrowth: validGrowth.flatMap((row) => row.perSkillGrowth || []),
        remainingWeakSkills: [...new Set(validGrowth.flatMap((row) => row.remainingWeakSkills || []))],
      } : null);
      const studentProgressStates = buildSyntheticStudentProgressStates(list);
      const assessmentResults = buildSyntheticAssessment(list);
      const mistakePlans = buildSyntheticMistakePlans(list);
      const workingAnalysisSummaries = buildSyntheticWorkingSummaries(list);
      const result = buildTeacherMathPathDashboard({
        teacherId: 'teacher',
        classId: id,
        domainId: 'fractions',
        studentProgressStates,
        assessmentResults,
        mistakePlans,
        workingAnalysisSummaries,
      });
      setDashboard(result);
    } catch (_) {
      setError(true);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const hasData = useMemo(() => (students || []).length > 0, [students]);

  if (error) return <ErrorState message="Couldn't load Teacher MathPath dashboard." onRetry={load} />;
  if (!students || !dashboard) return <Spinner label="Loading Teacher MathPath dashboard…" />;

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      <PageHeader
        title="Teacher MathPath Dashboard"
        subtitle="Fractions intervention pilot view of class-level mastery, fluency, retention, readiness, and actions."
        action={<Button onClick={() => navigate(`/teacher/classes/${id}/assign`)}>Assign Intervention</Button>}
      />
      <Card className="mb-4 p-4">
        <p className="text-sm text-ink-600">Students with saved Fractions placement: <span className="font-semibold text-ink-700">{placedCount}/{students.length}</span></p>
      </Card>

      {!hasData ? (
        <EmptyState message="No MathPath data available for this class yet." />
      ) : (
        <div className="space-y-4">
          <DiagnosticGrowthCard
            title="Class Diagnostic Growth"
            growth={classDiagnosticGrowth}
            onViewHistory={() => navigate(`/teacher/classes/${id}/mathpath`)}
            onRunRecheck={() => navigate(`/teacher/classes/${id}/assign?task=diagnostic_recheck`)}
            onAssignRecovery={() => navigate(`/teacher/classes/${id}/assign?task=recovery_pack`)}
          />
          <TeacherClassOverviewCard data={dashboard.classOverview} />
          <AdultWorkingReviewPanel review={workingReview || {}} title="Class Working and Help Requests" />

          <RecommendedTeacherActionsCard
            rows={dashboard.recommendedTeacherActions}
            onAssign={() => navigate(`/teacher/classes/${id}/assign`)}
          />

          <CollapsibleSection
            title="Class diagnostic details"
            summary="Skill heatmap, intervention groups, fluency, retention, assessment readiness, mistakes, and working quality."
            surface={false}
            action={<Button size="s" variant="secondary" onClick={() => navigate(`/teacher/classes/${id}/mathpath/test-spec`)}>School Test</Button>}
          >
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <SkillMasteryHeatmapCard rows={dashboard.skillMasteryHeatmap} />
              <InterventionGroupsCard groups={dashboard.interventionGroups} />
              <ClassFluencyBottlenecksCard rows={dashboard.fluencyBottlenecks} />
              <RetentionRisksCard rows={dashboard.retentionRisks} />
              <AssessmentReadinessCard data={dashboard.assessmentReadiness} />
              <CommonMistakePatternsCard rows={dashboard.commonMistakePatterns} />
              <WorkingQualityOverviewCard data={dashboard.workingQualityOverview} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Secondary actions" summary="Review groups and mini lesson tools." surface={false}>
            <div className="flex flex-wrap gap-2">
              <Button size="s" variant="secondary" icon={FileText} onClick={() => navigate(`/teacher/classes/${id}/assign?module=Mastery%20Worksheet&worksheetType=class`)}>Generate Worksheet</Button>
              <Button size="s" variant="secondary" icon={Users} onClick={() => navigate(`/teacher/classes/${id}/groups`)}>Assign Review Groups</Button>
              <Button size="s" variant="secondary" icon={Clock3} onClick={() => navigate(`/teacher/classes/${id}/interventions`)}>Start Mini Lesson</Button>
            </div>
          </CollapsibleSection>
        </div>
      )}
    </>
  );
}
