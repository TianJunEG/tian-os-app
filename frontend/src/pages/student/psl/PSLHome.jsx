import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, ChevronDown, ChevronRight, HelpCircle, Star, Target, Trophy, Clock, BarChart3 } from 'lucide-react';
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

function MasteryBadge({ mastery }) {
  if (!mastery) return <span className="text-xs" style={{ color: '#8a93a3' }}>Not started</span>;
  const { status, score } = mastery;
  if (status === 'mastered')
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ color: '#1f9d57', background: '#f3faf6' }}>
        Mastered
      </span>
    );
  if (status === 'learning')
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ color: '#d9892e', background: '#fbf1e1' }}>
        {score}%
      </span>
    );
  if (status === 'needs_review')
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ color: '#d8694f', background: '#fbece9' }}>
        {score}%
      </span>
    );
  return <span className="text-xs" style={{ color: '#8a93a3' }}>Not started</span>;
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

  return (
    <div className="bg-dot-grid min-h-screen pb-8">
      <div className="mx-auto max-w-2xl space-y-4 px-3 pt-4 pb-6 sm:space-y-6 sm:px-6 sm:pt-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#fbf1e1' }}>
            <Brain className="h-5 w-5" style={{ color: '#d9892e' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold sm:text-xl" style={{ color: '#232c39' }}>Problem Solving Lab</h1>
            <p className="text-sm" style={{ color: '#6b7585' }}>Learn to solve word problems step by step</p>
          </div>
        </div>

        {/* Dashboard stats */}
        {dashboard?.overview?.totalSessions > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-xl border border-[#dde1e8] bg-[#f5f6f8] p-3 text-center">
              <Trophy className="mx-auto h-4 w-4" style={{ color: '#d9892e' }} />
              <p className="mt-1 font-mono text-lg font-bold" style={{ color: '#232c39' }}>{dashboard.overview.skillsMastered}</p>
              <p className="text-[10px] font-medium" style={{ color: '#8a93a3' }}>Mastered</p>
            </div>
            <div className="rounded-xl border border-[#dde1e8] bg-[#f5f6f8] p-3 text-center">
              <BarChart3 className="mx-auto h-4 w-4" style={{ color: '#1f8a5b' }} />
              <p className="mt-1 font-mono text-lg font-bold" style={{ color: '#232c39' }}>{dashboard.overview.averageAccuracy}%</p>
              <p className="text-[10px] font-medium" style={{ color: '#8a93a3' }}>Accuracy</p>
            </div>
            <div className="rounded-xl border border-[#dde1e8] bg-[#f5f6f8] p-3 text-center">
              <Target className="mx-auto h-4 w-4" style={{ color: '#2f80d8' }} />
              <p className="mt-1 font-mono text-lg font-bold" style={{ color: '#232c39' }}>{dashboard.overview.skillsAttempted}</p>
              <p className="text-[10px] font-medium" style={{ color: '#8a93a3' }}>Attempted</p>
            </div>
            <div className="rounded-xl border border-[#dde1e8] bg-[#f5f6f8] p-3 text-center">
              <Clock className="mx-auto h-4 w-4" style={{ color: '#5a6675' }} />
              <p className="mt-1 font-mono text-lg font-bold" style={{ color: '#232c39' }}>{dashboard.overview.totalSessions}</p>
              <p className="text-[10px] font-medium" style={{ color: '#8a93a3' }}>Sessions</p>
            </div>
          </div>
        )}

        {/* Recommended skill */}
        {data?.recommended && (
          <div className="step-shell !p-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5" style={{ color: '#d9892e' }} />
              <div className="flex-1">
                <p className="mono-label" style={{ color: '#d9892e' }}>Recommended</p>
                <p className="text-sm font-semibold" style={{ color: '#232c39' }}>
                  {skills.find((s) => s.skillId === data.recommended)?.name || data.recommended}
                </p>
              </div>
              <button
                onClick={() => handleStart(data.recommended)}
                disabled={starting === data.recommended}
                className="btn-gold !h-9 !px-4 !text-sm"
              >
                {starting === data.recommended ? 'Starting…' : 'Start'}
              </button>
            </div>
          </div>
        )}

        {/* Decision Guide link */}
        <button
          type="button"
          onClick={() => navigate('/student/psl/decision-guide')}
          className="step-shell flex w-full items-center gap-3 !p-4 text-left transition-colors hover:bg-white/60"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#f0e8fb' }}>
            <HelpCircle className="h-4 w-4" style={{ color: '#7c3aed' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#232c39' }}>Decision Guide</p>
            <p className="text-xs" style={{ color: '#6b7585' }}>Not sure which heuristic to use? Answer a few yes/no questions to find out.</p>
          </div>
          <ChevronRight className="h-4 w-4" style={{ color: '#8a93a3' }} />
        </button>

        {/* Level filter pills */}
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

        {/* Heuristic filter banner */}
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

        {/* Skill groups */}
        {grouped.map((group, gi) => {
          const isOpen = expanded[group.heuristic] ?? gi === 0;
          const masteredCount = group.skills.filter((s) => s.mastery?.status === 'mastered').length;
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
                  {masteredCount > 0 && <span style={{ color: '#1f9d57' }}>{masteredCount}/</span>}
                  {group.skills.length} skills
                </span>
              </button>
              {isOpen && (
                <div className="space-y-2">
                  {group.skills.map((skill) => {
                    const blocked = readiness[skill.skillId] && !readiness[skill.skillId].allReady;
                    return (
                      <div key={skill.skillId}>
                        <button
                          type="button"
                          className="step-shell flex w-full items-center gap-3 !p-4 text-left transition-colors hover:bg-white/60"
                          onClick={() => handleStart(skill.skillId)}
                          disabled={starting === skill.skillId}
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: '#eef0f4' }}
                          >
                            {skill.mastery?.status === 'mastered' ? (
                              <Star className="h-4 w-4" style={{ color: '#d9892e' }} />
                            ) : (
                              <span className="text-xs font-bold" style={{ color: '#8a93a3' }}>
                                {skill.difficulty}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#232c39' }}>{skill.name}</p>
                            <p className="text-xs line-clamp-2" style={{ color: '#6b7585' }}>{skill.description}</p>
                          </div>
                          <MasteryBadge mastery={skill.mastery} />
                          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: '#8a93a3' }} />
                        </button>
                        {blocked && (
                          <div className="mt-2 ml-4">
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
  );
}
