import Skill from '../../models/Skill.js';
import MasteryRecord from '../../models/MasteryRecord.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import MathPathAssessmentSession from '../../models/mathpath/MathPathAssessmentSession.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathPracticeSession from '../../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import MathPathSkill from '../../models/mathpath/MathPathSkill.js';
import MathPathWorkingSession from '../../models/mathpath/MathPathWorkingSession.js';
import StudentXP from '../../models/studentProfile/StudentXP.js';
import StudentAchievement from '../../models/studentProfile/StudentAchievement.js';
import StudentLearningEvent from '../../models/studentProfile/StudentLearningEvent.js';

export const XP_VALUES = Object.freeze({
  diagnosticCompleted: 25,
  practiceCompleted: 10,
  fluencySessionCompleted: 15,
  workingSubmitted: 5,
  skillMastered: 50,
  masteryTestPassed: 75,
  dailyStreakMaintained: 5,
});

export const ACHIEVEMENT_DEFINITIONS = Object.freeze([
  {
    code: 'first_diagnostic',
    title: 'First Diagnostic',
    description: 'Completed a diagnostic check.',
    icon: 'target',
    category: 'Learning Milestones',
    unlockedWhen: (m) => m.diagnosticsCompleted >= 1,
  },
  {
    code: 'first_practice',
    title: 'First Practice Session',
    description: 'Completed a focused practice session.',
    icon: 'practice',
    category: 'Learning Milestones',
    unlockedWhen: (m) => m.practiceSessions >= 1,
  },
  {
    code: 'first_mastered_skill',
    title: 'First Mastered Skill',
    description: 'Mastered the first skill on a path.',
    icon: 'skill',
    category: 'Learning Milestones',
    unlockedWhen: (m) => m.skillsMastered >= 1,
  },
  {
    code: 'five_skills_mastered',
    title: 'Five Skills Mastered',
    description: 'Built secure progress across five skills.',
    icon: 'skills',
    category: 'Learning Milestones',
    unlockedWhen: (m) => m.skillsMastered >= 5,
  },
  {
    code: 'ten_skills_mastered',
    title: 'Ten Skills Mastered',
    description: 'Reached ten mastered skills.',
    icon: 'trophy',
    category: 'Learning Milestones',
    unlockedWhen: (m) => m.skillsMastered >= 10,
  },
  {
    code: 'three_day_streak',
    title: 'Three Day Streak',
    description: 'Practised on three learning days in a row.',
    icon: 'streak',
    category: 'Consistency',
    unlockedWhen: (m) => m.streak >= 3,
  },
  {
    code: 'seven_day_streak',
    title: 'Seven Day Streak',
    description: 'Kept a full week of learning activity.',
    icon: 'streak',
    category: 'Consistency',
    unlockedWhen: (m) => m.streak >= 7,
  },
  {
    code: 'thirty_day_streak',
    title: 'Thirty Day Streak',
    description: 'Built a month-long learning habit.',
    icon: 'streak',
    category: 'Consistency',
    unlockedWhen: (m) => m.streak >= 30,
  },
  {
    code: 'first_working_submission',
    title: 'First Working Record',
    description: 'Saved or uploaded working for review.',
    icon: 'working',
    category: 'Effort',
    unlockedWhen: (m) => m.workingSubmissions >= 1,
  },
  {
    code: 'one_hundred_questions',
    title: '100 Questions Solved',
    description: 'Solved 100 learning questions.',
    icon: 'questions',
    category: 'Effort',
    unlockedWhen: (m) => m.questionsSolved >= 100,
  },
  {
    code: 'five_hundred_questions',
    title: '500 Questions Solved',
    description: 'Solved 500 learning questions.',
    icon: 'questions',
    category: 'Effort',
    unlockedWhen: (m) => m.questionsSolved >= 500,
  },
  {
    code: 'first_fluency_session',
    title: 'First Fluency Session',
    description: 'Completed a speed and accuracy round.',
    icon: 'fluency',
    category: 'Growth',
    unlockedWhen: (m) => m.fluencySessions >= 1,
  },
  {
    code: 'first_mastery_test',
    title: 'First Mastery Test',
    description: 'Completed a mastery checkpoint.',
    icon: 'checkpoint',
    category: 'Growth',
    unlockedWhen: (m) => m.masteryTestsPassed >= 1,
  },
]);

