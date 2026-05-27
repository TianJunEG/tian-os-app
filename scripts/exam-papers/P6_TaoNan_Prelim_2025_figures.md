# Figure generation brief — P6 Maths Prelim 2025 (Tao Nan School)

These 15 figures back the diagram-dependent questions seeded by
`scripts/seedExamPapers.js` (the `FIGURE_QUESTIONS` array, `sourceRef =
P6_TaoNan_Prelim_2025`). Each question is already in the database with
`hasFigure: true` and a `figureUrl`; it just needs the matching image produced.

## Where to save
Save each as **SVG** (vector, crisp at any size) at:

```
frontend/public/figures/p6-taonan-prelim-2025/<id>.svg
```

which is served by the app at `/figures/p6-taonan-prelim-2025/<id>.svg` — exactly
the `figureUrl` the seed stores. (PNG at 2× also works if you change the seed's
`.svg` extension; SVG preferred.)

## House style (apply to every prompt)
- Clean **black line art on a white background**, like a printed exam diagram.
- Thin uniform strokes (~2px), **sans-serif** labels, no drop shadows, no 3D
  bevels except where an isometric solid is required.
- Shading = flat **light grey (#cccccc)** fill only; no other colour.
- Tight margins; the figure should read clearly at ~360 px wide.
- Render measurements/labels exactly as written. Right angles get a small square
  mark; equal sides get tick marks where stated.

Each entry below is a ready-to-paste prompt. Lead every prompt with the house
style sentence: *"Clean black-and-white educational line diagram, white
background, thin strokes, sans-serif labels, flat light-grey shading only."*

---

### p1-q2 — Perpendicular lines on a grid  (Q: which two lines are perpendicular)
Draw a square dotted grid (about 7×6). Plot five points and join them into an
irregular closed figure with segments **AB, BC, CD, DE, EA**. Label A (upper
area), B (right), C (just below B), D (bottom-left), E (left). Position the
points so that **AB meets BC at a right angle** (mark the right angle with a
small square); the other corners are clearly not right angles. No measurements.

### p1-q3 — Two measuring cylinders  (Q: total volume of water)
Draw two upright measuring cylinders side by side.
- Left cylinder: graduated **0–1000 ml** with major ticks every 200 ml; water
  (light-grey fill) up to **600 ml**; label "1000 ml" at the top tick.
- Right cylinder: graduated **0–500 ml** with major ticks every 100 ml; water up
  to **200 ml**; label "500 ml" at the top tick.
Cylinders roughly the same height so the differing scales are the point.

### p1-q4 — Decimal number line  (Q: value at A)
A horizontal number line from **7 to 9**, divided into **8 equal intervals**
(tick spacing = 0.25). Label only the end ticks **7** and **9**. Draw a vertical
arrow pointing up to the **3rd tick after 7** (i.e. 7.75) and label it **A** below
the arrow.

### p1-q10 — Intersecting lines, find angle m  (Q: AB & CD straight lines)
Two straight lines **AB** and **CD** crossing at a point O, plus a third ray from
O going up-left. Label endpoints A (left), B (right), C (upper-left), D
(lower-right). At O mark: **30°** between ray CO-ish and the upper ray, **125°**
to its right, a small **right-angle square**, and the unknown angle **m** in the
lower region. Reproduce the original cluster: 30° and 125° above the line AB, the
right-angle mark and m just below.

### p1-q11 — Pie chart of hobbies  (Q: which hobby is 1/5)
A circle divided into 5 sectors, labelled with name + value inside each:
**Jogging 30**, **Reading 48**, **Gaming 62**, **Dancing 40**, **Cycling** (draw
Cycling as a clean **90° right-angle sector**, marked with a small square at the
centre). Total = 240, so Reading (48) is exactly 1/5. Sectors sized roughly to
their values.

### p1-q15 — Three identical right-angled triangles  (Q: area of figure)
Three identical right-angled triangles arranged around a common central point to
form a fan/pinwheel-like figure (as in the paper). Mark one **vertical side
24 cm** (with up/down arrows showing the 24 cm span) and one **hypotenuse 20 cm**.
Include the right-angle squares at the triangles' right angles.

### p1-q20 — Line graph: plant height  (Q: height in May)
Line graph. Y-axis titled **"Height of plant (cm)"**, scale **0–160** with
gridlines every 20. X-axis: **Mar, Apr, May, Jun, Jul, Aug**. Plot and connect
points: Mar ≈ 35, Apr ≈ 70, **May = 95**, Jun ≈ 105, Jul ≈ 132, Aug ≈ 142. Mark
data points with small dots.

### p1-q22 — Eight points on a grid with compass  (used by Q22a and Q22b)
A square grid (about 7×7) with a **North arrow** to the right of the grid. Plot
eight labelled points at grid intersections, matching the paper's layout:
**A** top-left, **B** top-right, **C** right (one row below B), **H** left middle,
**E** centre, **F** lower-middle-left, **D** lower-middle-right, **G** bottom
(below F). Small dots at each point, letters beside them. (So F is directly west
of D and directly north of G; E and F are south-west of B.)

### p1-q25 — Two sides of a trapezium on a grid  (Q: draw trapezium STUV)
A square grid (about 9×7). Draw two connected segments: **S→T** sloping gently
down to the right, then **T→U** sloping more steeply down to the right. Label S
(upper-left), T (middle), U (lower-right). Leave the rest of the grid blank for
the student to construct V. A faint tick on ST is fine. No shading.

### p1-q26 — Solid of 8 unit cubes  (used by Q26a and Q26b)
An **isometric** drawing of a solid built from 8 unit cubes in a step/L shape
(two cubes high at the back-right, an L footprint). Label the two viewing
directions with arrows: **"Front view"** (front-left) and **"Side view"**
(front-right). To the right, show the **side view** drawn on a small dot grid (an
L/step silhouette). This is the one figure that may use light 3D shading on cube
faces for readability.

### p2-q2 — Symmetry grid  (Q: shade 5 more for symmetry about AB)
A slightly **tilted square grid** (about 6×6). Draw a **dashed diagonal line of
symmetry** from **A** (bottom-left) to **B** (top-right). Shade **7 cells** placed
so they are *not* yet symmetric about AB (matching the paper: a scattered set on
both sides). Leave all other cells blank.

### p2-q11 — Line graph: water used  (Q: % increase Apr→May)
Line graph. Y-axis **"Amount of water used (m³)"**, scale **0–60** every 10.
X-axis: **Jan, Feb, Mar, Apr, May, Jun**. Plot and connect: Jan ≈ 34, Feb ≈ 48,
Mar ≈ 28, **Apr = 40**, **May = 50**, Jun ≈ 24. Mark data points.

### p2-q12 — Parallelogram + rhombus  (Q: find ∠w)
Overlapping figure: **parallelogram ABCD** (A upper-left, B upper-right, C right,
D lower-left) and **rhombus CFDE** with **E at the top** and **F at the bottom**.
Mark the rhombus apex angle **74°** at F and tick the rhombus's equal sides.
Points **G** and **H** lie on AB near the top; mark **12°** at D (∠ADG) and label
the angle **w** at H (above AB). Match the paper's "Star-of-David"-like overlap.

### p2-q14 — Bar graph: books borrowed  (used by Q14a and Q14b)
Vertical bar graph. Y-axis **"Number of books borrowed"** 0–100 (ticks every 20),
light-grey bars. X-axis: **Mon, Tue, Wed, Thu, Fri**. Bar heights: Mon **65**,
Tue **90**, Wed **85**, Thu **40**; **Fri** has no bar — show a **"?"** above the
empty Friday slot. Faint dashed gridlines at 40, 80, 90 as in the paper.

### p2-q17a — Three rectangles with a shaded triangle  (Q: shaded vs unshaded)
One long rectangle divided by two vertical lines into **three identical
rectangles**. Draw a large triangle from the **bottom-left corner** to the
**top-right corner** spanning all three; **shade the triangle** light grey.
Caption **"Figure 1"** below.

### p2-q17b — Three circles with inscribed tilted squares  (Q: shaded vs unshaded)
Three equal circles in a row, touching, with a horizontal line **AB** through all
three centres (A at the far left, B at the far right). Inside each circle draw a
**tilted (45°) square** (side 16 cm). Shade regions to match the paper: the left
circle's upper half shaded with its square left unshaded, the middle circle's
square shaded, the right circle fully shaded — i.e. a shaded-vs-unshaded
comparison across semicircles and inscribed squares. Caption **"Figure 2"** below.

---

## After images exist
No re-seed of the questions is required for content, but if you change the file
extension or path convention, update `FIGURE_BASE` / the `.svg` suffix in
`scripts/seedExamPapers.js` and re-run `npm run seed:exampapers` (idempotent).
