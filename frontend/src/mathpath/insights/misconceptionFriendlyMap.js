// Parent-facing translations of machine misconception tags.
//
// Parents must never see a raw slug like "frac/add-without-common" or jargon
// like "incorrect_method". This module turns a tag into a short plain-English
// explanation of what the child likely misunderstood, plus a one-line tip for
// what to try at home.
//
// Sources, in priority order:
//   1. EXPLICIT_FRIENDLY below — hand-written, parent-voiced entries for the
//      most common tags across all MathPath domains.
//   2. The structured domain maps that already carry description + remediation
//      (ratioRate, percentages) — reused so we don't duplicate that copy.
//   3. humanizeTag() — a slug-to-sentence fallback so an unmapped tag still
//      reads as meaning, never as an underscore/slash slug.

import RATIO_RATE_MISCONCEPTION_MAP from '../../../../shared/mathpath/ratioRate/ratioRateMisconceptionMap.js';
import { getMisconception as getPercentageMisconception } from '../../../../shared/mathpath/percentages/percentageMisconceptionMap.js';

// Hand-written, parent-friendly entries. plainExplanation = what the child
// likely misunderstood (no jargon); atHomeTip = one concrete thing to try.
const EXPLICIT_FRIENDLY = {
  // Fractions (the original gap that surfaced this work)
  'frac/add-without-common': {
    plainExplanation: 'Your child added the tops and bottoms of the fractions straight across, instead of giving them the same bottom number first.',
    atHomeTip: 'Use a pizza or chocolate-bar drawing to show why the slices need to be the same size before you can add them.',
  },
  'frac/add-denominators': {
    plainExplanation: 'Your child added the bottom numbers of the fractions, which changes the size of the pieces.',
    atHomeTip: 'Show that 1/2 + 1/2 makes one whole, not 2/4, using a folded piece of paper.',
  },

  // Addition / subtraction
  'add/forgot-carry': {
    plainExplanation: 'Your child added the columns but forgot to carry the extra ten into the next column.',
    atHomeTip: 'Practise a few sums together, saying "carry the one" out loud at each step.',
  },
  'add/place-misalign': {
    plainExplanation: 'The digits were not lined up by place value, so tens and ones got added together.',
    atHomeTip: 'Use squared paper so each digit sits in its own column.',
  },
  'add/count-all': {
    plainExplanation: 'Your child counted from one every time instead of counting on from the bigger number.',
    atHomeTip: 'For 8 + 3, practise starting at 8 and counting "9, 10, 11".',
  },
  'sub/smaller-from-larger': {
    plainExplanation: 'Your child took the smaller digit from the larger one in each column, rather than borrowing.',
    atHomeTip: 'Show how to "borrow" a ten when the top digit is smaller, using coins or counters.',
  },
  'sub/across-zeros': {
    plainExplanation: 'Borrowing across zeros tripped your child up.',
    atHomeTip: 'Work through a sum like 300 − 142 slowly together, one borrow at a time.',
  },

  // Multiplication / division
  'mult/forgot-carry': {
    plainExplanation: 'A carried number was dropped during the multiplication.',
    atHomeTip: 'Encourage writing the carried digit down small above the next column.',
  },
  'mult/missing-placeholder': {
    plainExplanation: 'When multiplying by tens, the placeholder zero was left out, making the answer too small.',
    atHomeTip: 'Remind your child to add a zero before multiplying by the tens digit.',
  },
  'div/ignore-remainder': {
    plainExplanation: 'Your child stopped before dealing with the remainder, or ignored it.',
    atHomeTip: 'Use sharing out sweets to show what the "left over" remainder means.',
  },
  'div/order-reversal': {
    plainExplanation: 'The two numbers in the division were swapped around.',
    atHomeTip: 'Read the question aloud: "how many groups fit into the total" tells you which number goes first.',
  },

  // Place value
  'pv/digit-vs-value': {
    plainExplanation: 'Your child read a digit on its own rather than what it is worth in its place (e.g. the 3 in 30 is worth thirty).',
    atHomeTip: 'Build numbers with place-value blocks or coins to show each digit\'s value.',
  },
  'pv/zero-placeholder': {
    plainExplanation: 'A zero that holds a place was left out, changing the size of the number.',
    atHomeTip: 'Write numbers like 305 together and talk about why the middle zero matters.',
  },

  // Rounding / estimation
  'round/always-up': {
    plainExplanation: 'Your child rounded every number up instead of looking at the next digit.',
    atHomeTip: 'Use a number line to see which whole number a value is closest to.',
  },
  'round/wrong-digit': {
    plainExplanation: 'The rounding was done from the wrong digit.',
    atHomeTip: 'Underline the digit being rounded together before deciding up or down.',
  },

  // Geometry / measurement
  'geo/perimeter-vs-area': {
    plainExplanation: 'Your child mixed up perimeter (the distance around) with area (the space inside).',
    atHomeTip: 'Walk around the edge of a rug for perimeter, then count the tiles inside for area.',
  },
  'ap/perimeter-area-confuse': {
    plainExplanation: 'Your child mixed up perimeter (the distance around) with area (the space inside).',
    atHomeTip: 'Walk around the edge of a rug for perimeter, then count the tiles inside for area.',
  },
  'geo/radius-diameter-confuse': {
    plainExplanation: 'The radius (centre to edge) and diameter (right across) of the circle were swapped.',
    atHomeTip: 'Draw a circle and label the line across (diameter) as twice the line from the middle (radius).',
  },
  'mea/wrong-unit': {
    plainExplanation: 'The answer used the wrong unit of measurement.',
    atHomeTip: 'Talk about what each unit measures — cm for length, ml for liquid — before answering.',
  },
  'mea/convert-direction': {
    plainExplanation: 'When converting units, your child multiplied where they should have divided (or the other way round).',
    atHomeTip: 'Ask "am I going to a bigger or smaller unit?" to decide whether the number should grow or shrink.',
  },

  // Algebra
  'alg/letter-as-label': {
    plainExplanation: 'Your child treated the letter as a label or object instead of a number that can vary.',
    atHomeTip: 'Talk about the letter as "some number we don\'t know yet" rather than a thing.',
  },
  'alg/combine-unlike': {
    plainExplanation: 'Different kinds of terms were added together as if they were the same.',
    atHomeTip: 'Compare it to adding apples and oranges — you can only combine the same kind.',
  },

  // Statistics
  'stat/mean-not-divide': {
    plainExplanation: 'Your child added the values to find the average but forgot to divide by how many there were.',
    atHomeTip: 'Find the average of a few everyday numbers together, saying "add them all, then share equally".',
  },

  // Time
  'tim/base-10-error': {
    plainExplanation: 'Your child treated time like normal counting, but an hour has 60 minutes, not 100.',
    atHomeTip: 'Use a clock face to count on in minutes past the hour.',
  },
};

