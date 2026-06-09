import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Lock,
  Pencil,
  PenLine,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { studentProfileAPI } from '../../services/api';
import { Badge, Button, Card, ErrorState, ProgressBar, Spinner } from '../../components/ui';
import { getVisualModeStyles, isLowerPrimary, isSecondary, resolveStudentVisualMode } from '../../design-os/studentVisualMode';
import { FEATURE_FLAGS } from '../../config/featureFlags';

const iconMap = {
  badge: Award,
  target: Target,
  practice: BookOpen,
  skill: BadgeCheck,
  skills: CheckCircle2,
  trophy: Trophy,
  streak: Flame,
  working: PenLine,
  questions: Sparkles,
  fluency: Clock,
  checkpoint: Target,
};

const ACHIEVEMENT_DISPLAY = {
  first_question: { title: 'First Step', description: 'Answered your very first question!', emoji: '🌟' },
  first_correct: { title: 'Right On!', description: 'Got your first answer correct!', emoji: '✅' },
  streak_3: { title: 'Streak Starter', description: '3 correct answers in a row!', emoji: '🔥' },
  streak_5: { title: 'On Fire!', description: '5 correct answers in a row!', emoji: '🔥🔥' },
  streak_10: { title: 'Unstoppable!', description: '10 correct answers in a row!', emoji: '💥' },
  first_skill_mastered: { title: 'Skill Master', description: 'Mastered your first skill!', emoji: '🏆' },
  ten_skills_mastered: { title: 'Knowledge Builder', description: 'Mastered 10 skills!', emoji: '📚' },
  hundred_questions: { title: 'Century Club', description: 'Answered 100 questions!', emoji: '💯' },
  first_mistake_reviewed: { title: 'Learning Detective', description: 'Reviewed your first mistake!', emoji: '🔍' },
  first_working_submitted: { title: 'Show Your Work', description: 'Submitted working for the first time!', emoji: '📝' },
  all_diagnostic_complete: { title: 'Diagnostic Hero', description: 'Completed all diagnostic questions!', emoji: '🎯' },
  first_recovery_pack: { title: 'Recovery Star', description: 'Completed your first recovery pack!', emoji: '⭐' },
  fluency_started: { title: 'Speed Builder', description: 'Started fluency practice!', emoji: '⚡' },
};

function getAchievementDisplay(achievement) {
  const display = ACHIEVEMENT_DISPLAY[achievement?.code] || {};
  return {
    title: display.title || achievement?.title || achievement?.code || 'Achievement',
    description: display.description || achievement?.description || '',
    emoji: display.emoji || '🏅',
  };
}

function NextToUnlockBanner({ achievements = [] }) {
  const nextLocked = achievements.find((a) => !a.unlocked);
  if (!nextLocked) return null;
  const display = getAchievementDisplay(nextLocked);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gold-200 bg-gradient-to-r from-gold-50 to-ivory p-4">
      <Star className="h-6 w-6 text-gold-500" />
      <div>
        <p className="text-sm font-bold text-navy-800">Next to unlock: {display.title}</p>
        <p className="text-xs text-ink-500">{display.description}</p>
      </div>
    </div>
  );
}

