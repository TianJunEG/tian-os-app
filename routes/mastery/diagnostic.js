import express from 'express';
import { protect } from '../../middleware/auth.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import Mistake from '../../models/Mistake.js';
import Question from '../../models/Question.js';
import Skill from '../../models/Skill.js';
import { resolveStudent } from '../../utils/studentContext.js';
import { runPlacement } from '../../utils/placementEngine.js';
import { resolveFractionsStartingSkill } from '../../utils/fractionPlacementResolver.js';
import { studentMathPathTimingAnalytics } from '../../utils/analytics.js';
import { isCorrectWithContext } from '../../utils/answerCheck.js';
import {
  answerAdaptiveDiagnostic,
  startAdaptiveDiagnostic,
} from '../../services/diagnostics/diagnosticRuntime.js';
import {
  getDiagnosticGrowth,
  getDiagnosticHistory,
} from '../../services/diagnostics/diagnosticGrowthService.js';
import { classifyFractionMistake } from '../../shared/mathpath/fractions/fractionMistakeToMasteryEngine.js';
import { calculateQuestionTiming } from '../../shared/mathpath/fractions/fractionFluencyRetentionEngine.js';
import { normalizeConfidence, recordLearningEvents } from '../../services/telemetry/learningTelemetryService.js';
import { createLinkId } from '../../services/mathpath/workingLinkageService.js';
import {
  toDateLike,
  normalizeTimeSpentSeconds,
  answerInputTypeFor,
  mapPlacementReadiness,
  parentPlacementSummary,
  buildStudentPlacementReport,
  readinessBandFromLevel,
  loadFractionsSkills,
} from './_helpers.js';

const router = express.Router();

router.post('/placement', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const attempts = Array.isArray(req.body?.attempts) ? req.body.attempts : [];
    const result = await runPlacement(student._id, attempts);
    res.json({ studentId: student._id, ...(result || { masteryProfile: [] }) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Placement failed.' });
  }
});

router.post('/diagnostic/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const payload = await startAdaptiveDiagnostic({
      student,
      userId: req.user.id,
      subjectId: 'math',
      domainId: 'fractions',
      requestedMode: req.body?.requestedMode || req.body?.mode,
      startSkillId: req.body?.startSkillId || '',
      studentLevel: req.body?.studentLevel,
      diagnosticPurpose: req.body?.diagnosticPurpose,
    });
    return res.json(payload);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Failed to start diagnostic.',
      code: err.code,
      ...(err.payload || {}),
    });
  }
});

router.post('/diagnostic/:sessionId/answer', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const payload = await answerAdaptiveDiagnostic({
      student,
      sessionId: req.params.sessionId,
      body: req.body || {},
    });
    return res.json(payload);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Failed to process adaptive diagnostic answer.',
      code: err.code,
      ...(err.payload || {}),
    });
  }
});

