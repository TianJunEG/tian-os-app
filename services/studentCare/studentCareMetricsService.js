function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function average(values = []) {
  const nums = values.map((value) => num(value, NaN)).filter(Number.isFinite);
  return nums.length ? Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length) : 0;
}

export function buildStudentCareMetrics({
  students = [],
  assignments = [],
  diagnosticGrowth = [],
  papers = [],
} = {}) {
  return {
    studentsSupported: students.length,
    recoveryPacksAssigned: assignments.length,
    recoveryPacksCompleted: assignments.filter((assignment) => assignment.status === 'completed').length,
    rechecksCompleted: diagnosticGrowth.filter((growth) => Boolean(growth.latest) && growth.latest?.diagnosticPurpose === 'recheck').length,
    averageReadinessImprovement: average(diagnosticGrowth.map((growth) => growth.overallImprovement).filter((value) => value !== null && value !== undefined)),
    papersUploaded: papers.length,
    papersReviewed: papers.filter((paper) => ['reviewed', 'assigned'].includes(paper.status)).length,
  };
}

export default {
  buildStudentCareMetrics,
};
