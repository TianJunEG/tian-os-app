import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, RotateCcw, Target } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { visibleSkillLevel } from '../../../utils/skillLevel';
import { mathpathAPI } from '../../../services/api';
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { fractionSkillGraph } from '../../../mathpath/fractions/fractionSkillGraph';
import { runMathPathDomainPipeline } from '../../../mathpath/orchestration/mathPathDomainOrchestrator';
import {
  normalizeCurriculum,
  getSkillCurriculumMapping,
  getUniversalSkillByFrameworkId,
  getVisibleSkillsForStudentLevel,
} from '../../../mathpath/curriculum';
import FEATURE_FLAGS, { isFractionsStoryModeEnabled } from '../../../config/featureFlags';
import {
  ASSESSMENT_LOCK_MESSAGE,
  getFractionAssessmentBlueprintReadiness,
} from '../../../mathpath/fractions/fractionAssessmentReadinessGate';

const STRAND_GROUPS = [
  { key: 'foundation', label: 'Foundation', ids: ['F001', 'F002', 'F003', 'F004', 'F005'] },
  { key: 'comparison', label: 'Comparison', ids: ['F006', 'F007', 'F008', 'F009'] },
  { key: 'equivalence', label: 'Equivalence', ids: ['F010', 'F011', 'F012'] },
  { key: 'conversion', label: 'Conversion', ids: ['F013', 'F014', 'F015'] },
  { key: 'operations', label: 'Operations', ids: ['F016', 'F017', 'F018', 'F019', 'F020', 'F021', 'F022'] },
  { key: 'applications', label: 'Applications', ids: ['F023', 'F024', 'F025'] },
  { key: 'mastery', label: 'Mastery Challenge', ids: ['F026'] },
];

const skillById = new Map((fractionSkillGraph.skills || []).map((skill) => [skill.id, skill]));

function displaySkillName(skillId, fallback = '') {
  return getUniversalSkillByFrameworkId(skillId)?.title || fallback || skillId;
}

function isCompleteStatus(status) {
  return ['accurate', 'fluent', 'retained'].includes(status);
}

function normalizeStatus(rawStatus, locked, needsReview) {
  if (locked) return 'Locked';
  if (needsReview) return 'Needs Review';
  const status = String(rawStatus || '').toLowerCase();
  if (status === 'retained') return 'Retained';
  if (status === 'fluent') return 'Fluent';
  if (status === 'accurate' || status === 'mastered') return 'Accurate';
  if (status === 'weak') return 'Weak';
  if (status === 'learning') return 'Learning';
  return 'Not Started';
}

function statusTone(label) {
  if (label === 'Retained') return 'success';
  if (label === 'Fluent') return 'navy';
  if (label === 'Accurate') return 'gold';
  if (label === 'Needs Review' || label === 'Weak') return 'error';
  if (label === 'Locked') return 'neutral';
  if (label === 'Learning') return 'navy';
  return 'neutral';
}

function actionFromNext(nextAction, assessmentReady = false) {
  const action = String(nextAction?.action || 'continuePractice');
  if (action === 'startFluency') {
    return FEATURE_FLAGS.fluency
      ? { label: 'Start Fluency Drill', to: '/student/mathpath/fluency' }
      : { label: 'Continue Practice', to: '/student/mathpath/practice/recommended-pathway' };
  }
  if (action === 'completeRetentionReview') return { label: 'Review Due Skill', to: '/student/mathpath/practice/recommended-review' };
  if (action === 'attemptAssessment') return FEATURE_FLAGS.assessments && assessmentReady
    ? { label: 'Start Assessment', to: '/student/mathpath/assessment' }
    : { label: 'Continue Practice', to: '/student/mathpath/practice/recommended-pathway' };
  // ?source=manual lets the upload screen open standalone (it lazily creates a
  // working session on submit). Without it the bare link dead-ends on an error
  // screen, forcing extra clicks/navigation to reach the upload canvas.
  if (action === 'uploadWorking') return { label: 'Upload Working', to: '/student/mathpath/working/upload?source=manual' };
  if (action === 'followRemediationPlan') return { label: 'Practise This Skill', to: '/student/mathpath/practice/recommended-remediation' };
  if (action === 'advanceSkill') return { label: 'Move to Next Skill', to: '/student/mathpath/practice/recommended-next' };
  return { label: 'Continue Practice', to: '/student/mathpath/practice/recommended-pathway' };
}

