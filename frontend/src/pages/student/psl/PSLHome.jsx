import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, ChevronDown, ChevronRight, HelpCircle, Lock, Star, Target } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { Spinner } from '../../../components/ui';
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

const pageStyle = {
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  color: '#232c39',
  minHeight: '100vh',
  background: '#e7eaef',
  backgroundImage: 'radial-gradient(#d3d8e0 1px, transparent 1.4px)',
  backgroundSize: '26px 26px',
  padding: '0 0 96px',
};

const shellStyle = {
  background: '#f5f6f8',
  border: '1px solid #dde1e8',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 36px 70px -34px rgba(30,42,66,0.45)',
};

const titleCardStyle = {
  background: '#fff',
  border: '1px solid #eaedf2',
  borderRadius: 14,
  padding: '18px 22px',
  boxShadow: '0 1px 2px rgba(30,42,66,0.04)',
};

const cardStyle = {
  background: '#fff',
  border: '1px solid #e7eaef',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(30,42,66,0.05)',
  padding: '16px 18px',
};

const goldCTAStyle = {
  height: 48,
  borderRadius: 12,
  background: '#d9892e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  color: '#fff',
  fontWeight: 700,
  fontSize: '15px',
  boxShadow: '0 4px 14px -4px rgba(217,137,46,0.6)',
  cursor: 'pointer',
  border: 'none',
  fontFamily: 'inherit',
};

const filterChipStyle = (active) => ({
  padding: '6px 14px',
  borderRadius: 999,
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  fontFamily: 'inherit',
  background: active ? '#d9892e' : '#fff',
  color: active ? '#fff' : '#6b7585',
  boxShadow: active ? '0 2px 8px rgba(217,137,46,0.35)' : 'none',
  ...(active ? {} : { border: '1px solid #e7eaef' }),
});

function MasteryBadge({ mastery }) {
  if (!mastery) return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#aab2bf', letterSpacing: '0.04em' }}>NOT STARTED</span>;
  const { status, score } = mastery;
  if (status === 'mastered') return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, color: '#1f8a5b', background: '#e7f3ec', padding: '4px 9px', borderRadius: 7, letterSpacing: '0.04em' }}>MASTERED</span>;
  if (status === 'learning') return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, color: '#a8743a', background: '#fbf1e1', padding: '4px 9px', borderRadius: 7 }}>{score}%</span>;
  if (status === 'needs_review') return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, color: '#c8472f', background: '#fdeeea', padding: '4px 9px', borderRadius: 7 }}>{score}%</span>;
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#aab2bf' }}>NOT STARTED</span>;
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

  if (loading) return <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;
  if (error) return <div style={{ padding: 24, textAlign: 'center', color: '#d8694f' }}>{error}</div>;

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
    <div style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 30px 0' }}>
        <div style={shellStyle}>
          <div style={{ padding: '24px 30px 30px' }}>
            {/* Title card */}
            <div style={titleCardStyle}>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#232c39' }}>Word Problems</div>
              <div style={{ fontSize: 14, color: '#8a93a3', marginTop: 2 }}>Read it, plan it, solve it — one step at a time.</div>
            </div>

            {/* Recommended card */}
            {data?.recommended && (
              <div style={{ ...cardStyle, marginTop: 18, border: '1.5px solid #f0dcb8', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 5, background: '#d9892e' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingLeft: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a8743a', marginBottom: 6 }}>RECOMMENDED</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#232c39' }}>
                      {skills.find((s) => s.skillId === data.recommended)?.name || data.recommended}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStart(data.recommended)}
                    disabled={starting === data.recommended}
                    style={{ ...goldCTAStyle, padding: '0 22px', opacity: starting === data.recommended ? 0.5 : 1 }}
                  >
                    {starting === data.recommended ? 'Starting...' : 'Start'}
                    <ChevronRight style={{ width: 17, height: 17 }} />
                  </button>
                </div>
              </div>
            )}

            {/* Decision Guide card */}
            <button
              type="button"
              onClick={() => navigate('/student/psl/decision-guide')}
              style={{ ...cardStyle, marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f4ecfb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c4dbd', flex: '0 0 auto' }}>
                <HelpCircle style={{ width: 20, height: 20 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#232c39' }}>Decision Guide</div>
                <div style={{ fontSize: 13, color: '#8a93a3', marginTop: 1 }}>Not sure which heuristic to use? Answer a few yes/no questions to find out.</div>
              </div>
              <ChevronRight style={{ width: 16, height: 16, color: '#c2c8d0' }} />
            </button>

            {/* Level filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
              <button type="button" onClick={() => setFilterLevel(null)} style={filterChipStyle(!filterLevel)}>
                All ({skills.length})
              </button>
              {LEVEL_ORDER.map((lvl) => levelCounts[lvl] > 0 && (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)}
                  style={filterChipStyle(filterLevel === lvl)}
                >
                  {LEVEL_LABELS[lvl]} ({levelCounts[lvl]})
                </button>
              ))}
            </div>

            {/* Heuristic filter active indicator */}
            {filterHeuristic && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f4ecfb', borderRadius: 10, padding: '8px 14px', marginTop: 14 }}>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: '#7c4dbd' }}>
                  Showing: {HEURISTIC_LABELS[filterHeuristic] || filterHeuristic}
                </span>
                <button
                  type="button"
                  onClick={() => setFilterHeuristic(null)}
                  style={{ fontSize: 12, fontWeight: 600, color: '#7c4dbd', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Show all
                </button>
              </div>
            )}

            {/* Skill groups */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {grouped.map((group, gi) => {
                const isOpen = expanded[group.heuristic] ?? gi === 0;
                const masteredCount = group.skills.filter((s) => s.mastery?.status === 'mastered').length;
                return (
                  <div key={group.heuristic}>
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [group.heuristic]: !isOpen }))}
                      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, borderRadius: 10, padding: '8px 6px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {isOpen
                        ? <ChevronDown style={{ width: 16, height: 16, color: '#8a93a3' }} />
                        : <ChevronRight style={{ width: 16, height: 16, color: '#8a93a3' }} />}
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#46505f' }}>{group.label}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#8a93a3' }}>
                        {masteredCount > 0 && <span style={{ color: '#1f8a5b' }}>{masteredCount}/</span>}
                        {group.skills.length} skills
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, marginLeft: 4 }}>
                        {group.skills.map((skill) => {
                          const blocked = readiness[skill.skillId] && !readiness[skill.skillId].allReady;
                          return (
                            <div key={skill.skillId}>
                              <button
                                type="button"
                                onClick={() => handleStart(skill.skillId)}
                                disabled={starting === skill.skillId}
                                style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, width: '100%', cursor: 'pointer', textAlign: 'left', opacity: starting === skill.skillId ? 0.6 : 1 }}
                              >
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: skill.mastery?.status === 'mastered' ? '#e7f3ec' : '#f3f4f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                                  {skill.mastery?.status === 'mastered' ? (
                                    <Star style={{ width: 17, height: 17, color: '#d9892e' }} />
                                  ) : (
                                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#8a93a3' }}>
                                      {skill.difficulty}
                                    </span>
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: '#232c39', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.name}</div>
                                  <div style={{ fontSize: 12.5, color: '#8a93a3', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{skill.description}</div>
                                </div>
                                <MasteryBadge mastery={skill.mastery} />
                                <ChevronRight style={{ width: 16, height: 16, color: '#c2c8d0', flex: '0 0 auto' }} />
                              </button>
                              {blocked && (
                                <div style={{ marginTop: 8, marginLeft: 16 }}>
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
      </div>
    </div>
  );
}
