import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MathPathDomainGrid, { MATHPATH_DOMAINS } from './MathPathDomainGrid';

describe('MathPathDomainGrid', () => {
  it('covers all 15 MathPath domains', () => {
    expect(MATHPATH_DOMAINS.length).toBe(15);
    const slugs = MATHPATH_DOMAINS.map((d) => d.slug);
    for (const slug of ['fractions', 'decimals', 'percentages', 'ratio-rate', 'number-sense',
      'operations', 'money', 'time', 'measurement', 'area-perimeter', 'volume',
      'geometry', 'circles', 'statistics', 'algebra']) {
      expect(slugs, slug).toContain(slug);
    }
  });

  it('renders a link to /student/mathpath/<slug> for every domain', () => {
    render(<MemoryRouter><MathPathDomainGrid /></MemoryRouter>);
    for (const d of MATHPATH_DOMAINS) {
      const link = screen.getByLabelText(`Open ${d.label}`);
      expect(link.getAttribute('href')).toBe(`/student/mathpath/${d.slug}`);
    }
  });

  it('uses the canonical /fractions route (not the legacy /path)', () => {
    render(<MemoryRouter><MathPathDomainGrid /></MemoryRouter>);
    expect(screen.getByLabelText('Open Fractions').getAttribute('href')).toBe('/student/mathpath/fractions');
  });
});
