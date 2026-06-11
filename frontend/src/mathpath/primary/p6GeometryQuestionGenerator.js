import { getSkill } from './p6GeometrySkillGraph.js';
import { getQuestionFamiliesBySkill } from './p6GeometryQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------------------------------------------------------------------------
// P6-GEO-01: Angles in Parallel Lines
// ---------------------------------------------------------------------------

function generateAnglesInParallelLines(familyId) {
  // _001: Corresponding angles (equal)
  if (familyId.endsWith('_001')) {
    const angle = randInt(30, 150);

    const layouts = [
      {
        prompt: `AB is parallel to CD. A transversal PQ crosses AB at E and CD at F. Angle AEP = ${angle}°. Find angle CFP.`,
        hint: 'Corresponding angles formed by a transversal crossing parallel lines are equal.',
        solution: `Angle AEP and angle CFP are corresponding angles (both on the same side of the transversal, in matching positions). Since AB is parallel to CD, corresponding angles are equal. Angle CFP = ${angle}°.`,
      },
      {
        prompt: `Line L1 is parallel to line L2. A transversal crosses both lines. One of the corresponding angles is ${angle}°. What is the other corresponding angle?`,
        hint: 'When a transversal crosses parallel lines, corresponding angles are equal.',
        solution: `Corresponding angles are equal when formed by a transversal crossing parallel lines. The other corresponding angle = ${angle}°.`,
      },
      {
        prompt: `PQ is parallel to RS. A transversal TU crosses PQ at M and RS at N. Angle PMT = ${angle}°. Find angle RNT.`,
        hint: 'Corresponding angles are in matching positions at each intersection.',
        solution: `Angle PMT and angle RNT are corresponding angles (same side of transversal, same position). Since PQ // RS, corresponding angles are equal. Angle RNT = ${angle}°.`,
      },
    ];

    const layout = pick(layouts);
    return {
      skillId: 'P6-GEO-01',
      questionFamilyId: familyId,
      prompt: layout.prompt,
      answer: angle,
      answerType: 'number',
      instructionHint: layout.hint,
      solutionText: layout.solution,
      misconceptionTraps: ['confuses_corresponding_alternate'],
    };
  }

  // _002: Alternate angles (equal)
  if (familyId.endsWith('_002')) {
    const angle = randInt(25, 155);

    const layouts = [
      {
        prompt: `AB is parallel to CD. A transversal PQ crosses AB at E and CD at F. Angle BEF = ${angle}°. Find angle EFD.`,
        hint: 'Alternate angles are on opposite sides of the transversal between the parallel lines. They are equal.',
        solution: `Angle BEF and angle EFD are alternate angles (on opposite sides of the transversal, between the parallel lines). Since AB // CD, alternate angles are equal. Angle EFD = ${angle}°.`,
      },
      {
        prompt: `Line L1 is parallel to line L2. A transversal crosses them forming alternate angles. One alternate angle measures ${angle}°. What is the other alternate angle?`,
        hint: 'Alternate angles are equal when a transversal crosses parallel lines.',
        solution: `Alternate angles formed by a transversal cutting parallel lines are equal. The other alternate angle = ${angle}°.`,
      },
      {
        prompt: `PQ is parallel to RS. A transversal crosses PQ at M and RS at N. Angle QMN = ${angle}°. Find angle MNR.`,
        hint: 'Alternate angles lie on opposite sides of the transversal, between the parallel lines.',
        solution: `Angle QMN and angle MNR are alternate angles (opposite sides of transversal MN, between parallel lines PQ and RS). Alternate angles are equal. Angle MNR = ${angle}°.`,
      },
    ];

    const layout = pick(layouts);
    return {
      skillId: 'P6-GEO-01',
      questionFamilyId: familyId,
      prompt: layout.prompt,
      answer: angle,
      answerType: 'number',
      instructionHint: layout.hint,
      solutionText: layout.solution,
      misconceptionTraps: ['confuses_corresponding_alternate', 'confuses_supplementary_complementary'],
    };
  }

  // _003: Co-interior angles (sum = 180°)
  {
    const givenAngle = randInt(20, 160);
    const answer = 180 - givenAngle;

    const layouts = [
      {
        prompt: `AB is parallel to CD. A transversal PQ crosses AB at E and CD at F. Angle BEF = ${givenAngle}°. Find angle DFE.`,
        hint: 'Co-interior (same-side interior) angles add up to 180°.',
        solution: `Angle BEF and angle DFE are co-interior angles (on the same side of the transversal, between the parallel lines). Co-interior angles sum to 180°. Angle DFE = 180° − ${givenAngle}° = ${answer}°.`,
      },
      {
        prompt: `Line L1 is parallel to line L2. A transversal crosses them. One co-interior angle is ${givenAngle}°. Find the other co-interior angle.`,
        hint: 'Co-interior angles formed between parallel lines sum to 180°.',
        solution: `Co-interior angles add up to 180°. The other co-interior angle = 180° − ${givenAngle}° = ${answer}°.`,
      },
      {
        prompt: `PQ is parallel to RS. A transversal crosses PQ at M and RS at N. Angle QMN = ${givenAngle}°. Find angle SNM.`,
        hint: 'Co-interior angles are on the same side of the transversal between the parallel lines.',
        solution: `Angle QMN and angle SNM are co-interior angles (same side of the transversal, between PQ and RS). Co-interior angles sum to 180°. Angle SNM = 180° − ${givenAngle}° = ${answer}°.`,
      },
    ];

    const layout = pick(layouts);
    return {
      skillId: 'P6-GEO-01',
      questionFamilyId: familyId,
      prompt: layout.prompt,
      answer,
      answerType: 'number',
      instructionHint: layout.hint,
      solutionText: layout.solution,
      misconceptionTraps: ['forgets_co_interior_sum', 'confuses_supplementary_complementary'],
    };
  }
}