function LearningPathHeader({ progress, currentSkillName, nextCta, onPrimary, onStory }) {
  const storyEnabled = isFractionsStoryModeEnabled();
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-deep">Current Skill Path</p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">Fractions</h2>
          <p className="mt-1 text-sm text-ink-500">{currentSkillName || 'Start your diagnostic'}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button icon={ArrowRight} onClick={onPrimary} disabled={nextCta.disabled}>{nextCta.label}</Button>
          {storyEnabled && (
            <Button
              variant="secondary"
              size="s"
              onClick={onStory}
            >
              Try a Story Problem
            </Button>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="navy">{progress.percentageMastered || 0}% mastered</Badge>
        <Badge tone="neutral">{progress.percentageFluent || 0}% fluent</Badge>
        <Badge tone="success">{progress.percentageRetained || 0}% retained</Badge>
      </div>
      <ProgressBar className="mt-4" value={progress.masteredSkills?.length || 0} max={progress.totalSkills || 26} />
    </Card>
  );
}

function SkillStatusBadge({ label }) {
  return <Badge tone={statusTone(label)}>{label}</Badge>;
}

function SkillNodeCard({
  skill,
  statusLabel,
  isLocked,
  isCurrent,
  isFluent,
  isRetained,
  needsReview,
  missingPrerequisiteNames,
  onAction,
}) {
  const actionLabel = isLocked ? 'Locked' : needsReview ? 'Review' : isCurrent ? 'Continue' : statusLabel === 'Not Started' ? 'Start' : 'Practise';
  const { user } = useAuth();
  const studentLevel = user?.studentLevel || user?.moeLevel || user?.profile?.studentLevel || '';
  // Hide the level badge on below-level (remedial) skills so a higher-level
  // student isn't shown a demoralising lower "Primary N" tag.
  const levelTag = visibleSkillLevel(skill.levelBand?.length ? skill.levelBand.join('/') : (skill.moeLevel || ''), studentLevel);
  const prerequisiteName = missingPrerequisiteNames[0] || '';
  return (
    <Card className={`p-4 ${isCurrent ? 'ring-2 ring-gold/60' : ''} ${isLocked ? 'bg-surface-white/80 opacity-75' : ''}`}>
      <div className="flex min-h-[3.25rem] items-start justify-between gap-3">
        <p className="text-base font-semibold leading-snug text-ink-800">{skill.displayName || skill.name}</p>
        <span className="shrink-0">
          {isLocked ? <Lock className="h-4 w-4 text-ink-300" /> : isRetained ? <CheckCircle2 className="h-4 w-4 text-success-700" /> : null}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <SkillStatusBadge label={statusLabel} />
        {needsReview && <Badge tone="error">Review</Badge>}
        {levelTag && <Badge tone="gold">{levelTag}</Badge>}
      </div>
      {isLocked && prerequisiteName && (
        <p className="mt-3 line-clamp-1 text-xs text-ink-400">Unlocks after {prerequisiteName}</p>
      )}
      <div className="mt-4">
        <Button size="s" variant={isLocked ? 'secondary' : 'primary'} disabled={isLocked} onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}

function SkillStrandSection({ label, skills, onSkillAction }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</h3>
        <span className="text-xs text-ink-400">{skills.length} skills</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {skills.map((skillItem) => (
          <SkillNodeCard
            key={skillItem.id}
            skill={skillItem}
            statusLabel={skillItem.statusLabel}
            isLocked={skillItem.locked}
            isCurrent={skillItem.current}
            isFluent={skillItem.fluent}
            isRetained={skillItem.retained}
            needsReview={skillItem.needsReview}
            missingPrerequisiteNames={skillItem.missingPrerequisiteNames}
            onAction={() => onSkillAction(skillItem)}
          />
        ))}
      </div>
    </section>
  );
}

function NextActionPanel({ nextAction, onPrimary, assessmentReady }) {
  const cta = actionFromNext(nextAction, assessmentReady);
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-tint text-gold-deep">
            <Target className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-deep">Next Action</p>
            <p className="truncate text-sm font-semibold text-ink-700">{cta.disabled ? ASSESSMENT_LOCK_MESSAGE : nextAction?.explanation || 'Continue your recommended Fractions step.'}</p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <Button className="w-full sm:w-auto" icon={ArrowRight} onClick={() => onPrimary(cta.to)} disabled={cta.disabled}>{cta.label}</Button>
        </div>
      </div>
    </Card>
  );
}

