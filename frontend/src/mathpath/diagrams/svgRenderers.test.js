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

  it('bar_chart axes draw then bars grow upward with staggered timing', () => {
    const svg = renderers.bar_chart({
      width: 400, height: 300,
      data: { bars: [{ value: 10, label: 'A' }, { value: 7, label: 'B' }, { value: 4, label: 'C' }] },
    });

    // 2 axis dash + 3 bars (height+y each = 6) + 3 label opacity = 11 animate elements
    const animates = [...svg.matchAll(/<animate /g)];
    expect(animates.length).toBe(11);
    // Bars grow from y0 (bottom)
    expect(svg).toContain('attributeName="height"');
    expect(svg).toContain('attributeName="y"');
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