router.post('/diagnostic/:sessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathDiagnosticSession.findOne({
      diagnosticSessionId: req.params.sessionId,
      studentId: String(student._id),
      domainId: 'fractions',
    });
    if (!session) return res.status(404).json({ error: 'Diagnostic session not found.' });

    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    if (!responses.length) return res.status(400).json({ error: 'No diagnostic responses submitted.' });

    const questionIds = responses.map((r) => r.questionId).filter(Boolean);
    const questions = await Question.find({ _id: { $in: questionIds } }).populate('skillId');
    const qMap = new Map(questions.map((q) => [String(q._id), q]));
    const attemptsForPlacement = [];
    const masteryProfileHints = [];
    const savedAttempts = [];
    const mistakesFromDiagnostic = [];

    for (const r of responses) {
      const q = qMap.get(String(r.questionId));
      if (!q || !q.skillId) continue;
      const skill = q.skillId;
      const skillFid = String(skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode || '').toUpperCase();
      const studentAnswer = String(r.studentAnswer ?? '');
      const skipped = Boolean(r.skipped);
      const timedOut = Boolean(r.timedOut);
      const correct = skipped ? false : isCorrectWithContext(studentAnswer, q.answer, q.stem);
      const retries = Math.max(0, Number(r.attemptNumber || 1) - 1);
      const timeTakenSeconds = normalizeTimeSpentSeconds(r.timeTaken, r.questionStartedAt, r.questionEndedAt);
      const responseMs = Math.max(0, Number(timeTakenSeconds || 0) * 1000);
      const confidence = String(r.confidence || '');
      const reflection = String(r.reflection || r.confidence || '');
      const helpRequested = Boolean(r.helpRequested || r.help_requested);
      const confidenceCalibration = String(r.confidenceCalibration || '');
      const possibleMisconception = Boolean(r.possibleMisconception || (!correct && (reflection === 'i_know_this' || /very/i.test(confidence))));
      const questionFamilyId = String(r.questionFamilyId || `QF_${skillFid || 'UNK'}_${String(q._id).slice(-4).toUpperCase()}`);
      const attemptId = String(r.attemptId || createLinkId('attempt'));
      const startedAt = toDateLike(r.questionStartedAt);
      const endedAt = toDateLike(r.questionEndedAt) || new Date();
      const eventTimestamp = toDateLike(r.timestamp) || endedAt || new Date();
      const timing = calculateQuestionTiming({
        ...r,
        timeTaken: timeTakenSeconds,
        timeSpentSeconds: timeTakenSeconds,
        questionStartedAt: startedAt,
        questionEndedAt: endedAt,
        answerSubmittedAt: endedAt,
      });

      attemptsForPlacement.push({
        slug: skill.slug,
        correct,
        responseMs,
        hesitationMs: 0,
        retries,
        misconceptionTag: correct ? '' : (q.misconceptionTag || ''),
      });

      masteryProfileHints.push({
        skillId: skillFid,
        skillName: skill.name,
        correct,
        confidence,
        skipped,
        timeTaken: Number(timeTakenSeconds || 0),
        timedOut,
      });

      savedAttempts.push({
        attemptId,
        studentId: String(student._id),
        domainId: 'fractions',
        skillId: skillFid || skill.slug || String(skill._id),
        questionFamilyId,
        questionId: String(q._id),
        sessionId: session.diagnosticSessionId,
        sessionType: 'diagnostic',
        answer: studentAnswer,
        answerCorrect: correct,
        studentAnswer,
        correctAnswer: String(q.answer || ''),
        correct,
        timeTaken: Number.isFinite(Number(timeTakenSeconds)) ? Number(timeTakenSeconds) : null,
        timeSpentSeconds: Number.isFinite(Number(timeTakenSeconds)) ? Number(timeTakenSeconds) : null,
        rawTimeSeconds: timing.rawTimeSeconds,
        effectiveAnswerTimeSeconds: timing.effectiveAnswerTimeSeconds,
        totalQuestionTimeSeconds: timing.totalQuestionTimeSeconds,
        reviewTimeSeconds: timing.reviewTimeSeconds,
        skillTimingSnapshot: timing,
        timestamp: eventTimestamp,
        confidenceLevel: confidence,
        confidence,
        reflection,
        helpRequested,
        confidenceCalibration,
        possibleMisconception,
        attemptNumber: Number(r.attemptNumber || 1),
        skipped,
        timedOut,
        questionStartedAt: startedAt || null,
        questionEndedAt: endedAt || null,
        workingUploaded: Boolean(r.workingUploaded || r.workingSubmitted || r.fullscreenWorkingSubmitted),
        workingSubmitted: Boolean(r.workingSubmitted),
        workingSubmittedAt: toDateLike(r.workingSubmittedAt),
        workingImage: String(r.workingImage || ''),
        workingStrokes: Array.isArray(r.workingStrokes) ? r.workingStrokes : [],
        workingMathObjects: Array.isArray(r.workingMathObjects) ? r.workingMathObjects : [],
        workingNotNeeded: Boolean(r.workingNotNeeded),
        workingRequirementLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(String(r.workingRequirementLevel || '').toUpperCase())
          ? String(r.workingRequirementLevel).toUpperCase()
          : '',
        fullscreenWorkingImage: String(r.fullscreenWorkingImage || ''),
        fullscreenWorkingStrokes: Array.isArray(r.fullscreenWorkingStrokes) ? r.fullscreenWorkingStrokes : [],
        fullscreenWorkingMathObjects: Array.isArray(r.fullscreenWorkingMathObjects) ? r.fullscreenWorkingMathObjects : [],
        fullscreenWorkingSubmitted: Boolean(r.fullscreenWorkingSubmitted),
        fullscreenWorkingSubmittedAt: toDateLike(r.fullscreenWorkingSubmittedAt),
        workingEvidence: Array.isArray(r.workingEvidence) ? r.workingEvidence : [],
        workingCode: String(r.workingCode || ''),
        workingSessionId: String(r.workingSessionId || ''),
        workingId: String(r.workingId || ''),
        workingExpected: true,
      });

      if (!correct) {
        const misconceptionTag = q.misconceptionTag || '';
        const mistakeClassification = classifyFractionMistake({
          skillId: skillFid,
          questionFamilyId,
          studentAnswer,
          correctAnswer: String(q.modelAnswer || q.answer || ''),
          confidence,
          timeTaken: timeTakenSeconds,
          workingAnalysisResult: {
            calculatorIntegrityFlags: Boolean(r.workingUploaded || r.workingSubmitted || r.fullscreenWorkingSubmitted)
              ? []
              : [{ flagType: 'missingWorking' }],
          },
        });
        const mistakeType = skipped
          ? 'careless'
          : (misconceptionTag === 'frac/add-without-common' || misconceptionTag === 'frac/add-denominators')
            ? 'method_error'
            : 'unknown';
        mistakesFromDiagnostic.push({
          studentId: student._id,
          workspaceId: student.workspaceId,
          questionId: q._id,
          skillId: q.skillId._id || q.skillId,
          attemptId,
          workingId: String(r.workingId || ''),
          module: 'MathPath',
          questionStem: q.stem,
          workedSolution: q.modelAnswer || q.workedSolution || '',
          studentAnswer,
          correctAnswer: String(q.modelAnswer || q.answer || ''),
          mistakeId: mistakeClassification.mistakeId,
          mistakeCategory: mistakeClassification.mistakeCategory,
          severity: mistakeClassification.severityLevel,
          mistakeType,
          misconceptionTag,
          rootCauseMapping: mistakeClassification.rootCauseMapping,
          skillMapping: mistakeClassification.skillMapping,
          firstOccurredAt: new Date(),
          mostRecentOccurredAt: new Date(),
          frequency: 1,
          attemptsSinceOccurrence: 0,
          improvementTrend: 'insufficient_evidence',
          resolved: false,
          interventionPathway: mistakeClassification.interventionPathway?.sequence || [],
          nextAction: mistakeClassification.nextAction,
          auditTrail: [mistakeClassification.auditEvent].filter(Boolean),
          confidence,
          reflection,
          helpRequested,
          confidenceCalibration,
          possibleMisconception,
          status: 'open',
          occurredAt: new Date(),
          source: skipped ? 'diagnostic-skipped' : 'diagnostic-incorrect',
        });
      }
    }

    if (!savedAttempts.length) return res.status(400).json({ error: 'Submitted responses do not match valid diagnostic questions.' });
    await MathPathAttempt.insertMany(savedAttempts);
    if (mistakesFromDiagnostic.length) {
      await Mistake.insertMany(mistakesFromDiagnostic);
      await Promise.all(mistakesFromDiagnostic.map((mistake) => MathPathMistakeRecord.findOneAndUpdate(
        {
          studentId: String(student._id),
          domainId: 'fractions',
          mistakeCode: mistake.mistakeId || mistake.misconceptionTag || 'M010',
          skillId: savedAttempts.find((attempt) => String(attempt.questionId) === String(mistake.questionId))?.skillId || '',
          questionFamilyId: savedAttempts.find((attempt) => String(attempt.questionId) === String(mistake.questionId))?.questionFamilyId || '',
        },
        {
          $inc: { frequency: 1 },
          $set: {
            mistakeName: mistake.mistakeCategory || mistake.mistakeType || 'Diagnostic mistake',
            severity: ['critical', 'major'].includes(mistake.severity) ? 'high' : 'medium',
            lastSeenAt: new Date(),
          },
          $push: {
            evidence: {
              source: mistake.source,
              questionId: String(mistake.questionId),
              prompt: mistake.questionStem,
              studentAnswer: mistake.studentAnswer,
              correctAnswer: mistake.correctAnswer,
              confidence: mistake.confidence || '',
              reflection: mistake.reflection || '',
              helpRequested: Boolean(mistake.helpRequested),
              confidenceCalibration: mistake.confidenceCalibration || '',
              seenAt: new Date(),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )));
    }

    const placement = await runPlacement(student._id, attemptsForPlacement);
    const { byFrameworkId } = await loadFractionsSkills();
    const mapSlugToF = (slug) => {
      const skill = [...byFrameworkId.values()].find((s) => s.slug === slug);
      return skill ? {
        skillId: String(skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode || ''),
        name: skill.name,
        slug: skill.slug,
      } : { skillId: '', name: slug, slug };
    };

    const placementRecommended = placement?.recommendedStartSkills?.[0]
      ? mapSlugToF(placement.recommendedStartSkills[0].slug)
      : null;
    const masteredSkills = (placement?.masteryProfile || [])
      .filter((p) => p.mastery === 'mastered')
      .map((p) => mapSlugToF(p.slug))
      .filter((s) => s.skillId);
    const weakSkills = (placement?.masteryProfile || [])
      .filter((p) => p.mastery === 'not-secure' || p.mastery === 'developing')
      .map((p) => mapSlugToF(p.slug))
      .filter((s) => s.skillId);
    const fluencyRecommendations = (placement?.fluencyRecommendations || []).map((f) => mapSlugToF(f.slug));
    const prerequisiteGaps = (placement?.prerequisiteGaps || []).map((g) => ({
      skill: mapSlugToF(g.slug),
      rootGap: mapSlugToF(g.rootGap),
    }));
    const remediationRecommendations = (placement?.remediationPathways || []).map((r) => ({
      skill: mapSlugToF(r.slug),
      reinforce: (r.reinforce || []).map((slug) => mapSlugToF(slug)).filter((s) => s.skillId),
      misconception: r.misconception || null,
    }));
    const readinessLevel = mapPlacementReadiness(placement?.masteryProfile || []);

    const recommendedSkillId = resolveFractionsStartingSkill({
      mode: session.mode,
      weakSkills,
      prerequisiteGaps,
      placementRecommended,
      targetSkillIds: session.targetSkillIds || [],
    });
    const recommended = mapSlugToF(
      [...byFrameworkId.values()].find(
        (s) => String(s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || '').toUpperCase() === String(recommendedSkillId).toUpperCase()
      )?.slug || ''
    );
    const safeRecommended = recommended?.skillId ? recommended : {
      skillId: recommendedSkillId,
      name: byFrameworkId.get(String(recommendedSkillId).toUpperCase())?.name || recommendedSkillId,
      slug: byFrameworkId.get(String(recommendedSkillId).toUpperCase())?.slug || '',
    };

    const totalExpected = Array.isArray(session.result?.questionIds) ? session.result.questionIds.length : savedAttempts.length;
    const correctCount = savedAttempts.filter((attempt) => attempt.correct).length;
    const answeredCount = savedAttempts.filter((attempt) => !attempt.skipped).length;
    const readinessScore = savedAttempts.length ? Math.round((correctCount / savedAttempts.length) * 100) : 0;
    const completionRatio = totalExpected > 0 ? Math.min(1, savedAttempts.length / totalExpected) : 1;
    const confidenceScore = Math.round(Math.min(1, (placement?.overallConfidence || 0) * completionRatio) * 100) / 100;
    const fluencyGaps = fluencyRecommendations.filter((f) => f?.skillId);

    const result = {
      readinessBand: readinessBandFromLevel(readinessLevel),
      recommendedStartingSkill: safeRecommended,
      recommendedStartingSkillName: safeRecommended?.name || '',
      recommendedStartingTopic: 'Fractions',
      masteryProfile: placement?.masteryProfile || [],
      masteredSkills,
      weakSkills,
      prerequisiteGaps,
      fluencyRecommendations,
      fluencyGaps,
      remediationRecommendations,
      confidenceScore,
      overallFractionReadinessScore: readinessScore,
      questionsCorrect: correctCount,
      questionsAnswered: answeredCount,
      totalQuestions: savedAttempts.length,
      confidenceCalibrationSummary: {
        masterySignals: savedAttempts.filter((a) => a.correct && /very/i.test(a.confidence || '')).length,
        luckyCorrect: savedAttempts.filter((a) => a.correct && /guess/i.test(a.confidence || '')).length,
        misconceptionAlerts: savedAttempts.filter((a) => !a.correct && /very/i.test(a.confidence || '')).length,
        learningGaps: savedAttempts.filter((a) => !a.correct && /unsure/i.test(a.confidence || '')).length,
      },
      readinessLevel,
      diagnosticCompleted: true,
      diagnosticCompletedAt: new Date().toISOString(),
      lastSessionAt: new Date().toISOString(),
      currentSkillId: safeRecommended?.skillId || null,
      skillMasteryStatus: (placement?.masteryProfile || []).reduce((acc, row) => {
        const key = mapSlugToF(row.slug)?.skillId;
        if (key) acc[key] = row.mastery || 'developing';
        return acc;
      }, {}),
      recentMistakeTypes: [],
      needsRecheck: false,
      masteryCheckCompleted: false,
      completedAt: new Date().toISOString(),
      nextPracticePayload: {
        skillId: safeRecommended?.skillId || 'F001',
        source: 'diagnostic-placement',
        mode: session.mode,
        questionCount: 8,
      },
    };
    result.studentPlacementReport = buildStudentPlacementReport(result);
    result.parentPlacementSummary = parentPlacementSummary(result);
    result.parentSummary = result.parentPlacementSummary;

    const completedBefore = await MathPathDiagnosticSession.find({
      studentId: String(student._id),
      subjectId: session.subjectId || 'math',
      domainId: session.domainId || 'fractions',
      status: 'completed',
      diagnosticSessionId: { $ne: session.diagnosticSessionId },
    }).sort({ completedAt: 1, createdAt: 1 }).lean();
    const baseline = completedBefore.find((row) => row.isBaseline)
      || completedBefore.find((row) => row.diagnosticPurpose === 'baseline')
      || completedBefore[0]
      || null;
    const previous = completedBefore[completedBefore.length - 1] || null;
    session.diagnosticPurpose = session.diagnosticPurpose || session.result?.diagnosticPurpose || 'baseline';
    session.attemptNumber = session.attemptNumber || completedBefore.length + 1;
    session.isBaseline = Boolean(session.isBaseline || !baseline);
    session.baselineDiagnosticId = session.isBaseline ? session.diagnosticSessionId : (session.baselineDiagnosticId || baseline?.diagnosticSessionId || '');
    session.previousDiagnosticId = session.previousDiagnosticId || previous?.diagnosticSessionId || '';
    session.perSkillSnapshot = Object.entries(result.skillBreakdown || {}).map(([skillId, row]) => ({
      skillId,
      skillName: row.name || '',
      questionsAnswered: Number(row.attempts || 0),
      correctCount: Number(row.correct || 0),
      score: Number(row.percentage || 0),
      confidenceScore: null,
      averageTimeTaken: null,
      workingSubmittedRate: null,
      misconceptionTags: [],
      evidenceQuestionIds: [],
    }));
    session.status = 'completed';
    session.completedAt = new Date();
    session.result = result;
    session.resultPayload = result;
    session.readinessScore = readinessScore;
    await session.save();

    return res.json({
      sessionId: session.diagnosticSessionId,
      mode: session.mode,
      diagnosticPurpose: session.diagnosticPurpose || session.result?.diagnosticPurpose || 'baseline',
      assignmentId: session.assignmentId || '',
      studentLevel: session.studentLevel,
      ...result,
      recommendedStartingSkillId: safeRecommended?.skillId || null,
      studentFriendlySummary: `You are doing well in parts of fractions. Start with ${safeRecommended?.name || 'the recommended skill'} to build stronger confidence.`,
      parentFriendlySummary: result.parentPlacementSummary,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to complete diagnostic.' });
  }
});

router.get('/diagnostic/history', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const subjectId = req.query.subjectId || 'math';
    const domainId = req.query.domainId || 'fractions';
    const history = await getDiagnosticHistory({
      studentId: String(student._id),
      subjectId,
      domainId,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, history });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load diagnostic history.' });
  }
});

