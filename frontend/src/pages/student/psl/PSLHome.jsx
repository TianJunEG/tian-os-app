import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, ChevronDown, ChevronRight, HelpCircle, Star } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import PrerequisiteGate from './components/PrerequisiteGate';

const HEURISTIC_LABELS = {
  'bar-model': 'Bar Model (Units & Parts)',
  'before-after': 'Before-After',
  'work-backwards': 'Work Backwards',
  'multi-step': 'Multi-Step Arithmetic',
  'guess-check': 'Guess & Check / Supposition',
  'ratio': 'Proportional & Ratio Reasoning',
  'data-interpretation': 'Data Interpretation',
  'excess-shortage': 'Excess & Shortage',
  'simultaneous': 'Simultaneous / Elimination',
  'pattern-recognition': 'Pattern Recognition',
};
const HEURISTIC_ORDER = ['bar-model', 'before-after', 'work-backwards', 'multi-step', 'guess-check', 'ratio', 'data-interpretation', 'excess-shortage', 'simultaneous', 'pattern-recognition'];
const LEVEL_LABELS = { P3: 'Primary 3', P4: 'Primary 4', P5: 'Primary 5', P6: 'Primary 6' };
const LEVEL_ORDER = ['P3', 'P4', 'P5', 'P6'];

/* ─── Progress ring ──────────────────────────────────────────── */
function ProgressRing({ percent }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div className="relative shrink-0" style={{ width: 80, height: 80 }}>
      <svg viewBox="0 0 80 80" className="h-full w-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke="#d9892e" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-lg font-bold" style={{ color: '#f4f0e8' }}>{percent}%</span>
        <span className="text-[8px] font-medium uppercase tracking-wider" style={{ color: '#8b9ab3' }}>Complete</span>
      </div>
    </div>
  );
}

/* ─── Mastery badge (compact) ────────────────────────────────── */
function MasteryBadge({ mastery }) {
  if (!mastery)
    return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: '#8a93a3', background: '#eef0f4' }}>New</span>;
  const { status, score } = mastery;
  if (status === 'mastered')
    return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: '#1f9d57', background: '#f3faf6' }}>Mastered</span>;
  if (status === 'learning')
    return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: '#d9892e', background: '#fbf1e1' }}>{score}%</span>;
  if (status === 'needs_review')
    return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: '#d8694f', background: '#fbece9' }}>{score}%</span>;
  return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: '#8a93a3', background: '#eef0f4' }}>New</span>;
}

