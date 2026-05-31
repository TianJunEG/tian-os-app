import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Map as MapIcon, ChevronRight, GraduationCap, Compass, ClipboardCheck } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, StatusBadge, ProgressBar, StatTile, PageHeader, Spinner, EmptyState } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import {
  getUniversalSkillByFrameworkId,
  getVisibleSkillsForStudentLevel,
} from '../../../mathpath/curriculum';
import {
  buildMathPathDomainProgressState,
  getMathPathDomainProgressState,
  setMathPathDomainProgressState,
} from '../../../mathpath/state/mathPathDomainProgressState';

// MathPath home — current standing + the single recommended next action, then
// the topic map. "One bright thing in the room": Start recommended practice.
export default function MathPathHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?._id || user?.id || user?.email || 'demo-student';
  const [mastery, setMastery] = useState(null);
  const [topics, setTopics] = useState([]);
  const [domainProgress, setDomainProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startingWarmup, setStartingWarmup] = useState(false);
  const [startingDiagnostic, setStartingDiagnostic] = useState(false);
  const [error, setError] = useState(null);
  const [latestPlacement, setLatestPlacement] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillPreview, setSkillPreview] = useState(null);
  const [skillPreviewLoading, setSkillPreviewLoading] = useState(false);
  const [skillPreviewError, setSkillPreviewError] = useState('');
  const selectedSkillId = selectedSkill?.skillId || '';
  const curriculumCountry = 'SG';
  const curriculumId = 'MOE_PRIMARY_MATH_2021';

  const isFrameworkSkillId = (value) => /^F\d{3}$/i.test(String(value || ''));
  const canonicalSkillName = (skillId, fallback = '') => {
    if (!isFrameworkSkillId(skillId)) return fallback || String(skillId || '');
    return getUniversalSkillByFrameworkId(String(skillId).toUpperCase())?.title || fallback || String(skillId).toUpperCase();
  };

  useEffect(() => {
    (async () => {
      try {
        const [masteryRes, mapRes, latestRes, mistakesRes] = await Promise.allSettled([
          mathpathAPI.mastery(),
          mathpathAPI.map(),
          mathpathAPI.getLatestDiagnostic(),
          mathpathAPI.mistakes({ status: 'all' }),
        ]);

        if (masteryRes.status !== 'fulfilled' || mapRes.status !== 'fulfilled' || latestRes.status !== 'fulfilled') {
          throw new Error('Could not load MathPath.');
        }

        const masteryData = masteryRes.value?.data || {};
        const mapData = mapRes.value?.data || {};
        const latestData = latestRes.value?.data || {};
        const mistakesData = mistakesRes.status === 'fulfilled' ? mistakesRes.value?.data || {} : {};
        const existingState = getMathPathDomainProgressState(studentId, 'fractions') || {};
        const derivedState = buildMathPathDomainProgressState({
          studentId,
          domainId: 'fractions',
          latestDiagnostic: latestData,
          masteryPayload: masteryData,
          mistakesPayload: mistakesData,
          topicMapPayload: mapData,
          existingState,
        });

        setMastery(masteryData);
        setTopics(mapData.topics || []);
        setLatestPlacement(latestData || null);
        setDomainProgress(derivedState);
        setMathPathDomainProgressState(studentId, 'fractions', derivedState);
      } catch (e) {
        setError(e.response?.data?.error || 'Could not load MathPath.');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const startLearningSession = async ({ skillId, sessionType = 'practice', questionCount = 10, feature = null } = {}) => {
    if (!skillId || starting || startingWarmup) return;
    const warmup = sessionType === 'warmup';
    if (warmup) setStartingWarmup(true);
    else setStarting(true);
    try {
      const isFrameworkSkillId = /^F\d{3}$/i.test(String(skillId || ''));
      if (isFrameworkSkillId) {
        navigate('/student/mathpath/practice/recommended-pathway', {
          state: {
            skillId: String(skillId).toUpperCase(),
            questionCount,
            sessionType,
            source: 'mathpath-home',
          },
        });
        return;
      }

      const payload = {
        skillId,
        questionCount,
        mode: sessionType === 'warmup' ? 'warmup' : 'independent',
        feature: feature || (sessionType === 'warmup' ? 'Quick Warm-up' : sessionType === 'remediation' ? 'Remediation Practice' : 'MathPath Practice'),
      };
      const { data } = await mathpathAPI.startSession(payload);
      navigate(`/student/mathpath/practice/${data.session_id}`, {
        state: {
          items: data.items,
          sessionType,
          source: 'mathpath-home',
          backTo: '/student/mathpath',
          homeBase: '/student/mathpath',
        },
      });
    } catch (e) {
      setError(e.response?.data?.error || `Could not start ${sessionType} session.`);
    } finally {
      if (warmup) setStartingWarmup(false);
      else setStarting(false);
    }
  };

  const startDiagnostic = async (diagnosticPurpose = 'baseline') => {
    if (startingDiagnostic) return;
    setStartingDiagnostic(true);
    navigate('/student/mathpath/diagnostic', {
      state: {
        diagnosticPurpose,
        source: 'mathpath-home',
      },
    });
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

  const previewFlagOn = import.meta.env.VITE_ENABLE_MATHPATH_FULL_PREVIEW === '1'
    || import.meta.env.VITE_ENABLE_MATHPATH_FULL_PREVIEW === 'true';
  const isPreviewMode = previewFlagOn && (import.meta.env.DEV || user?.role === 'admin');
  const records = mastery?.records || [];
  const mastered = records.filter((r) => r.status === 'mastered');
  const learning = records.filter((r) => r.status === 'learning');
  const recommended = mastery?.recommended;
  const weak = mastery?.weakSkills || [];
  const placementResult = latestPlacement?.result || {};
  const placementCurrentSkillId = placementResult?.recommendedStartingSkill?.skillId
    || placementResult?.recommendedStartingSkillId
    || placementResult?.nextPracticePayload?.skillId
    || null;
  const placementMasteredSet = new Set((placementResult?.masteredSkills || []).map((row) => row?.skillId).filter(Boolean));
  const placementWeakSet = new Set((placementResult?.weakSkills || []).map((row) => row?.skillId).filter(Boolean));
  const currentFrameworkSkillId = isFrameworkSkillId(domainProgress?.currentSkillId)
    ? String(domainProgress.currentSkillId).toUpperCase()
    : (isFrameworkSkillId(placementCurrentSkillId) ? String(placementCurrentSkillId).toUpperCase() : null);
  const hasPlacement = Boolean(
    domainProgress?.diagnosticCompleted
      || (latestPlacement?.hasPlacement && latestPlacement?.result?.recommendedStartingSkill?.skillId)
  );
  const placementSkill = latestPlacement?.result?.recommendedStartingSkill || null;
  const visibleTopics = topics;
  const studentLevel = user?.studentLevel || user?.moeLevel || user?.profile?.studentLevel || '';
  const isEarlyLevel = ['P1', 'P2'].includes(String(studentLevel).toUpperCase());
  const quickWarmupSkillId = domainProgress?.weakSkills?.[0]?.skillId || recommended?.skillId || placementSkill?.skillId || null;
  const unitCompleted = Boolean(domainProgress?.unitCompleted);
  const masteryCheckCompleted = Boolean(domainProgress?.masteryCheckCompleted);
  const showMasteryCheck = hasPlacement && unitCompleted && !masteryCheckCompleted;
  const showWarmup = hasPlacement && !showMasteryCheck && Boolean(quickWarmupSkillId) && (domainProgress?.weakSkills?.length || 0) > 0;
  const welcomeTitle = hasPlacement ? 'Welcome back' : 'Let’s find your starting point';
  const continueSkillId = currentFrameworkSkillId || recommended?.skillId || placementSkill?.skillId || domainProgress?.currentSkillId || null;
  const effectiveStudentLevel = studentLevel || latestPlacement?.studentLevel || domainProgress?.studentLevel || 'P4';
  const visiblePathwaySkills = getVisibleSkillsForStudentLevel({
    country: curriculumCountry,
    curriculum: curriculumId,
    domain: 'fractions',
    studentLevel: effectiveStudentLevel,
    weakSkillIds: [...placementWeakSet],
    currentSkillId: currentFrameworkSkillId || placementCurrentSkillId || null,
  });
  const visiblePathwaySkillIds = new Set(visiblePathwaySkills.map((row) => row.frameworkSkillId).filter(Boolean));
  const pathwayRows = visiblePathwaySkills.map((row) => {
    const skillId = row.frameworkSkillId;
    const placementStatus = placementResult?.skillMasteryStatus?.[skillId];
    const lower = String(placementStatus || '').toLowerCase();
    const completed = placementMasteredSet.has(skillId) || ['mastered', 'accurate', 'fluent', 'retained'].includes(lower);
    const current = skillId === currentFrameworkSkillId;
    const weakSkill = placementWeakSet.has(skillId) || ['not-secure', 'developing', 'needsreview', 'weak'].includes(lower);
    const prereqs = Array.isArray(row.prerequisites) ? row.prerequisites : [];
    const locked = !current && !completed && prereqs.some((pre) => !placementMasteredSet.has(pre) && !visiblePathwaySkillIds.has(pre));
    return {
      ...row,
      skillId,
      displayName: row.title || canonicalSkillName(skillId, row.title || skillId),
      completed,
      current,
      weakSkill,
      locked,
    };
  });
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
      <PageHeader title="MathPath" subtitle="A personalised learning journey, one step at a time." />
      <Card className="mb-6 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Learning Modes v2</p>
        <p className="mt-1 text-sm text-ink-600">{welcomeTitle}. Keep building your fractions mastery.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-hairline p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-700"><GraduationCap className="h-4 w-4" /> Continue Learning</p>
            <p className="mt-1 text-xs text-ink-500">Diagnostic once, then continue from your existing pathway.</p>
            <Button className="mt-3 w-full" icon={ArrowRight} disabled={!hasPlacement && startingDiagnostic} onClick={() => {
              if (!hasPlacement) return startDiagnostic('baseline');
              if (showMasteryCheck) return navigate('/student/mathpath/assessment', { state: { assessmentType: 'mastery' } });
              if (continueSkillId) return startLearningSession({ skillId: continueSkillId, sessionType: 'practice', questionCount: 10 });
            }}>
              {!hasPlacement ? 'Start Fractions Check-In' : showMasteryCheck ? 'Start Mastery Check' : 'Continue Learning'}
            </Button>
          </div>
          <div className="rounded-xl border border-hairline p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-700"><Compass className="h-4 w-4" /> Explore Skills</p>
            <p className="mt-1 text-xs text-ink-500">Browse any fractions skill and check readiness.</p>
            <Button to="/student/mathpath/path" variant="secondary" className="mt-3 w-full">Explore Skills</Button>
          </div>
          <div className="rounded-xl border border-hairline p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-700"><ClipboardCheck className="h-4 w-4" /> Test Mode</p>
            <p className="mt-1 text-xs text-ink-500">Run quick checks, topic tests, and timed practice.</p>
            <Button to="/student/mathpath/assessment" variant="secondary" className="mt-3 w-full" disabled={!hasPlacement}>Open Test Mode</Button>
          </div>
        </div>
      </Card>
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
        {!hasPlacement ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">Fractions Check-In</h2>
              <p className="mt-1 text-sm text-ink-600">A short low-pressure check-in (8–12 questions) helps us find your best starting point.</p>
            </div>
            <Button size="l" icon={ArrowRight} disabled={startingDiagnostic} onClick={() => startDiagnostic('baseline')} className="shrink-0">
              {startingDiagnostic ? 'Starting…' : 'Start Fractions Check-In'}
            </Button>
          </div>
        ) : showMasteryCheck ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">Fractions Mastery Check</h2>
              <p className="mt-1 text-sm text-ink-600">You’ve completed this unit’s pathway. Let’s confirm readiness and spot any final gaps.</p>
            </div>
            <Button size="l" icon={ArrowRight} onClick={() => navigate('/student/mathpath/assessment', { state: { assessmentType: 'mastery' } })} className="shrink-0">
              Start Mastery Check
            </Button>
          </div>
        ) : recommended ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">Up next: {canonicalSkillName(recommended.skillId, recommended.skillName)}</h2>
              <p className="mt-1 text-sm text-ink-500">{recommended.topicName} · <StatusBadge status={recommended.masteryState || recommended.status} /></p>
              {recommended.reason && <p className="mt-1 text-sm text-ink-600">{recommended.reason}</p>}
            </div>
            <Button size="l" icon={ArrowRight} disabled={starting} onClick={() => startLearningSession({ skillId: recommended.skillId, sessionType: 'practice', questionCount: 10 })} className="shrink-0">
              {starting ? 'Starting…' : 'Continue Learning'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">Up next: {canonicalSkillName(placementSkill?.skillId, placementSkill?.name) || 'Recommended Fractions Skill'}</h2>
              <p className="mt-1 text-sm text-ink-600">Start recommended practice from your saved diagnostic placement.</p>
            </div>
            <Button size="l" icon={ArrowRight} disabled={starting || !placementSkill?.skillId} onClick={() => startLearningSession({ skillId: placementSkill?.skillId, sessionType: 'practice', questionCount: 10 })} className="shrink-0">
              {starting ? 'Starting…' : 'Continue Learning'}
            </Button>
          </div>
        )}
        {showWarmup && (
          <div className="mt-4 rounded-xl border border-navy-200 bg-navy-50 p-4">
            <p className="text-sm font-semibold text-navy-800">Quick warm-up recommended</p>
            <p className="mt-1 text-sm text-ink-600">Try 2–3 retrieval questions before your main practice.</p>
            <Button
              className="mt-3"
              variant="secondary"
              disabled={startingWarmup}
              onClick={() => startLearningSession({
                skillId: quickWarmupSkillId,
                sessionType: 'warmup',
                questionCount: 3,
                feature: 'Quick Warm-up',
              })}
            >
              {startingWarmup ? 'Starting warm-up…' : 'Start Quick Warm-up'}
            </Button>
          </div>
        )}
        {hasPlacement && domainProgress?.needsRecheck && (
          <div className="mt-4 rounded-xl border border-gold-300 bg-gold-100 p-4">
            <p className="text-sm font-semibold text-gold-900">Re-check suggested</p>
            <p className="mt-1 text-sm text-gold-900">You’ve had a long break or repeated struggles. A short check-in can refresh your placement.</p>
            <Button className="mt-3" variant="secondary" onClick={() => startDiagnostic('recheck')}>
              Run Check-In Again
            </Button>
          </div>
        )}
        {!isEarlyLevel && hasPlacement && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="m" to="/student/mathpath/path">Explore Skills</Button>
            <Button variant="secondary" size="m" to="/student/mathpath/assessment">Open Test Mode</Button>
            <Button variant="secondary" size="m" onClick={() => startDiagnostic('recheck')} disabled={startingDiagnostic}>
              Run Check-In Again
            </Button>
          </div>
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
              <p className="text-sm text-ink-500">{canonicalSkillName(weak[0].skillId, weak[0].skillName)} in {weak[0].topicName} could use practice.</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Visible Fractions Pathway</h3>
          <span className="text-xs text-ink-400">{curriculumCountry} · MOE Primary Math 2021 · {effectiveStudentLevel}</span>
        </div>
        {pathwayRows.length ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {pathwayRows.map((row) => {
              const tone = row.current ? 'navy' : row.completed ? 'success' : row.weakSkill ? 'error' : row.locked ? 'neutral' : 'gold';
              return (
                <div key={row.skillId} className={`rounded-lg border px-3 py-2 ${row.current ? 'border-navy-400 bg-navy-50' : 'border-hairline bg-white'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-ink-700">{row.displayName}</p>
                    <Badge tone={tone}>{row.skillId}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    Introduced {row.introducedLevel || '-'} · Mastery {row.masteryLevel || '-'}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-500">No visible curriculum skills found for this level yet.</p>
        )}
      </Card>

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
