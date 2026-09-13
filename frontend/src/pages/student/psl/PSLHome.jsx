import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronRight, HelpCircle, Star } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import PrerequisiteGate from './components/PrerequisiteGate';
import { Card, Button, Badge, PageHeader, StatTile, Spinner, ErrorState } from '../../../components/ui';
import { MascotBubble } from '../../../components/MascotAvatar';

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

// Compact mastery pill, on the shared Badge tones.
function MasteryBadge({ mastery }) {
  if (!mastery) return <Badge tone="neutral">New</Badge>;
  const { status, score } = mastery;
  if (status === 'mastered') return <Badge tone="success">Mastered</Badge>;
  if (status === 'learning') return <Badge tone="gold">{score}%</Badge>;
  if (status === 'needs_review') return <Badge tone="rose">{score}%</Badge>;
  return <Badge tone="neutral">New</Badge>;
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
    pslAPI.dashboard().then((res) => setDashboard(res.data)).catch((e) => console.warn('PSLHome: fetch failed', e));
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

  if (loading) return <Spinner label="Loading skills…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

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
  const hasSessions = overview?.totalSessions > 0;
  const recommendedSkill = data?.recommended ? skills.find((s) => s.skillId === data.recommended) : null;

  const pill = (active) => `shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold transition ${active ? 'bg-emerald text-white' : 'bg-line text-body-muted hover:text-emerald'}`;

  return (
    <>
      <PageHeader title="Problem Solving Lab" subtitle="Learn to solve word problems step by step." />
      <MascotBubble
        name="lejo"
        message={hasSessions
          ? `You've mastered ${masteredCount} of ${skills.length} skills — keep it up!`
          : "Let's crack word problems step by step. Pick a skill to start."}
        size="sm"
        className="mb-5"
      />

      {hasSessions && (
        <Card className="mb-4 flex items-center gap-6 p-4">
          <StatTile label="Mastered" value={masteredCount} />
          <StatTile label="Attempted" value={attemptedCount} />
          <StatTile label="Skills" value={skills.length} />
        </Card>
      )}

      {recommendedSkill && (
        <Card className="mb-4 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-deep">Recommended next</div>
              <h2 className="font-display text-xl font-semibold text-emerald-deep">{recommendedSkill.name}</h2>
              {recommendedSkill.description && <p className="mt-1 text-sm text-ink-500">{recommendedSkill.description}</p>}
            </div>
            <Button size="l" icon={ArrowRight} disabled={starting === data.recommended} onClick={() => handleStart(data.recommended)} className="shrink-0">
              {starting === data.recommended ? 'Starting…' : 'Continue learning'}
            </Button>
          </div>
        </Card>
      )}

      <Card interactive className="mb-4">
        <button type="button" onClick={() => navigate('/student/psl/decision-guide')} className="flex w-full items-center gap-3 p-4 text-left">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-btn bg-purple-tint text-purple"><HelpCircle className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">Decision Guide</span>
            <span className="block text-xs text-body-muted">Not sure which method? Find your heuristic.</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-body-faint" />
        </button>
      </Card>

      {/* Level filter pills */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => setFilterLevel(null)} className={pill(!filterLevel)}>All ({skills.length})</button>
        {LEVEL_ORDER.map((lvl) => levelCounts[lvl] > 0 && (
          <button key={lvl} type="button" onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)} className={pill(filterLevel === lvl)}>
            {LEVEL_LABELS[lvl]} ({levelCounts[lvl]})
          </button>
        ))}
      </div>

      {filterHeuristic && (
        <div className="mb-4 flex items-center gap-2 rounded-card bg-purple-tint px-3 py-2">
          <span className="flex-1 text-xs font-semibold text-purple">Showing: {HEURISTIC_LABELS[filterHeuristic] || filterHeuristic}</span>
          <button type="button" onClick={() => setFilterHeuristic(null)} className="text-xs font-medium text-purple">Show all</button>
        </div>
      )}

      {/* Skill groups */}
      <div className="space-y-4">
        {grouped.map((group, gi) => {
          const isOpen = expanded[group.heuristic] ?? gi === 0;
          const groupMastered = group.skills.filter((s) => s.mastery?.status === 'mastered').length;
          return (
            <div key={group.heuristic}>
              <button
                type="button"
                onClick={() => setExpanded((prev) => ({ ...prev, [group.heuristic]: !isOpen }))}
                className="mb-2 flex w-full items-center gap-2 rounded-btn px-1 py-1.5 text-left transition hover:bg-line-soft"
              >
                {isOpen ? <ChevronDown className="h-4 w-4 text-body-faint" /> : <ChevronRight className="h-4 w-4 text-body-faint" />}
                <h2 className="flex-1 text-sm font-bold uppercase tracking-wide text-body-muted">{group.label}</h2>
                <span className="text-xs text-body-muted">
                  {groupMastered > 0 && <span className="text-emerald">{groupMastered}/</span>}{group.skills.length}
                </span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.skills.map((skill) => {
                    const blocked = readiness[skill.skillId] && !readiness[skill.skillId].allReady;
                    const isMastered = skill.mastery?.status === 'mastered';
                    return (
                      <div key={skill.skillId}>
                        <Card interactive className="h-full">
                          <button
                            type="button"
                            className="flex h-full w-full flex-col p-3 text-left disabled:opacity-60"
                            onClick={() => handleStart(skill.skillId)}
                            disabled={starting === skill.skillId}
                          >
                            <div className="mb-1.5 flex items-center gap-1.5">
                              <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md ${isMastered ? 'bg-gold-tint text-gold-deep' : 'bg-line text-body-faint'}`}>
                                {isMastered ? <Star className="h-3 w-3" /> : <span className="text-[10px] font-bold">{skill.difficulty}</span>}
                              </span>
                              <MasteryBadge mastery={skill.mastery} />
                            </div>
                            <p className="text-xs font-semibold leading-snug text-ink">{skill.name}</p>
                            {skill.description && <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-body-muted">{skill.description}</p>}
                          </button>
                        </Card>
                        {blocked && <div className="mt-1.5"><PrerequisiteGate blockers={readiness[skill.skillId].blockers} /></div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
