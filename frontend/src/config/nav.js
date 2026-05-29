// Role-based navigation for the unified Tian OS shell. One config drives both
// the desktop sidebar and the mobile bottom nav. Role controls which set shows;
// workspace controls the data within. See master spec §11.
import {
  Home, Calculator, GitBranch, ClipboardList, Users, CalendarDays, GraduationCap,
  LayoutGrid, BookOpen, FlaskConical, MoreHorizontal, SpellCheck, Sprout, Cog,
  FileText,
} from 'lucide-react';
import { MODULES } from './modules';
import FEATURE_FLAGS from './featureFlags';

const moduleByKey = (key) => MODULES.find((module) => module.key === key);
const studentModuleNav = (key, labelOverride, options = {}) => {
  const module = moduleByKey(key);
  if (!module) return null;
  return {
    to: module.path,
    label: labelOverride || module.name,
    icon: module.icon,
    ...options,
  };
};

const STUDENT_SIDEBAR = [
  { to: '/student', label: 'Home', icon: Home, end: true },
  studentModuleNav('mathpath', 'MathPath', { end: false }),
  studentModuleNav('fluency', 'Fluency Practice', { end: false }),
  studentModuleNav('mistakes', 'Mistake-to-Mastery', { end: false }),
  studentModuleNav('worksheets', 'Mastery Worksheet', { end: true }),
  { to: '/student/assignments', label: 'Assignments', icon: ClipboardList, end: true },
  studentModuleNav('progress', 'Progress', { end: true }),
  studentModuleNav('science', 'Science Adaptive Revision', { end: false }),
  studentModuleNav('spelling', 'Spelling Practice', { end: false }),
  studentModuleNav('lifelab', 'LifeLab', { end: false }),
  studentModuleNav('mechanisms', 'Mechanisms Playground', { end: false }),
].filter(Boolean);

// `bottom` = mobile bottom-nav items (max 5). `sidebar` = desktop/tablet items.
export const NAV = {
  student: {
    bottom: [
      { to: '/student', label: 'Home', icon: Home, end: true },
      { to: '/student/mathpath', label: 'MathPath', icon: Calculator, end: false },
      { to: '/student/assignments', label: 'Tasks', icon: ClipboardList, end: true },
      { to: '/student/progress', label: 'Progress', icon: GitBranch, end: true },
      { to: '/more', label: 'More', icon: MoreHorizontal, end: true },
    ],
    sidebar: STUDENT_SIDEBAR,
  },
  parent: {
    bottom: [
      { to: '/parent', label: 'Home', icon: Home },
      { to: '/parent/children', label: 'Children', icon: Users },
      { to: '/parent/profile', label: 'Profile', icon: BookOpen },
      { to: '/more', label: 'More', icon: MoreHorizontal },
    ],
    sidebar: [
      { to: '/parent', label: 'Home', icon: Home },
      { to: '/parent/children', label: 'Children', icon: Users },
      { to: '/parent/profile', label: 'Profile', icon: BookOpen },
    ],
    more: [
        { to: '/parent/children', label: 'Children', icon: Users, description: 'Open a student profile to assign practice and view progress.' },
        { to: '/parent/children', label: 'Progress', icon: GitBranch, description: 'View your child’s progress, weak topics and mastery map.' },
        { to: '/parent/children', label: 'Assign Practice', icon: ClipboardList, description: 'Assign Maths or Science practice to your child.' },
        ...(FEATURE_FLAGS.worksheets || FEATURE_FLAGS.worksheetsComingSoon ? [{ to: '/parent/children', label: 'Worksheets', icon: FileText, description: 'Generate mastery worksheets for your child.' }] : []),
        { to: '/parent/children', label: 'Recommended Actions', icon: CalendarDays, description: 'See personalised actions for your child’s learning path.' },
        ...(FEATURE_FLAGS.lifelab ? [{ to: '/parent/children', label: 'LifeLab', icon: Sprout, description: 'Open practical activities and enrichment for your child.' }] : []),
    ],
  },
  tutor: {
    bottom: [
      { to: '/tutor', label: 'Home', icon: Home },
      { to: '/tutor/students', label: 'Students', icon: Users },
      { to: '/tutor/homework', label: 'Homework', icon: ClipboardList },
      { to: '/tutor/training', label: 'Training', icon: GraduationCap },
      { to: '/more', label: 'More', icon: MoreHorizontal },
    ],
    sidebar: [
      {
        label: 'Work',
        items: [
          { to: '/tutor', label: 'Home', icon: Home },
          { to: '/tutor/students', label: 'Students', icon: Users },
          { to: '/tutor/homework', label: 'Homework', icon: ClipboardList },
          { to: '/tutor/availability', label: 'Availability', icon: CalendarDays },
          { to: '/tutor/training', label: 'Training', icon: GraduationCap },
        ],
      },
    ],
    more: [
      { to: '/tutor/students', label: 'Students', icon: Users, description: 'Open assigned learners and session histories.' },
      { to: '/tutor/homework', label: 'Homework', icon: ClipboardList, description: 'Review and assign work for your students.' },
      { to: '/tutor/availability', label: 'Availability', icon: CalendarDays, description: 'Manage your teaching schedule.' },
      { to: '/tutor/training', label: 'Training', icon: GraduationCap, description: 'Continue tutor development and certification.' },
      { to: '/tutor/students', label: 'Lesson Prep', icon: BookOpen, description: 'Open a student profile to prepare lessons.' },
      { to: '/tutor/students', label: 'Lesson Notes', icon: BookOpen, description: 'Open a student profile to view lesson notes.' },
    ],
  },
  teacher: {
    bottom: [
      { to: '/teacher', label: 'Home', icon: Home },
      { to: '/teacher/classes', label: 'Classes', icon: LayoutGrid },
      { to: '/teacher/lifelab', label: 'LifeLab', icon: FlaskConical },
      { to: '/more', label: 'More', icon: MoreHorizontal },
    ],
    sidebar: [
      {
        label: 'Class management',
        items: [
          { to: '/teacher', label: 'Home', icon: Home },
          { to: '/teacher/classes', label: 'Classes', icon: LayoutGrid },
        ],
      },
      {
        label: 'Tools',
        items: [
          { to: '/teacher/lifelab', label: 'LifeLab', icon: FlaskConical },
        ],
      },
    ],
    more: [
      { to: '/teacher/lifelab', label: 'LifeLab', icon: FlaskConical, description: 'Open practical science and STEM activities.' },
      { to: '/teacher/classes', label: 'Reports', icon: LayoutGrid, description: 'View class reports and student mastery summaries.' },
      { to: '/teacher/classes', label: 'Interventions', icon: LayoutGrid, description: 'Plan interventions and support for students.' },
      { to: '/teacher/classes', label: 'Grouping', icon: LayoutGrid, description: 'Create targeted groups for differentiated teaching.' },
      { to: '/teacher/classes', label: 'Assign Practice', icon: LayoutGrid, description: 'Assign practice and follow up on student work.' },
    ],
  },
};

export const ROLE_HOME = {
  student: '/student', parent: '/parent', tutor: '/tutor', teacher: '/teacher', admin: '/admin',
};
