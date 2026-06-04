import { describe, expect, it } from 'vitest';
import { renderers } from './svgRenderers';

describe('fraction diagram renderers', () => {
  it('renders fraction bars with solid pastel blue fills instead of hatching', () => {
    const svg = renderers.fraction_bar({
      width: 320,
      height: 160,
      data: { parts: 4, shaded: 2, labelMode: 'none' },
    });

    expect(svg).toContain('fill="#bfdbfe"');
    expect(svg).toContain('fill="#fff"');
    expect(svg).not.toContain('<pattern');
    expect(svg).not.toContain('url(#');
    expect(svg).not.toContain('rotate(45)');
  });

  it('renders fraction circles with solid pastel blue fills instead of hatching', () => {
    const svg = renderers.fraction_circle({
      width: 320,
      height: 220,
      data: { parts: 6, shaded: 3 },
    });

    expect(svg).toContain('fill="#bfdbfe"');
    expect(svg).toContain('fill="#fff"');
    expect(svg).not.toContain('<pattern');
    expect(svg).not.toContain('url(#');
    expect(svg).not.toContain('rotate(45)');
  });
});
