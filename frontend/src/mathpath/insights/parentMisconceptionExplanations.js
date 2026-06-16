// Parent-facing, plain-English explanations for MathPath misconception tags.
//
// Mistakes carry a machine tag (e.g. "frac/add-denominators", "geo/triangle-no-half").
// Parents should never see those slugs — they want to know, in everyday words, what
// their child likely misunderstood and one concrete thing to try at home.
//
// Resolution order (see getParentMisconception / describeMistakeForParent):
//   1. Exact tag → a curated { plainExplanation, atHomeTip }.
//   2. Domain prefix (the part before the "/") → a relevant, friendlier-than-a-slug line.
//   3. Generic fallback via buildParentInsight, so an unmapped tag still reads as plain
//      English — never a raw underscore/slash slug.
//
// This is domain-generic: any new domain's tags fall through to the prefix map, and any
// new prefix falls through to the generic builder. Seed new curated entries here as the
// tags that actually occur grow.

import { buildParentInsight } from './insightQualityEngine.js';

// prefix (text before "/") → the everyday topic name a parent would recognise.
const DOMAIN_TOPICS = {
  add: 'addition',
  sub: 'subtraction',
  mult: 'multiplication',
  div: 'division',
  count: 'counting',
  pv: 'place value',
  compare: 'comparing numbers',
  order: 'working through the steps in order',
  op: 'choosing the right operation',
  round: 'rounding',
  estimate: 'estimating',
  mental: 'mental maths',
  neg: 'negative numbers',
  frac: 'fractions',
  alg: 'algebra',
  geo: 'shapes and geometry',
  ap: 'area and perimeter',
  cir: 'circles',
  mea: 'measurement',
  mon: 'money',
  tim: 'time',
  vol: 'volume',
  stat: 'reading graphs and data',
  pattern: 'number patterns',
  rr: 'ratio and rate',
  psl: 'problem solving',
};

