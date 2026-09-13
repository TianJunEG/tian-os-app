import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BackLink } from './index';

describe('BackLink', () => {
  it('renders a router link when given `to`', () => {
    render(
      <MemoryRouter>
        <BackLink to="/student">Back to Dashboard</BackLink>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /back to dashboard/i });
    expect(link).toHaveAttribute('href', '/student');
  });

  it('renders a button that fires onClick when given `onClick`', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<BackLink onClick={onClick}>Back</BackLink>);
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('defaults its label to "Back"', () => {
    render(<BackLink onClick={() => {}} />);
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });
});