// ---------------------------------------------------------------------------
// P6-GEO-02: Angle Properties of Quadrilaterals
// ---------------------------------------------------------------------------

function generateQuadrilateralAngles(familyId) {
  // _001: Parallelogram — find opposite angle (equal)
  if (familyId.endsWith('_001')) {
    const angleA = randInt(40, 140);

    const variants = [
      {
        prompt: `ABCD is a parallelogram. Angle A = ${angleA}°. Find angle C.`,
        hint: 'In a parallelogram, opposite angles are equal.',
        solution: `In a parallelogram, opposite angles are equal. Angle C is opposite to angle A. Angle C = ${angleA}°.`,
      },
      {
        prompt: `PQRS is a parallelogram. Angle P = ${angleA}°. What is angle R?`,
        hint: 'Opposite angles of a parallelogram are always equal.',
        solution: `Opposite angles of a parallelogram are equal. Angle R (opposite to angle P) = ${angleA}°.`,
      },
      {
        prompt: `In parallelogram WXYZ, angle W = ${angleA}°. Find angle Y.`,
        hint: 'Recall: opposite angles in a parallelogram are equal.',
        solution: `In parallelogram WXYZ, angle Y is opposite to angle W. Opposite angles are equal, so angle Y = ${angleA}°.`,
      },
    ];

    const variant = pick(variants);
    return {
      skillId: 'P6-GEO-02',
      questionFamilyId: familyId,
      prompt: variant.prompt,
      answer: angleA,
      answerType: 'number',
      instructionHint: variant.hint,
      solutionText: variant.solution,
      misconceptionTraps: ['assumes_all_angles_equal_in_parallelogram'],
    };
  }

  // _002: Parallelogram — find adjacent angle (supplementary)
  if (familyId.endsWith('_002')) {
    const angleA = randInt(35, 145);
    const answer = 180 - angleA;

    const variants = [
      {
        prompt: `ABCD is a parallelogram. Angle A = ${angleA}°. Find angle B.`,
        hint: 'In a parallelogram, adjacent angles are supplementary (they add up to 180°).',
        solution: `In a parallelogram, adjacent angles add up to 180° (co-interior angles between parallel sides). Angle B = 180° − ${angleA}° = ${answer}°.`,
      },
      {
        prompt: `PQRS is a parallelogram. Angle Q = ${angleA}°. What is angle R?`,
        hint: 'Adjacent angles in a parallelogram are supplementary.',
        solution: `Adjacent angles in a parallelogram sum to 180°. Angle R = 180° − ${angleA}° = ${answer}°.`,
      },
      {
        prompt: `In parallelogram EFGH, angle E = ${angleA}°. Find angle F.`,
        hint: 'Two adjacent angles in a parallelogram always add up to 180°.',
        solution: `In parallelogram EFGH, angle E and angle F are adjacent. They sum to 180°. Angle F = 180° − ${angleA}° = ${answer}°.`,
      },
    ];

    const variant = pick(variants);
    return {
      skillId: 'P6-GEO-02',
      questionFamilyId: familyId,
      prompt: variant.prompt,
      answer,
      answerType: 'number',
      instructionHint: variant.hint,
      solutionText: variant.solution,
      misconceptionTraps: ['assumes_all_angles_equal_in_parallelogram', 'confuses_supplementary_complementary'],
    };
  }

  // _003: Trapezium — find fourth angle using 360° sum
  {
    // Generate 3 angles that leave a valid 4th angle (positive integer, 1-179)
    let a1, a2, a3, answer;
    do {
      a1 = randInt(50, 130);
      a2 = randInt(50, 130);
      a3 = randInt(50, 130);
      answer = 360 - a1 - a2 - a3;
    } while (answer < 1 || answer > 179);

    const variants = [
      {
        prompt: `ABCD is a trapezium. Angle A = ${a1}°, angle B = ${a2}°, and angle C = ${a3}°. Find angle D.`,
        hint: 'The four angles of any quadrilateral add up to 360°.',
        solution: `Angles of a quadrilateral sum to 360°. Angle D = 360° − ${a1}° − ${a2}° − ${a3}° = ${answer}°.`,
      },
      {
        prompt: `In trapezium PQRS, three of the angles are ${a1}°, ${a2}°, and ${a3}°. Find the fourth angle.`,
        hint: 'Use the angle sum property of quadrilaterals: all four angles add up to 360°.',
        solution: `Sum of angles in a quadrilateral = 360°. Fourth angle = 360° − ${a1}° − ${a2}° − ${a3}° = ${answer}°.`,
      },
    ];

    const variant = pick(variants);
    return {
      skillId: 'P6-GEO-02',
      questionFamilyId: familyId,
      prompt: variant.prompt,
      answer,
      answerType: 'number',
      instructionHint: variant.hint,
      solutionText: variant.solution,
      misconceptionTraps: ['wrong_angle_sum_quadrilateral'],
    };
  }
}