// Curated parent-friendly explanations, keyed by the exact misconception tag.
// plainExplanation: what the child likely misunderstood, in everyday words.
// atHomeTip: one concrete thing a parent can do at home.
const MISCONCEPTION_EXPLANATIONS = {
  // --- Addition ---
  'add/carry-cascade': { plainExplanation: 'When carrying into the next column, the carry did not get added all the way through, so a digit ended up wrong.', atHomeTip: 'Redo one sum together, saying out loud each carried "1" and where it goes.' },
  'add/count-all': { plainExplanation: 'Your child counted everything from one instead of counting on from the bigger number.', atHomeTip: 'Practise "counting on": start at the larger number and count up the smaller one on fingers.' },
  'add/forgot-carry': { plainExplanation: 'A ten was made but not carried into the next column, so the total came out too small.', atHomeTip: 'When a column adds past 9, point to the carried 1 and check it lands in the next column.' },
  'add/place-misalign': { plainExplanation: 'The numbers were not lined up by place value, so ones and tens got added together.', atHomeTip: 'Use squared paper so units sit under units and tens under tens.' },

  // --- Subtraction ---
  'sub/across-zeros': { plainExplanation: 'Borrowing across zeros got tangled, so the answer drifted off.', atHomeTip: 'Work one "borrow across zero" example slowly together, regrouping one column at a time.' },
  'sub/count-back-error': { plainExplanation: 'Counting back lost track somewhere, so the answer was a little out.', atHomeTip: 'Use a number line and hop back one step at a time, counting each hop aloud.' },
  'sub/smaller-from-larger': { plainExplanation: 'Your child took the smaller digit from the larger one in each column, even when the top digit was smaller, instead of borrowing.', atHomeTip: 'Show that when the top digit is smaller you must borrow ten from next door.' },

  // --- Multiplication ---
  'mult/append-zeros-decimal': { plainExplanation: 'When multiplying decimals, zeros were added like whole numbers and the decimal point ended up in the wrong place.', atHomeTip: 'Count the decimal places in both numbers and check the answer has the same total.' },
  'mult/forgot-carry': { plainExplanation: 'A carry was dropped while multiplying, so one column came out wrong.', atHomeTip: 'Redo one multiplication, writing the small carry digit each time.' },
  'mult/missing-placeholder': { plainExplanation: 'When multiplying by tens, the zero placeholder was left out, so the rows did not line up.', atHomeTip: 'Remind them to put a 0 in the ones place before multiplying by the tens digit.' },
  'mult/repeated-add-slow': { plainExplanation: 'Your child is still adding over and over instead of using times-tables, which is slow and easy to slip on.', atHomeTip: 'Practise the relevant times-table for a few minutes so it becomes quick recall.' },

  // --- Division ---
  'div/bad-estimate': { plainExplanation: 'The estimate for how many times the number divides was off, which threw out the answer.', atHomeTip: 'Guess the answer roughly first, then check it by multiplying back.' },
  'div/drop-zero': { plainExplanation: 'A zero was dropped in the answer, making it ten times too small.', atHomeTip: 'Check each place: if a digit will not divide, write a 0 there and carry on.' },
  'div/ignore-remainder': { plainExplanation: 'The leftover (remainder) was ignored instead of being used or explained.', atHomeTip: 'Ask "what is left over, and what does it mean in this question?"' },
  'div/order-reversal': { plainExplanation: 'The two numbers were divided the wrong way round.', atHomeTip: 'Read it as "how many groups fit" to check which number goes inside the division.' },

  // --- Counting ---
  'count/decade-boundary': { plainExplanation: 'Counting tripped at a tens boundary, like going 29 to 20 instead of 30.', atHomeTip: 'Practise counting over tens: 28, 29, 30, 31 out loud.' },
  'count/hundred-boundary': { plainExplanation: 'Counting stumbled crossing a hundred, like 199 to 100.', atHomeTip: 'Practise counting across hundreds: 198, 199, 200, 201.' },
  'count/lose-step': { plainExplanation: 'A number got skipped or repeated while counting.', atHomeTip: 'Count slowly together, touching each object once.' },
  'count/teen-ty': { plainExplanation: 'Teen and "ty" numbers got mixed up, like fourteen and forty.', atHomeTip: 'Say the pairs side by side: thirteen/thirty, fourteen/forty.' },

  // --- Place value ---
  'pv/digit-vs-value': { plainExplanation: 'Your child read a digit on its own instead of what it is worth in its place — the 3 in 30 is thirty.', atHomeTip: 'Point at a digit and ask "how much is this one really worth here?"' },
  'pv/grouping': { plainExplanation: 'Grouping into tens and hundreds did not quite work out.', atHomeTip: 'Use bundles of ten straws or base-ten blocks to rebuild the number.' },
  'pv/place-name': { plainExplanation: 'A place-value name (tens, hundreds, thousands) got mixed up.', atHomeTip: 'Write a number and take turns naming each column.' },
  'pv/zero-placeholder': { plainExplanation: 'A zero that holds a place was left out, which changed the size of the number.', atHomeTip: 'Show how 205 needs the 0 to keep the 2 in the hundreds.' },

  // --- Comparing ---
  'compare/leading-digit': { plainExplanation: 'Numbers were compared by the first digit only, ignoring how many digits there are.', atHomeTip: 'Line numbers up by place value and compare from the left, digit by digit.' },
  'compare/length-not-value': { plainExplanation: 'A decimal was judged "bigger" because it had more digits, not more value.', atHomeTip: 'Compare decimals place by place: 0.5 is bigger than 0.45.' },

  // --- Order of operations ---
  'order/by-length': { plainExplanation: 'Items were put in order by how long they look rather than their value.', atHomeTip: 'Compare the actual values, not the number of digits.' },
  'order/ignore-brackets': { plainExplanation: 'Brackets were skipped, so the steps were done in the wrong order.', atHomeTip: 'Remind them to do whatever is inside the brackets first.' },
  'order/left-to-right': { plainExplanation: 'The sum was worked strictly left to right instead of doing × and ÷ before + and −.', atHomeTip: 'Practise "multiply and divide before add and subtract".' },
  'order/local-not-global': { plainExplanation: 'Part of the problem was ordered correctly, but not the whole thing.', atHomeTip: 'Reread the question and order all the steps from start to finish.' },

  // --- Operation choice ---
  'op/factor-multiple-confuse': { plainExplanation: 'Factors and multiples got swapped — factors divide into a number, multiples are its times-table.', atHomeTip: 'Say it together: factors are small and go INTO it; multiples are big and come FROM it.' },
  'op/hcf-lcm-confuse': { plainExplanation: 'Highest common factor and lowest common multiple got mixed up.', atHomeTip: 'HCF is the biggest number that divides both; LCM is the smallest both go into.' },
  'op/model-wrong-parts': { plainExplanation: 'When drawing the bar model, the parts and the whole were placed wrongly.', atHomeTip: 'Ask "what is the whole, and what are the parts?" before drawing.' },
  'op/wrong-operation-choice': { plainExplanation: 'Your child picked the wrong operation for what the question was asking.', atHomeTip: 'Underline the key words and ask whether the amount should get bigger or smaller.' },

  // --- Rounding ---
  'round/always-up': { plainExplanation: 'Every number was rounded up instead of rounding to the nearest.', atHomeTip: 'Check the next digit: 5 or more rounds up, 4 or less rounds down.' },
  'round/no-cascade': { plainExplanation: 'Rounding did not carry through — 99 to the nearest ten should become 100.', atHomeTip: 'Try rounding 95, 99 and 199 to see when the rounding "tips over".' },

  // --- Estimating ---
  'estimate/exact-not-estimate': { plainExplanation: 'Your child worked out the exact answer instead of a quick estimate.', atHomeTip: 'Practise rounding first, then estimating, before doing the full sum.' },
  'estimate/ignore-check': { plainExplanation: 'An estimate was not used to check whether the real answer looked sensible.', atHomeTip: 'After answering, ask "is this close to my estimate?"' },
  'estimate/round-one': { plainExplanation: 'Only one of the numbers was rounded when estimating.', atHomeTip: 'Round both numbers to easy values before adding or multiplying.' },

  // --- Mental strategies ---
  'mental/no-compensation': { plainExplanation: 'A friendlier mental strategy, like +10 then −1, was not used.', atHomeTip: 'Show that "+9 is the same as +10 then take 1 back".' },
  'mental/no-factoring': { plainExplanation: 'Breaking a number into easier factors was not used to make the maths simpler.', atHomeTip: 'Show that "× 6" can be "× 2 then × 3".' },

  // --- Negative numbers ---
  'neg/direction': { plainExplanation: 'Which way to move on the number line with negatives got muddled.', atHomeTip: 'Use a number line: subtracting moves left, adding moves right.' },
  'neg/magnitude-order': { plainExplanation: 'Negative numbers were ordered by size instead of position — −7 is smaller than −2.', atHomeTip: 'On a number line, the further left, the smaller, even for negatives.' },
  'neg/order-like-positive': { plainExplanation: 'Negatives were ordered as if they were positive numbers.', atHomeTip: 'Remind them −10 is less than −1, not more.' },

  // --- Fractions (also referenced by the mistakes route's labels) ---
  'frac/add-denominators': { plainExplanation: 'Your child added the top and bottom numbers straight across instead of finding a common denominator first.', atHomeTip: 'Use paper strips to show 1/2 + 1/4: rename 1/2 as 2/4, then add the quarters.' },
  'frac/add-without-common': { plainExplanation: 'Fractions were added before giving them the same bottom number (denominator).', atHomeTip: 'Show that the bottoms must match first: 1/2 becomes 2/4, then add.' },

  // --- Algebra ---
  'alg/3n-means-3-plus-n': { plainExplanation: 'Your child read "3n" as "3 plus n" instead of "3 times n".', atHomeTip: 'Say "3n means 3 lots of n" a few times with examples.' },
  'alg/combine-unlike': { plainExplanation: 'Unlike terms were added together, like adding apples and oranges.', atHomeTip: 'Only collect terms that match: the n\'s with the n\'s, plain numbers with numbers.' },
  'alg/distribute-partial': { plainExplanation: 'When expanding brackets, only the first term inside got multiplied.', atHomeTip: 'Show that 3(n + 2) multiplies BOTH parts: 3n + 6.' },
  'alg/equals-means-answer': { plainExplanation: 'The equals sign was read as "write the answer" rather than "both sides balance".', atHomeTip: 'Talk about "=" as a balance: whatever you do to one side, do to the other.' },
  'alg/letter-as-label': { plainExplanation: 'A letter was treated as a label (like "a" for apple) instead of a number we are finding.', atHomeTip: 'Remind them the letter stands for an unknown number.' },
  'alg/order-of-undo': { plainExplanation: 'The steps to undo an equation were done in the wrong order.', atHomeTip: 'Undo in reverse: deal with + or − first, then × or ÷.' },
  'alg/same-side-op': { plainExplanation: 'An operation was done to one side of the equation but not the other.', atHomeTip: 'Whatever you do to one side, do exactly the same to the other side.' },
  'alg/sub-no-times': { plainExplanation: 'When putting a value back in, the multiply step was missed.', atHomeTip: 'Show that if n = 4, then 3n means 3 × 4 = 12.' },
  'alg/word-order': { plainExplanation: 'The expression was written in the order the words came, not what the maths means.', atHomeTip: 'Talk through what each part means before writing the expression.' },
  'alg/wrong-relation': { plainExplanation: 'The relationship between the quantities was set up incorrectly.', atHomeTip: 'Reread the sentence and ask "which is bigger, and by how much?"' },

  // --- Geometry ---
  'geo/angle-by-arm-length': { plainExplanation: 'Your child judged an angle by how long its lines are, not how open it is.', atHomeTip: 'Show that longer lines do not make a bigger angle — it is about the opening.' },
  'geo/angle-relationship': { plainExplanation: 'An angle rule, like angles on a straight line, was not used.', atHomeTip: 'Look up which angles add to 90, 180 or 360 and label them.' },
  'geo/angle-sum-wrong': { plainExplanation: 'The angle total for the shape was wrong — a triangle\'s angles make 180.', atHomeTip: 'Recall: triangle angles add to 180, a four-sided shape to 360.' },
  'geo/area-add-sides': { plainExplanation: 'Area was found by adding the sides instead of multiplying.', atHomeTip: 'Area is length × width; adding the sides gives the perimeter instead.' },
  'geo/compass-confuse': { plainExplanation: 'Using the compass for a construction got muddled.', atHomeTip: 'Practise keeping the compass width fixed while drawing the arc.' },
  'geo/construction-precision': { plainExplanation: 'The construction was roughly right but not accurate enough.', atHomeTip: 'Use a sharp pencil and measure carefully with the ruler.' },
  'geo/diagonal-symmetry-miss': { plainExplanation: 'A diagonal line of symmetry was missed.', atHomeTip: 'Try folding the shape along a slanted line to test for symmetry.' },
  'geo/double-count-edges': { plainExplanation: 'Edges of the 3D shape were counted twice.', atHomeTip: 'Mark each edge once with a pencil as you count.' },
  'geo/faces-edges-confuse': { plainExplanation: 'Faces and edges got mixed up.', atHomeTip: 'Faces are the flat surfaces; edges are the lines where they meet.' },
  'geo/forgot-straight-edges': { plainExplanation: 'Some straight sides were missed when counting.', atHomeTip: 'Trace around the shape and count each side as you go.' },
  'geo/net-folding': { plainExplanation: 'Your child could not picture how the flat net folds into a solid.', atHomeTip: 'Print or trace the net and actually fold it into the shape.' },
  'geo/orientation-changes-shape': { plainExplanation: 'A shape was thought to change when it was just turned around.', atHomeTip: 'Turn a cut-out shape and show it is still the same shape.' },
  'geo/parallel-perp-confuse': { plainExplanation: 'Parallel and perpendicular lines got mixed up.', atHomeTip: 'Parallel lines never meet; perpendicular lines cross at a right angle, like an L.' },
  'geo/perimeter-vs-area': { plainExplanation: 'Perimeter and area were swapped.', atHomeTip: 'Perimeter is the distance around; area is the space inside.' },
  'geo/protractor-scale': { plainExplanation: 'The wrong scale on the protractor was read — the inner versus outer numbers.', atHomeTip: 'Start from the 0 line and follow that same scale round to the angle.' },
  'geo/quad-angle-relationship': { plainExplanation: 'An angle rule for four-sided shapes was not used.', atHomeTip: 'Remember the four angles of a quadrilateral add to 360.' },
  'geo/radius-diameter-confuse': { plainExplanation: 'Radius and diameter got mixed up.', atHomeTip: 'The diameter goes all the way across; the radius is half of it.' },
  'geo/reflect-not-translate': { plainExplanation: 'A reflection was done as a slide, or a slide as a reflection.', atHomeTip: 'Reflect means flip in a mirror line; translate means slide without turning.' },
  'geo/side-vertex-count': { plainExplanation: 'Sides and corners (vertices) got mixed up when counting.', atHomeTip: 'Count corners and sides separately, marking each as you go.' },
  'geo/square-not-rectangle': { plainExplanation: 'Your child did not see that a square is also a rectangle.', atHomeTip: 'Talk about how a square is a special rectangle with equal sides.' },
  'geo/triangle-by-look': { plainExplanation: 'A triangle was named by how it looks instead of its sides or angles.', atHomeTip: 'Check the actual side lengths and angles before naming it.' },
  'geo/triangle-no-half': { plainExplanation: 'The "halve it" step for a triangle\'s area was missed.', atHomeTip: 'Area of a triangle is half of base × height — do not forget the half.' },

  // --- Area & perimeter ---
  'ap/missing-side': { plainExplanation: 'An unknown side was not worked out before finding the perimeter or area.', atHomeTip: 'Use the sides you know to find the missing one first.' },
  'ap/overlap-region': { plainExplanation: 'An overlapping or shared region was counted twice or missed.', atHomeTip: 'Split the shape into clear rectangles and add the parts carefully.' },
  'ap/perimeter-area-confuse': { plainExplanation: 'Perimeter and area got swapped.', atHomeTip: 'Perimeter is the distance around; area is the space inside.' },
  'ap/triangle-no-half': { plainExplanation: 'The "halve it" step for a triangle\'s area was missed.', atHomeTip: 'Remember the area of a triangle is half of base × height.' },

  // --- Circles ---
  'cir/area-uses-diameter': { plainExplanation: 'The diameter was used in the circle area formula instead of the radius.', atHomeTip: 'Area uses the radius (half the diameter), squared.' },
  'cir/half-wrong': { plainExplanation: 'Halving the diameter to get the radius went wrong.', atHomeTip: 'The radius is exactly half the diameter — check that step.' },
  'cir/radius-diameter': { plainExplanation: 'Radius and diameter got mixed up.', atHomeTip: 'The diameter goes across the whole circle; the radius is half of it.' },

  // --- Measurement ---
  'mea/24hr-convert': { plainExplanation: 'Converting between 12-hour and 24-hour time went wrong.', atHomeTip: 'Practise: 3pm is 15:00 — add 12 to afternoon hours.' },
  'mea/area-units': { plainExplanation: 'Square units for area were missed or wrong — cm² not cm.', atHomeTip: 'Remind them area is measured in square units.' },
  'mea/capacity-volume-confuse': { plainExplanation: 'Capacity and volume got mixed up.', atHomeTip: 'Capacity is how much it holds; volume is how much space it takes up.' },
  'mea/compare-mixed-units': { plainExplanation: 'Amounts in different units were compared without converting first.', atHomeTip: 'Change both to the same unit before comparing.' },
  'mea/convert-direction': { plainExplanation: 'The conversion went the wrong way — multiplied where it should divide between units.', atHomeTip: 'Ask "am I going to a bigger or smaller unit?" to choose × or ÷.' },
  'mea/money-decimal-place': { plainExplanation: 'The decimal point in money was misplaced, mixing pounds and pence.', atHomeTip: 'Keep two digits after the point for pence: £3.05, not £3.5.' },
  'mea/net-dimensions': { plainExplanation: 'The measurements on a net were applied to the wrong faces.', atHomeTip: 'Match each rectangle on the net to the face it folds into.' },
  'mea/perimeter-units': { plainExplanation: 'Units for perimeter were wrong or missing.', atHomeTip: 'Perimeter is a length, so use plain units like cm or m.' },
  'mea/rate-volume-confuse': { plainExplanation: 'A rate, like litres per minute, and a total amount got mixed up.', atHomeTip: 'Check whether the question wants a "per" amount or a total.' },
  'mea/scale-interval': { plainExplanation: 'The size of each step on a scale was misread.', atHomeTip: 'Work out what one gap on the scale is worth before reading it.' },
  'mea/time-base-60': { plainExplanation: 'Time was treated like base-10 — 1.5 hours read as 1 hour 50 minutes.', atHomeTip: 'Remind them an hour is 60 minutes, so 1.5 hours is 1 hr 30 min.' },
  'mea/volume-add-edges': { plainExplanation: 'Volume was found by adding edges instead of multiplying.', atHomeTip: 'Volume is length × width × height.' },
  'mea/wrong-unit': { plainExplanation: 'The wrong unit was chosen for what was being measured.', atHomeTip: 'Match the unit to the size: mm/cm/m, ml/l, g/kg.' },

  // --- Money ---
  'mon/add-not-multiply': { plainExplanation: 'Repeated amounts were added one by one instead of multiplied.', atHomeTip: 'If it is the same price several times, multiply to save steps.' },
  'mon/cents-overflow': { plainExplanation: 'Pence over 99 were not carried into pounds.', atHomeTip: 'Remind them 100p makes £1 — carry the extra into pounds.' },
  'mon/change-direction': { plainExplanation: 'Change was worked out the wrong way round.', atHomeTip: 'Change = money given − price. Count up from the price to check.' },
  'mon/face-value': { plainExplanation: 'Coins were counted by how many there are, not their value.', atHomeTip: 'Count by value: a 20p is worth more than two 5p coins.' },
  'mon/money-decimal-place': { plainExplanation: 'The decimal point in money was misplaced.', atHomeTip: 'Keep two digits for pence: £4.05, not £4.5.' },

  // --- Time ---
  'tim/base-10-error': { plainExplanation: 'Time was treated like base-10 instead of 60 minutes in an hour.', atHomeTip: 'Remember 60 minutes make an hour, not 100.' },
  'tim/hour-half': { plainExplanation: 'Half and quarter hours were misread.', atHomeTip: 'Practise: half past is 30 minutes, quarter past is 15.' },
  'tim/minute-skip': { plainExplanation: 'Minutes were miscounted around the clock face.', atHomeTip: 'Count the minute marks in fives around the clock together.' },

  // --- Volume ---
  'vol/hidden-cubes': { plainExplanation: 'Cubes hidden at the back of a 3D drawing were not counted.', atHomeTip: 'Count layer by layer, including the cubes you cannot see.' },

  // --- Statistics / data ---
  'stat/ignore-key': { plainExplanation: 'The key or scale on the graph was ignored when reading values.', atHomeTip: 'Always check what one symbol or one square stands for first.' },
  'stat/mean-not-divide': { plainExplanation: 'When finding the mean (average), the dividing step was missed.', atHomeTip: 'Mean = add all the values, then divide by how many there are.' },
  'stat/mean-reverse': { plainExplanation: 'Working backwards from a mean to a total went wrong.', atHomeTip: 'Total = mean × how many values.' },
  'stat/pie-angle-fraction': { plainExplanation: 'A slice of the pie chart was not linked to its fraction or angle.', atHomeTip: 'Remember the whole pie is 360°, so half is 180°.' },
  'stat/point-misread': { plainExplanation: 'A point on the graph was read off slightly wrong.', atHomeTip: 'Use a ruler to trace across and down to the axes.' },
  'stat/row-column-mix': { plainExplanation: 'Rows and columns in the table got mixed up.', atHomeTip: 'Point to where the right row and column meet to read the value.' },
  'stat/scale-interval': { plainExplanation: 'Each step on the graph\'s scale was misjudged.', atHomeTip: 'Work out what one gridline is worth before reading values.' },
  'stat/trend-overread': { plainExplanation: 'More was read into the graph\'s trend than it actually shows.', atHomeTip: 'Stick to what the data shows, not what might happen next.' },

  // --- Patterns ---
  'pattern/assume-linear': { plainExplanation: 'Your child assumed the pattern grows by the same amount each time when it does not.', atHomeTip: 'Check the gap between several terms before deciding the rule.' },
  'pattern/op-confusion': { plainExplanation: 'The wrong operation was used to continue the pattern.', atHomeTip: 'Test the rule on two known terms before using it.' },
  'pattern/step-drift': { plainExplanation: 'The step size drifted partway through the pattern.', atHomeTip: 'Find the difference between terms and keep it consistent.' },

  // --- Ratio & rate ---
  'rr/add-not-multiply': { plainExplanation: 'Ratios were scaled by adding instead of multiplying.', atHomeTip: 'To keep a ratio the same, multiply both parts by the same number.' },
  'rr/additive-not-multiplicative': { plainExplanation: 'The amounts were compared by their difference rather than by ratio.', atHomeTip: 'Ask "how many times bigger?", not "how much more?"' },
  'rr/assume-total-constant': { plainExplanation: 'The total was assumed to stay the same when the ratio changed.', atHomeTip: 'Check whether the total or one part is what stays fixed.' },
  'rr/avg-of-speeds': { plainExplanation: 'Two speeds were simply averaged, which is not how average speed works.', atHomeTip: 'Average speed = total distance ÷ total time, not (speed1 + speed2) ÷ 2.' },
  'rr/flat-rate': { plainExplanation: 'A "per unit" rate was treated as a flat total.', atHomeTip: 'Check whether the price is per item or for the whole lot.' },
  'rr/forgot-total-units': { plainExplanation: 'The number of shares in the ratio was not totalled before sharing.', atHomeTip: 'Add the ratio parts first to find how many shares there are.' },
  'rr/formula-confusion': { plainExplanation: 'The speed, distance and time formula was used the wrong way.', atHomeTip: 'Use the triangle: distance = speed × time.' },
  'rr/incomplete-simplify': { plainExplanation: 'The ratio was not fully simplified.', atHomeTip: 'Keep dividing both parts until they share no common factor.' },
  'rr/no-common-term': { plainExplanation: 'Two ratios were compared without making a part match first.', atHomeTip: 'Make one quantity equal in both ratios before comparing.' },
  'rr/order-reversed': { plainExplanation: 'The ratio was written the wrong way round.', atHomeTip: 'Check which quantity comes first in the question.' },
  'rr/pairwise-only': { plainExplanation: 'A three-part ratio was handled in pairs and lost consistency.', atHomeTip: 'Keep all three parts together when scaling.' },
  'rr/part-part-as-fraction': { plainExplanation: 'A part-to-part ratio was read as a fraction of the whole.', atHomeTip: 'In 2:3, the first part is 2 out of 5, not 2 out of 3.' },
  'rr/part-whole-mixup': { plainExplanation: 'A part and the whole got swapped in the ratio.', atHomeTip: 'Be clear which number is one part and which is the total.' },
  'rr/percent-of-part': { plainExplanation: 'A percentage was taken of the wrong amount.', atHomeTip: 'Check what the percentage is "of" before working it out.' },
  'rr/rate-inverted': { plainExplanation: 'The rate was flipped — time per item instead of items per time.', atHomeTip: 'Read the units carefully: is it "per hour" or "hours per"?' },
  'rr/three-units-error': { plainExplanation: 'Handling three related quantities went wrong.', atHomeTip: 'Work with two quantities at a time, keeping units clear.' },
  'rr/unit-mismatch': { plainExplanation: 'Different units were combined without converting.', atHomeTip: 'Make the units match before calculating.' },

  // --- Problem solving ---
  'psl/arithmetic-error': { plainExplanation: 'The method was right but a calculation slipped.', atHomeTip: 'Redo the arithmetic slowly and check each step.' },
  'psl/missed-condition': { plainExplanation: 'A condition in the question was missed.', atHomeTip: 'Underline every condition before solving.' },
  'psl/missed-constraint': { plainExplanation: 'A limit or rule in the problem was overlooked.', atHomeTip: 'List what the question says must be true before answering.' },
  'psl/missed-number': { plainExplanation: 'A number given in the question was left out.', atHomeTip: 'Tick off each number as it is used.' },
  'psl/used-wrong-numbers': { plainExplanation: 'The wrong numbers from the question were used.', atHomeTip: 'Reread and match each number to what it represents.' },
  'psl/wrong-answer': { plainExplanation: 'The final answer did not match what the question asked for.', atHomeTip: 'Reread the question and check the answer fits it.' },
  'psl/wrong-conditions': { plainExplanation: 'The problem was solved under the wrong conditions.', atHomeTip: 'Re-check exactly what the question is asking for.' },
  'psl/wrong-constraints': { plainExplanation: 'The wrong limits were applied to the problem.', atHomeTip: 'List the real limits from the question before solving.' },
  'psl/wrong-guess': { plainExplanation: 'A guess-and-check went down the wrong path.', atHomeTip: 'Try a sensible first guess, then adjust based on the result.' },
  'psl/wrong-model-type': { plainExplanation: 'The wrong kind of diagram or model was chosen.', atHomeTip: 'Talk about which model fits before drawing it.' },
  'psl/wrong-operation': { plainExplanation: 'The wrong operation was chosen for the problem.', atHomeTip: 'Decide whether the answer should grow or shrink to pick the operation.' },
  'psl/wrong-operations': { plainExplanation: 'One or more steps used the wrong operation.', atHomeTip: 'Check each step\'s operation against what the question needs.' },
  'psl/wrong-reverse': { plainExplanation: 'Working backwards through the problem went the wrong way.', atHomeTip: 'Undo the steps in reverse order, one at a time.' },
  'psl/wrong-step-order': { plainExplanation: 'The steps were done in the wrong order.', atHomeTip: 'Plan the order of steps before starting.' },
  'psl/wrong-table-setup': { plainExplanation: 'The table for organising the problem was set up wrongly.', atHomeTip: 'Label the rows and columns before filling them in.' },
  'psl/wrong-variable': { plainExplanation: 'The wrong unknown was chosen to solve for.', atHomeTip: 'Decide clearly what you are trying to find first.' },
};