export default function PSLHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readiness, setReadiness] = useState({});
  const [starting, setStarting] = useState(null);
  const [filterLevel, setFilterLevel] = useState(null);
  const [filterHeuristic, setFilterHeuristic] = useState(searchParams.get('heuristic'));
  const [expanded, setExpanded] = useState({});
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    pslAPI.home()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
    pslAPI.dashboard().then((res) => setDashboard(res.data)).catch(() => {});
  }, []);

  const checkReadiness = async (skillId) => {
    if (readiness[skillId]) return readiness[skillId];
    try {
      const res = await pslAPI.readiness(skillId);
      setReadiness((prev) => ({ ...prev, [skillId]: res.data }));
      return res.data;
    } catch {
      return { allReady: true, blockers: [] };
    }
  };

  const handleStart = async (skillId) => {
    setStarting(skillId);
    const ready = await checkReadiness(skillId);
    if (!ready.allReady) {
      setStarting(null);
      return;
    }
    try {
      const res = await pslAPI.startSession({ skillId, problemCount: 5 });
      navigate(`/student/psl/session/${res.data.sessionId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
      setStarting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-dot-grid min-h-screen">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#dde1e8] border-t-[#d9892e]" />
          <p className="text-sm font-medium" style={{ color: '#6b7585' }}>Loading skills…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dot-grid min-h-screen">
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-medium" style={{ color: '#d8694f' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-gold-outline">Retry</button>
        </div>
      </div>
    );
  }

  const skills = data?.skills || [];
  const filtered = skills.filter((sk) =>
    (!filterLevel || sk.level === filterLevel) && (!filterHeuristic || sk.heuristic === filterHeuristic)
  );
  const grouped = HEURISTIC_ORDER.map((h) => ({
    heuristic: h,
    label: HEURISTIC_LABELS[h] || h,
    skills: filtered.filter((sk) => sk.heuristic === h),
  })).filter((g) => g.skills.length > 0);
  const levelCounts = LEVEL_ORDER.reduce((acc, lvl) => {
    acc[lvl] = skills.filter((sk) => sk.level === lvl).length;
    return acc;
  }, {});

  const overview = dashboard?.overview;
  const masteredCount = overview?.skillsMastered || 0;
  const attemptedCount = overview?.skillsAttempted || 0;
  const completionPct = skills.length > 0 ? Math.round((masteredCount / skills.length) * 100) : 0;
  const hasSessions = overview?.totalSessions > 0;

  const recommendedSkill = data?.recommended
    ? skills.find((s) => s.skillId === data.recommended)
    : null;

  return (
    <div className="bg-dot-grid min-h-screen pb-8">
      <div className="mx-auto max-w-2xl px-3 pt-0 pb-6 sm:px-6">

        {/* ── Hero banner ──────────────────────────────────── */}
        <div className="results-dark mx-[-12px] px-5 py-6 sm:mx-0 sm:mt-4 sm:px-8 sm:py-8">
          <div className="flex items-center gap-4 sm:gap-5">
            {hasSessions ? (
              <ProgressRing percent={completionPct} />
            ) : (
              <div
                className="flex h-[80px] w-[80px] shrink-0 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(217,137,46,0.2)' }}
              >
                <Brain className="h-9 w-9" style={{ color: '#d9892e' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold sm:text-2xl" style={{ color: '#f4f0e8' }}>
                Problem Solving Lab
              </h1>
              {hasSessions ? (
                <p className="mt-1 text-xs sm:text-sm" style={{ color: '#8b9ab3' }}>
                  {masteredCount} mastered · {attemptedCount} attempted · {skills.length} skills
                </p>
              ) : (
                <p className="mt-1 text-xs sm:text-sm" style={{ color: '#8b9ab3' }}>
                  Learn to solve word problems step by step
                </p>
              )}
              {recommendedSkill && (
                <button
                  onClick={() => handleStart(data.recommended)}
                  disabled={starting === data.recommended}
                  className="btn-gold mt-3 !h-9 !px-5 !text-sm"
                >
                  {starting === data.recommended ? 'Starting…' : 'Continue learning'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-5">

          {/* ── Decision Guide ─────────────────────────────── */}
          <button
            type="button"
            onClick={() => navigate('/student/psl/decision-guide')}
            className="step-shell flex w-full items-center gap-3 !p-3 sm:!p-4 text-left transition-colors hover:bg-white/60"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: '#f0e8fb' }}
            >
              <HelpCircle className="h-4 w-4" style={{ color: '#7c3aed' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#232c39' }}>Decision Guide</p>
              <p className="text-xs" style={{ color: '#6b7585' }}>Find your heuristic</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0" style={{ color: '#8a93a3' }} />
          </button>

          {/* ── Filter pills ───────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
            <button
              type="button"
              onClick={() => setFilterLevel(null)}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
              style={!filterLevel
                ? { background: '#d9892e', color: '#fff' }
                : { background: '#eef0f4', color: '#5a6675' }}
            >
              All ({skills.length})
            </button>
            {LEVEL_ORDER.map((lvl) => levelCounts[lvl] > 0 && (
              <button
                key={lvl}
                type="button"
                onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                style={filterLevel === lvl
                  ? { background: '#d9892e', color: '#fff' }
                  : { background: '#eef0f4', color: '#5a6675' }}
              >
                {LEVEL_LABELS[lvl]} ({levelCounts[lvl]})
              </button>
            ))}
          </div>

          {/* ── Heuristic filter banner ────────────────────── */}
          {filterHeuristic && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: '#f0e8fb' }}>
              <span className="flex-1 text-xs font-semibold" style={{ color: '#7c3aed' }}>
                Showing: {HEURISTIC_LABELS[filterHeuristic] || filterHeuristic}
              </span>
              <button
                type="button"
                onClick={() => setFilterHeuristic(null)}
                className="text-xs font-medium" style={{ color: '#7c3aed' }}
              >
                Show all
              </button>
            </div>
          )}

          {/* ── Skill groups (2-col grid) ──────────────────── */}
          {grouped.map((group, gi) => {
            const isOpen = expanded[group.heuristic] ?? gi === 0;
            const groupMastered = group.skills.filter((s) => s.mastery?.status === 'mastered').length;
            return (
              <div key={group.heuristic}>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [group.heuristic]: !isOpen }))}
                  className="mb-2 flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-white/50"
                >
                  {isOpen
                    ? <ChevronDown className="h-4 w-4" style={{ color: '#8a93a3' }} />
                    : <ChevronRight className="h-4 w-4" style={{ color: '#8a93a3' }} />}
                  <h2 className="mono-label flex-1" style={{ color: '#5a6675' }}>{group.label}</h2>
                  <span className="text-xs" style={{ color: '#8a93a3' }}>
                    {groupMastered > 0 && <span style={{ color: '#1f9d57' }}>{groupMastered}/</span>}
                    {group.skills.length}
                  </span>
                </button>
                {isOpen && (
                  <div className="grid grid-cols-2 gap-2">
                    {group.skills.map((skill) => {
                      const blocked = readiness[skill.skillId] && !readiness[skill.skillId].allReady;
                      const isMastered = skill.mastery?.status === 'mastered';
                      return (
                        <div key={skill.skillId}>
                          <button
                            type="button"
                            className="step-shell flex w-full flex-col !p-3 text-left transition-colors hover:bg-white/60"
                            onClick={() => handleStart(skill.skillId)}
                            disabled={starting === skill.skillId}
                          >
                            <div className="mb-1.5 flex items-center gap-1.5">
                              <div
                                className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md"
                                style={{ background: isMastered ? '#fbf1e1' : '#eef0f4' }}
                              >
                                {isMastered ? (
                                  <Star className="h-3 w-3" style={{ color: '#d9892e' }} />
                                ) : (
                                  <span className="text-[10px] font-bold" style={{ color: '#8a93a3' }}>
                                    {skill.difficulty}
                                  </span>
                                )}
                              </div>
                              <MasteryBadge mastery={skill.mastery} />
                            </div>
                            <p className="text-xs font-semibold leading-snug" style={{ color: '#232c39' }}>
                              {skill.name}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-snug line-clamp-2" style={{ color: '#6b7585' }}>
                              {skill.description}
                            </p>
                          </button>
                          {blocked && (
                            <div className="mt-1.5">
                              <PrerequisiteGate blockers={readiness[skill.skillId].blockers} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
