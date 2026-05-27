// Single source of truth for the Tian OS module catalog. The student dashboard
// and any module grid render from this list, so adding a module later is a
// one-line change. Status gates what's clickable vs. "coming soon".
//
// MVP scope: Math is the core. English = Spelling only (no Reading/Comprehension/
// Writing/Cloze — ever). See docs/tian-os-master-product-spec.md §2.
import {
  Calculator, Timer, Wrench, FileText, Network, SpellCheck, FlaskConical, Sprout, Cog,
} from 'lucide-react';

// status: 'live' (built) | 'soon' (placeholder/coming soon)
// section: groups modules on the dashboard. Omitted = the core (Primary) set;
// 'Secondary' = lower-secondary subject tools (e.g. D&T Mechanisms Playground).
export const MODULES = [
  {
    key: 'mathpath', name: 'MathPath', icon: Calculator, path: '/student/mathpath',
    purpose: 'Adaptive math mastery — your personalised pathway.', status: 'live',
    primary: true,
  },
  {
    key: 'fluency', name: 'Fluency Practice', icon: Timer, path: '/student/mathpath/fluency',
    purpose: 'Short timed drills to build speed and accuracy.', status: 'live',
  },
  {
    key: 'mistakes', name: 'Mistake-to-Mastery', icon: Wrench, path: '/student/mathpath/mistakes',
    purpose: 'Turn recent slips into targeted practice.', status: 'live',
  },
  {
    key: 'worksheets', name: 'Mastery Worksheet', icon: FileText, path: '/student/worksheets',
    purpose: 'Focused practice sets from your weak skills.', status: 'soon',
  },
  {
    key: 'progress', name: 'Skill Graph', icon: Network, path: '/student/progress',
    purpose: 'See your mastery map and what unlocks next.', status: 'soon',
  },
  {
    key: 'spelling', name: 'Spelling Practice', icon: SpellCheck, path: '/student/spelling',
    purpose: 'Spelling fluency and retention. English · Spelling.', status: 'live',
  },
  {
    key: 'science', name: 'Science Adaptive Revision', icon: FlaskConical, path: '/student/science',
    purpose: 'Open-ended science mastery and revision.', status: 'live',
  },
  {
    key: 'lifelab', name: 'LifeLab', icon: Sprout, path: '/student/lifelab',
    purpose: 'Real-life Math and Science activities.', status: 'soon',
  },
  {
    key: 'mechanisms', name: 'Mechanisms Playground', icon: Cog, path: '/secondary/mechanisms',
    purpose: 'Explore gears, levers, pulleys and linkages through interactive D&T simulations.',
    status: 'live', section: 'Secondary',
  },
];

// Modules grouped by dashboard section, in display order. Core (Primary) first,
// then Secondary subject tools.
export const SECTIONS = [
  { key: 'core', label: null, modules: MODULES.filter((m) => !m.section) },
  { key: 'secondary', label: 'Secondary', modules: MODULES.filter((m) => m.section === 'Secondary') },
];
