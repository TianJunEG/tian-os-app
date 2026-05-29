import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Map as MapIcon, ChevronRight } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, StatusBadge, ProgressBar, StatTile, PageHeader, Spinner, EmptyState } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';

// MathPath home — current standing + the single recommended next action, then
// the topic map. "One bright thing in the room": Start recommended practice.
export default function MathPathHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mastery, setMastery] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillPreview, setSkillPreview] = useState(null);
  const [skillPreviewLoading, setSkillPreviewLoading] = useState(false);
  const [skillPreviewError, setSkillPreviewError] = useState('');
  const selectedSkillId = selectedSkill?.skillId || '';

  useEffect(() => {
    (async () => {
      try {
        const [m, map] = await Promise.all([mathpathAPI.mastery(), mathpathAPI.map()]);
        setMastery(m.data);
        setTopics(map.data.topics || []);
      } catch (e) {
        setError(e.response?.data?.error || 'Could not load MathPath.');
      } finally { setLoading(false); }
    })();
  }, []);

  const startPractice = async (skillId) => {
    if (!skillId || starting) return;
    setStarting(true);
    try {
      const { data } = await mathpathAPI.startSession({ skillId, questionCount: 10 });
      navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items } });
    } catch (e) {
      setError(e.response?.data?.error || 'Could not start practice.');
      setStarting(false);
    }
  };

  const openSkillPreview = async (skill, topicName) => {
    if (!isPreviewMode || !skill?.skillId) return;
    const base = {
      skillId: skill.skillId,
      skillName: skill.name,
      level: skill.moeLevel || '',
      topicName: topicName || '',
    };
    setSelectedSkill(base);
    setSkillPreview(null);
    setSkillPreviewError('');
    setSkillPreviewLoading(true);
    try {
      // Probe existing APIs only (no backend change): a large preview session gives
      // question availability and samples; remediation probe confirms endpoint support.
      const [sessionRes, remediationRes] = await Promise.allSettled([
        mathpathAPI.startSession({ skillId: skill.skillId, questionCount: 200 }),
        mathpathAPI.remediation({ skillId: skill.skillId }, []),
      ]);

      let availableQuestions = 0;
      let sampleQuestions = [];
      let startable = false;
      let sessionId = '';
      let sessionItems = [];
      if (sessionRes.status === 'fulfilled') {
        const data = sessionRes.value?.data || {};
        sessionId = data.session_id || '';
        sessionItems = data.items || [];
        availableQuestions = sessionItems.length;
        sampleQuestions = sessionItems.slice(0, 3).map((q) => q.stem).filter(Boolean);
        startable = availableQuestions > 0;
      } else {
        const msg = sessionRes.reason?.response?.data?.error || '';
        if (/no questions available/i.test(msg)) {
          availableQuestions = 0;
          sampleQuestions = [];
          startable = false;
        } else {
          setSkillPreviewError(msg || 'Question preview unavailable.');
        }
      }

      const remediationExists = remediationRes.status === 'fulfilled';
      const mistakesHandled = true; // MathPath attempt flow writes mistakes for incorrect answers.
      const readiness = availableQuestions > 0
        ? (skill.status === 'needs_review' ? 'Needs review' : 'Ready')
        : 'Missing questions';

      setSkillPreview({
        ...base,
        sessionId,
        sessionItems,
        availableQuestions,
        sampleQuestions,
        startable,
        remediationExists,
        mistakesHandled,
        readiness,
      });
    } finally {
      setSkillPreviewLoading(false);
    }
  };

  const startPreviewPractice = () => {
    if (!skillPreview?.startable || !skillPreview?.sessionId) return;
    navigate(`/student/mathpath/practice/${skillPreview.sessionId}`, { state: { items: skillPreview.sessionItems || [] } });
  };

  if (loading) return <Spinner label="Loading MathPath…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  const defaultLevels = ['Primary 4', 'Primary 5'];
  const previewFlagOn = import.meta.env.VITE_ENABLE_MATHPATH_FULL_PREVIEW === '1'
    || import.meta.env.VITE_ENABLE_MATHPATH_FULL_PREVIEW === 'true';
  const isPreviewMode = previewFlagOn && (import.meta.env.DEV || user?.role === 'admin');
  const records = mastery?.records || [];
  const mastered = records.filter((r) => r.status === 'mastered');
  const learning = records.filter((r) => r.status === 'learning');
  const recommended = mastery?.recommended;
  const weak = mastery?.weakSkills || [];
  const visibleTopics = isPreviewMode
    ? topics
    : topics.filter((t) => defaultLevels.includes(t.moeLevel));
  const previewLevels = [...new Set(
    (topics || [])
      .flatMap((t) => (t.skills || []).map((s) => s.moeLevel))
      .filter(Boolean)
  )].sort((a, b) => {
    const na = parseInt(String(a).replace(/\D+/g, ''), 10);
    const nb = parseInt(String(b).replace(/\D+/g, ''), 10);
    if (Number.isNaN(na) || Number.isNaN(nb)) return String(a).localeCompare(String(b));
    return na - nb;
  });

  return (
    <>
      <PageHeader title="MathPath" subtitle="Your adaptive maths pathway." />
      {isPreviewMode && (
        <Card className="mb-6 border-l-4 border-l-gold-500 p-4">
          <p className="text-sm font-semibold text-gold-800">Curriculum Preview — not visible to beta users</p>
          <p className="mt-1 text-xs text-ink-500">Development/admin-only full map view.</p>
          <p className="mt-1 text-xs text-ink-500">Grouped by skill level for curriculum review. Production roadmap may group by topic.</p>
        </Card>
      )}

      {/* Recommended next action */}
      <Card className="mb-6 p-5">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700">Recommended next</div>
        {recommended ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">{recommended.skillName}</h2>
              <p className="mt-1 text-sm text-ink-500">{recommended.topicName} · <StatusBadge status={recommended.masteryState || recommended.status} /></p>
              {recommended.reason && <p className="mt-1 text-sm text-ink-600">{recommended.reason}</p>}
            </div>
            <Button size="l" icon={ArrowRight} disabled={starting} onClick={() => startPractice(recommended.skillId)} className="shrink-0">
              {starting ? 'Starting…' : 'Start recommended practice'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink-500">Pick a topic below to begin your first practice.</p>
        )}
      </Card>

      {/* Standing */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-6">
          <StatTile label="Mastered" value={mastered.length} />
          <StatTile label="Learning" value={learning.length} />
          <StatTile label="To review" value={weak.filter((w) => w.status === 'needs_review').length} />
        </div>
        <ProgressBar value={mastered.length} max={Math.max(records.length, 1)} />
      </Card>

      {/* Weak topics alert */}
      {weak.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-error-500 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error-500" />
            <div>
              <p className="text-sm font-semibold text-ink-700">Needs attention</p>
              <p className="text-sm text-ink-500">{weak[0].skillName} in {weak[0].topicName} could use practice.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Topic map */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Topic map</h3>
        <span className="inline-flex items-center gap-1 text-xs text-ink-300"><MapIcon className="h-3.5 w-3.5" /> {visibleTopics.length} topics</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleTopics.map((t) => (
          <Link key={t.topicId} to={`/student/mathpath/topics/${t.topicId}`} className="block">
            <Card interactive className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-semibold text-ink-700">{t.name}</h4>
                <Badge tone="neutral">{t.masteredCount}/{t.total}</Badge>
              </div>
              <ProgressBar value={t.masteredCount} max={Math.max(t.total, 1)} />
              <p className="mt-2 text-xs text-ink-300">{t.moeLevel}</p>
            </Card>
          </Link>
        ))}
      </div>
      {isPreviewMode && (
        <>
          <div className="mt-8 mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Levels and skills</h3>
            <span className="text-xs text-ink-300">{previewLevels.length} levels</span>
          </div>
          {selectedSkill && (
            <Card className="mb-4 border-l-4 border-l-gold-500 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gold-800">Curriculum Preview — not visible to beta users</p>
                <button type="button" onClick={() => { setSelectedSkill(null); setSkillPreview(null); setSkillPreviewError(''); }} className="text-xs text-ink-500 underline">Close</button>
              </div>
              {skillPreviewLoading ? (
                <Spinner label="Loading skill detail…" />
              ) : (
                <div className="space-y-2 text-sm text-ink-700">
                  <p><span className="font-semibold">Level:</span> {skillPreview?.level || selectedSkill.level || '—'}</p>
                  <p><span className="font-semibold">Topic/domain:</span> {skillPreview?.topicName || selectedSkill.topicName || '—'}</p>
                  <p><span className="font-semibold">Skill name:</span> {skillPreview?.skillName || selectedSkill.skillName}</p>
                  <p><span className="font-semibold">Skill ID:</span> <span className="font-mono text-xs">{skillPreview?.skillId || selectedSkill.skillId}</span></p>
                  <p><span className="font-semibold">Number of available questions:</span> {skillPreview?.availableQuestions ?? 0}</p>
                  <p><span className="font-semibold">Practice can be started:</span> {skillPreview?.startable ? 'Yes' : 'No'}</p>
                  <p><span className="font-semibold">Remediation/mistake handling:</span> {skillPreview?.remediationExists ? 'Remediation available; mistakes tracked' : 'Remediation endpoint unavailable; mistakes tracked'}</p>
                  <p><span className="font-semibold">Readiness status:</span> {skillPreview?.readiness || 'Needs review'}</p>
                  {skillPreviewError && <p className="text-xs text-error-700">{skillPreviewError}</p>}
                  {skillPreview?.sampleQuestions?.length ? (
                    <div>
                      <p className="font-semibold">Sample questions:</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-ink-600">
                        {skillPreview.sampleQuestions.map((stem, i) => <li key={`${i}-${stem.slice(0, 24)}`}>{stem}</li>)}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-500">
                      {skillPreviewError ? 'Question preview unavailable.' : 'No questions seeded yet.'}
                    </p>
                  )}
                  <div className="pt-2">
                    <Button size="s" onClick={startPreviewPractice} disabled={!skillPreview?.startable}>Start Practice</Button>
                  </div>
                </div>
              )}
            </Card>
          )}
          <div className="space-y-3">
            {previewLevels.map((level) => {
              const levelTopics = topics
                .map((t) => ({
                  ...t,
                  levelSkills: (t.skills || []).filter((s) => s.moeLevel === level),
                }))
                .filter((t) => t.levelSkills.length > 0);
              return (
                <Card key={level} className="p-4">
                  <p className="text-sm font-semibold text-ink-700">{level}</p>
                  <div className="mt-3 space-y-3">
                    {levelTopics.map((t) => (
                      <div key={t.topicId} className="rounded-lg border border-hairline p-3">
                        <p className="text-sm font-medium text-ink-700">{t.name}</p>
                        {t.levelSkills?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {t.levelSkills.map((s) => (
                              <button
                                key={s.skillId}
                                type="button"
                                onClick={() => openSkillPreview(s, t.name)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-left text-xs hover:bg-navy-50 ${selectedSkillId === s.skillId ? 'border-navy-500 bg-navy-50 text-navy-700' : 'border-hairline text-ink-600'}`}
                              >
                                <span>{s.name}</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-ink-400">Not seeded yet</p>
                        )}
                      </div>
                    ))}
                    {!levelTopics.length && <p className="text-xs text-ink-400">Coming later</p>}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
