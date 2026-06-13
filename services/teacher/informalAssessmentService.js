import crypto from 'crypto';
import mongoose from 'mongoose';
import { generateProblem, checkAnswer } from '../../mathpath/src/generator.js';
import { CURRICULA } from '../../mathpath/src/curriculum.js';
import { generateProblem as generatePSLProblem } from '../psl/problemGenerator.js';
import Question from '../../models/Question.js';
import InformalAssessment from '../../models/InformalAssessment.js';
import InformalAssessmentSession from '../../models/InformalAssessmentSession.js';
import Assignment from '../../models/Assignment.js';
import ClassStudent from '../../models/ClassStudent.js';
import StudentGroup from '../../models/StudentGroup.js';
import Student from '../../models/Student.js';

function findSkillAcrossCurricula(skillId) {
  for (const c of CURRICULA) {
    const s = c.skills.find((sk) => sk.id === skillId);
    if (s) return s;
  }
  return null;
}

function looksLikeObjectId(id) {
  return /^[a-f0-9]{24}$/.test(id);
}

async function generateFromQuestionPool(skillIds, difficulty, questionCount) {
  const objectIds = skillIds.map((id) => new mongoose.Types.ObjectId(id));
  const filter = { skillId: { $in: objectIds } };
  if (difficulty && difficulty !== 'mixed') filter.difficulty = difficulty;

  const pool = await Question.aggregate([
    { $match: filter },
    { $sample: { size: questionCount * 2 } },
  ]);
  if (!pool.length) throw Object.assign(new Error('No questions found for these skills'), { status: 400 });

  const seen = new Set();
  const questions = [];
  for (const q of pool) {
    if (questions.length >= questionCount) break;
    if (seen.has(q.stem)) continue;
    seen.add(q.stem);
    questions.push({
      questionId: crypto.randomUUID(),
      skillId: String(q.skillId),
      display: q.stem,
      answer: q.type === 'mcq' ? q.answer : Number(q.answer) || q.answer,
      kind: q.type === 'mcq' ? 'mcq' : '',
      choices: q.choices || [],
      choice: q.type === 'mcq',
      decimal: false,
    });
  }
  if (!questions.length) throw Object.assign(new Error('No questions found for these skills'), { status: 400 });
  return questions;
}

export async function generateAssessmentQuestions({ module, skillIds, difficulty, questionCount }) {
  const questions = [];

  if (module === 'MathPath') {
    const usePool = skillIds.some(looksLikeObjectId);

    if (usePool) {
      return generateFromQuestionPool(skillIds, difficulty, questionCount);
    }

    const skills = skillIds.map((id) => findSkillAcrossCurricula(id)).filter(Boolean);
    if (!skills.length) throw Object.assign(new Error('No valid MathPath skills found'), { status: 400 });

    const seenDisplays = new Set();
    for (let i = 0; i < questionCount; i++) {
      const skill = skills[i % skills.length];
      let prob = null;
      let tries = 0;
      while (tries < 20) {
        prob = generateProblem(skill);
        if (!seenDisplays.has(prob.display)) break;
        tries++;
      }
      seenDisplays.add(prob.display);
      questions.push({
        questionId: crypto.randomUUID(),
        skillId: skill.id,
        display: prob.display,
        answer: prob.answer,
        kind: prob.kind || '',
        choices: prob.choices || [],
        choice: !!prob.choice,
        decimal: !!prob.decimal,
      });
    }
  } else if (module === 'PSL') {
    const usedTemplateIds = [];
    for (let i = 0; i < questionCount; i++) {
      const skillId = skillIds[i % skillIds.length];
      const prob = await generatePSLProblem(skillId, { usedTemplateIds });
      if (prob?.templateId) usedTemplateIds.push(prob.templateId);
      questions.push({
        questionId: crypto.randomUUID(),
        skillId,
        storyText: prob.storyText,
        correctAnswer: prob.correctAnswer,
        heuristic: prob.heuristic || '',
        structure: prob.structure || '',
      });
    }
  } else {
    throw Object.assign(new Error(`Unsupported module: ${module}`), { status: 400 });
  }

  return questions;
}

export function gradeSubmission(assessment, answers) {
  const attempts = [];
  let correctCount = 0;

  for (const q of assessment.questions) {
    const submitted = answers.find((a) => a.questionId === q.questionId);
    const studentAnswer = submitted?.answer ?? null;
    let correct = false;

    if (studentAnswer !== null && studentAnswer !== '') {
      if (assessment.module === 'MathPath') {
        if (q.choice) {
          correct = String(studentAnswer).trim() === String(q.answer).trim();
        } else {
          const n = Number(String(studentAnswer).trim());
          const a = Number(q.answer);
          correct = Number.isFinite(n) && Number.isFinite(a) && n === a;
        }
      } else {
        correct = Number(studentAnswer) === q.correctAnswer;
      }
    }

    if (correct) correctCount++;
    attempts.push({
      questionId: q.questionId,
      answer: studentAnswer,
      correct,
      timeMs: submitted?.timeMs || null,
    });
  }

  const totalCount = assessment.questions.length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  return { attempts, correctCount, totalCount, score };
}

