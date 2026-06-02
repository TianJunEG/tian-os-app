import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(process.cwd());

const guardedFiles = [
  'frontend/src/pages/student/StudentDashboard.jsx',
  'frontend/src/pages/student/StudentAssignments.jsx',
  'frontend/src/pages/student/mathpath/MathPathHome.jsx',
  'frontend/src/pages/student/mathpath/FractionsLearningPathPage.jsx',
  'frontend/src/pages/student/science/ScienceTopics.jsx',
  'frontend/src/pages/parent/ParentHome.jsx',
  'frontend/src/pages/parent/ChildAssignments.jsx',
  'frontend/src/pages/parent/ChildNav.jsx',
  'frontend/src/pages/parent/AssignPractice.jsx',
  'frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx',
  'frontend/src/components/LifeLab/screens/TutorViewScreen.jsx',
  'frontend/src/components/LifeLab/screens/ClassOverviewScreen.jsx',
];

const bannedVisiblePhrases = [
  'Courses',
  'Current Course',
  'Course Progress',
  'Continue Course',
  'Start Course',
  'lessons completed',
  'Your assignments',
  'View assignments',
  'No assignments yet',
  'Assignment progress',
  'Manage student assignments',
  'No Assignments Yet',
  'Suggested Assignments',
  'No assignment suggestions yet',
  '>Lesson<',
];

describe('Tian OS visible copy consistency', () => {
  it('keeps guarded student, parent, and LifeLab screens away from generic LMS wording', () => {
    const failures = [];

    for (const file of guardedFiles) {
      const text = fs.readFileSync(path.join(repoRoot, file), 'utf8');
      for (const phrase of bannedVisiblePhrases) {
        if (text.includes(phrase)) {
          failures.push(`${file}: ${phrase}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