function resolveStudentVisualMode(student = {}) {
  const explicit = student.profile?.studentVisualMode || student.studentVisualMode || '';
  if (['lower_primary', 'upper_primary', 'secondary'].includes(explicit)) return explicit;
  const level = String(student.level || '').toLowerCase();
  const secondary = level.match(/(?:secondary|sec|s)\s*([1-6])/i);
  if (secondary) return 'secondary';
  const primary = level.match(/(?:primary|p)\s*([1-6])/i);
  if (primary && Number(primary[1]) <= 4) return 'lower_primary';
  if (primary) return 'upper_primary';
  return 'upper_primary';
}

// Mastery requires retention/recheck evidence. Practice competence (accurate/fluent) does not
// count as mastered until a passing recheck/retention promotes the skill state to retained.
const MASTERED_STATES = ['retained'];
const SUBMITTED_ASSESSMENT_STATES = ['submitted', 'marked', 'reviewed'];
const domainLabel = (domainId = '') => {
  if (!domainId) return 'MathPath';
  return String(domainId).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

function uniqueCount(values = []) {
  return new Set(values.filter(Boolean).map(String)).size;
}

function localDateKey(date, offsetHours = 8) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() + offsetHours * 3600000);
  return local.toISOString().slice(0, 10);
}

function calculateActivityStreak(dates = [], offsetHours = 8) {
  const days = new Set(dates.map((d) => localDateKey(d, offsetHours)).filter(Boolean));
  if (!days.size) return 0;
  const now = new Date(Date.now() + offsetHours * 3600000);
  let cursor = now;
  let streak = 0;
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) {
      if (streak === 0) {
        cursor = new Date(cursor.getTime() - 86400000);
        if (days.has(cursor.toISOString().slice(0, 10))) continue;
      }
      break;
    }
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

// Builds a MathPathAttempt filter clause that excludes per-answer diagnostic
// attempts whose parent check-in did NOT complete. Abandoned/in-progress
// check-ins must not pollute profile aggregates (a student can interrupt a
// check-in, which now resets it). Non-diagnostic attempts are left untouched.
async function buildDiagnosticAttemptExclusion(studentId) {
  const completed = await MathPathDiagnosticSession
    .find({ studentId, status: 'completed' })
    .select('diagnosticSessionId')
    .lean();
  const completedSessionIds = completed
    .map((s) => s.diagnosticSessionId)
    .filter(Boolean);
  // Keep an attempt unless it is a diagnostic attempt tied to a session that did
  // not complete. $nor leaves every non-diagnostic attempt unaffected.
  return {
    $nor: [
      { sessionType: 'diagnostic', sessionId: { $nin: completedSessionIds } },
    ],
  };
}

async function getSkillName(skillId) {
  if (!skillId) return '';
  const skill = await Skill.findOne({
    $or: [
      { 'metadata.mathPathSkillId': skillId },
      { 'metadata.officialSkillCode': skillId },
      { slug: skillId },
    ],
  }).lean();
  return skill?.name || skillId;
}