router.get('/diagnostic/growth', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const subjectId = req.query.subjectId || 'math';
    const domainId = req.query.domainId || 'fractions';
    const growth = await getDiagnosticGrowth({
      studentId: String(student._id),
      subjectId,
      domainId,
      assignmentId: req.query.assignmentId,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, ...growth });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load diagnostic growth.' });
  }
});

router.get('/diagnostic/latest', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const latest = await MathPathDiagnosticSession.findOne({
      studentId: String(student._id),
      domainId: 'fractions',
      status: 'completed',
    }).sort({ completedAt: -1, createdAt: -1 });

    if (!latest) {
      return res.json({ hasPlacement: false, result: null });
    }

    return res.json({
      hasPlacement: true,
      diagnosticCompleted: true,
      sessionId: latest.diagnosticSessionId,
      mode: latest.mode,
      studentLevel: latest.studentLevel,
      completionReason: latest.completionReason || latest.result?.completionReason || '',
      lifecycleLog: latest.lifecycleLog || {},
      completedAt: latest.completedAt,
      lastSessionAt: latest.completedAt,
      timingAnalytics: latest.diagnosticSessionId
        ? await studentMathPathTimingAnalytics(student._id, { sessionId: latest.diagnosticSessionId })
        : null,
      result: latest.result || null,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load latest diagnostic.' });
  }
});