/**
 * Resolve a misconception tag to a parent-friendly { plainExplanation, atHomeTip }.
 * Returns null only when the tag is empty or its domain prefix is unknown — callers
 * should then fall back to describeMistakeForParent's generic builder.
 *
 * @param {string} tag - the raw misconception tag, e.g. "geo/triangle-no-half".
 * @returns {{ plainExplanation: string, atHomeTip: string, matched: 'tag'|'domain' } | null}
 */
export function getParentMisconception(tag = '') {
  const key = String(tag || '').trim().toLowerCase();
  if (!key) return null;

  const exact = MISCONCEPTION_EXPLANATIONS[key];
  if (exact) return { ...exact, matched: 'tag' };

  const prefix = key.split('/')[0];
  const topic = DOMAIN_TOPICS[prefix];
  if (topic) {
    return {
      plainExplanation: `This looks like a slip with ${topic}.`,
      atHomeTip: `Go back over a ${topic} example together and ask your child to talk through each step out loud.`,
      matched: 'domain',
    };
  }

  return null;
}

/**
 * Build the parent-facing explanation for a single mistake card. Always returns a
 * plain-English { plainExplanation, atHomeTip } — never a raw tag/slug. Prefers the
 * curated tag map, then the domain prefix, then a generic line from buildParentInsight.
 *
 * @param {object} mistake - the shaped mistake object a MistakeCard receives.
 * @returns {{ plainExplanation: string, atHomeTip: string, source: 'tag'|'domain'|'generic' }}
 */
export function describeMistakeForParent(mistake = {}) {
  const fromTag = getParentMisconception(mistake.misconceptionTag || '');
  if (fromTag) {
    return {
      plainExplanation: fromTag.plainExplanation,
      atHomeTip: fromTag.atHomeTip,
      source: fromTag.matched,
    };
  }

  // No mapped tag: reuse the existing insight builder so the parent still sees plain
  // English rather than a machine code. A backend-provided human label, if present,
  // makes the better headline.
  const parentInsight = buildParentInsight({
    correct: mistake.answerCorrect === true,
    confidence: mistake.confidence,
    skillName: mistake.skillName,
    mistakeName: (mistake.mistakeTypeLabel || '').trim() || undefined,
    workingAnalysis: mistake.workingInsight || undefined,
  });

  return {
    plainExplanation: (mistake.mistakeTypeLabel || '').trim() || parentInsight.whatIsTheIssue,
    atHomeTip: parentInsight.whatCanIDo,
    source: 'generic',
  };
}

export default { getParentMisconception, describeMistakeForParent };
