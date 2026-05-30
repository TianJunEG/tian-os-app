import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, RotateCcw, Target } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { mathpathAPI } from '../../../services/api';
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { fractionSkillGraph } from '../../../mathpath/fractions/fractionSkillGraph';
import { runMathPathDomainPipeline } from '../../../mathpath/orchestration/mathPathDomainOrchestrator';

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

function actionFromNext(nextAction) {
  const action = String(nextAction?.action || 'continuePractice');
  if (action === 'startFluency') return { label: 'Start Fluency Drill', to: '/student/mathpath/fluency' };
  if (action === 'completeRetentionReview') return { label: 'Review Due Skill', to: '/student/mathpath' };
  if (action === 'attemptAssessment') return { label: 'Start Assessment', to: '/student/mathpath/assessment' };
  if (action === 'uploadWorking') return { label: 'Upload Working', to: '/student/mathpath/working/upload' };
  if (action === 'followRemediationPlan') return { label: 'Practise This Skill', to: '/student/mathpath' };
  if (action === 'advanceSkill') return { label: 'Move to Next Skill', to: '/student/mathpath' };
  return { label: 'Continue Practice', to: '/student/mathpath' };
}

function LearningPathHeader({ progress, currentSkillName, nextCta, onPrimary }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Domain</p>
          <h2 className="font-display text-2xl font-semibold text-navy-700">Fractions</h2>
          <p className="mt-1 text-sm text-ink-600">Current skill: {currentSkillName || 'Start your diagnostic'}</p>
        </div>
        <Button icon={ArrowRight} onClick={onPrimary}>{nextCta.label}</Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-ink-500">Mastered</p>
          <p className="font-mono text-xl text-navy-700">{progress.percentageMastered || 0}%</p>
        </div>
        <div>
          <p className="text-xs text-ink-500">Fluent</p>
          <p className="font-mono text-xl text-navy-700">{progress.percentageFluent || 0}%</p>
        </div>
        <div>
          <p className="text-xs text-ink-500">Retained</p>
          <p className="font-mono text-xl text-navy-700">{progress.percentageRetained || 0}%</p>
        </div>
      </div>
      <ProgressBar className="mt-4" value={progress.masteredSkills?.length || 0} max={progress.totalSkills || 26} />
    </Card>
  );
}

function SkillStatusBadge({ label }) {
  return <Badge tone={statusTone(label)}>{label}</Badge>;
}

function SkillNodeCard({ skill, statusLabel, isLocked, isCurrent, isFluent, isRetained, needsReview, onAction }) {
  const actionLabel = isLocked ? 'Locked' : needsReview ? 'Review' : isCurrent ? 'Continue' : statusLabel === 'Not Started' ? 'Start' : 'Practise';
  return (
    <Card className={`p-4 ${isCurrent ? 'ring-2 ring-gold-400/60' : ''} ${isLocked ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-800">{skill.name}</p>
          <p className="mt-0.5 text-xs text-ink-500">{skill.description}</p>
        </div>
        {isLocked ? <Lock className="h-4 w-4 text-ink-400" /> : isRetained ? <CheckCircle2 className="h-4 w-4 text-success-700" /> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <SkillStatusBadge label={statusLabel} />
        {isFluent && <Badge tone="navy">Fluent</Badge>}
        {isRetained && <Badge tone="success">Retained</Badge>}
        {needsReview && <Badge tone="error">Review</Badge>}
      </div>
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
            onAction={() => onSkillAction(skillItem)}
          />
        ))}
      </div>
    </section>
  );
}

function NextActionPanel({ nextAction, onPrimary }) {
  const cta = actionFromNext(nextAction);
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Target className="mt-0.5 h-5 w-5 text-gold-700" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-700">Next Action</p>
          <p className="mt-1 text-sm text-ink-700">{nextAction?.explanation || 'Continue with your next recommended Fractions step.'}</p>
        </div>
      </div>
      <Button className="mt-4" icon={ArrowRight} onClick={() => onPrimary(cta.to)}>{cta.label}</Button>
    </Card>
  );
}

export default function FractionsLearningPathPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pipeline, setPipeline] = useState(null);

  const studentId = user?._id || user?.id || user?.email || 'demo-student';

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

  const strands = useMemo(() => {
    return STRAND_GROUPS.map((group) => {
      const items = group.ids.map((skillId) => {
        const skill = skillById.get(skillId);
        const status = skillStatuses[skillId] || 'notStarted';
        const locked = !isCompleteStatus(status) && (skill?.prerequisites || []).some((req) => !completedSet.has(req));
        const needsReview = needsReviewSet.has(skillId) || status === 'needsReview' || status === 'weak';
        return {
          ...(skill || { id: skillId, name: skillId, description: '' }),
          status,
          statusLabel: normalizeStatus(status, locked, needsReview),
          locked,
          current: skillId === currentSkillId,
          fluent: fluentSkillIds.has(skillId),
          retained: retainedSkillIds.has(skillId),
          needsReview,
        };
      });
      return { ...group, items };
    });
  }, [skillStatuses, completedSet, needsReviewSet, currentSkillId, fluentSkillIds, retainedSkillIds]);

  if (loading) return <Spinner label="Loading learning path…" />;
  if (error) return <EmptyState message={error} />;

  const hasDiagnosticSignal = Boolean(
    studentProgress?.diagnosticResult?.recommendedStartingSkillId
    || (studentProgress?.diagnosticResult?.masteredSkillIds || []).length
    || (studentProgress?.diagnosticResult?.weakSkillIds || []).length
  );

  if (!hasDiagnosticSignal && !(masteryProgress.totalSkills > 0)) {
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

  const nextCta = actionFromNext(nextAction);
  const currentSkillName = skillById.get(currentSkillId)?.name || 'Fractions starter skill';

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="Fractions Learning Path" subtitle="See your current skill, progress, and what to do next." />
      <LearningPathHeader
        progress={masteryProgress}
        currentSkillName={currentSkillName}
        nextCta={nextCta}
        onPrimary={() => navigate(nextCta.to)}
      />

      <NextActionPanel nextAction={nextAction} onPrimary={(to) => navigate(to)} />

      {studentProgress.retentionProgress?.skillsDueForReview?.length ? (
        <Card className="p-4">
          <div className="flex items-start gap-2">
            <RotateCcw className="mt-0.5 h-4 w-4 text-gold-700" />
            <p className="text-sm text-ink-700">
              {studentProgress.retentionProgress.skillsDueForReview.length} review
              {studentProgress.retentionProgress.skillsDueForReview.length === 1 ? '' : 's'} due.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
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
            navigate('/student/mathpath', {
              state: { focusSkillId: skill.id },
            });
          }}
        />
      ))}
    </div>
  );
}
