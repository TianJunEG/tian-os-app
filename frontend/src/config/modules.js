// Single source of truth for the Tian OS module catalog. The student dashboard
// and any module grid render from this list, so adding a module later is a
// one-line change. Status gates what's clickable vs. "coming soon".
//
// MVP scope: Math is the core. English = Spelling only (no Reading/Comprehension/
// Writing/Cloze — ever). See docs/tian-os-master-product-spec.md §2.
import {
  Calculator, Timer, Wrench, FileText, Network, SpellCheck, FlaskConical, Sprout, Cog, BookOpen,
} from 'lucide-react';
import { FEATURE_FLAGS } from './featureFlags';

// status: 'live' (built) | 'soon' (placeholder/coming soon)
// section: groups modules on the dashboard. Omitted = the core (Primary) set;
// 'Secondary' = lower-secondary subject tools (e.g. D&T Mechanisms Playground).
const ALL_MODULES = [
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
    key: 'progress', name: 'Progress', icon: Network, path: '/student/progress',
    purpose: 'See your mastery map and what unlocks next.', status: 'live',
  },
  {
    key: 'spelling', name: 'Spelling Practice', icon: SpellCheck, path: '/student/spelling',
    purpose: 'Spelling fluency and retention. English · Spelling.', status: 'live',
  },
  {
    key: 'englishpath', name: 'Vocabulary Builder', icon: BookOpen, path: '/student/english/vocab',
    purpose: 'Learn the words the P6 paper tests, step by step. English · Vocabulary.', status: 'live',
  },
  {
    key: 'science', name: 'Science Adaptive Revision', icon: FlaskConical, path: '/student/science',
    purpose: 'Open-ended science mastery and revision.', status: 'soon',
  },
  {
    key: 'lifelab', name: 'LifeLab', icon: Sprout, path: '/student/lifelab',
    purpose: 'Real-life Math and Science activities.', status: 'live',
  },
  {
    key: 'mechanisms', name: 'Mechanisms Playground', icon: Cog, path: '/secondary/mechanisms',
    purpose: 'Explore gears, levers, pulleys and linkages through interactive D&T simulations.',
    status: 'soon', section: 'Secondary',
  },
];

// Filter modules based on FEATURE_FLAGS. For v0.1 we expose MathPath+core
// modules. Worksheets show as "soon" but remain visible so users see what's
// coming. Everything else is hidden.
export const MODULES = ALL_MODULES.filter((m) => {
  switch (m.key) {
    case 'mathpath': return FEATURE_FLAGS.mathpath;
    case 'fluency': return FEATURE_FLAGS.fluency;
    case 'mistakes': return FEATURE_FLAGS.mistakes;
    case 'progress': return FEATURE_FLAGS.progress;
    case 'worksheets': return FEATURE_FLAGS.worksheets;
    case 'spelling': return FEATURE_FLAGS.spelling;
    case 'englishpath': return FEATURE_FLAGS.englishpath;
    case 'science': return FEATURE_FLAGS.science;
    case 'lifelab': return FEATURE_FLAGS.lifelab;
    case 'mechanisms': return FEATURE_FLAGS.mechanisms;
    default: return false;
  }
});

// Modules grouped by dashboard section, in display order. Core (Primary) first,
// then Secondary subject tools.
export const SECTIONS = [
  { key: 'core', label: null, modules: MODULES.filter((m) => !m.section) },
  { key: 'secondary', label: 'Secondary', modules: MODULES.filter((m) => m.section === 'Secondary') },
];
