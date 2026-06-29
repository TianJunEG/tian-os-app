import { describe, expect, it } from 'vitest';
import { renderers } from './svgRenderers';

describe('fraction diagram renderers', () => {
  it('renders fraction bars with solid pastel blue fills instead of hatching', () => {
    const svg = renderers.fraction_bar({
      width: 320,
      height: 160,
      data: { parts: 4, shaded: 2, labelMode: 'none' },
    });

    expect(svg).toContain('#bfdbfe');
    expect(svg).toContain('fill="#fff"');
    expect(svg).not.toContain('<pattern');
    expect(svg).not.toContain('url(#');
    expect(svg).not.toContain('rotate(45)');
  });

  it('renders fraction circles with animated pastel blue fills', () => {
    const svg = renderers.fraction_circle({
      width: 320,
      height: 220,
      data: { parts: 6, shaded: 3 },
    });

    expect(svg).toContain('#bfdbfe');
    expect(svg).toContain('<animate');
    expect(svg).not.toContain('<pattern');
    expect(svg).not.toContain('url(#');
    expect(svg).not.toContain('rotate(45)');
  });

  it('staggers fraction circle slice animations with increasing delays', () => {
    const svg = renderers.fraction_circle({
      width: 320,
      height: 220,
      data: { parts: 4, shaded: 3 },
    });

    const delays = [...svg.matchAll(/begin="([\d.]+)s"/g)].map(m => parseFloat(m[1]));
    // 3 fill animations + 1 label opacity animation = 4 delays
    expect(delays.length).toBe(4);
    // Each shaded-slice delay should increase
    expect(delays[0]).toBeLessThan(delays[1]);
    expect(delays[1]).toBeLessThan(delays[2]);
  });

  it('fraction bar animations stagger correctly', () => {
    const svg = renderers.fraction_bar({
      width: 320,
      height: 160,
      data: { parts: 5, shaded: 3, labelMode: 'fraction' },
    });

    const delays = [...svg.matchAll(/begin="([\d.]+)s"/g)].map(m => parseFloat(m[1]));
    expect(delays.length).toBe(4); // 3 fill + 1 label
    expect(delays[0]).toBeLessThan(delays[1]);
    expect(delays[1]).toBeLessThan(delays[2]);
    // label comes after last segment
    expect(delays[3]).toBeGreaterThan(delays[2]);
  });
});

describe('part_whole_bar and comparison_bar animations', () => {
  it('part_whole_bar segments grow with staggered width animations', () => {
    const svg = renderers.part_whole_bar({
      width: 400,
      height: 120,
      data: { parts: [{ value: 3, label: 'A' }, { value: 2, label: 'B' }, { value: 5, label: 'C' }] },
    });

    // 3 width animations + 3 label opacity animations = 6 animate elements
    const animates = [...svg.matchAll(/<animate /g)];
    expect(animates.length).toBe(6);
    // Width animations grow from 0
    expect(svg).toContain('from="0"');
    // Labels fade in
    const opacityAnimates = [...svg.matchAll(/attributeName="opacity"/g)];
    expect(opacityAnimates.length).toBe(3);
  });

  it('comparison_bar animates bars growing and values fading in', () => {
    const svg = renderers.comparison_bar({
      width: 400,
      height: 160,
      data: { leftValue: 8, rightValue: 5, leftLabel: 'Cats', rightLabel: 'Dogs' },
    });

    // 2 label fades + 2 bar widths + 2 value fades = 6 animate elements
    const animates = [...svg.matchAll(/<animate /g)];
    expect(animates.length).toBe(6);
    // Bars grow from 0 width
    const widthAnimates = [...svg.matchAll(/attributeName="width"/g)];
    expect(widthAnimates.length).toBe(2);
    // Top bar starts before bottom bar
    const barDelays = [...svg.matchAll(/attributeName="width"[^>]*begin="([\d.]+)s"/g)].map(m => parseFloat(m[1]));
    expect(barDelays[0]).toBeLessThan(barDelays[1]);
  });

  it('before_after_bar and ratio_bar delegate to comparison_bar with animations', () => {
    const before = renderers.before_after_bar({
      width: 400, height: 160,
      data: { before: 10, after: 15 },
    });
    const ratio = renderers.ratio_bar({
      width: 400, height: 160,
      data: { a: 3, b: 7, aLabel: 'Red', bLabel: 'Blue' },
    });

    expect(before).toContain('<animate');
    expect(before).toContain('Before');
    expect(ratio).toContain('<animate');
    expect(ratio).toContain('Red');
  });
});

