function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function latest(items = [], key = 'createdAt') {
  return [...items]
    .filter((item) => item?.[key])
    .sort((a, b) => new Date(b[key]) - new Date(a[key]))[0] || null;
}

export function buildTutorLessonPrepPreview({
  student = {},
  growth = {},
  mistakes = [],
  papers = [],
  assignments = [],
} = {}) {
  const weakSkills = [
    ...(growth.remainingWeakSkills || []),
    ...mistakes.map((mistake) => mistake.skillId).filter(Boolean),
  ];
  const uniqueWeakSkills = [...new Set(weakSkills)].slice(0, 5);
  const repeatedMistakes = [...mistakes]
    .sort((a, b) => num(b.frequency) - num(a.frequency))
    .slice(0, 5)
    .map((mistake) => ({
      skillId: mistake.skillId || '',
      mistakeName: mistake.mistakeName || mistake.mistakeCode || 'Repeated mistake',
      frequency: num(mistake.frequency, 1),
      severity: mistake.severity || 'medium',
    }));
  const recentPaper = latest(papers, 'createdAt');
  const activeAssignment = assignments.find((assignment) => ['assigned', 'in_progress'].includes(assignment.status)) || null;
  const suggestedLessonFocus = uniqueWeakSkills[0]
    ? `Rebuild ${uniqueWeakSkills[0]} using worked examples, then check transfer with two word problems.`
    : 'Run a short diagnostic warm-up, then choose a focus from the latest mistakes.';

  return {
    student: {
      studentId: String(student._id || student.id || student.studentId || ''),
      name: student.name || 'Student',
      level: student.level || '',
    },
    weakSkills: uniqueWeakSkills,
    recentMistakes: repeatedMistakes,
    recentPapers: recentPaper ? [{
      paperAnalysisId: String(recentPaper._id || recentPaper.id || ''),
      title: recentPaper.originalFilename || 'Uploaded paper',
      status: recentPaper.status,
      weakSkillIds: recentPaper.weakSkillIds || [],
      createdAt: recentPaper.createdAt,
    }] : [],
    activeRecoveryPack: activeAssignment ? {
      assignmentId: String(activeAssignment._id || activeAssignment.id || ''),
      title: activeAssignment.title || 'Recovery Pack',
      status: activeAssignment.status,
      completion: activeAssignment.completion || {},
    } : null,
    suggestedLessonFocus,
    estimatedLessonDurationMinutes: uniqueWeakSkills.length >= 3 || repeatedMistakes.length >= 3 ? 45 : 30,
  };
}

export default {
  buildTutorLessonPrepPreview,
};
