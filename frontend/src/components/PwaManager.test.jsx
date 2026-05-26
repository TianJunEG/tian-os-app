import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import PwaManager from './PwaManager';

describe('PwaManager', () => {
  it('renders nothing when online with no pending prompts', () => {
    const { container } = render(<PwaManager />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the offline indicator after an offline event', () => {
    render(<PwaManager />);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });
});
