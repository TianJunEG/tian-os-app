import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Camera, ChevronRight, ChevronDown, GraduationCap, Compass, ClipboardCheck, Layers, PencilLine, Wand2, Zap, Hash } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, StatusBadge, ProgressBar, StatTile, Spinner, EmptyState } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import {
  normalizeCurriculum,
  getUniversalSkillByFrameworkId,
  getVisibleSkillsForStudentLevel,
  getPrerequisiteSkills,
  getRemediationSkillsForWeakPrerequisites,
} from '../../../mathpath/curriculum';
import FEATURE_FLAGS, { isFractionsStoryModeEnabled } from '../../../config/featureFlags';
import { fractionSkillGraph } from '../../../mathpath/fractions/fractionSkillGraph';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../../design-os/studentVisualMode';
import {
  buildMathPathDomainProgressState,
  getMathPathDomainProgressState,
  setMathPathDomainProgressState,
} from '../../../mathpath/state/mathPathDomainProgressState';
import {
  ASSESSMENT_LOCK_MESSAGE,
  getFractionAssessmentBlueprintReadiness,
} from '../../../mathpath/fractions/fractionAssessmentReadinessGate';

// MathPath home — current standing + the single recommended next action, then
// the topic map. "One bright thing in the room": Start recommended practice.
export default function MathPathHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const visualMode = resolveStudentVisualMode(user || {});
  const visualStyles = getVisualModeStyles(visualMode);
  const studentId = user?._id || user?.id || user?.email || '';
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
  const totalFractionsSkills = fractionSkillGraph.skillIds?.length || 26;
  const courseMasteredCount = Math.min(mastered.length, totalFractionsSkills);
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
  const placementSkill = latestPlacement?.result?.recommendedStartingSkill || null;
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
  const welcomeTitle = hasPlacement ? 'Welcome back' : 'Let’s find your starting point';
  const continueSkillId = currentFrameworkSkillId
    || normalizeFrameworkSkillId(recommended?.skillId)
    || placementFrameworkSkillId
    || null;
  const practiceFallbackSkillId = continueSkillId || 'F001';
  const storyModeEnabled = isFractionsStoryModeEnabled();
  const roles = new Set([user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean));
  const canTrainQuestionPatterns = ['admin', 'teacher', 'tutor'].some((role) => roles.has(role));
  const storySkillId = (['F026', 'F025'].find((id) => placementWeakSet.has(id)) || continueSkillId || 'F025');
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
  const modePreviewRows = pathwayRows.slice(0, 4).map((row) => {
    const label = row.current
      ? 'Recommended'
      : row.completed || currentPrereqSet.has(row.skillId)
        ? 'Ready'
        : remediationPrereqSet.has(row.skillId)
          ? 'Not Recommended Yet'
          : 'Challenge';
    return { ...row, readinessLabel: label };
  });
  const modePreviewLabels = [...new Set(modePreviewRows.map((row) => row.readinessLabel).filter(Boolean))].slice(0, 3);
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

  return (
    <>
      <div className={`${visualStyles.page} space-y-6`}>
      <div>
        <p className={`text-sm font-semibold ${visualStyles.accent}`}>{welcomeTitle}</p>
        <h1 className="font-display text-3xl font-semibold text-ink-900">Learning Paths</h1>
      </div>

      <Card className={`p-4 sm:p-5 ${visualStyles.heroCard}`}>
        <div className="grid gap-5 md:grid-cols-[20rem_1fr] md:items-center">
          <div className={`relative h-44 overflow-hidden rounded-2xl ${visualStyles.heroPanel}`}>
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/45" />
            <div className="absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-white/35" />
            <span className="absolute left-6 top-6 grid h-16 w-16 place-items-center rounded-2xl bg-paper/85 shadow-resting">
              <GraduationCap className="h-8 w-8" />
            </span>
            <span className="absolute bottom-4 right-6 font-mono text-7xl font-semibold opacity-25">=</span>
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold uppercase ${visualStyles.accent}`}>Math Mastery</p>
            <h2 className="mt-1 font-display text-4xl font-semibold text-ink-900">Fractions</h2>
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
      </Card>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink-900">Explore Learning Modes</h2>
          <Button to="/student/mathpath/path" variant="secondary" size="s">View All</Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className={`flex h-full flex-col p-4 ${visualStyles.accentCard}`}>
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${visualStyles.icon}`}><GraduationCap className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">Continue Learning</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">Follow your recommended pathway.</p>
            <Button
              variant="primary"
              className={`mt-4 w-full ${visualStyles.primaryCta}`}
              disabled={!hasPlacement && startingDiagnostic}
              onClick={() => {
                if (!hasPlacement) return startDiagnostic('baseline');
                return startLearningSession({ skillId: practiceFallbackSkillId, sessionType: 'practice', questionCount: 10 });
              }}
            >
              Continue
            </Button>
          </Card>
          <Card className="flex h-full flex-col border-gold-100 bg-gradient-to-br from-gold-50 via-white to-orange-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-100 text-gold-700"><Hash className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">P1 Mathematics</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">58 skills across 7 domains — Singapore MOE P1 syllabus.</p>
            <Button to="/student/mathpath/p1" variant="secondary" className="mt-4 w-full border-gold-200 bg-white/80 text-gold-700 hover:bg-gold-50">
              Explore P1
            </Button>
          </Card>
          <Card className="flex h-full flex-col border-sky-100 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-navy-700"><Layers className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">P3 Mathematics</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">24 skills across 8 domains — Singapore MOE P3 syllabus.</p>
            <Button to="/student/mathpath/p3" variant="secondary" className="mt-4 w-full border-sky-200 bg-white/80 text-navy-700 hover:bg-sky-50">
              Explore P3
            </Button>
          </Card>
          <Card className="flex h-full flex-col border-mint-100 bg-gradient-to-br from-mint-50 via-white to-sky-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint-100 text-success-700"><Compass className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">Explore Skills</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">Browse readiness across fractions.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {modePreviewLabels.length ? modePreviewLabels.map((label) => (
                <Badge
                  key={`preview-${label}`}
                  tone={label === 'Recommended' ? 'navy' : label === 'Ready' ? 'success' : label === 'Challenge' ? 'gold' : 'neutral'}
                >
                  {label}
                </Badge>
              )) : <Badge tone="neutral">Ready</Badge>}
            </div>
            <Button to="/student/mathpath/path" variant="secondary" className="mt-4 w-full border-mint-200 bg-white/80 text-success-700 hover:bg-mint-50">Explore</Button>
          </Card>
          {assessmentPilotEnabled && <Card className="flex h-full flex-col border-gold-100 bg-gradient-to-br from-gold-50 via-white to-yellow-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-100 text-gold-700"><ClipboardCheck className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">Test Mode</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">Quick checks and topic tests.</p>
            <Button
              to={masteryCheckAvailable ? '/student/mathpath/assessment' : undefined}
              variant="secondary"
              className="mt-4 w-full"
              disabled={!hasPlacement || !masteryCheckAvailable}
              state={masteryCheckAvailable ? { mode: 'test', options: ['Quick Check', 'Topic Test', 'Mini Paper'] } : undefined}
            >
              {masteryCheckAvailable ? 'Open Test Mode' : 'Coming Soon'}
            </Button>
            {!masteryCheckAvailable && <p className="mt-2 text-xs font-semibold text-ink-500">{ASSESSMENT_LOCK_MESSAGE}</p>}
          </Card>}
          {FEATURE_FLAGS.modelTrainer && <Card className="flex h-full flex-col border-sky-100 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-navy-700"><PencilLine className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">Model Drawing</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">Learn bar models for fraction word problems.</p>
            <Button to="/student/mathpath/fractions/model-trainer" variant="secondary" className="mt-4 w-full">
              Open Trainer
            </Button>
          </Card>}
          {FEATURE_FLAGS.modelTrainer && canTrainQuestionPatterns && (
            <Card className="flex h-full flex-col border-violet-100 bg-gradient-to-br from-violet-50 via-white to-gold-50 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Wand2 className="h-6 w-6" /></span>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">Similar Questions</h3>
              <p className="mt-1 flex-1 text-sm text-ink-500">Generate reusable practice sets from sample questions.</p>
              <Button to="/student/mathpath/fractions/model-trainer#similar-question-generator" variant="secondary" className="mt-4 w-full">
                Open Generator
              </Button>
            </Card>
          )}
          {FEATURE_FLAGS.fluency && (
            <Card className="flex h-full flex-col border-teal-100 bg-gradient-to-br from-teal-50 via-white to-sky-50 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-100 text-teal-700"><Zap className="h-6 w-6" /></span>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">Speed &amp; Accuracy</h3>
              <p className="mt-1 flex-1 text-sm text-ink-500">Build times-table fluency with flash quizzes.</p>
              <Button to="/student/mathpath/fluency/times-tables" variant="secondary" className="mt-4 w-full border-teal-200 bg-white/80 text-teal-700 hover:bg-teal-50">
                Practise Now
              </Button>
            </Card>
          )}
          <Card className="flex h-full flex-col border-pink-100 bg-gradient-to-br from-pink-50 via-white to-orange-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-100 text-pink-700"><Camera className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">Upload Test Paper</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">Snap a photo of your marked test and get targeted practice.</p>
            <Button to="/student/mathpath/upload-paper" variant="secondary" className="mt-4 w-full border-pink-200 bg-white/80 text-pink-700 hover:bg-pink-50">
              Upload Paper
            </Button>
          </Card>
        </div>
      </section>
      {isPreviewMode && (
        <Card className="mb-6 border-l-4 border-l-gold-500 p-4">
          <p className="text-sm font-semibold text-gold-800">Curriculum Preview — not visible to beta users</p>
          <p className="mt-1 text-xs text-ink-500">Development/admin-only full map view.</p>
          <p className="mt-1 text-xs text-ink-500">Grouped by skill level for curriculum review. Production roadmap may group by topic.</p>
        </Card>
      )}

      {/* Recommended next action */}
      <Card className={`p-5 ${visualStyles.accentCard}`}>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700">Recommended next</div>
        {!hasPlacement ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">Fractions Check-In</h2>
              <p className="mt-1 text-sm text-ink-600">A short low-pressure check-in (8–12 questions) helps us find your best starting point.</p>
            </div>
            <Button size="l" icon={ArrowRight} disabled={startingDiagnostic} onClick={() => startDiagnostic('baseline')} className={`shrink-0 ${visualStyles.primaryCta}`}>
              {startingDiagnostic ? 'Starting…' : 'Start Fractions Check-In'}
            </Button>
          </div>
        ) : assessmentPilotEnabled && showMasteryCheck ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">Fractions Mastery Check</h2>
              <p className="mt-1 text-sm text-ink-600">You’ve completed this unit’s pathway. Let’s confirm readiness and spot any final gaps.</p>
            </div>
            <Button size="l" icon={ArrowRight} onClick={() => navigate('/student/mathpath/assessment', { state: { assessmentType: 'mastery' } })} className={`shrink-0 ${visualStyles.primaryCta}`}>
              Start Mastery Check
            </Button>
          </div>
        ) : assessmentPilotEnabled && showLockedMasteryCheck ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">Fractions Mastery Check</h2>
              <p className="mt-1 text-sm text-ink-600">{ASSESSMENT_LOCK_MESSAGE}</p>
            </div>
            <Button size="l" icon={ArrowRight} disabled className="shrink-0">
              Locked
            </Button>
          </div>
        ) : recommended ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">Up next: {canonicalSkillName(recommended.skillId, recommended.skillName)}</h2>
              <p className="mt-1 text-sm text-ink-500">{recommended.topicName} · <StatusBadge status={recommended.masteryState || recommended.status} /></p>
              {recommended.reason && <p className="mt-1 text-sm text-ink-600">{recommended.reason}</p>}
            </div>
            <Button size="l" icon={ArrowRight} disabled={starting} onClick={() => startLearningSession({ skillId: recommended.skillId, sessionType: 'practice', questionCount: 10 })} className={`shrink-0 ${visualStyles.primaryCta}`}>
              {starting ? 'Starting…' : 'Continue Learning'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">Up next: {canonicalSkillName(placementSkill?.skillId, placementSkill?.name) || 'Recommended Fractions Skill'}</h2>
              <p className="mt-1 text-sm text-ink-600">Start recommended practice from your saved diagnostic placement.</p>
            </div>
            <Button size="l" icon={ArrowRight} disabled={starting || !practiceFallbackSkillId} onClick={() => startLearningSession({ skillId: practiceFallbackSkillId, sessionType: 'practice', questionCount: 10 })} className={`shrink-0 ${visualStyles.primaryCta}`}>
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
            <Button variant="secondary" size="m" to="/student/mathpath/assignments">Recovery Packs</Button>
            <Button variant="secondary" size="m" to="/student/mathpath/path">Explore Skills</Button>
            {assessmentPilotEnabled && (
              <Button variant="secondary" size="m" to={masteryCheckAvailable ? '/student/mathpath/assessment' : undefined} disabled={!masteryCheckAvailable}>
                {masteryCheckAvailable ? 'Open Test Mode' : 'Mastery Check Locked'}
              </Button>
            )}
            {storyModeEnabled && (
              <Button
                variant="secondary"
                size="m"
                onClick={() => {
                  const targetSkillId = /^F0(25|26)$/i.test(String(storySkillId || '')) ? String(storySkillId).toUpperCase() : 'F025';
                  navigate(`/student/mathpath/fractions/story/${targetSkillId}`);
                }}
              >
                Try a Story Problem
              </Button>
            )}
            <Button variant="secondary" size="m" onClick={() => startDiagnostic('recheck')} disabled={startingDiagnostic}>
              Run Check-In Again
            </Button>
          </div>
        )}
      </Card>

      {/* Standing */}
      <Card className={`p-5 ${visualStyles.accentCard}`}>
        <div className="mb-4 flex items-center gap-6">
          <StatTile label="Mastered" value={mastered.length} />
          <StatTile label="Learning" value={learning.length} />
          <StatTile label="To review" value={weak.filter((w) => w.status === 'needs_review').length} />
        </div>
        <ProgressBar value={courseMasteredCount} max={totalFractionsSkills} barClassName={visualStyles.progress} />
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
          <span className="text-xs text-ink-400">{curriculumCountry} · {curriculumLabel} · {effectiveStudentLevel}</span>
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
                  <p className="mt-1 text-[11px] text-ink-400">
                    {row.strand || 'Number and Algebra'} {row.syllabusRef ? `· ${row.syllabusRef}` : ''}
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
        <button
          type="button"
          onClick={() => setShowTopicMapSection((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-xs font-semibold text-ink-500 transition hover:bg-navy-50"
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
      {isPreviewMode && (
        <>
          <div className="mt-8 mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Levels and skills</h3>
            <button
              type="button"
              onClick={() => setShowLevelsSkillsSection((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-xs font-semibold text-ink-500 transition hover:bg-navy-50"
            >
              <span>{showLevelsSkillsSection ? 'Hide details' : `Show all (${previewLevels.length} levels · ${previewSkillCount} skills)`}</span>
              {showLevelsSkillsSection ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
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
                      {skillPreviewError ? 'Question preview unavailable.' : 'Practice is not available for this skill yet.'}
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
