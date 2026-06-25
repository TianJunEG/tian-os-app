import React from 'react';
import { Star, Medal } from 'lucide-react';

// Star rating (1–3) + medal for a mastery / score percentage.
//
// Once a skill is attempted it earns at least one star; the count climbs with
// the score, and reaching mastery (>= 90%) earns all three stars plus a medal
// and stronger emphasis. Thresholds mirror the proficient(70) / mastered(90)
// bands already used across the learning paths.
export const MASTERED_PCT = 90;
export const PROFICIENT_PCT = 70;

export function starsFor(pct) {
  const p = Number(pct) || 0;
  if (p >= MASTERED_PCT) return 3;
  if (p >= PROFICIENT_PCT) return 2;
  if (p > 0) return 1;
  return 0;
}

const MASTERED_STATUSES = ['mastered', 'accurate', 'fluent', 'retained'];
const IN_PROGRESS_STATUSES = ['learning', 'needsReview', 'needs_review', 'weak', 'forgotten', 'started'];

// Resolve an effective mastery percentage from a learning-path skill state
// (a status string + optional accuracy). Mastered statuses always earn the full
// three stars + medal; otherwise use the real accuracy when known, else a single
// star for any in-progress skill and nothing for a not-yet-started one.
export function effectiveMasteryPct(status = '', accuracy = null) {
  if (MASTERED_STATUSES.includes(status)) return 100;
  const acc = Number(accuracy);
  if (Number.isFinite(acc) && acc > 0) return acc;
  if (IN_PROGRESS_STATUSES.includes(status)) return 40;
  return 0;
}

const SIZES = {
  sm: { star: 'h-4 w-4', gap: 'gap-0.5', label: 'text-xs' },
  md: { star: 'h-5 w-5', gap: 'gap-1', label: 'text-sm' },
  lg: { star: 'h-8 w-8', gap: 'gap-1.5', label: 'text-sm' },
};

export default function MasteryStars({
  percentage = 0,
  size = 'sm',
  showMedal = true,
  showLabel = false,
  className = '',
}) {
  const pct = Number(percentage) || 0;
  const filled = starsFor(pct);
  if (filled === 0) return null; // not attempted yet — nothing to show

  const mastered = pct >= MASTERED_PCT;
  const sz = SIZES[size] || SIZES.sm;
  const label = mastered ? 'Mastered' : filled === 2 ? 'Proficient' : 'In progress';

  return (
    <span
      className={`inline-flex items-center ${sz.gap} ${className}`}
      role="img"
      aria-label={mastered ? 'Mastered — three stars and a medal' : `${filled} of 3 stars`}
    >
      <span className={`inline-flex items-center ${sz.gap}`}>
        {[0, 1, 2].map((i) => (
          <Star
            key={i}
            className={`${sz.star} ${i < filled ? 'fill-gold text-gold' : 'fill-none text-line-strong'} ${mastered && i < filled ? 'drop-shadow-[0_1px_2px_rgba(217,137,46,0.45)]' : ''}`}
            strokeWidth={2}
          />
        ))}
      </span>
      {mastered && showMedal && <Medal className={`${sz.star} text-gold-deep`} />}
      {showLabel && (
        <span className={`font-semibold ${sz.label} ${mastered ? 'text-gold-deep' : filled === 2 ? 'text-emerald-deep' : 'text-ink-500'}`}>
          {label}
        </span>
      )}
    </span>
  );
}