router.get('/diagnostic/:sessionId', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathDiagnosticSession.findOne({
      diagnosticSessionId: req.params.sessionId,
      studentId: String(student._id),
      domainId: 'fractions',
    });
    if (!session) return res.status(404).json({ error: 'Diagnostic session not found.' });
    let questions = [];
    const storedIds = Array.isArray(session.result?.questionIds) ? session.result.questionIds : [];
    if (storedIds.length) {
      const docs = await Question.find({ _id: { $in: storedIds } });
      const byId = new Map(docs.map((q) => [String(q._id), q]));
      const metaById = new Map((session.result?.questionMeta || []).map((m) => [String(m.questionId), m]));
      questions = storedIds
        .map((qid) => {
          const q = byId.get(String(qid));
          if (!q) return null;
          const meta = metaById.get(String(qid)) || {};
          return {
            questionId: String(q._id),
            skillId: meta.skillId || '',
            questionFamilyId: meta.questionFamilyId || '',
            prompt: q.stem,
            type: q.type,
            choices: q.choices || [],
            visual: q.visual || null,
            hasFigure: !!q.hasFigure,
            figureUrl: q.figureUrl || '',
            figureAlt: q.figureAlt || '',
            answerInputType: answerInputTypeFor(q.answer),
            workingRequired: true,
          };
        })
        .filter(Boolean);
    }

    return res.json({
      sessionId: session.diagnosticSessionId,
      mode: session.mode,
      studentLevel: session.studentLevel,
      status: session.status,
      completionReason: session.completionReason || session.result?.completionReason || '',
      lifecycleLog: session.lifecycleLog || {},
      timingAnalytics: await studentMathPathTimingAnalytics(student._id, { sessionId: session.diagnosticSessionId }),
      result: session.result || {},
      completedAt: session.completedAt,
      questions,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load diagnostic session.' });
  }
});

export default router;