export async function assignAssessment({ assessment, target, classId, workspaceId, teacherUserId }) {
  let studentIds = [];

  if (target.type === 'class') {
    const links = await ClassStudent.find({ classId, status: 'active' });
    studentIds = links.map((l) => l.studentId);
  } else if (target.type === 'group') {
    const group = await StudentGroup.findOne({ _id: target.id, classId });
    studentIds = group?.studentIds || [];
  } else if (target.type === 'student') {
    studentIds = [target.id];
  }

  if (!studentIds.length) throw Object.assign(new Error('No students in target'), { status: 400 });

  const assignmentDocs = studentIds.map((sid) => ({
    workspaceId,
    studentId: sid,
    assignedByUserId: teacherUserId,
    assignedByRole: 'teacher',
    module: assessment.module,
    subject: assessment.subject,
    questionCount: assessment.questionCount,
    difficulty: assessment.difficulty,
    dueDate: assessment.dueDate,
    status: 'not_started',
    interventionType: 'informal_assessment',
    assignedToType: target.type || 'class',
    assignedToId: target.id || classId,
    templateId: String(assessment._id),
  }));

  const assignments = await Assignment.insertMany(assignmentDocs);
  const assignmentById = {};
  assignments.forEach((a, i) => { assignmentById[String(studentIds[i])] = a._id; });

  const sessions = studentIds.map((sid) => ({
    assessmentId: assessment._id,
    studentId: sid,
    workspaceId,
    assignmentId: assignmentById[String(sid)] || null,
    status: 'not_started',
    totalCount: assessment.questions.length,
  }));
  await InformalAssessmentSession.insertMany(sessions);

  assessment.status = 'assigned';
  assessment.assignedAt = new Date();
  assessment.assignedToType = target.type || 'class';
  assessment.assignedToId = target.id || classId;
  assessment.resultsSummary.totalAssigned = studentIds.length;
  await assessment.save();

  return { assigned: studentIds.length };
}

export async function buildClassResults(assessmentId) {
  const assessment = await InformalAssessment.findById(assessmentId).lean();
  if (!assessment) throw Object.assign(new Error('Assessment not found'), { status: 404 });

  const sessions = await InformalAssessmentSession.find({ assessmentId }).lean();
  const studentIds = sessions.map((s) => s.studentId);
  const students = await Student.find({ _id: { $in: studentIds } }).select('name').lean();
  const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));

  const submitted = sessions.filter((s) => s.status === 'submitted');
  const avgScore = submitted.length
    ? Math.round(submitted.reduce((sum, s) => sum + (s.score || 0), 0) / submitted.length)
    : null;

  const perStudent = sessions.map((s) => ({
    studentId: s.studentId,
    name: nameById[String(s.studentId)] || '',
    status: s.status,
    score: s.score,
    correctCount: s.correctCount,
    totalCount: s.totalCount,
    timeSpentMs: s.timeSpentMs,
    wrongQuestions: (s.attempts || []).filter((a) => !a.correct).map((a) => {
      const q = assessment.questions.find((q2) => q2.questionId === a.questionId);
      return {
        questionId: a.questionId,
        studentAnswer: a.answer,
        correctAnswer: assessment.module === 'MathPath' ? q?.answer : q?.correctAnswer,
        display: q?.display || q?.storyText || '',
      };
    }),
  }));

  const perQuestion = assessment.questions.map((q, idx) => {
    const qAttempts = submitted.map((s) => (s.attempts || [])[idx]).filter(Boolean);
    const correctPct = qAttempts.length
      ? Math.round((qAttempts.filter((a) => a.correct).length / qAttempts.length) * 100)
      : null;
    const wrongAnswers = {};
    for (const a of qAttempts) {
      if (!a.correct && a.answer !== null && a.answer !== '') {
        const key = String(a.answer);
        wrongAnswers[key] = (wrongAnswers[key] || 0) + 1;
      }
    }
    return {
      questionId: q.questionId,
      index: idx,
      display: q.display || q.storyText || '',
      skillId: q.skillId,
      correctAnswer: assessment.module === 'MathPath' ? q.answer : q.correctAnswer,
      correctPct,
      totalAttempts: qAttempts.length,
      commonWrongAnswers: Object.entries(wrongAnswers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([answer, count]) => ({ answer, count })),
    };
  });

  return {
    assessment: {
      _id: assessment._id,
      title: assessment.title,
      module: assessment.module,
      questionCount: assessment.questionCount,
      timeLimitMinutes: assessment.timeLimitMinutes,
      status: assessment.status,
      assignedAt: assessment.assignedAt,
      skillIds: assessment.skillIds,
    },
    summary: {
      totalAssigned: sessions.length,
      totalCompleted: submitted.length,
      completionRate: sessions.length ? Math.round((submitted.length / sessions.length) * 100) : 0,
      averageScore: avgScore,
    },
    perStudent,
    perQuestion,
  };
}