function initials(name = 'Student') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'S';
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function formatEventDate(date) {
  if (!date) return '';
  const then = new Date(date);
  if (Number.isNaN(then.getTime())) return '';
  const today = new Date();
  const todayKey = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (then.toDateString() === todayKey) return 'Today';
  if (then.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function friendlyProfileError(err) {
  if (err?.response?.status === 404) {
    return 'Unable to load profile.';
  }
  return 'Unable to load profile.';
}

async function loadProfileData() {
  console.info('[StudentProfile] API request: overview');
  try {
    const res = await studentProfileAPI.overview();
    console.info('[StudentProfile] API response: overview', { status: res?.status || 200 });
    return res.data;
  } catch (err) {
    console.warn('[StudentProfile] API request failed: overview', {
      status: err?.response?.status,
      error: err?.response?.data?.error || err?.message,
    });

    if (err?.response?.status !== 404) throw err;

    console.info('[StudentProfile] API fallback request: summary/achievements/timeline');
    const [summary, achievements, timeline] = await Promise.all([
      studentProfileAPI.summary(),
      studentProfileAPI.achievements(),
      studentProfileAPI.timeline(),
    ]);
    console.info('[StudentProfile] API fallback response', {
      summary: summary?.status || 200,
      achievements: achievements?.status || 200,
      timeline: timeline?.status || 200,
    });
    return {
      summary: summary.data,
      achievements: achievements.data,
      timeline: timeline.data,
    };
  }
}

function DecorativeMotif({ enabled }) {
  if (!enabled) return null;
  return <span className="pointer-events-none absolute right-4 top-4 text-xl opacity-60" aria-hidden>✦</span>;
}

function SnapshotCard({ icon: Icon, label, value, visual }) {
  return (
    <Card className={`relative overflow-hidden p-4 ${visual.styles.card}`}>
      <DecorativeMotif enabled={visual.styles.decorative} />
      <div className="flex items-center gap-3">
        <span className={`grid ${isLowerPrimary(visual.mode) ? 'h-12 w-12' : 'h-11 w-11'} shrink-0 place-items-center rounded-xl ${visual.styles.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-2xl font-semibold leading-none text-ink-900 tabular-nums">{value}</p>
          <p className={`mt-1 ${isLowerPrimary(visual.mode) ? 'text-base' : 'text-sm'} font-semibold text-ink-500`}>{label}</p>
        </div>
      </div>
    </Card>
  );
}

function AchievementBadge({ achievement, visual }) {
  const display = getAchievementDisplay(achievement);
  return (
    <Card className={`p-4 ${achievement.unlocked ? 'border-gold-300 bg-gradient-to-br from-gold-100 to-gold-50' : 'border-hairline bg-bone opacity-75'}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${achievement.unlocked ? 'bg-gold-200' : 'bg-hairline text-ink-400'}`}>
          {achievement.unlocked ? display.emoji : <Lock className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink-900">{display.title}</h3>
            <Badge tone={achievement.unlocked ? 'success' : 'neutral'}>{achievement.unlocked ? 'Unlocked' : 'Locked'}</Badge>
          </div>
          <p className="mt-1 text-sm leading-5 text-ink-500">{display.description}</p>
        </div>
      </div>
    </Card>
  );
}

function TimelineItem({ event }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-navy-700" />
      <div className="min-w-0 flex-1 border-b border-hairline pb-4 last:border-b-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-ink-900">{event.title}</p>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">{formatEventDate(event.occurredAt)}</span>
        </div>
        {event.description && <p className="mt-1 text-sm text-ink-500">{event.description}</p>}
        {event.xpAwarded > 0 && <p className="mt-2 text-sm font-semibold text-gold-700">Earned {event.xpAwarded} XP</p>}
      </div>
    </li>
  );
}

export default function StudentProfile() {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const nameInputRef = useRef(null);

  const startEditName = () => {
    setNameValue(state.data?.summary?.student?.name || '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };
  const cancelEditName = () => { setEditingName(false); setNameValue(''); };
  const saveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === state.data?.summary?.student?.name) { cancelEditName(); return; }
    setNameSaving(true);
    try {
      await studentProfileAPI.updateName(trimmed);
      setState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          summary: { ...prev.data?.summary, student: { ...prev.data?.summary?.student, name: trimmed } },
        },
      }));
      setEditingName(false);
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setNameSaving(false);
    }
  };

  const load = useCallback(() => {
    let active = true;
    console.info('[StudentProfile] route loaded: /student/profile');
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    loadProfileData()
      .then((data) => {
        if (active) {
          console.info('[StudentProfile] render success');
          setState({ loading: false, error: '', data });
        }
      })
      .catch((err) => {
        if (active) {
          console.error('[StudentProfile] render fallback', {
            status: err?.response?.status,
            error: err?.response?.data?.error || err?.message,
          });
          setState({
            loading: false,
            error: friendlyProfileError(err),
            data: null,
          });
        }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const visibleAchievements = useMemo(() => {
    return (state.data?.achievements || []).filter(
      (a) => a.code !== 'fluency_started' || FEATURE_FLAGS.fluency
    );
  }, [state.data]);

  const groupedAchievements = useMemo(() => {
    const rows = visibleAchievements;
    return rows.reduce((acc, achievement) => {
      const key = achievement.category || 'Learning';
      acc[key] = acc[key] || [];
      acc[key].push(achievement);
      return acc;
    }, {});
  }, [state.data]);

  if (state.loading) return <Spinner label="Loading your profile…" />;
  if (state.error) {
    return (
      <ErrorState
        message={`${state.error} Profile unavailable. Please try again.`}
        onRetry={load}
      />
    );
  }

  const summary = state.data?.summary || {};
  const student = summary.student || {};
  const timeline = state.data?.timeline || [];
  const progress = summary.progress || { mastered: 0, total: 1, percentage: 0 };
  const avatarText = initials(student.name);
  const visualMode = resolveStudentVisualMode({
    ...student,
    studentVisualMode: student.studentVisualMode,
    level: student.level,
  });
  const visual = { mode: visualMode, styles: getVisualModeStyles(visualMode) };
  const copy = {
    profileTitle: visual.styles.profileLabel,
    snapshotTitle: isLowerPrimary(visual.mode) ? 'My Progress Stars' : 'Learning Snapshot',
    pathTitle: isSecondary(visual.mode) ? 'Current Skill Path' : 'Current Learning Path',
    continueLabel: isLowerPrimary(visual.mode) ? '🚀 Continue' : 'Continue Learning',
    achievementSubtitle: isLowerPrimary(visual.mode)
      ? 'Unlocked badges show what you have built. Locked badges show your next goals.'
      : 'Unlocked badges show growth milestones. Locked badges show what to aim for next.',
  };

  return (
    <main className={`mx-auto max-w-6xl pb-8 ${visual.styles.page}`}>
      <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card className={`relative overflow-hidden p-5 sm:p-6 ${visual.styles.card}`}>
          <DecorativeMotif enabled={visual.styles.decorative} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-xl font-semibold ${visual.styles.primaryIcon}`}>
                  {avatarText}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-500">{copy.profileTitle}</p>
                {editingName ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEditName(); }}
                      className="rounded-lg border border-hairline bg-white px-3 py-1.5 text-lg font-bold text-navy-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                      maxLength={100}
                      disabled={nameSaving}
                    />
                    <button onClick={saveName} disabled={nameSaving} className="rounded-lg bg-teal-500 p-1.5 text-white hover:bg-teal-600 disabled:opacity-50"><Check className="h-4 w-4" /></button>
                    <button onClick={cancelEditName} className="rounded-lg bg-bone p-1.5 text-ink-500 hover:bg-hairline"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <h1 className={`truncate font-display ${isSecondary(visual.mode) ? 'text-2xl' : 'text-3xl'} font-semibold text-ink-900`}>{student.name || 'Student'}</h1>
                    <button onClick={startEditName} className="rounded-lg p-1 text-ink-400 hover:bg-bone hover:text-ink-600" title="Edit name"><Pencil className="h-4 w-4" /></button>
                  </div>
                )}
                <p className="mt-1 text-sm text-ink-500">{student.level || 'Learning with Tian OS'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[16rem]">
              <div className={`rounded-xl border p-3 ${visual.styles.softCard}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">Current Focus</p>
                <p className="mt-1 font-semibold text-ink-900">{summary.currentDomain || 'MathPath'}</p>
              </div>
              <div className={`rounded-xl border p-3 ${visual.styles.softCard}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">{visual.styles.xpLabel}</p>
                <p className="mt-1 font-mono text-xl font-semibold text-ink-900 tabular-nums">{formatNumber(summary.xp)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className={`relative overflow-hidden p-5 sm:p-6 ${visual.styles.card}`}>
          <DecorativeMotif enabled={visual.styles.decorative} />
          <p className="text-sm font-semibold text-ink-500">{visual.styles.streakLabel}</p>
          <div className="mt-3 flex items-end gap-3">
            <Flame className="h-8 w-8 text-gold-500" />
            <p className="font-mono text-4xl font-semibold leading-none text-ink-900 tabular-nums">{summary.streak || 0}</p>
            <p className="pb-1 text-sm font-semibold text-ink-500">{summary.streak === 1 ? 'day' : 'days'}</p>
          </div>
          {!isSecondary(visual.mode) && <p className="mt-3 text-sm leading-5 text-ink-500">Keep building steady learning habits. XP rewards effort, practice, and working records.</p>}
        </Card>
      </section>

      <h2 className="mt-6 font-display text-2xl font-semibold text-ink-900">{copy.snapshotTitle}</h2>
      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SnapshotCard visual={visual} icon={Sparkles} label="Questions Solved" value={formatNumber(summary.questionsSolved)} />
        <SnapshotCard visual={visual} icon={BadgeCheck} label="Skills Mastered" value={formatNumber(summary.skillsMastered)} />
        <SnapshotCard visual={visual} icon={BookOpen} label="Practice Sessions" value={formatNumber(summary.practiceSessions)} />
        <SnapshotCard visual={visual} icon={PenLine} label="Working Records" value={formatNumber(summary.workingSubmissions)} />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card className={`p-5 sm:p-6 ${visual.styles.card}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-500">{copy.pathTitle}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900">{summary.currentDomain || 'MathPath'}</h2>
              <p className="mt-2 text-sm text-ink-500">Current skill</p>
              <p className="mt-1 text-lg font-semibold text-ink-900">{summary.currentSkill || 'Start your next skill check'}</p>
            </div>
            <Button to={summary.recommendedAction?.href || '/student/mathpath'} icon={ArrowRight} size={visual.styles.buttonSize} className="w-full sm:w-auto">
              {copy.continueLabel}
            </Button>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-ink-700">Mastery Progress</span>
              <span className="font-mono font-semibold text-ink-500 tabular-nums">{progress.label}</span>
            </div>
            <ProgressBar value={progress.mastered || 0} max={progress.total || 1} />
          </div>
        </Card>

        <Card className={`p-5 sm:p-6 ${visual.styles.softCard}`}>
          <p className="text-sm font-semibold text-ink-500">Recommended Action</p>
          <p className="mt-2 text-lg font-semibold text-ink-900">{summary.recommendedAction?.label || 'Continue Learning'}</p>
          {!isLowerPrimary(visual.mode) && <p className="mt-2 text-sm leading-5 text-ink-500">Pick up from the next useful skill and keep your progress moving.</p>}
        </Card>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-900">Achievements</h2>
            <p className="mt-1 text-sm text-ink-500">{copy.achievementSubtitle}</p>
          </div>
        </div>
        <NextToUnlockBanner achievements={visibleAchievements} />
        <div className="mt-4 space-y-5">
          {Object.entries(groupedAchievements).map(([category, achievements]) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-ink-400">{category}</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {achievements.map((achievement) => (
                  <AchievementBadge key={achievement.code} achievement={achievement} visual={visual} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="font-display text-2xl font-semibold text-ink-900">Learning Timeline</h2>
        <Card className={`mt-4 p-5 sm:p-6 ${visual.styles.card}`}>
          {timeline.length ? (
            <ol className="space-y-4">
              {timeline.slice(0, 10).map((event) => (
                <TimelineItem key={event.id} event={event} />
              ))}
            </ol>
          ) : (
            <div className="rounded-xl border border-dashed border-hairline bg-slate-50 p-5 text-sm text-ink-500">
              Your recent learning activity will appear here after diagnostics, practice, working submissions, and checkpoints.
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
