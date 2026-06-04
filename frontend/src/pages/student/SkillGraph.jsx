import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BookOpenCheck, CheckCircle2, Clock3, Lock, RotateCcw, Sparkles } from 'lucide-react';
import { mathpathAPI } from '../../services/api';
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../design-os/studentVisualMode';

function statusLabel(skill = {}) {
  if (skill.locked) return 'Locked';
  const status = String(skill.status || '').toLowerCase();
  if (status === 'mastered') return 'Mastered';
  if (status === 'needs_review' || status === 'needsreview') return 'Needs Review';
  if (status === 'learning' || status === 'in_progress') return 'Working On';
  if (status === 'not_started') return skill.ready ? 'Ready' : 'Not Started';
  return status ? status.replace(/_/g, ' ') : 'Not Started';
}

function statusTone(label) {
  if (label === 'Mastered') return 'success';
  if (label === 'Needs Review') return 'error';
  if (label === 'Working On') return 'navy';
  if (label === 'Ready') return 'gold';
  return 'neutral';
}

function formatLastPractised(value) {
  if (!value) return 'Not practised yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not practised yet';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function recommendedAction(skill = {}) {
  if (skill.locked) {
    return {
      label: 'Build prerequisite first',
      cta: 'Locked',
      disabled: true,
      helper: skill.missingPrereqs?.length ? `Needs ${skill.missingPrereqs[0]}` : 'A foundation skill is still needed.',
    };
  }
  const label = statusLabel(skill);
  if (label === 'Mastered') {
    return { label: 'Keep it fresh', cta: 'Review', helper: 'A short review helps this stay secure.' };
  }
  if (label === 'Needs Review') {
    return { label: 'Review mistakes', cta: 'Review', helper: 'Start here to repair the weak spot.' };
  }
  if (label === 'Working On') {
    return { label: 'Continue learning', cta: 'Continue', helper: 'Finish this skill before moving on.' };
  }
  return { label: 'Start when ready', cta: 'Start', helper: 'This skill is available now.' };
}

function flattenSkills(topics = []) {
  return topics.flatMap((topic) => (
    (topic.skills || []).map((skill) => ({
      ...skill,
      topicName: topic.name,
      topicId: topic.topicId,
    }))
  ));
}

function groupSkills(skills = []) {
  const groups = {
    mastered: [],
    workingOn: [],
    needsReview: [],
    notStarted: [],
  };

  skills.forEach((skill) => {
    const status = String(skill.status || '').toLowerCase();
    if (status === 'mastered') groups.mastered.push(skill);
    else if (status === 'needs_review' || status === 'needsreview') groups.needsReview.push(skill);
    else if (status === 'learning' || status === 'in_progress') groups.workingOn.push(skill);
    else groups.notStarted.push(skill);
  });

  return groups;
}

function SummaryCard({ icon: Icon, label, value, helper, tone = 'navy', visualStyles }) {
  const toneClass = {
    navy: 'bg-navy-50 text-navy-700',
    gold: 'bg-gold-100 text-gold-700',
    success: 'bg-success-100 text-success-700',
    error: 'bg-error-100 text-error-700',
    neutral: 'bg-slate-50 text-ink-600',
  }[tone] || 'bg-navy-50 text-navy-700';

  return (
    <Card className={`p-4 ${visualStyles?.accentCard || 'border-white/80 bg-white/90'}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-500">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold text-ink-900">{value}</p>
          {helper && <p className="mt-1 text-xs text-ink-500">{helper}</p>}
        </div>
      </div>
    </Card>
  );
}

function NextStepHero({ skill, onStart, starting, visualStyles }) {
  if (!skill) {
    return (
      <Card className={`p-5 ${visualStyles.heroCard}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="success">All caught up</Badge>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink-900">No urgent skill today</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">Review a mastered skill or start a fresh MathPath challenge when you are ready.</p>
          </div>
          <Button to="/student/mathpath" icon={ArrowRight} className={visualStyles.primaryCta}>Open MathPath</Button>
        </div>
      </Card>
    );
  }

  const action = recommendedAction(skill);
  return (
    <Card className={`overflow-hidden p-0 ${visualStyles.accentCard}`}>
      <div className="grid gap-0 lg:grid-cols-[14rem_1fr]">
        <div className={`relative min-h-[9rem] overflow-hidden ${visualStyles.heroPanel}`}>
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/45" />
          <div className="absolute bottom-4 left-5 grid h-14 w-14 place-items-center rounded-2xl bg-paper/80 shadow-resting">
            <Sparkles className="h-7 w-7" />
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <Badge tone="gold">What to do next</Badge>
          <h2 className="mt-3 font-display text-3xl font-semibold text-ink-900">{skill.name}</h2>
          <p className="mt-2 text-sm text-ink-500">{skill.topicName}</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">{action.helper}</p>
          <div className="mt-5">
            <Button icon={ArrowRight} disabled={starting || action.disabled} onClick={() => onStart(skill)} className={visualStyles.primaryCta}>
              {action.cta}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SkillRow({ skill, onStart, starting, visualStyles }) {
  const label = statusLabel(skill);
  const action = recommendedAction(skill);

  return (
    <Card className={`p-4 ${visualStyles.accentCard} ${skill.locked ? 'opacity-80' : ''}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(label)}>{label}</Badge>
            {skill.locked && <Lock className="h-4 w-4 text-ink-300" />}
          </div>
          <h3 className="mt-2 text-base font-semibold leading-snug text-ink-900">{skill.name}</h3>
          <p className="mt-1 text-sm text-ink-500">{skill.topicName}</p>
        </div>

        <div className="grid gap-3 text-sm md:w-[30rem] md:grid-cols-[1fr_1.1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">Last practised</p>
            <p className="mt-1 font-semibold text-ink-800">{formatLastPractised(skill.lastPracticedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">Recommended next</p>
            <p className="mt-1 font-semibold text-ink-800">{action.label}</p>
          </div>
          <Button
            size="s"
            variant={label === 'Needs Review' ? 'primary' : 'secondary'}
            disabled={starting || action.disabled}
            onClick={() => onStart(skill)}
            className="w-full md:w-auto"
          >
            {action.cta}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SkillSection({ title, question, skills, emptyText, icon: Icon, tone, onStart, starting, visualStyles }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-navy-700">
              <Icon className="h-4 w-4" />
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink-900">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-ink-500">{question}</p>
        </div>
        <Badge tone={tone}>{skills.length}</Badge>
      </div>

      {skills.length ? (
        <div className="space-y-3">
          {skills.map((skill) => (
            <SkillRow
              key={String(skill.skillId)}
              skill={skill}
              onStart={onStart}
              starting={starting}
              visualStyles={visualStyles}
            />
          ))}
        </div>
      ) : (
        <Card className={`p-4 text-sm text-ink-500 ${visualStyles.accentCard}`}>{emptyText}</Card>
      )}
    </section>
  );
}

export default function SkillGraph() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const visualStyles = getVisualModeStyles(resolveStudentVisualMode(user || {}));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    mathpathAPI.graph()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || 'Could not load your progress.'))
      .finally(() => setLoading(false));
  }, []);

  const startPractice = async (skill) => {
    if (!skill?.skillId || starting || skill.locked) return;
    setStarting(true);
    try {
      const { data: session } = await mathpathAPI.startSession({ skillId: skill.skillId, questionCount: 10 });
      navigate(`/student/mathpath/practice/${session.session_id}`, { state: { items: session.items } });
    } catch (e) {
      setError(e.response?.data?.error || 'Could not start practice.');
      setStarting(false);
    }
  };

  const skills = useMemo(() => flattenSkills(data?.topics || []), [data?.topics]);
  const groups = useMemo(() => groupSkills(skills), [skills]);
  const nextSkill = groups.needsReview[0] || groups.workingOn[0] || skills.find((skill) => !skill.locked && skill.status === 'not_started') || null;

  if (loading) return <Spinner label="Loading your progress…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  const summary = data?.summary || {};
  if (!summary.total) {
    return (
      <>
        <PageHeader title="Progress" subtitle="See what you have mastered, what you are working on, and what to do next." />
        <EmptyState icon={BookOpenCheck} message="Your progress will appear once you begin MathPath practice.">
          <Button to="/student/mathpath" icon={ArrowRight}>Open MathPath</Button>
        </EmptyState>
      </>
    );
  }

  return (
    <div className={`mx-auto max-w-6xl space-y-6 ${visualStyles.page}`}>
      <PageHeader title="Progress" subtitle="Mastery visibility for MathPath skills." />

      <NextStepHero skill={nextSkill} onStart={startPractice} starting={starting} visualStyles={visualStyles} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={CheckCircle2} label="Mastered Skills" value={groups.mastered.length} helper="Secure skills" tone="success" visualStyles={visualStyles} />
        <SummaryCard icon={Sparkles} label="Working On" value={groups.workingOn.length} helper="Active learning" tone="navy" visualStyles={visualStyles} />
        <SummaryCard icon={RotateCcw} label="Needs Review" value={groups.needsReview.length} helper="Fix these next" tone="error" visualStyles={visualStyles} />
        <SummaryCard icon={Clock3} label="Not Started" value={groups.notStarted.length} helper="Still ahead" tone="neutral" visualStyles={visualStyles} />
      </section>

      <SkillSection
        title="Mastered Skills"
        question="What have I mastered?"
        skills={groups.mastered}
        emptyText="No mastered skills yet. Start with today’s recommended practice."
        icon={CheckCircle2}
        tone="success"
        onStart={startPractice}
        starting={starting}
        visualStyles={visualStyles}
      />
      <SkillSection
        title="Working On"
        question="What am I working on?"
        skills={groups.workingOn}
        emptyText="No skills are in progress right now."
        icon={Sparkles}
        tone="navy"
        onStart={startPractice}
        starting={starting}
        visualStyles={visualStyles}
      />
      <SkillSection
        title="Needs Review"
        question="What should I repair next?"
        skills={groups.needsReview}
        emptyText="No review needed right now."
        icon={RotateCcw}
        tone="error"
        onStart={startPractice}
        starting={starting}
        visualStyles={visualStyles}
      />
      <SkillSection
        title="Not Started"
        question="What is still ahead?"
        skills={groups.notStarted}
        emptyText="Every visible skill has been started."
        icon={Clock3}
        tone="neutral"
        onStart={startPractice}
        starting={starting}
        visualStyles={visualStyles}
      />
    </div>
  );
}
