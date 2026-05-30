import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
  createAssessmentSession,
  createDiagnosticSession,
  createMathPathAttempt,
  createPracticeSession,
  createWorkingSession,
  getMathPathSkillsByDomain,
  getQuestionFamiliesByDomain,
  getStudentSkillState,
  getStudentMistakeRecords,
  upsertMistakeRecord,
  upsertStudentSkillState,
  updateStudentSkillState,
} from '../services/mathpath/mathPathRepository.js';
import { seedMathPathFractions } from './seedMathPathFractions.js';

dotenv.config();

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const studentId = `mp_validate_student_${Date.now()}`;
const domainId = 'fractions';

export async function validateMathPathPersistence() {
  await mongoose.connect(URI);
  try {
    const seedRun1 = await seedMathPathFractions({ manageConnection: false });
    const seedRun2 = await seedMathPathFractions({ manageConnection: false });

    const skills = await getMathPathSkillsByDomain(domainId);
    const families = await getQuestionFamiliesByDomain(domainId);

    const sampleSkill = skills[0];
    const sampleFamily = families.find((f) => f.skillId === sampleSkill?.skillId) || families[0];

    const createdState = await upsertStudentSkillState({
      studentId,
      domainId,
      skillId: sampleSkill.skillId,
      status: 'learning',
      accuracy: 70,
      attemptCount: 2,
      correctCount: 1,
    });
    const updatedState = await updateStudentSkillState(studentId, domainId, sampleSkill.skillId, {
      status: 'accurate',
      accuracy: 92,
      attemptCount: 5,
      correctCount: 5,
      masteredAt: new Date(),
    });

    const attempt = await createMathPathAttempt({
      studentId,
      domainId,
      skillId: sampleSkill.skillId,
      questionFamilyId: sampleFamily.questionFamilyId,
      questionId: `q_${Date.now()}`,
      sessionId: `sess_${Date.now()}`,
      sessionType: 'practice',
      studentAnswer: '1/2',
      correctAnswer: '1/2',
      correct: true,
      timeTaken: 12,
      confidence: 'confident',
      attemptNumber: 1,
      workingExpected: sampleFamily.workingRequired,
      workingUploaded: false,
    });

    const practiceSession = await createPracticeSession({
      studentId,
      domainId,
      targetSkillId: sampleSkill.skillId,
      targetQuestionFamilyIds: [sampleFamily.questionFamilyId],
      sessionGoal: 'Validation practice',
      estimatedQuestionCount: 5,
      status: 'inProgress',
    });

    const diagnosticSession = await createDiagnosticSession({
      studentId,
      domainId,
      mode: 'core',
      studentLevel: 'P4',
      targetSkillIds: [sampleSkill.skillId],
      targetQuestionFamilyIds: [sampleFamily.questionFamilyId],
      status: 'inProgress',
    });

    const assessmentSession = await createAssessmentSession({
      studentId,
      domainId,
      assessmentType: 'baseline',
      mode: 'core',
      singaporeLevel: 'P4',
      targetSkillIds: [sampleSkill.skillId],
      targetQuestionFamilyIds: [sampleFamily.questionFamilyId],
      totalMarks: 10,
      timeLimitMinutes: 15,
      calculatorAllowed: false,
      workingRequired: true,
      status: 'notStarted',
    });

    const workingSession = await createWorkingSession({
      studentId,
      domainId,
      practiceSessionId: practiceSession.practiceSessionId,
      skillIds: [sampleSkill.skillId],
      questionIds: [attempt.questionId],
      inputMethod: 'paper',
      status: 'pending',
    });

    await upsertMistakeRecord({
      studentId,
      domainId,
      mistakeCode: 'M001',
      mistakeName: 'Whole-Number Thinking',
      skillId: sampleSkill.skillId,
      questionFamilyId: sampleFamily.questionFamilyId,
      severity: 'medium',
      evidence: [{ source: 'validation' }],
      remediationSkillIds: [sampleSkill.skillId],
    });
    await upsertMistakeRecord({
      studentId,
      domainId,
      mistakeCode: 'M001',
      mistakeName: 'Whole-Number Thinking',
      skillId: sampleSkill.skillId,
      questionFamilyId: sampleFamily.questionFamilyId,
      severity: 'high',
      evidence: [{ source: 'validation-repeat' }],
      remediationSkillIds: [sampleSkill.skillId],
    });
    const mistakeRecords = await getStudentMistakeRecords(studentId, domainId);
    const stateAfterUpdate = await getStudentSkillState(studentId, domainId, sampleSkill.skillId);

    const checks = {
      modelsCompile: true,
      skillsSeeded: skills.length > 0,
      familiesSeeded: families.length > 0,
      studentStateCreated: Boolean(createdState?._id),
      studentStateUpdated: stateAfterUpdate?.status === 'accurate',
      attemptCreated: Boolean(attempt?._id),
      practiceSessionCreated: Boolean(practiceSession?._id),
      diagnosticSessionCreated: Boolean(diagnosticSession?._id),
      assessmentSessionCreated: Boolean(assessmentSession?._id),
      workingSessionCreated: Boolean(workingSession?._id),
      mistakeUpserted: mistakeRecords.some((r) => r.mistakeCode === 'M001' && r.frequency >= 2),
      seedIdempotent:
        seedRun1.dbSkills === seedRun2.dbSkills &&
        seedRun1.dbQuestionFamilies === seedRun2.dbQuestionFamilies,
    };

    return {
      isValid: Object.values(checks).every(Boolean),
      checks,
      seedRun1,
      seedRun2,
      sample: {
        studentSkillState: stateAfterUpdate,
        attemptId: attempt._id,
        practiceSessionId: practiceSession.practiceSessionId,
        diagnosticSessionId: diagnosticSession.diagnosticSessionId,
        assessmentSessionId: assessmentSession.assessmentSessionId,
        workingSessionId: workingSession.workingSessionId,
        mistakeRecord: mistakeRecords.find((r) => r.mistakeCode === 'M001') || null,
      },
    };
  } finally {
    await mongoose.disconnect();
  }
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  validateMathPathPersistence()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
