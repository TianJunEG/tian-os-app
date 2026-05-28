// Role-based navigation for the unified Tian OS shell. One config drives both
// the desktop sidebar and the mobile bottom nav. Role controls which set shows;
// workspace controls the data within. See master spec §11.
import {
  Home, Calculator, GitBranch, ClipboardList, Users, CalendarDays, GraduationCap,
  LayoutGrid, BookOpen, FlaskConical, MoreHorizontal, SpellCheck, Sprout, Cog,
} from 'lucide-react';
import { MODULES } from './modules';

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
  studentModuleNav('worksheets', 'Worksheets', { end: true }),
  studentModuleNav('progress', 'Progress', { end: true }),
  { to: '/student/assignments', label: 'Tasks', icon: ClipboardList, end: true },
  studentModuleNav('science', 'Science Adaptive Revision', { end: false }),
  studentModuleNav('spelling', 'Spelling Practice', { end: false }),
  studentModuleNav('lifelab', 'LifeLab', { end: false }),
  studentModuleNav('mechanisms', 'Mechanisms Playground', { end: false }),
].filter(Boolean);

const studentSidebarGroups = [
  {
    label: 'Core Learning',
    items: STUDENT_SIDEBAR.slice(0, 5),
  },
  {
    label: 'Progress',
    items: STUDENT_SIDEBAR.slice(5, 7),
  },
  {
    label: 'Other Subjects',
    items: STUDENT_SIDEBAR.slice(7, 10),
  },
  {
    label: 'Secondary',
    items: [STUDENT_SIDEBAR[10]],
  },
];

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
    sidebar: studentSidebarGroups,
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
      { to: '/parent/children', label: 'Children', icon: Users, description: 'Open a child profile to access assignments, progress and worksheets.' },
      { to: '/parent/profile', label: 'Parent profile', icon: BookOpen, description: 'Update your family account and settings.' },
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
        ],
      },
      {
        label: 'Support',
        items: [
          { to: '/tutor/availability', label: 'Availability', icon: CalendarDays },
          { to: '/tutor/training', label: 'Training', icon: GraduationCap },
        ],
      },
    ],
    more: [
      { to: '/tutor/availability', label: 'Availability', icon: CalendarDays, description: 'Manage your teaching schedule.' },
      { to: '/tutor/training', label: 'Training', icon: GraduationCap, description: 'Continue tutor development and certification.' },
      { to: '/tutor/students', label: 'Lesson Notes & Prep', icon: Users, description: 'Open a student profile to access lesson notes and prep tools.' },
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
