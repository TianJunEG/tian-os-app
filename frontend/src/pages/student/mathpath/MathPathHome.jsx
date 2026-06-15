import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Camera, ChevronRight, ChevronDown, GraduationCap, Layers, Zap } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, ProgressBar, Spinner, EmptyState } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import {
  normalizeCurriculum,
  getUniversalSkillByFrameworkId,
  getVisibleSkillsForStudentLevel,
  getPrerequisiteSkills,
  getRemediationSkillsForWeakPrerequisites,
} from '../../../mathpath/curriculum';
import FEATURE_FLAGS from '../../../config/featureFlags';
import MathPathDomainGrid from './components/MathPathDomainGrid';
import { fractionSkillGraph } from '../../../mathpath/fractions/fractionSkillGraph';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../../design-os/studentVisualMode';
import { MascotGreeting } from '../../../components/MascotAvatar';
import {
  buildMathPathDomainProgressState,
  getMathPathDomainProgressState,
  setMathPathDomainProgressState,
} from '../../../mathpath/state/mathPathDomainProgressState';
import {
  ASSESSMENT_LOCK_MESSAGE,
  getFractionAssessmentBlueprintReadiness,
} from '../../../mathpath/fractions/fractionAssessmentReadinessGate';

export default function MathPathHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const visualMode = resolveStudentVisualMode(user || {});
  const visualStyles = getVisualModeStyles(visualMode);
  const studentId = user?._id || user?.id || user?.email || '';
  const [mastery, setMastery] = useState(null);
  const [skillGraph, setSkillGraph] = useState(null);
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
  const [showTopicMapSection, setShowTopicMapSection] = useState(false);
  const [showLevelsSkillsSection, setShowLevelsSkillsSection] = useState(false);
  const selectedSkillId = selectedSkill?.skillId || '';
  const curriculumCountry = 'SG';

  const isFrameworkSkillId = (value) => /^F\d{3}$/i.test(String(value || ''));
  const normalizeFrameworkSkillId = (value) => (
    isFrameworkSkillId(value) ? String(value).toUpperCase() : null
  );
  const canonicalSkillName = (skillId, fallback = '') => {
    if (!isFrameworkSkillId(skillId)) return fallback || String(skillId || '');
    return getUniversalSkillByFrameworkId(String(skillId).toUpperCase())?.title || fallback || String(skillId).toUpperCase();
  };

  useEffect(() => {
    (async () => {
      try {
        const [masteryRes, mapRes, latestRes, mistakesRes, graphRes] = await Promise.allSettled([
          mathpathAPI.mastery(),
          mathpathAPI.map(),
          mathpathAPI.getLatestDiagnostic(),
          mathpathAPI.mistakes({ status: 'all' }),
          mathpathAPI.graph(),
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
        if (graphRes.status === 'fulfilled') setSkillGraph(graphRes.value?.data || null);
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
      const mistakesHandled = true;
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
  const totalFractionsSkills = fractionSkillGraph.skillIds?.length || 26;
  const graphMastered = skillGraph?.summary?.mastered ?? null;
  const courseMasteredCount = Math.min(graphMastered !== null ? Math.max(mastered.length, graphMastered) : mastered.length, totalFractionsSkills);
  const courseProgressPct = totalFractionsSkills
    ? Math.round((courseMasteredCount / totalFractionsSkills) * 100)
    : 0;
  const recommended = isFrameworkSkillId(mastery?.recommended?.skillId) ? mastery.recommended : null;
  const weak = mastery?.weakSkills || [];
  const placementResult = latestPlacement?.result || {};
  const placementCurrentSkillId = placementResult?.recommendedStartingSkill?.skillId
    || placementResult?.recommendedStartingSkillId
    || placementResult?.nextPracticePayload?.skillId
    || null;
  const placementMasteredSet = new Set((placementResult?.masteredSkills || []).map((row) => row?.skillId).filter(Boolean));
  const placementWeakSet = new Set((placementResult?.weakSkills || []).map((row) => row?.skillId).filter(Boolean));
  const placementFrameworkSkillId = normalizeFrameworkSkillId(placementCurrentSkillId);
  const currentFrameworkSkillId = normalizeFrameworkSkillId(domainProgress?.currentSkillId) || placementFrameworkSkillId;
  const hasPlacement = Boolean(
    domainProgress?.diagnosticCompleted
      || (latestPlacement?.hasPlacement && latestPlacement?.result?.recommendedStartingSkill?.skillId)
  );
  const visibleTopics = topics;
  const studentLevel = user?.studentLevel || user?.moeLevel || user?.profile?.studentLevel || '';
  const studentStream = user?.stream || user?.profile?.stream || '';
  const normalizedLevel = String(studentLevel || '').toUpperCase();
  const curriculumId = normalizeCurriculum(
    normalizedLevel.startsWith('S') && String(studentStream || '').toUpperCase() === 'G1'
      ? 'MOE_SECONDARY_G1_MATH_2021'
      : '',
    studentLevel
  );
  const curriculumLabel = curriculumId === 'MOE_SECONDARY_G1_MATH_2021'
    ? 'Sec 1 G1 · Number and Algebra'
    : 'Primary · Number and Algebra';
  const isEarlyLevel = ['P1', 'P2'].includes(String(studentLevel).toUpperCase());
  const quickWarmupSkillId = normalizeFrameworkSkillId(domainProgress?.weakSkills?.[0]?.skillId)
    || normalizeFrameworkSkillId(recommended?.skillId)
    || placementFrameworkSkillId
    || null;
  const unitCompleted = Boolean(domainProgress?.unitCompleted);
  const masteryCheckCompleted = Boolean(domainProgress?.masteryCheckCompleted);
  const masteredSkillIdsForGate = [
    ...mastered.map((row) => row?.skillId).filter(Boolean),
    ...Array.from(placementMasteredSet),
    ...(domainProgress?.masteredSkillIds || []),
  ];
  const assessmentGate = getFractionAssessmentBlueprintReadiness({
    completedSkillIds: masteredSkillIdsForGate,
    level: studentLevel || 'P5',
  });
  const assessmentPilotEnabled = FEATURE_FLAGS.assessments;
  const masteryCheckAvailable = assessmentPilotEnabled && assessmentGate.ready;
  const showMasteryCheck = assessmentPilotEnabled && hasPlacement && unitCompleted && !masteryCheckCompleted && masteryCheckAvailable;
  const showLockedMasteryCheck = assessmentPilotEnabled && hasPlacement && unitCompleted && !masteryCheckCompleted && !masteryCheckAvailable;
  const showWarmup = hasPlacement && !showMasteryCheck && Boolean(quickWarmupSkillId) && (domainProgress?.weakSkills?.length || 0) > 0;
  const welcomeTitle = hasPlacement ? 'Welcome back' : "Let’s find your starting point";
  const continueSkillId = currentFrameworkSkillId
    || normalizeFrameworkSkillId(recommended?.skillId)
    || placementFrameworkSkillId
    || null;
  const practiceFallbackSkillId = continueSkillId || 'F001';
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
      curriculumLabel,
      completed,
      current,
      weakSkill,
      locked,
    };
  });
  const weakSkillIds = [...placementWeakSet];
  const remediationPrereqSkills = getRemediationSkillsForWeakPrerequisites({
    weakSkillIds,
    country: curriculumCountry,
    curriculum: curriculumId,
  });
  const currentSkillPrereqs = currentFrameworkSkillId
    ? getPrerequisiteSkills(currentFrameworkSkillId, {
        country: curriculumCountry,
        curriculum: curriculumId,
      })
    : [];
  const remediationPrereqSet = new Set(remediationPrereqSkills.map((row) => row.frameworkSkillId).filter(Boolean));
  const currentPrereqSet = new Set(currentSkillPrereqs.map((row) => row.frameworkSkillId).filter(Boolean));
  const previewLevels = [...new Set(
    [
      ...(topics || []).map((t) => t.moeLevel).filter(Boolean),
      ...(topics || []).flatMap((t) => (t.skills || []).map((s) => s.moeLevel)),
    ]
      .filter(Boolean)
  )].sort((a, b) => {
    const na = parseInt(String(a).replace(/\D+/g, ''), 10);
    const nb = parseInt(String(b).replace(/\D+/g, ''), 10);
    if (Number.isNaN(na) || Number.isNaN(nb)) return String(a).localeCompare(String(b));
    return na - nb;
  });
  const topicMapSummaryCount = Math.min(2, visibleTopics.length);
  const previewLevelSummaryCount = Math.min(2, previewLevels.length);
  const previewSkillCount = topics.reduce((total, topic) => total + ((topic.skills || []).length), 0);
  const levelPath = `/student/mathpath/${String(effectiveStudentLevel).toLowerCase()}`;

  return (
    <>
      <div className={`${visualStyles.page} space-y-4 overflow-x-hidden sm:space-y-6`}>
      <div>
        <p className={`text-sm font-semibold ${visualStyles.accent}`}>{welcomeTitle}</p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">MathPath</h1>
        <MascotGreeting mascotKey="kylo" studentName={(user?.name || 'there').split(' ')[0]} className="mt-3" />
      </div>

      {/* Hero — main CTA + progress */}
      <Card className={`p-4 sm:p-5 ${visualStyles.heroCard}`}>
        <div className="grid gap-5 md:grid-cols-[20rem_1fr] md:items-center">
          <div className={`relative h-44 overflow-hidden rounded-2xl ${visualStyles.heroPanel}`}>
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/45" />
            <div className="absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-white/35" />
            <span className="absolute left-6 top-6 grid h-16 w-16 place-items-center rounded-2xl bg-surface-white/85 shadow-rest">
              <GraduationCap className="h-8 w-8" />
            </span>
            <span className="absolute bottom-4 right-6 font-mono text-7xl font-semibold opacity-25">=</span>
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold uppercase ${visualStyles.accent}`}>Math Mastery</p>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-ink-900">Fractions</h2>
            <p className="mt-2 text-sm text-ink-500">
              {recommended
                ? `Up next: ${canonicalSkillName(recommended.skillId, recommended.skillName)}`
                : hasPlacement
                  ? 'Continue from your saved diagnostic placement.'
                  : 'A short check-in finds your best starting point.'}
            </p>
            <Button className={`mt-5 w-full sm:w-auto ${visualStyles.primaryCta}`} size="l" icon={ArrowRight} disabled={(!hasPlacement && startingDiagnostic) || showLockedMasteryCheck} onClick={() => {
              if (!hasPlacement) return startDiagnostic('baseline');
              if (assessmentPilotEnabled && showMasteryCheck) return navigate('/student/mathpath/assessment', { state: { assessmentType: 'mastery' } });
              return startLearningSession({ skillId: practiceFallbackSkillId, sessionType: 'practice', questionCount: 10 });
            }}>
              {!hasPlacement ? 'Start Fractions Check-In' : showMasteryCheck ? 'Start Mastery Check' : showLockedMasteryCheck ? 'Mastery Check Locked' : 'Continue Learning'}
            </Button>
            {showLockedMasteryCheck && <p className="mt-3 text-sm font-semibold text-ink-600">{ASSESSMENT_LOCK_MESSAGE}</p>}
          </div>
        </div>
        <div className="mt-5">
          <ProgressBar value={courseMasteredCount} max={totalFractionsSkills} barClassName={visualStyles.progress} />
          <div className="mt-2 flex items-center justify-between text-sm font-semibold text-ink-500">
            <span>{courseMasteredCount}/{totalFractionsSkills} skills mastered</span>
            <span className={visualStyles.accent}>{courseProgressPct}%</span>
          </div>
        </div>
        {showWarmup && (
          <div className="mt-4 rounded-xl border border-emerald-border bg-emerald-tint p-4">
            <p className="text-sm font-semibold text-emerald-deep">Quick warm-up recommended</p>
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
          <div className="mt-4 rounded-xl border border-gold-border bg-gold-tint p-4">
            <p className="text-sm font-semibold text-gold-deep">Re-check suggested</p>
            <p className="mt-1 text-sm text-gold-deep">You've had a long break or repeated struggles. A short check-in can refresh your placement.</p>
            <Button className="mt-3" variant="secondary" onClick={() => startDiagnostic('recheck')}>
              Run Check-In Again
            </Button>
          </div>
        )}
      </Card>

      {/* Weak topics alert */}
      {weak.length > 0 && (
        <Card className="border-l-4 border-l-error-500 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error-500" />
            <div>
              <p className="text-sm font-semibold text-ink-700">Needs attention</p>
              <p className="text-sm text-ink-500">{canonicalSkillName(weak[0].skillId, weak[0].skillName)} in {weak[0].topicName} could use practice.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Explore by topic — all 15 domains */}
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-ink-900 sm:mb-4 sm:text-2xl">Explore Topics</h2>
        <MathPathDomainGrid />
      </section>

      {/* Quick actions — focused set */}
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-ink-900 sm:mb-4 sm:text-2xl">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <Card className="flex h-full flex-col border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Layers className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">{effectiveStudentLevel} Mathematics</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">Browse your syllabus skills and topics.</p>
            <Button to={levelPath} variant="secondary" className="mt-4 w-full border-emerald-200 bg-white/80 text-emerald-700 hover:bg-emerald-50">
              Explore {effectiveStudentLevel}
            </Button>
          </Card>
          <Card className="flex h-full flex-col border-pink-100 bg-gradient-to-br from-pink-50 via-white to-orange-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-100 text-pink-700"><Camera className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">Upload Test Paper</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">Snap a photo of your marked test and get targeted practice.</p>
            <Button to="/student/mathpath/upload-paper" variant="secondary" className="mt-4 w-full border-pink-200 bg-white/80 text-pink-700 hover:bg-pink-50">
              Upload Paper
            </Button>
          </Card>
          {FEATURE_FLAGS.fluency && (
            <Card className="flex h-full flex-col border-teal-100 bg-gradient-to-br from-teal-50 via-white to-sky-50 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-tint text-emerald-deep"><Zap className="h-6 w-6" /></span>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">Speed &amp; Accuracy</h3>
              <p className="mt-1 flex-1 text-sm text-ink-500">Build times-table fluency with flash quizzes.</p>
              <Button to="/student/mathpath/fluency/times-tables" variant="secondary" className="mt-4 w-full border-teal-200 bg-white/80 text-emerald-deep hover:bg-emerald-tint">
                Practise Now
              </Button>
            </Card>
          )}
          {!isEarlyLevel && hasPlacement && (
            <Card className={`flex h-full flex-col p-4 ${visualStyles.accentCard}`}>
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${visualStyles.icon}`}><GraduationCap className="h-6 w-6" /></span>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">Recovery Packs</h3>
              <p className="mt-1 flex-1 text-sm text-ink-500">Targeted practice for skills that need work.</p>
              <Button to="/student/mathpath/assignments" variant="secondary" className="mt-4 w-full">View Packs</Button>
            </Card>
          )}
        </div>
      </section>

      {/* Topic map — collapsed by default */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Topic map</h3>
          <button
            type="button"
            onClick={() => setShowTopicMapSection((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full border border-line-soft px-2.5 py-1 text-xs font-semibold text-ink-500 transition hover:bg-emerald-tint"
          >
            <span>{showTopicMapSection ? 'Hide details' : `Show all (${visibleTopics.length})`}</span>
            {showTopicMapSection ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(showTopicMapSection ? visibleTopics : visibleTopics.slice(0, topicMapSummaryCount)).map((t) => (
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
        {!showTopicMapSection && visibleTopics.length > topicMapSummaryCount && (
          <p className="mt-2 text-xs text-ink-400">
            Showing {topicMapSummaryCount} of {visibleTopics.length} topics.
          </p>
        )}
      </section>

      {/* Admin preview — hidden from students */}
      {isPreviewMode && (
        <>
          <Card className="border-l-4 border-l-gold p-4">
            <p className="text-sm font-semibold text-gold-deep">Curriculum Preview — not visible to beta users</p>
          </Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Levels and skills</h3>
            <button
              type="button"
              onClick={() => setShowLevelsSkillsSection((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-line-soft px-2.5 py-1 text-xs font-semibold text-ink-500 transition hover:bg-emerald-tint"
            >
              <span>{showLevelsSkillsSection ? 'Hide details' : `Show all (${previewLevels.length} levels · ${previewSkillCount} skills)`}</span>
              {showLevelsSkillsSection ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
          {selectedSkill && (
            <Card className="mb-4 border-l-4 border-l-gold p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gold-deep">Skill detail</p>
                <button type="button" onClick={() => { setSelectedSkill(null); setSkillPreview(null); setSkillPreviewError(''); }} className="text-xs text-ink-500 underline">Close</button>
              </div>
              {skillPreviewLoading ? (
                <Spinner label="Loading skill detail…" />
              ) : (
                <div className="space-y-2 text-sm text-ink-700">
                  <p><span className="font-semibold">Skill:</span> {skillPreview?.skillName || selectedSkill.skillName} ({skillPreview?.skillId || selectedSkill.skillId})</p>
                  <p><span className="font-semibold">Questions:</span> {skillPreview?.availableQuestions ?? 0} · <span className="font-semibold">Startable:</span> {skillPreview?.startable ? 'Yes' : 'No'}</p>
                  <div className="pt-2">
                    <Button size="s" onClick={startPreviewPractice} disabled={!skillPreview?.startable}>Start Practice</Button>
                  </div>
                </div>
              )}
            </Card>
          )}
          <div className="space-y-3">
            {(showLevelsSkillsSection ? previewLevels : previewLevels.slice(0, previewLevelSummaryCount)).map((level) => {
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
                      <div key={t.topicId} className="rounded-lg border border-line-soft p-3">
                        <p className="text-sm font-medium text-ink-700">{t.name}</p>
                        {t.levelSkills?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {t.levelSkills.map((s) => (
                              <button
                                key={s.skillId}
                                type="button"
                                onClick={() => openSkillPreview(s, t.name)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-left text-xs hover:bg-emerald-tint ${selectedSkillId === s.skillId ? 'border-emerald bg-emerald-tint text-emerald-deep' : 'border-line-soft text-ink-600'}`}
                              >
                                <span>{s.name}</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-ink-400">Practice will unlock later.</p>
                        )}
                      </div>
                    ))}
                    {!levelTopics.length && <p className="text-xs text-ink-400">Coming later</p>}
                  </div>
                </Card>
              );
            })}
            {!showLevelsSkillsSection && previewLevels.length > previewLevelSummaryCount && (
              <p className="text-xs text-ink-400">Showing {previewLevelSummaryCount} of {previewLevels.length} levels.</p>
            )}
          </div>
        </>
      )}
      </div>
    </>
  );
}
