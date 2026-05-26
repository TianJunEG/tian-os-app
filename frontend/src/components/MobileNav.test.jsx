import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobileNav from './MobileNav';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: mockUseAuth }));

function renderNav(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MobileNav />
    </MemoryRouter>
  );
}

describe('MobileNav', () => {
  beforeEach(() => mockUseAuth.mockReset());

  it('renders the full set of items for a parent', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'parent' } });
    renderNav();
    ['Home', 'Find', 'Practice', 'Bookings', 'Messages'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument()
    );
  });

  it('renders a reduced set for a student', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'student' } });
    renderNav();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
    expect(screen.queryByText('Bookings')).not.toBeInTheDocument();
    expect(screen.queryByText('Messages')).not.toBeInTheDocument();
  });

  it('renders nothing when there is no recognized role', () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = renderNav();
    expect(container).toBeEmptyDOMElement();
  });
});