async function deriveMetrics(student) {
  const studentObjectId = student._id;
  const studentId = String(student._id);

  // Excludes per-answer diagnostic attempts from non-completed check-ins so an
  // abandoned/in-progress check-in does not skew profile stats.
  const excludeIncompleteDiagnostics = await buildDiagnosticAttemptExclusion(studentId);

  const [
    questionsSolved,
    diagnosticsCompleted,
    practiceSessions,
    fluencySessionIds,
    workingAttempts,
    uploadedWorkings,
    masteredSkillStates,
    masteredRecords,
    masteryTestsPassed,
    recentAttempts,
    recentPracticeSessions,
    recentDiagnostics,
    recentMasteredStates,
    masteryStreakRows,
    totalFractionsSkills,
  ] = await Promise.all([
    MathPathAttempt.countDocuments({ studentId, ...excludeIncompleteDiagnostics }),
    MathPathDiagnosticSession.countDocuments({ studentId, status: 'completed' }),
    MathPathPracticeSession.countDocuments({ studentId, status: 'completed' }),
    MathPathAttempt.distinct('sessionId', { studentId, sessionType: 'fluency' }),
    MathPathAttempt.countDocuments({
      studentId,
      ...excludeIncompleteDiagnostics,
      $or: [
        { workingSubmitted: true },
        { workingUploaded: true },
        { fullscreenWorkingSubmitted: true },
      ],
    }),
    MathPathWorkingSession.countDocuments({
      studentId,
      status: { $in: ['submitted', 'mapped', 'analysed', 'needs_review', 'analysisReady'] },
    }),
    MathPathStudentSkillState.find({ studentId, status: { $in: MASTERED_STATES } }).lean(),
    MasteryRecord.find({
      studentId: studentObjectId,
      $or: [{ status: 'mastered' }, { masteryState: { $in: ['secure', 'mastered', 'retained'] } }],
    }).lean(),
    MathPathAssessmentSession.countDocuments({
      studentId,
      assessmentType: 'mastery',
      status: { $in: SUBMITTED_ASSESSMENT_STATES },
    }),
    MathPathAttempt.find({ studentId, ...excludeIncompleteDiagnostics }).sort({ createdAt: -1 }).limit(30).lean(),
    MathPathPracticeSession.find({ studentId, status: 'completed' }).sort({ completedAt: -1, updatedAt: -1 }).limit(10).lean(),
    MathPathDiagnosticSession.find({ studentId, status: 'completed' }).sort({ completedAt: -1, updatedAt: -1 }).limit(10).lean(),
    MathPathStudentSkillState.find({ studentId, status: { $in: MASTERED_STATES } }).sort({ masteredAt: -1, updatedAt: -1 }).limit(10).lean(),
    MasteryRecord.find({ studentId: studentObjectId }).select('streak bestStreak lastPracticedAt').lean(),
    Skill.countDocuments({ slug: /^fr\./i }),
  ]);

  const masteredCodes = [
    ...masteredSkillStates.map((row) => row.skillId),
    ...masteredRecords.map((row) => String(row.skillId)),
  ];
  const workingSubmissions = Math.max(workingAttempts, uploadedWorkings);
  const activityDates = [
    ...recentAttempts.map((row) => row.createdAt || row.timestamp),
    ...recentPracticeSessions.map((row) => row.completedAt || row.updatedAt || row.createdAt),
    ...recentDiagnostics.map((row) => row.completedAt || row.updatedAt || row.createdAt),
  ];
  const recentAttempt = recentAttempts[0] || {};
  const recentState = await MathPathStudentSkillState.findOne({ studentId })
    .sort({ lastPractisedAt: -1, updatedAt: -1 })
    .lean();
  const currentSkillId = recentState?.skillId || recentAttempt?.skillId || 'F001';
  const currentDomain = recentState?.domainId || recentAttempt?.domainId || 'fractions';
  const currentSkill = await getSkillName(currentSkillId);
  // MasteryRecord.streak/bestStreak counts consecutive correct answers on a
  // single skill — NOT daily login streak.  Only use activity-date-based streak
  // for the profile "days active" counter.
  const activityStreak = calculateActivityStreak(activityDates);
  const streak = activityStreak;
  // Denominator: use the real per-domain active-skill count for the student's
  // current domain. Previously non-fractions fell through to max(mastered, 1)
  // which produced mastered/total = N/N = 100% for any non-fractions student
  // with any progress (and 0/1 = 0% for a fresh one). For fractions, keep the
  // pre-fetched Skill count (slug-based) so behaviour is unchanged there.
  let domainTotalSkills = 0;
  if (currentDomain === 'fractions') {
    domainTotalSkills = Math.max(totalFractionsSkills || 0, 26);
  } else if (currentDomain) {
    try { domainTotalSkills = await MathPathSkill.countDocuments({ domainId: currentDomain, isActive: true }); }
    catch { domainTotalSkills = 0; }
  }
  // Fall through to the legacy max-of-mastered only if we genuinely couldn't
  // resolve a real domain size, so we never show a degenerate "100%".
  const totalSkills = domainTotalSkills > 0 ? domainTotalSkills : Math.max(uniqueCount(masteredCodes), 1);

  return {
    studentId,
    questionsSolved,
    diagnosticsCompleted,
    practiceSessions,
    fluencySessions: uniqueCount(fluencySessionIds),
    workingSubmissions,
    skillsMastered: uniqueCount(masteredCodes),
    masteryTestsPassed,
    streak,
    currentDomain,
    currentSkill,
    currentSkillId,
    totalSkills,
    recent: {
      attempts: recentAttempts,
      practiceSessions: recentPracticeSessions,
      diagnostics: recentDiagnostics,
      masteredStates: recentMasteredStates,
    },
  };
}