export default function FractionsLearningPathPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pipeline, setPipeline] = useState(null);

  const studentId = user?._id || user?.id || user?.email || '';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const masteryRes = await mathpathAPI.mastery();
        const mastery = masteryRes?.data || {};
        const records = Array.isArray(mastery.records) ? mastery.records : [];
        const masteredSkillIds = records
          .filter((record) => ['mastered', 'accurate', 'fluent', 'retained'].includes(String(record.status || '').toLowerCase()))
          .map((record) => record.skillId)
          .filter(Boolean);
        const weakSkillIds = records
          .filter((record) => ['needs_review', 'needsreview', 'weak'].includes(String(record.status || '').toLowerCase()))
          .map((record) => record.skillId)
          .filter(Boolean);
        const fluentSkillIds = records
          .filter((record) => ['fluent', 'retained'].includes(String(record.status || '').toLowerCase()))
          .map((record) => record.skillId)
          .filter(Boolean);

        const pipelineResult = runMathPathDomainPipeline({
          studentId,
          domainId: 'fractions',
          mode: 'full',
          practiceState: {
            currentSkillId: mastery?.recommended?.skillId || null,
            masteredSkillIds,
            weakSkillIds,
            fluentSkillIds,
          },
          retentionState: {},
          assessmentResults: [],
          mistakePlans: [],
          workingAnalysisSummary: {},
        });
        if (!active) return;
        setPipeline(pipelineResult);
      } catch (e) {
        if (!active) return;
        setError(e?.response?.data?.error || e.message || 'Could not load learning path.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [studentId]);

  const studentProgress = pipeline?.studentProgress || {};
  const masteryProgress = studentProgress.masteryProgress || {};
  const nextAction = studentProgress.nextRecommendedAction || {};
  const currentSkillId = studentProgress.currentSkill;
  const skillStatuses = studentProgress.skillStatuses || {};
  const retainedSkillIds = new Set(studentProgress.retentionProgress?.retainedSkillIds || []);
  const fluentSkillIds = new Set(studentProgress.fluencyProgress?.fluentSkillIds || []);
  const needsReviewSet = new Set((studentProgress.weakSkills || []).map((w) => w.skillId));
  const completedSet = new Set(Object.entries(skillStatuses).filter(([, status]) => isCompleteStatus(status)).map(([skillId]) => skillId));
  const studentLevel = user?.studentLevel || user?.moeLevel || user?.profile?.studentLevel || 'P4';
  const studentStream = user?.stream || user?.profile?.stream || '';
  const curriculum = normalizeCurriculum(
    String(studentLevel || '').toUpperCase().startsWith('S') && String(studentStream || '').toUpperCase() === 'G1'
      ? 'MOE_SECONDARY_G1_MATH_2021'
      : '',
    studentLevel
  );

  const visibleSkillRows = useMemo(() => {
    const weakSkillIds = (studentProgress.weakSkills || []).map((row) => row.skillId).filter(Boolean);
    const rows = getVisibleSkillsForStudentLevel({
      country: 'SG',
      curriculum,
      domain: 'fractions',
      studentLevel,
      weakSkillIds,
      currentSkillId,
    });
    return rows.length ? rows : [];
  }, [studentProgress.weakSkills, studentLevel, currentSkillId, curriculum]);

  const visibleSkillIds = useMemo(() => {
    const ids = visibleSkillRows.map((row) => row.frameworkSkillId).filter(Boolean);
    return new Set(ids.length ? ids : fractionSkillGraph.skillIds);
  }, [visibleSkillRows]);

  const strands = useMemo(() => {
    return STRAND_GROUPS.map((group) => {
      const items = group.ids
        .filter((skillId) => visibleSkillIds.has(skillId))
        .map((skillId) => {
          const skill = skillById.get(skillId);
          const status = skillStatuses[skillId] || 'notStarted';
          const locked = !isCompleteStatus(status) && (skill?.prerequisites || []).some((req) => !completedSet.has(req));
          const needsReview = needsReviewSet.has(skillId) || status === 'needsReview' || status === 'weak';
          const curriculumMapping = getSkillCurriculumMapping(skillId, {
            country: 'SG',
            curriculum,
          });
          const missingPrerequisites = (skill?.prerequisites || []).filter((req) => !completedSet.has(req));
          const missingPrerequisiteNames = missingPrerequisites.map((req) => displaySkillName(req, skillById.get(req)?.name || req));
          return {
            ...(skill || { id: skillId, name: skillId, description: '' }),
            displayName: displaySkillName(skillId, skill?.name || skillId),
            status,
            statusLabel: normalizeStatus(status, locked, needsReview),
            locked,
            current: skillId === currentSkillId,
            fluent: fluentSkillIds.has(skillId),
            retained: retainedSkillIds.has(skillId),
            needsReview,
            prerequisitesMet: missingPrerequisites.length === 0,
            missingPrerequisiteNames,
            introducedLevel: curriculumMapping?.introducedLevel || skill?.introducedLevel || '',
            masteryLevel: curriculumMapping?.masteryLevel || skill?.masteryLevel || '',
            levelBand: curriculumMapping?.levelBand || skill?.singaporeLevel || [],
            syllabusRef: curriculumMapping?.syllabusRef || '',
            strand: curriculumMapping?.strand || 'Number and Algebra',
          };
        });
      return { ...group, items };
    });
  }, [skillStatuses, completedSet, needsReviewSet, currentSkillId, fluentSkillIds, retainedSkillIds, visibleSkillIds, curriculum]);

  if (loading) return <Spinner label="Loading learning path…" />;
  if (error) return <EmptyState message={error} />;

  const hasDiagnosticSignal = Boolean(
    studentProgress?.diagnosticResult?.recommendedStartingSkillId
    || (studentProgress?.diagnosticResult?.masteredSkillIds || []).length
    || (studentProgress?.diagnosticResult?.weakSkillIds || []).length
  );

  if (!hasDiagnosticSignal && (masteryProgress.masteredSkills?.length || 0) === 0 && Object.keys(skillStatuses).length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Fractions Learning Path" subtitle="Structured progression across all 26 Fractions skills." />
        <EmptyState
          message="Start your Fractions Diagnostic to find your best starting point."
        >
          <Button onClick={() => navigate('/student/mathpath/diagnostic')} icon={ArrowRight}>Start Diagnostic</Button>
        </EmptyState>
      </div>
    );
  }

  const assessmentGate = getFractionAssessmentBlueprintReadiness({
    completedSkillIds: Array.from(completedSet),
    level: studentLevel,
  });
  const nextCta = actionFromNext(nextAction, assessmentGate.ready);
  const currentSkillName = displaySkillName(currentSkillId, skillById.get(currentSkillId)?.name || 'Fractions starter skill');
  const launchPrimary = (to = nextCta.to) => {
    if (!to) return;
    if (String(to).startsWith('/student/mathpath/practice/')) {
      navigate(to, {
        state: {
          skillId: currentSkillId || 'F001',
          questionCount: 8,
          sessionType: 'practice',
          source: 'fractions-pathway',
          backTo: '/student/mathpath/fractions',
          homeBase: '/student/mathpath/fractions',
        },
      });
      return;
    }
    navigate(to);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="Fractions Learning Path" />
      <LearningPathHeader
        progress={masteryProgress}
        currentSkillName={currentSkillName}
        nextCta={nextCta}
        onPrimary={launchPrimary}
        onStory={() => navigate('/student/mathpath/fractions/story/F026')}
      />

      <NextActionPanel nextAction={nextAction} onPrimary={launchPrimary} assessmentReady={FEATURE_FLAGS.assessments && assessmentGate.ready} />

      {studentProgress.retentionProgress?.skillsDueForReview?.length ? (
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-gold-deep" />
            <p className="text-sm text-ink-700">
              {studentProgress.retentionProgress.skillsDueForReview.length} review
              {studentProgress.retentionProgress.skillsDueForReview.length === 1 ? '' : 's'} due.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-3">
          <p className="text-sm text-ink-600">No review due today.</p>
        </Card>
      )}

      {strands.map((strand) => (
        <SkillStrandSection
          key={strand.key}
          label={strand.label}
          skills={strand.items}
          onSkillAction={(skill) => {
            if (skill.locked) return;
            navigate(`/student/mathpath/practice/skill-${skill.id}`, {
              state: {
                skillId: skill.id,
                questionCount: 8,
                sessionType: 'practice',
                source: 'fractions-pathway-skill-card',
                backTo: '/student/mathpath/fractions',
                homeBase: '/student/mathpath/fractions',
              },
            });
          }}
        />
      ))}
    </div>
  );
}
