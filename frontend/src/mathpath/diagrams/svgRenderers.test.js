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
