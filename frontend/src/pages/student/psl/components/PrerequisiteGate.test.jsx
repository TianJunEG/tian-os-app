import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrerequisiteGate from './PrerequisiteGate';

function renderGate(props = {}) {
  return render(
    <MemoryRouter>
      <PrerequisiteGate {...props} />
    </MemoryRouter>
  );
}

describe('PrerequisiteGate', () => {
  it('returns null when blockers is empty', () => {
    const { container } = renderGate({ blockers: [] });
    expect(container.firstChild).toBeNull();
  });

  it('returns null when blockers not provided', () => {
    const { container } = renderGate();
    expect(container.firstChild).toBeNull();
  });

  it('renders the heading and blockers list', () => {
    renderGate({
      blockers: [
        { code: 'F010', name: 'Equivalent Fractions', type: 'mathpath', score: 40 },
      ],
    });
    expect(screen.getByText(/prerequisites needed/i)).toBeInTheDocument();
    expect(screen.getByText(/Equivalent Fractions/)).toBeInTheDocument();
  });

  it('shows score percentage for each blocker', () => {
    renderGate({
      blockers: [
        { code: 'F010', name: 'Fractions', type: 'mathpath', score: 40 },
        { code: 'PSL01', name: 'Bar Model', type: 'psl', score: 25 },
      ],
    });
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.getByText(/25%/)).toBeInTheDocument();
  });

  it('renders a link to MathPath', () => {
    renderGate({
      blockers: [{ code: 'F010', name: 'Fractions', type: 'mathpath', score: 40 }],
    });
    expect(screen.getByText(/go to mathpath/i)).toBeInTheDocument();
  });
});