function calculateXP(metrics) {
  const sourceTotals = {
    diagnosticCompleted: metrics.diagnosticsCompleted * XP_VALUES.diagnosticCompleted,
    practiceCompleted: metrics.practiceSessions * XP_VALUES.practiceCompleted,
    fluencySessionCompleted: metrics.fluencySessions * XP_VALUES.fluencySessionCompleted,
    workingSubmitted: metrics.workingSubmissions * XP_VALUES.workingSubmitted,
    skillMastered: metrics.skillsMastered * XP_VALUES.skillMastered,
    masteryTestPassed: metrics.masteryTestsPassed * XP_VALUES.masteryTestPassed,
    dailyStreakMaintained: metrics.streak * XP_VALUES.dailyStreakMaintained,
  };
  return {
    totalXP: Object.values(sourceTotals).reduce((sum, value) => sum + value, 0),
    sourceTotals,
  };
}

async function syncXP(studentId, metrics) {
  const derived = calculateXP(metrics);
  const existing = await StudentXP.findOne({ studentId }).lean();
  const totalXP = Math.max(existing?.totalXP || 0, derived.totalXP);
  await StudentXP.findOneAndUpdate(
    { studentId },
    {
      $set: {
        totalXP,
        sourceTotals: derived.sourceTotals,
        lastCalculatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
  return { totalXP, sourceTotals: derived.sourceTotals };
}

async function syncAchievements(studentId, metrics) {
  const existing = await StudentAchievement.find({ studentId }).lean();
  const unlockedCodes = new Set(existing.map((row) => row.code));
  const newlyUnlocked = ACHIEVEMENT_DEFINITIONS.filter((definition) => definition.unlockedWhen(metrics) && !unlockedCodes.has(definition.code));
  if (newlyUnlocked.length) {
    await StudentAchievement.insertMany(
      newlyUnlocked.map((definition) => ({
        studentId,
        code: definition.code,
        title: definition.title,
        description: definition.description,
        icon: definition.icon,
        category: definition.category,
        unlockedAt: new Date(),
      })),
      { ordered: false }
    ).catch((err) => {
      if (err?.code !== 11000) throw err;
    });
  }
  const updated = await StudentAchievement.find({ studentId }).lean();
  const unlockedMap = new Map(updated.map((row) => [row.code, row]));
  return ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const unlocked = unlockedMap.get(definition.code);
    return {
      code: definition.code,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      category: definition.category,
      unlocked: Boolean(unlocked),
      unlockedAt: unlocked?.unlockedAt || null,
    };
  });
}

export async function getStudentProfileSummary(student) {
  const metrics = await deriveMetrics(student);
  const xp = await syncXP(student._id, metrics);
  const mastered = Math.min(metrics.skillsMastered, metrics.totalSkills);

  return {
    student: {
      id: String(student._id),
      name: student.name || 'Student',
      level: student.level || '',
      avatarUrl: student.avatarUrl || student.profile?.avatarUrl || '',
      studentVisualMode: resolveStudentVisualMode(student),
    },
    xp: xp.totalXP,
    streak: metrics.streak,
    skillsMastered: mastered,
    questionsSolved: metrics.questionsSolved,
    practiceSessions: metrics.practiceSessions,
    workingSubmissions: metrics.workingSubmissions,
    currentDomain: domainLabel(metrics.currentDomain),
    currentSkill: metrics.currentSkill,
    currentSkillId: metrics.currentSkillId,
    progress: {
      mastered,
      total: metrics.totalSkills,
      label: `${mastered} / ${metrics.totalSkills} Skills Mastered`,
      percentage: metrics.totalSkills ? Math.round((mastered / metrics.totalSkills) * 100) : 0,
    },
    recommendedAction: {
      label: metrics.currentSkill ? `Continue ${metrics.currentSkill}` : 'Continue Learning',
      href: '/student/mathpath',
    },
    xpBreakdown: xp.sourceTotals,
  };
}

export async function getStudentAchievements(student) {
  const metrics = await deriveMetrics(student);
  await syncXP(student._id, metrics);
  return syncAchievements(student._id, metrics);
}

export async function getStudentLearningTimeline(student) {
  const metrics = await deriveMetrics(student);
  const storedEvents = await StudentLearningEvent.find({ studentId: student._id })
    .sort({ occurredAt: -1 })
    .limit(10)
    .lean();

  const derivedEvents = [
    ...metrics.recent.practiceSessions.map((session) => ({
      eventType: 'practice_completed',
      title: `Completed ${domainLabel(session.domainId)} Practice`,
      description: session.targetSkillId ? `Practised ${session.targetSkillId}` : 'Completed a focused practice session.',
      xpAwarded: XP_VALUES.practiceCompleted,
      occurredAt: session.completedAt || session.updatedAt || session.createdAt,
      skillId: session.targetSkillId || '',
      domainId: session.domainId || '',
    })),
    ...metrics.recent.diagnostics.map((session) => ({
      eventType: 'diagnostic_completed',
      title: `Completed ${domainLabel(session.domainId)} Diagnostic`,
      description: 'Found the next best skills to practise.',
      xpAwarded: XP_VALUES.diagnosticCompleted,
      occurredAt: session.completedAt || session.updatedAt || session.createdAt,
      domainId: session.domainId || '',
    })),
    ...metrics.recent.masteredStates.map((state) => ({
      eventType: 'skill_mastered',
      title: `Mastered ${state.skillId}`,
      description: 'Skill progress updated.',
      xpAwarded: XP_VALUES.skillMastered,
      occurredAt: state.masteredAt || state.updatedAt,
      skillId: state.skillId,
      domainId: state.domainId || '',
    })),
    ...metrics.recent.attempts
      .filter((attempt) => attempt.workingSubmitted || attempt.workingUploaded || attempt.fullscreenWorkingSubmitted)
      .slice(0, 5)
      .map((attempt) => ({
        eventType: 'working_submitted',
        title: 'Submitted Working',
        description: attempt.skillId ? `Working record for ${attempt.skillId}` : 'Working record saved.',
        xpAwarded: XP_VALUES.workingSubmitted,
        occurredAt: attempt.workingSubmittedAt || attempt.createdAt || attempt.timestamp,
        skillId: attempt.skillId || '',
        domainId: attempt.domainId || '',
      })),
  ];

  return [...storedEvents, ...derivedEvents]
    .filter((event) => event.occurredAt)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 10)
    .map((event) => ({
      id: String(event._id || `${event.eventType}-${event.occurredAt}-${event.skillId || ''}`),
      eventType: event.eventType,
      title: event.title,
      description: event.description || '',
      xpAwarded: event.xpAwarded || 0,
      occurredAt: event.occurredAt,
      domainId: event.domainId || '',
      skillId: event.skillId || '',
    }));
}

