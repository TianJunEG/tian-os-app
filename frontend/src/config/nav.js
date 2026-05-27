// Role-based navigation for the unified Tian OS shell. One config drives both
// the desktop sidebar and the mobile bottom nav. Role controls which set shows;
// workspace controls the data within. See master spec §11.
import {
  Home, Calculator, GitBranch, ClipboardList, Users, CalendarDays, GraduationCap,
  LayoutGrid, BookOpen, FlaskConical, MoreHorizontal, BarChart3,
} from 'lucide-react';

// `bottom` = mobile bottom-nav items (max 5). `sidebar` = desktop/tablet items.
export const NAV = {
  student: {
    bottom: [
      { to: '/student', label: 'Home', icon: Home },
      { to: '/student/mathpath', label: 'MathPath', icon: Calculator },
      { to: '/student/progress', label: 'Pathway', icon: GitBranch },
      { to: '/student/assignments', label: 'Tasks', icon: ClipboardList },
    ],
    sidebar: [
      { to: '/student', label: 'Home', icon: Home },
      { to: '/student/mathpath', label: 'MathPath', icon: Calculator },
      { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
      { to: '/student/progress', label: 'Progress', icon: GitBranch },
    ],
  },
  parent: {
    bottom: [
      { to: '/parent', label: 'Home', icon: Home },
      { to: '/parent/children', label: 'Children', icon: Users },
      { to: '/more', label: 'More', icon: MoreHorizontal },
    ],
    sidebar: [
      { to: '/parent', label: 'Home', icon: Home },
      { to: '/parent/children', label: 'Children', icon: Users },
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
      { to: '/tutor', label: 'Home', icon: Home },
      { to: '/tutor/students', label: 'Students', icon: Users },
      { to: '/tutor/homework', label: 'Homework', icon: ClipboardList },
      { to: '/tutor/availability', label: 'Availability', icon: CalendarDays },
      { to: '/tutor/training', label: 'Training', icon: GraduationCap },
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
      { to: '/teacher', label: 'Home', icon: Home },
      { to: '/teacher/classes', label: 'Classes', icon: LayoutGrid },
      { to: '/teacher/lifelab', label: 'LifeLab', icon: FlaskConical },
    ],
  },
};

export const ROLE_HOME = {
  student: '/student', parent: '/parent', tutor: '/tutor', teacher: '/teacher', admin: '/admin',
};
