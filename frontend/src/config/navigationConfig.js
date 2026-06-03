import {
  Home, Calculator, ClipboardList, GitBranch, FileText, Users, BookOpen, CalendarDays,
  LayoutGrid, CheckSquare, Book, MessageSquare, Sparkles, UserCircle,
} from 'lucide-react';
import FEATURE_FLAGS from './featureFlags';
import VERSION from './version';

// Helper to compare semantic vX.Y strings -> numeric for minVersion checks
const vnum = (v) => parseFloat(String(v).replace(/^v/, '')) || 0;
const currentV = vnum(VERSION);

// Centralized nav item catalogue. Each entry describes visibility rules and
// metadata used to construct sidebars, bottoms, and 'more' lists for roles.
export const NAV_ITEMS = [
  // Student
  { key: 'student.dashboard', label: 'Home', path: '/student', icon: Home, roles: ['student'], minVersion: 'v0.1' },
  { key: 'student.mathpath', label: 'MathPath', path: '/student/mathpath', icon: Calculator, roles: ['student'], minVersion: 'v0.1' },
  { key: 'student.practice', label: 'Practice', path: '/student/assignments', icon: ClipboardList, roles: ['student'], minVersion: 'v0.1' },
  { key: 'student.mistakes', label: 'Mistakes', path: '/student/mathpath/mistakes', icon: CheckSquare, roles: ['student'], minVersion: 'v0.1' },
  { key: 'student.progress', label: 'Progress', path: '/student/progress', icon: GitBranch, roles: ['student'], minVersion: 'v0.1' },
  { key: 'student.profile', label: 'Profile', path: '/student/profile', icon: UserCircle, roles: ['student'], minVersion: 'v0.1' },
  { key: 'student.worksheets', label: 'Worksheets', path: '/student/worksheets', icon: FileText, roles: ['student'], minVersion: 'v0.2', featureFlag: 'worksheets' },

  // Parent (v0.3+)
  { key: 'parent.home', label: 'Home', path: '/parent', icon: Home, roles: ['parent'], minVersion: 'v0.3', featureFlag: 'parent' },
  { key: 'parent.children', label: 'Children', path: '/parent/children', icon: Users, roles: ['parent'], minVersion: 'v0.3', featureFlag: 'parent' },
  { key: 'parent.progress', label: 'Child Progress', path: '/parent/children/:studentId/progress', icon: GitBranch, roles: ['parent'], minVersion: 'v0.3', featureFlag: 'parent' },
  { key: 'parent.weak', label: 'Weak Areas', path: '/parent/children/:studentId/weak-topics', icon: BookOpen, roles: ['parent'], minVersion: 'v0.3', featureFlag: 'parent' },
  { key: 'parent.recommend', label: 'Recommendations', path: '/parent/children/:studentId/actions', icon: CalendarDays, roles: ['parent'], minVersion: 'v0.3', featureFlag: 'parent' },
  { key: 'parent.worksheets', label: 'Worksheets', path: '/parent/children/:studentId/worksheets', icon: FileText, roles: ['parent'], minVersion: 'v0.3', featureFlag: 'worksheets' },

  // Tutor (v0.4+)
  { key: 'tutor.home', label: 'Home', path: '/tutor', icon: Home, roles: ['tutor'], minVersion: 'v0.4', featureFlag: 'tutor' },
  { key: 'tutor.students', label: 'Students', path: '/tutor/students', icon: Users, roles: ['tutor'], minVersion: 'v0.4', featureFlag: 'tutor' },
  { key: 'tutor.lessonprep', label: 'Lesson Prep', path: '/tutor/students/:id/lesson-prep', icon: Book, roles: ['tutor'], minVersion: 'v0.4', featureFlag: 'tutor' },
  { key: 'tutor.assign', label: 'Assign Practice', path: '/tutor/students/:id/assign-homework', icon: ClipboardList, roles: ['tutor'], minVersion: 'v0.4', featureFlag: 'tutor' },
  { key: 'tutor.mistakehistory', label: 'Mistake History', path: '/tutor/students/:id/mistakes', icon: BookOpen, roles: ['tutor'], minVersion: 'v0.4', featureFlag: 'tutor' },
  { key: 'tutor.worksheets', label: 'Worksheets', path: '/parent/children/:studentId/worksheets', icon: FileText, roles: ['tutor'], minVersion: 'v0.4', featureFlag: 'worksheets' },

  // Teacher (v0.5+)
  { key: 'teacher.home', label: 'Home', path: '/teacher', icon: Home, roles: ['teacher'], minVersion: 'v0.5', featureFlag: 'teacher' },
  { key: 'teacher.classes', label: 'Classes', path: '/teacher/classes', icon: LayoutGrid, roles: ['teacher'], minVersion: 'v0.5', featureFlag: 'teacher' },
  { key: 'teacher.weakgroups', label: 'Weak Groups', path: '/teacher/classes/:id/groups', icon: BookOpen, roles: ['teacher'], minVersion: 'v0.5', featureFlag: 'teacher' },
  { key: 'teacher.assignments', label: 'Assign', path: '/teacher/classes/:id/assign', icon: ClipboardList, roles: ['teacher'], minVersion: 'v0.5', featureFlag: 'teacher' },
  { key: 'teacher.results', label: 'Results', path: '/teacher/classes/:id/reports', icon: Book, roles: ['teacher'], minVersion: 'v0.5', featureFlag: 'teacher' },
  { key: 'teacher.remediation', label: 'Remediation', path: '/teacher/classes/:id/interventions', icon: CheckSquare, roles: ['teacher'], minVersion: 'v0.5', featureFlag: 'teacher' },
];

// Build NAV shape consumed by AppShell and MobileNav
export function buildNav({ version = VERSION, featureFlags = FEATURE_FLAGS, role = 'student', showDisabled = false }) {
  const v = vnum(version);
  const items = NAV_ITEMS.filter((it) => {
    const meetsVersion = v >= vnum(it.minVersion || 'v0.0');
    const flagOk = it.featureFlag ? Boolean(featureFlags[it.featureFlag]) : true;
    return it.roles.includes(role) && (meetsVersion || showDisabled) && (flagOk || showDisabled);
  });

  // Sidebar: include main items and group by logical sections for roles
  const sidebar = items.map((it) => ({ to: it.path, label: it.label, icon: it.icon }));

  // Bottom nav: pick up to 5 priority items for mobile
  const bottom = items.slice(0, 5).map((it) => ({ to: it.path, label: it.label, icon: it.icon }));

  return { sidebar, bottom, all: items };
}

export default { NAV_ITEMS, buildNav };