// ── Personal Bests ──────────────────────────────────────────────────
// Computed from raw attempt and session data — student competes against
// themselves, not others.

function weekKey(date, offsetHours = 8) {
  const d = new Date(new Date(date).getTime() + offsetHours * 3600000);
  const dayOfWeek = d.getUTCDay();
  const monday = new Date(d);
  monday.setUTCDate(monday.getUTCDate() - ((dayOfWeek + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export async function getStudentPersonalBests(student, offsetHours = 8) {
  const studentId = String(student._id);
  // Drop per-answer attempts from non-completed check-ins so personal bests are
  // not skewed by an abandoned/in-progress diagnostic.
  const excludeIncompleteDiagnostics = await buildDiagnosticAttemptExclusion(studentId);

  const [allAttempts, completedSessions] = await Promise.all([
    MathPathAttempt.find({ studentId, ...excludeIncompleteDiagnostics })
      .sort({ createdAt: -1 })
      .select('correct timeTaken createdAt sessionId skillId')
      .lean(),
    MathPathPracticeSession.find({ studentId, status: 'completed' })
      .sort({ completedAt: -1 })
      .select('summary completedAt startedAt practiceSessionId targetSkillId')
      .lean(),
  ]);

  // 1. Best session accuracy (min 3 questions)
  let bestSessionAccuracy = 0;
  let bestSessionAccuracyDate = null;
  for (const session of completedSessions) {
    const acc = session.summary?.accuracySummary;
    if (acc && acc.total >= 3) {
      const pct = acc.accuracyPercentage ?? (acc.total ? Math.round((acc.correct / acc.total) * 100) : 0);
      if (pct > bestSessionAccuracy) {
        bestSessionAccuracy = pct;
        bestSessionAccuracyDate = session.completedAt;
      }
    }
  }

  // 2. Longest correct streak (consecutive correct answers across all attempts, ordered by time)
  const sorted = [...allAttempts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  let longestCorrectStreak = 0;
  let currentCorrectStreak = 0;
  let longestStreakEndDate = null;
  for (const attempt of sorted) {
    if (attempt.correct) {
      currentCorrectStreak += 1;
      if (currentCorrectStreak > longestCorrectStreak) {
        longestCorrectStreak = currentCorrectStreak;
        longestStreakEndDate = attempt.createdAt;
      }
    } else {
      currentCorrectStreak = 0;
    }
  }

  // 3. Best daily streak (consecutive days with activity)
  const activityDates = allAttempts.map((a) => a.createdAt).filter(Boolean);
  const bestDailyStreak = calculateBestDailyStreak(activityDates, offsetHours);

  // 4. Most questions in a single day
  const dayBuckets = {};
  for (const attempt of allAttempts) {
    const key = localDateKey(attempt.createdAt, offsetHours);
    if (!key) continue;
    dayBuckets[key] = (dayBuckets[key] || 0) + 1;
  }
  let mostQuestionsInDay = 0;
  let mostQuestionsDate = null;
  for (const [day, count] of Object.entries(dayBuckets)) {
    if (count > mostQuestionsInDay) {
      mostQuestionsInDay = count;
      mostQuestionsDate = day;
    }
  }

  // 5. Weekly XP comparison (this week vs last week)
  const now = new Date(Date.now() + offsetHours * 3600000);
  const thisWeekKey = weekKey(now, 0); // already offset
  const lastMonday = new Date(now);
  lastMonday.setUTCDate(lastMonday.getUTCDate() - 7);
  const lastWeekKey = weekKey(lastMonday, 0);

  const weekBuckets = {};
  for (const attempt of allAttempts) {
    const wk = weekKey(attempt.createdAt, offsetHours);
    if (!wk) continue;
    weekBuckets[wk] = (weekBuckets[wk] || 0) + 1;
  }
  const thisWeekQuestions = weekBuckets[thisWeekKey] || 0;
  const lastWeekQuestions = weekBuckets[lastWeekKey] || 0;

  // 6. Perfect sessions (100% accuracy, min 5 questions)
  let perfectSessions = 0;
  for (const session of completedSessions) {
    const acc = session.summary?.accuracySummary;
    if (acc && acc.total >= 5 && acc.correct === acc.total) {
      perfectSessions += 1;
    }
  }

  // 7. Fastest correct answer (excluding outliers under 1s)
  let fastestCorrectMs = null;
  let fastestCorrectDate = null;
  for (const attempt of allAttempts) {
    if (!attempt.correct) continue;
    const ms = attempt.timeTaken;
    if (!ms || ms < 1000) continue; // skip sub-1s outliers
    if (fastestCorrectMs === null || ms < fastestCorrectMs) {
      fastestCorrectMs = ms;
      fastestCorrectDate = attempt.createdAt;
    }
  }

  // 8. Total days active
  const uniqueDays = new Set(activityDates.map((d) => localDateKey(d, offsetHours)).filter(Boolean));
  const totalDaysActive = uniqueDays.size;

  return {
    bestSessionAccuracy: { value: bestSessionAccuracy, date: bestSessionAccuracyDate },
    longestCorrectStreak: { value: longestCorrectStreak, date: longestStreakEndDate },
    bestDailyStreak: { value: bestDailyStreak },
    mostQuestionsInDay: { value: mostQuestionsInDay, date: mostQuestionsDate },
    thisWeekQuestions,
    lastWeekQuestions,
    weeklyTrend: thisWeekQuestions >= lastWeekQuestions ? 'up' : 'down',
    perfectSessions: { value: perfectSessions },
    fastestCorrectAnswer: {
      value: fastestCorrectMs ? Math.round(fastestCorrectMs / 1000 * 10) / 10 : null,
      date: fastestCorrectDate,
    },
    totalDaysActive,
    totalQuestions: allAttempts.length,
    totalSessions: completedSessions.length,
  };
}

function calculateBestDailyStreak(dates = [], offsetHours = 8) {
  const days = [...new Set(dates.map((d) => localDateKey(d, offsetHours)).filter(Boolean))].sort();
  if (!days.length) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + 'T00:00:00Z');
    const curr = new Date(days[i] + 'T00:00:00Z');
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best;
}
