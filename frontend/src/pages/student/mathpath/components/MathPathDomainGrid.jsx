import React from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Hash, Percent, Scale, ListOrdered, Calculator, Coins, Clock,
  Ruler, Square, Box, Shapes, Circle, BarChart3, Variable,
} from 'lucide-react';

// The 15 MathPath domains, each linking to its existing learning-path route.
// Previously the dashboard only surfaced Fractions + Decimals; the other 13
// had routes but no entry point. Colour + icon per card keeps it lively for
// lower-primary learners rather than the old grey utility strip.
export const MATHPATH_DOMAINS = [
  { slug: 'fractions', label: 'Fractions', blurb: 'Parts, equivalence & operations', icon: PieChart, theme: 'from-violet-50 via-white to-sky-50 border-violet-100', chip: 'bg-violet-100 text-violet-700' },
  { slug: 'decimals', label: 'Decimals', blurb: 'Place value & conversions', icon: Hash, theme: 'from-amber-50 via-white to-orange-50 border-amber-100', chip: 'bg-amber-100 text-amber-700' },
  { slug: 'percentages', label: 'Percentage', blurb: 'Of amounts, change & discount', icon: Percent, theme: 'from-rose-50 via-white to-pink-50 border-rose-100', chip: 'bg-rose-100 text-rose-700' },
  { slug: 'ratio-rate', label: 'Ratio & Rate', blurb: 'Comparing & sharing', icon: Scale, theme: 'from-teal-50 via-white to-emerald-50 border-teal-100', chip: 'bg-teal-100 text-teal-700' },
  { slug: 'number-sense', label: 'Whole Numbers', blurb: 'Counting, place value & order', icon: ListOrdered, theme: 'from-sky-50 via-white to-indigo-50 border-sky-100', chip: 'bg-sky-100 text-sky-700' },
  { slug: 'operations', label: 'Four Operations', blurb: '+ − × ÷ and word problems', icon: Calculator, theme: 'from-indigo-50 via-white to-violet-50 border-indigo-100', chip: 'bg-indigo-100 text-indigo-700' },
  { slug: 'money', label: 'Money', blurb: 'Coins, change & spending', icon: Coins, theme: 'from-emerald-50 via-white to-mint-50 border-emerald-100', chip: 'bg-emerald-100 text-emerald-700' },
  { slug: 'time', label: 'Time', blurb: 'Clocks, duration & schedules', icon: Clock, theme: 'from-cyan-50 via-white to-sky-50 border-cyan-100', chip: 'bg-cyan-100 text-cyan-700' },
  { slug: 'measurement', label: 'Measurement', blurb: 'Length, mass & capacity', icon: Ruler, theme: 'from-lime-50 via-white to-emerald-50 border-lime-100', chip: 'bg-lime-100 text-lime-700' },
  { slug: 'area-perimeter', label: 'Area & Perimeter', blurb: 'Around & inside shapes', icon: Square, theme: 'from-orange-50 via-white to-amber-50 border-orange-100', chip: 'bg-orange-100 text-orange-700' },
  { slug: 'volume', label: 'Volume', blurb: 'Space inside solids', icon: Box, theme: 'from-fuchsia-50 via-white to-violet-50 border-fuchsia-100', chip: 'bg-fuchsia-100 text-fuchsia-700' },
  { slug: 'geometry', label: 'Geometry', blurb: 'Shapes, angles & lines', icon: Shapes, theme: 'from-blue-50 via-white to-cyan-50 border-blue-100', chip: 'bg-blue-100 text-blue-700' },
  { slug: 'circles', label: 'Circles', blurb: 'Radius, area & circumference', icon: Circle, theme: 'from-pink-50 via-white to-rose-50 border-pink-100', chip: 'bg-pink-100 text-pink-700' },
  { slug: 'statistics', label: 'Statistics', blurb: 'Graphs, tables & average', icon: BarChart3, theme: 'from-green-50 via-white to-teal-50 border-green-100', chip: 'bg-green-100 text-green-700' },
  { slug: 'algebra', label: 'Algebra', blurb: 'Unknowns & expressions', icon: Variable, theme: 'from-purple-50 via-white to-fuchsia-50 border-purple-100', chip: 'bg-purple-100 text-purple-700' },
];

export default function MathPathDomainGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {MATHPATH_DOMAINS.map(({ slug, label, blurb, icon: Icon, theme, chip }) => (
        <Link
          key={slug}
          to={`/student/mathpath/${slug}`}
          aria-label={`Open ${label}`}
          className={`group flex min-h-[7.5rem] flex-col rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald/30 ${theme}`}
        >
          <span className={`grid h-11 w-11 place-items-center rounded-2xl ${chip}`}>
            <Icon className="h-6 w-6" />
          </span>
          <h3 className="mt-3 font-display text-lg font-semibold leading-tight text-ink-900">{label}</h3>
          <p className="mt-1 text-xs leading-snug text-ink-500">{blurb}</p>
        </Link>
      ))}
    </div>
  );
}