function fromStructuredMap(tag) {
  // Ratio & Rate: tag-keyed object with { description, remediation }.
  const rr = RATIO_RATE_MISCONCEPTION_MAP[tag];
  if (rr && (rr.description || rr.remediation)) {
    return { plainExplanation: rr.description || '', atHomeTip: rr.remediation || '' };
  }
  // Percentages: array catalogue; entries carry a parent-voiced parentNote.
  const pct = getPercentageMisconception(tag);
  if (pct && (pct.description || pct.parentNote)) {
    return { plainExplanation: pct.description || '', atHomeTip: pct.parentNote || '' };
  }
  return null;
}

// Turn an unmapped slug into a readable phrase. Never returns a slug.
export function humanizeTag(tag = '') {
  const raw = String(tag || '').trim();
  if (!raw) return '';
  // Drop the domain prefix (e.g. "geo/") — parents don't need the namespace.
  const body = raw.includes('/') ? raw.slice(raw.indexOf('/') + 1) : raw;
  const words = body.replace(/[_-]+/g, ' ').trim();
  if (!words) return '';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const GENERIC_TIP =
  'Review this question together and ask your child to explain each step aloud — it often surfaces exactly where the idea slipped.';

// Resolve a tag to parent-friendly { plainExplanation, atHomeTip }.
// Always returns usable copy; falls back to a humanized phrase + generic tip
// so a parent never sees a raw slug or diagnostic jargon.
export function getFriendlyMisconception(tag = '') {
  const clean = String(tag || '').trim();
  if (!clean) return null;

  const explicit = EXPLICIT_FRIENDLY[clean];
  if (explicit) return { ...explicit };

  const structured = fromStructuredMap(clean);
  if (structured) {
    return {
      plainExplanation: structured.plainExplanation,
      atHomeTip: structured.atHomeTip || GENERIC_TIP,
    };
  }

  const phrase = humanizeTag(clean);
  if (!phrase) return null;
  return {
    plainExplanation: `This looks like a recurring slip with: ${phrase.toLowerCase()}.`,
    atHomeTip: GENERIC_TIP,
  };
}

export default getFriendlyMisconception;