describe('geometry and chart diagram animations', () => {
  it('rectangle_area draws outline then grid lines then labels', () => {
    const svg = renderers.rectangle_area({
      width: 400, height: 300,
      data: { widthUnits: 4, heightUnits: 3 },
    });

    // Outline dash animation + grid opacity animations + 2 label opacity animations
    expect(svg).toContain('stroke-dashoffset');
    expect(svg).toContain('<animate');
    const opacityAnims = [...svg.matchAll(/attributeName="opacity"/g)];
    // 3 vertical + 2 horizontal grid lines + 2 labels = 7 opacity animations
    expect(opacityAnims.length).toBe(7);
  });

  it('triangle_area draws outline then height line then labels', () => {
    const svg = renderers.triangle_area({
      width: 400, height: 300,
      data: { base: 6, height: 4 },
    });

    // Polygon dash + height line dash + 2 label opacity = 4 animate elements
    const animates = [...svg.matchAll(/<animate /g)];
    expect(animates.length).toBe(4);
    expect(svg).toContain('stroke-dashoffset');
    expect(svg).toContain('base 6');
    expect(svg).toContain('height 4');
  });

  it('cuboid draws front face, back face, edges, then labels', () => {
    const svg = renderers.cuboid({
      width: 500, height: 350,
      data: { length: 5, width: 3, height: 4 },
    });

    // 2 face dash animations + 4 edge opacity + 3 label opacity = 9 animate elements
    const animates = [...svg.matchAll(/<animate /g)];
    expect(animates.length).toBe(9);
    expect(svg).toContain('stroke-dashoffset');
  });

  it('angle_on_line draws base, arm, arc, then label', () => {
    const svg = renderers.angle_on_line({
      width: 400, height: 300,
      data: { angleDegrees: 45 },
    });

    // 3 dash animations (base + arm + arc) + 1 label opacity = 4 animate elements
    const animates = [...svg.matchAll(/<animate /g)];
    expect(animates.length).toBe(4);
    expect(svg).toContain('45');
  });

  it('bar_chart draws an even ruled y-axis + category labels (no values on the bars)', () => {
    const svg = renderers.bar_chart({
      width: 400, height: 300,
      data: { bars: [{ value: 10, label: 'A' }, { value: 6, label: 'B' }, { value: 4, label: 'C' }] },
    });

    // 3 bars (by fill colour; svgShell adds a background rect too)
    expect([...svg.matchAll(/fill="#93c5fd"/g)].length).toBe(3);
    // Category labels present; scale starts at 0 and is ruled with gridlines so
    // the student READS each value off the axis (not printed above the bars).
    for (const v of ['>A<', '>B<', '>C<']) expect(svg).toContain(v);
    expect(svg).toContain('>0<');
    expect([...svg.matchAll(/<line /g)].length).toBeGreaterThan(5);
  });

  it('circle renderer draws a circle with a labeled radius line', () => {
    const svg = renderers.circle({
      type: 'circle', width: 360, height: 280,
      data: { radius: 7, show: 'radius', label: '7 cm' },
    });
    expect(svg).toContain('<circle');
    expect(svg).toContain('7 cm');
    expect(svg).toContain('stroke-dashoffset'); // animated outline
  });

  it('circle renderer draws a labeled diameter line when show=diameter', () => {
    const svg = renderers.circle({
      type: 'circle', width: 360, height: 280,
      data: { diameter: 14, show: 'diameter', label: '14 cm' },
    });
    expect(svg).toContain('14 cm');
    expect(svg).toContain('#1d4ed8'); // dimension line color
  });

  it('semicircle renderer draws an arc path with a labeled diameter', () => {
    const svg = renderers.semicircle({
      type: 'semicircle', width: 360, height: 280,
      data: { diameter: 28, label: '28 cm', note: 'composite figure' },
    });
    expect(svg).toContain('<path');
    expect(svg).toContain('A '); // arc command
    expect(svg).toContain('28 cm');
    expect(svg).toContain('composite figure'); // optional note
  });

  it('quarter_circle renderer draws a quadrant with a labeled radius', () => {
    const svg = renderers.quarter_circle({
      type: 'quarter_circle', width: 360, height: 280,
      data: { radius: 14, label: '14 cm' },
    });
    expect(svg).toContain('<path');
    expect(svg).toContain('14 cm');
  });

  it('line_graph axes draw, path traces, then dots pop in', () => {
    const svg = renderers.line_graph({
      width: 400, height: 300,
      data: { points: [{ x: 1, y: 2 }, { x: 3, y: 5 }, { x: 5, y: 3 }] },
    });

    // 2 axis dash + 1 path dash + 3 dots (r grow + r settle each = 6) = 9 animate elements
    const animates = [...svg.matchAll(/<animate /g)];
    expect(animates.length).toBe(9);
    expect(svg).toContain('stroke-dashoffset');
  });
});
