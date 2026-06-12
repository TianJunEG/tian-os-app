import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronDown, ChevronRight, Lock, Star, Target } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { Card, Spinner } from '../../../components/ui';
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
  if (!mastery) return <span className="text-xs text-ink-400">Not started</span>;
  const { status, score } = mastery;
  if (status === 'mastered') return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Mastered</span>;
  if (status === 'learning') return <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold text-gold-700">{score}%</span>;
  if (status === 'needs_review') return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">{score}%</span>;
  return <span className="text-xs text-ink-400">Not started</span>;
}

export default function PSLHome() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readiness, setReadiness] = useState({});
  const [starting, setStarting] = useState(null);
  const [filterLevel, setFilterLevel] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    pslAPI.home()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
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

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  const skills = data?.skills || [];
  const filtered = filterLevel ? skills.filter((sk) => sk.level === filterLevel) : skills;
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
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24 sm:p-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100">
            <Brain className="h-5 w-5 text-gold-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink-800">Problem Solving Lab</h1>
            <p className="text-sm text-ink-500">Learn to solve word problems step by step</p>
          </div>
        </div>
      </div>

      {data?.recommended && (
        <Card className="p-4" interactive>
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-gold-500" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gold-600">Recommended</p>
              <p className="text-sm font-semibold text-ink-700">
                {skills.find((s) => s.skillId === data.recommended)?.name || data.recommended}
              </p>
            </div>
            <button
              onClick={() => handleStart(data.recommended)}
              disabled={starting === data.recommended}
              className="rounded-xl bg-gold-400 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-500 disabled:opacity-50"
            >
              {starting === data.recommended ? 'Starting...' : 'Start'}
            </button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterLevel(null)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${!filterLevel ? 'bg-gold-400 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}
        >
          All ({skills.length})
        </button>
        {LEVEL_ORDER.map((lvl) => levelCounts[lvl] > 0 && (
          <button
            key={lvl}
            type="button"
            onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${filterLevel === lvl ? 'bg-gold-400 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}
          >
            {LEVEL_LABELS[lvl]} ({levelCounts[lvl]})
          </button>
        ))}
      </div>

      {grouped.map((group, gi) => {
        const isOpen = expanded[group.heuristic] ?? gi === 0;
        const masteredCount = group.skills.filter((s) => s.mastery?.status === 'mastered').length;
        return (
          <div key={group.heuristic}>
            <button
              type="button"
              onClick={() => setExpanded((prev) => ({ ...prev, [group.heuristic]: !isOpen }))}
              className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-ink-50"
            >
              {isOpen
                ? <ChevronDown className="h-4 w-4 text-ink-400" />
                : <ChevronRight className="h-4 w-4 text-ink-400" />}
              <h2 className="flex-1 text-sm font-semibold text-ink-500">{group.label}</h2>
              <span className="text-xs text-ink-400">
                {masteredCount > 0 && <span className="text-emerald-600">{masteredCount}/</span>}
                {group.skills.length} skills
              </span>
            </button>
            {isOpen && (
              <div className="mt-1 space-y-2">
                {group.skills.map((skill) => {
                  const blocked = readiness[skill.skillId] && !readiness[skill.skillId].allReady;
                  return (
                    <div key={skill.skillId}>
                      <Card className="p-4" interactive>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 text-left"
                          onClick={() => handleStart(skill.skillId)}
                          disabled={starting === skill.skillId}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100">
                            {skill.mastery?.status === 'mastered' ? (
                              <Star className="h-4 w-4 text-gold-500" />
                            ) : (
                              <span className="text-xs font-bold text-ink-400">
                                {skill.difficulty}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink-700 truncate">{skill.name}</p>
                            <p className="text-xs text-ink-400 line-clamp-2">{skill.description}</p>
                          </div>
                          <MasteryBadge mastery={skill.mastery} />
                          <ChevronRight className="h-4 w-4 text-ink-300" />
                        </button>
                      </Card>
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
  );
}
