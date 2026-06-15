import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BookOpenCheck, CheckCircle2, Clock3, Info, Lock, RotateCcw, Sparkles, X } from 'lucide-react';
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

function ProgressRing({ value, total, color, size = 72, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? value / total : 0;
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-ink-100" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-700 ease-out" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="rotate-90 origin-center fill-ink-800 text-lg font-bold" style={{ fontSize: 18 }}>
        {value}
      </text>
    </svg>
  );
}

function SummaryRing({ label, value, total, color, visualStyles }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 sm:gap-2 sm:p-4 ${visualStyles?.accentCard || 'bg-white/90'}`}>
      <ProgressRing value={value} total={total} color={color} />
      <p className="text-xs font-semibold text-ink-500">{label}</p>
    </div>
  );
}

function NextStepHero({ skill, onStart, starting, visualStyles }) {
  if (!skill) {
    return (
      <Card className={`p-5 ${visualStyles.heroCard}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="success">All caught up</Badge>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-ink-900">No urgent skill today</h2>
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
          <div className="absolute bottom-4 left-5 grid h-14 w-14 place-items-center rounded-2xl bg-surface-white/80 shadow-rest">
            <Sparkles className="h-7 w-7" />
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <Badge tone="gold">What to do next</Badge>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-ink-900">{skill.name}</h2>
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
    <button
      type="button"
      disabled={starting || action.disabled}
      onClick={() => onStart(skill)}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
        skill.locked
          ? 'border-ink-100 bg-ink-50/50 opacity-60'
          : 'border-ink-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
      }`}
    >
      {skill.locked ? (
        <Lock className="h-4 w-4 shrink-0 text-ink-300" />
      ) : (
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          label === 'Mastered' ? 'bg-emerald-400' :
          label === 'Needs Review' ? 'bg-red-400' :
          label === 'Working On' ? 'bg-blue-400' : 'bg-ink-200'
        }`} />
      )}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">{skill.name}</span>
      <span className="hidden shrink-0 text-xs text-ink-300 sm:block">{formatLastPractised(skill.lastPracticedAt)}</span>
      <span className="shrink-0 text-xs text-ink-400">{skill.topicName}</span>
      {!skill.locked && (
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          label === 'Needs Review' ? 'bg-red-100 text-red-600' :
          label === 'Working On' ? 'bg-blue-100 text-blue-600' :
          label === 'Mastered' ? 'bg-emerald-100 text-emerald-600' :
          'bg-ink-100 text-ink-500'
        }`}>
          {action.cta}
        </span>
      )}
    </button>
  );
}

function SkillSection({ title, question, skills, emptyText, icon: Icon, tone, onStart, starting, visualStyles }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-raised text-emerald-deep">
            <Icon className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
          <Badge tone={tone}>{skills.length}</Badge>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            className="grid h-6 w-6 place-items-center rounded-full text-ink-300 hover:bg-ink-100 hover:text-ink-500"
            aria-label={`About ${title}`}
          >
            {showInfo ? <X className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {showInfo && (
        <p className="mb-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">{question}</p>
      )}

      {skills.length ? (
        <div className="space-y-1.5">
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
      const isFrameworkSkillId = /^F\d{3}$/i.test(String(skill.skillId || ''));
      if (isFrameworkSkillId) {
        navigate('/student/mathpath/practice/recommended-pathway', {
          state: {
            skillId: String(skill.skillId).toUpperCase(),
            questionCount: 10,
            sessionType: 'practice',
            source: 'skill-graph',
          },
        });
        return;
      }
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
    <div className={`mx-auto max-w-6xl space-y-4 sm:space-y-6 ${visualStyles.page}`}>
      <PageHeader title="Progress" subtitle="Mastery visibility for MathPath skills." />

      <NextStepHero skill={nextSkill} onStart={startPractice} starting={starting} visualStyles={visualStyles} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryRing label="Mastered" value={groups.mastered.length} total={skills.length} color="#34d399" visualStyles={visualStyles} />
        <SummaryRing label="Working On" value={groups.workingOn.length} total={skills.length} color="#60a5fa" visualStyles={visualStyles} />
        <SummaryRing label="Needs Review" value={groups.needsReview.length} total={skills.length} color="#f87171" visualStyles={visualStyles} />
        <SummaryRing label="Not Started" value={groups.notStarted.length} total={skills.length} color="#cbd5e1" visualStyles={visualStyles} />
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
