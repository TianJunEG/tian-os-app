const misconceptions = [
  {
    tag: 'confuses_corresponding_alternate',
    label: 'Confuses corresponding and alternate angles',
    description: 'Mixes up corresponding angles (same side, matching position) with alternate angles (opposite sides, between lines), leading to wrong angle identification.',
    remediationExplanation: 'Corresponding angles are in matching positions at each intersection (both above or both below the line, on the same side of the transversal). Alternate angles are on opposite sides of the transversal, between the parallel lines. Both pairs are equal, but they are different angle pairs.',
    visualScaffold: 'corresponding_vs_alternate_diagram',
    recheckPattern: 'Look at where the two angles sit relative to the transversal. Are they on the same side (corresponding) or opposite sides (alternate)?',
    parentNote: 'Draw two parallel lines with a transversal. Mark angles and ask: "Same side or opposite side of the crossing line?" Same side, matching spot = corresponding. Opposite side, between the lines = alternate.',
    relatedSkills: ['P6-GEO-01'],
  },
  {
    tag: 'forgets_co_interior_sum',
    label: 'Thinks co-interior angles are equal instead of supplementary',
    description: 'Assumes co-interior angles are equal (like corresponding or alternate angles) rather than supplementary (summing to 180°).',
    remediationExplanation: 'Co-interior angles (also called same-side interior or allied angles) are between the parallel lines, on the same side of the transversal. Unlike corresponding or alternate angles, co-interior angles are NOT equal — they add up to 180°.',
    visualScaffold: 'co_interior_angles_sum_180',
    recheckPattern: 'Co-interior angles add up to ___°. If one co-interior angle is 70°, the other is ___°.',
    parentNote: 'The key distinction: corresponding and alternate angles are equal, but co-interior angles add up to 180°. A common trick is to ask: "Same side, between the lines? Then add to 180°."',
    relatedSkills: ['P6-GEO-01'],
  },
  {
    tag: 'assumes_all_angles_equal_in_parallelogram',
    label: 'Assumes all four angles of a parallelogram are equal',
    description: 'Believes a parallelogram has four equal angles (like a rectangle), ignoring that only opposite angles are equal and adjacent angles are supplementary.',
    remediationExplanation: 'In a parallelogram, opposite angles are equal (e.g., angle A = angle C). But adjacent angles are supplementary — they add up to 180° (e.g., angle A + angle B = 180°). Only in a rectangle are all four angles equal (all 90°).',
    visualScaffold: 'parallelogram_angle_pairs',
    recheckPattern: 'In a parallelogram with angle A = 110°, angle B = ___° and angle C = ___°.',
    parentNote: 'Draw a tilted parallelogram (not a rectangle). Label one angle as 70°. Ask your child to find the other three. Opposite = same (70°), adjacent = 180° − 70° = 110°.',
    relatedSkills: ['P6-GEO-02'],
  },
  {
    tag: 'wrong_angle_sum_quadrilateral',
    label: 'Uses 180° instead of 360° for quadrilateral angle sum',
    description: 'Applies the triangle angle sum (180°) to quadrilaterals instead of the correct quadrilateral angle sum (360°).',
    remediationExplanation: 'A triangle has angles summing to 180°. A quadrilateral (4 sides) has angles summing to 360°. You can remember this because a quadrilateral can be split into 2 triangles: 2 × 180° = 360°.',
    visualScaffold: 'quadrilateral_split_into_triangles',
    recheckPattern: 'The angles of any quadrilateral add up to ___°. A quadrilateral can be split into ___ triangles.',
    parentNote: 'Draw any quadrilateral and draw one diagonal to split it into two triangles. Each triangle = 180°, so the quadrilateral = 360°. This visual proof helps the rule stick.',
    relatedSkills: ['P6-GEO-02'],
  },
  {
    tag: 'forgets_isosceles_base_angles',
    label: 'Forgets base angles of isosceles triangle are equal',
    description: 'Does not apply the property that the two base angles of an isosceles triangle (opposite the equal sides) are equal, leading to incorrect angle calculations.',
    remediationExplanation: 'In an isosceles triangle, the two sides that are equal are called the legs. The angles opposite these equal sides (the base angles) are always equal. If the vertex angle is known, each base angle = (180° − vertex angle) ÷ 2.',
    visualScaffold: 'isosceles_base_angles_equal',
    recheckPattern: 'An isosceles triangle has vertex angle 50°. Each base angle = (180° − 50°) ÷ 2 = ___°.',
    parentNote: 'Fold an isosceles triangle along its line of symmetry — the two base angles match perfectly. Use this to show your child why they must be equal.',
    relatedSkills: ['P6-GEO-03'],
  },
  {
    tag: 'vertically_opposite_adds_to_180',
    label: 'Thinks vertically opposite angles add to 180°',
    description: 'Believes vertically opposite angles are supplementary (add to 180°) rather than equal.',
    remediationExplanation: 'When two straight lines cross, they form two pairs of vertically opposite angles. Vertically opposite angles are always EQUAL, not supplementary. It is the adjacent angles (on a straight line) that add to 180°.',
    visualScaffold: 'vertically_opposite_vs_supplementary',
    recheckPattern: 'Two lines cross. One angle is 65°. The vertically opposite angle is ___°. The adjacent angle is ___°.',
    parentNote: 'Draw a big X. Label one angle 65°. The angle directly across = 65° (vertically opposite, equal). The angle next to it = 115° (angles on a straight line, add to 180°). Mixing these up is very common.',
    relatedSkills: ['P6-GEO-03'],
  },
  {
    tag: 'straight_line_angle_wrong_pair',
    label: 'Applies angles-on-a-straight-line to non-adjacent angles',
    description: 'Uses the 180° straight-line rule on angles that are not actually adjacent on the same straight line.',
    remediationExplanation: 'Angles on a straight line sum to 180° only when they are adjacent and together form a straight angle. Before subtracting from 180°, check that the angles you are adding truly sit next to each other on the same straight line.',
    visualScaffold: 'adjacent_angles_on_line',
    recheckPattern: 'Are these two angles side by side on the same straight line? If yes, they add to 180°. If not, this rule does not apply.',
    parentNote: 'Show two angles that share a vertex on a line — those add to 180°. Then show two angles at the same vertex that are NOT on the same line — the rule does not apply. The visual difference is key.',
    relatedSkills: ['P6-GEO-03'],
  },
  {
    tag: 'triangle_exterior_angle_error',
    label: 'Incorrect use of exterior angle theorem',
    description: 'Computes the exterior angle of a triangle incorrectly — typically subtracting only one interior angle from 180° instead of adding the two non-adjacent interior angles.',
    remediationExplanation: 'The exterior angle of a triangle equals the sum of the two non-adjacent (remote) interior angles. Equivalently, exterior angle = 180° minus the adjacent interior angle. Both methods give the same result.',
    visualScaffold: 'exterior_angle_theorem',
    recheckPattern: 'Triangle with angles 40°, 55°, 85°. The exterior angle at the 85° vertex = 180° − 85° = ___°. Check: 40° + 55° = ___°.',
    parentNote: 'The exterior angle shortcut: it equals the sum of the two "far" interior angles. If your child gets confused, have them first find all three interior angles (sum = 180°), then subtract the adjacent one from 180°.',
    relatedSkills: ['P6-GEO-03'],
  },
  {
    tag: 'confuses_supplementary_complementary',
    label: 'Confuses supplementary (180°) and complementary (90°)',
    description: 'Subtracts from 90° when should subtract from 180°, or vice versa, confusing supplementary and complementary angle relationships.',
    remediationExplanation: 'Complementary angles add to 90° (think "C" for "corner" — a right angle). Supplementary angles add to 180° (think "S" for "straight" — a straight line). Co-interior angles and adjacent parallelogram angles are supplementary (180°), not complementary.',
    visualScaffold: 'supplementary_vs_complementary',
    recheckPattern: 'Supplementary angles add to ___°. Complementary angles add to ___°. Co-interior angles are _____ary.',
    parentNote: 'Memory trick: "C" in complementary = "corner" (90°). "S" in supplementary = "straight line" (180°). Ask your child to classify angle pairs throughout the day.',
    relatedSkills: ['P6-GEO-01', 'P6-GEO-02'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) { return misconceptionByTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) { return misconceptions.filter((m) => m.relatedSkills.includes(skillId)); }
export function getAllMisconceptions() { return [...misconceptions]; }

export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return { tag: m.tag, explanation: m.remediationExplanation, visualScaffold: m.visualScaffold, recheckPattern: m.recheckPattern, parentNote: m.parentNote };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