// ---------------------------------------------------------------------------
// P6-GEO-03: Finding Unknown Angles in Figures (multi-step)
// ---------------------------------------------------------------------------

function generateMultiStepAngles(familyId) {
  // _001: Isosceles triangle + parallelogram
  if (familyId.endsWith('_001')) {
    // In triangle ABC (isosceles, AB = AC), angle BAC = X.
    // Base angles = (180 - X) / 2 each.
    // BCDE is a parallelogram. Angle BCD (interior of parallelogram at C) is adjacent to
    // angle ACB. We ask for angle CDE (opposite to angle BCD in parallelogram).
    // Ensure base angles are integers: X must be even and leave integer base angles.
    let vertexAngle, baseAngle;
    do {
      vertexAngle = randInt(10, 80) * 2; // even, between 20 and 160
      baseAngle = (180 - vertexAngle) / 2;
    } while (baseAngle < 10 || baseAngle > 85 || !Number.isInteger(baseAngle));

    // Angle BCD in the parallelogram: we pick a value that makes geometric sense.
    // The parallelogram extends from side BC. Angle BCD (at C in the parallelogram) must
    // be between 1 and 179. Let's define angle DCE = some value, so angle BCD = angle ACB + angle DCE
    // But to keep it simple and elegant: angle BCD in the parallelogram is the given,
    // and we combine it with the triangle.
    // Simpler approach: angle ACB = baseAngle. Line CE extends from C.
    // Angle ACE is on a straight line => angle ACE = 180 - angle ACB = 180 - baseAngle if B, C, E collinear... 
    // Let's use a cleaner multi-step:
    // Triangle ABC: AB=AC, angle BAC = vertexAngle, so angle ABC = angle ACB = baseAngle.
    // BCDE is a parallelogram. In the parallelogram, angle BCD is one of the angles.
    // angle BCD = 180 - baseAngle (supplementary to angle at B since BC is a common side 
    // and BD // CE). Actually let's just set angle BCD as a parameter.
    // 
    // Cleaner design: ABC isosceles with AB=AC, angle BAC = vertexAngle.
    // So angle ACB = baseAngle.
    // D is a point such that angle ACD = given. Find angle ACD + angle ACB = angle BCD.
    // Then in parallelogram BCDE, opposite angle to BCD = angle BED = angle BCD.
    // 
    // Simplest clean multi-step:
    // ABC is an isosceles triangle with AB = AC. Angle BAC = vertexAngle.
    // BC is extended to D such that angle ACD is an exterior angle of the triangle.
    // Then angle ACD = 180 - baseAngle (angles on straight line BCD).
    // ACDE is a parallelogram. Find angle CDE.
    // In parallelogram ACDE: angle CDE is adjacent to angle ACD, so angle CDE = 180 - angle ACD.
    // angle ACD = 180 - baseAngle
    // angle CDE = 180 - (180 - baseAngle) = baseAngle
    // That's too trivial. Let's try another approach:

    // Triangle ABC, AB = AC, angle BAC = vertexAngle, so angle ABC = angle ACB = baseAngle.
    // ABDE is a parallelogram (AB // ED, AE // BD).
    // Find angle BDE.
    // In parallelogram ABDE: angle ABD is one angle. 
    // angle ABD = angle ABC = baseAngle.
    // angle BDE (adjacent to angle ABD through side BD) — actually angle ABD and angle BDE
    // are adjacent angles in the parallelogram, so angle BDE = 180 - baseAngle.

    const answer = 180 - baseAngle;

    return {
      skillId: 'P6-GEO-03',
      questionFamilyId: familyId,
      prompt: `In the figure, triangle ABC is isosceles with AB = AC. Angle BAC = ${vertexAngle}°. ABDE is a parallelogram. Find angle BDE.`,
      answer,
      answerType: 'number',
      instructionHint: 'Step 1: Find the base angles of the isosceles triangle. Step 2: Use parallelogram properties to find the unknown angle.',
      solutionText: `Since triangle ABC is isosceles with AB = AC, the base angles are equal. Angle ABC = (180° − ${vertexAngle}°) ÷ 2 = ${baseAngle}°. In parallelogram ABDE, angle ABD = ${baseAngle}° and angle BDE are adjacent angles. Adjacent angles in a parallelogram sum to 180°. Angle BDE = 180° − ${baseAngle}° = ${answer}°.`,
      misconceptionTraps: ['forgets_isosceles_base_angles', 'assumes_all_angles_equal_in_parallelogram'],
    };
  }

  // _002: Angles on a straight line + vertically opposite angles
  if (familyId.endsWith('_002')) {
    // Two straight lines intersect. One angle = X. An adjacent angle on a straight line = 180-X.
    // A third line creates an angle Y with one of the lines on a straight line.
    // Find a vertically opposite angle.
    //
    // Setup: Lines AB and CD intersect at O. Angle AOC = given.
    // Line EF passes through O. Angle COE = secondAngle.
    // Find angle BOF (vertically opposite to angle AOE, where angle AOE = angle AOC + angle COE).

    let angleAOC, angleCOE, angleAOE, answer;
    do {
      angleAOC = randInt(30, 120);
      angleCOE = randInt(15, 90);
      angleAOE = angleAOC + angleCOE;
      answer = angleAOE; // vertically opposite to angle BOF
    } while (angleAOE < 1 || angleAOE > 179);

    return {
      skillId: 'P6-GEO-03',
      questionFamilyId: familyId,
      prompt: `Three straight lines pass through point O. Angle AOC = ${angleAOC}° and angle COE = ${angleCOE}°. Find angle BOF, where B is opposite A and F is opposite E (through point O).`,
      answer,
      answerType: 'number',
      instructionHint: 'Step 1: Find angle AOE by adding adjacent angles. Step 2: Use vertically opposite angles.',
      solutionText: `Angle AOE = angle AOC + angle COE = ${angleAOC}° + ${angleCOE}° = ${angleAOE}°. Angle BOF is vertically opposite to angle AOE (since B is opposite A and F is opposite E through O). Vertically opposite angles are equal. Angle BOF = ${answer}°.`,
      misconceptionTraps: ['vertically_opposite_adds_to_180', 'straight_line_angle_wrong_pair'],
    };
  }

  // _003: Triangle angle sum + exterior angle
  {
    // Triangle PQR. Angle P = a, angle Q = b, so angle R = 180 - a - b.
    // QR is extended to S. Angle PRS (exterior angle) = 180 - angle R = a + b.
    // Given angle P and angle Q, find angle PRS (exterior angle at R).
    let angleP, angleQ, angleR, answer;
    do {
      angleP = randInt(25, 80);
      angleQ = randInt(25, 80);
      angleR = 180 - angleP - angleQ;
      answer = angleP + angleQ; // exterior angle = sum of two non-adjacent interior angles
    } while (angleR < 20 || answer < 1 || answer > 179);

    const variants = [
      {
        prompt: `In triangle PQR, angle P = ${angleP}° and angle Q = ${angleQ}°. Side QR is extended to point S. Find angle PRS.`,
        solution: `Angle R in triangle PQR = 180° − ${angleP}° − ${angleQ}° = ${angleR}°. Angle PRS is the exterior angle at R. Angles on a straight line: angle PRS = 180° − ${angleR}° = ${answer}°. Alternatively, the exterior angle of a triangle equals the sum of the two non-adjacent interior angles: ${angleP}° + ${angleQ}° = ${answer}°.`,
      },
      {
        prompt: `In triangle ABC, angle A = ${angleP}° and angle B = ${angleQ}°. BC is extended to D. Find angle ACD.`,
        solution: `Angle C = 180° − ${angleP}° − ${angleQ}° = ${angleR}°. The exterior angle ACD at vertex C = 180° − ${angleR}° = ${answer}°. This equals the sum of the two remote interior angles: ${angleP}° + ${angleQ}° = ${answer}°.`,
      },
    ];

    const variant = pick(variants);
    return {
      skillId: 'P6-GEO-03',
      questionFamilyId: familyId,
      prompt: variant.prompt,
      answer,
      answerType: 'number',
      instructionHint: 'Step 1: Use the triangle angle sum (180°) to find the third angle. Step 2: The exterior angle and the interior angle at the same vertex are supplementary (add to 180°).',
      solutionText: variant.solution,
      misconceptionTraps: ['triangle_exterior_angle_error', 'straight_line_angle_wrong_pair'],
    };
  }
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P6-GEO-01': generateAnglesInParallelLines,
  'P6-GEO-02': generateQuadrilateralAngles,
  'P6-GEO-03': generateMultiStepAngles,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateQuestion(skillId, options = {}) {
  const skill = getSkill(skillId);
  if (!skill) return null;
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return null;
  const family = options.questionFamilyId
    ? families.find((f) => f.id === options.questionFamilyId) || pick(families)
    : pick(families);
  const generator = generatorsBySkill[skillId];
  if (!generator) return null;
  const question = generator(family.id);
  return {
    ...question,
    questionId: `${family.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    difficulty: family.difficulty,
    fluencyTargetSeconds: family.fluencyTargetSeconds,
  };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) { const q = generateQuestion(skillId, options); if (q) questions.push(q); }
  return questions;
}

export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) questions.push(...generateQuestionSet(skillId, questionsPerSkill));
  return questions;
}

export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }

export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
