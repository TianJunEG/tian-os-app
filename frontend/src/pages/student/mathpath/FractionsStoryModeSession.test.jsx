import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../services/api', () => ({
  mathpathAPI: {
    startSession: vi.fn(),
    attempt: vi.fn(),
    complete: vi.fn(),
  },
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'student-story-test' } }),
}));

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
  }));
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,story-working');
  HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    width: 900,
    height: 320,
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function renderStoryRoute(path, flagValue = 'true') {
  vi.resetModules();
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.stubEnv('VITE_ENABLE_FRACTIONS_STORY_MODE', flagValue);
  const { default: FractionsStoryModeSession } = await import('./FractionsStoryModeSession.jsx');
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/student/mathpath/fractions/story" element={<FractionsStoryModeSession />} />
        <Route path="/student/mathpath/fractions/story/:skillId" element={<FractionsStoryModeSession />} />
      </Routes>
    </MemoryRouter>
  );
}

async function renderDomainStoryRoute(path) {
  vi.resetModules();
  vi.spyOn(Math, 'random').mockReturnValue(0);
  const { default: StoryModeDomainRoute } = await import('./StoryModeDomainRoute.jsx');
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/student/mathpath/:domain/story" element={<StoryModeDomainRoute />} />
        <Route path="/student/mathpath/:domain/story/:skillId" element={<StoryModeDomainRoute />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('FractionsStoryModeSession direct routes', () => {
  it('renders the default direct story route when enabled', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story', 'true');
    expect(screen.getAllByText('Fraction Rescue Mission').length).toBeGreaterThan(0);
    expect(screen.getByText(/Scene 1 of/i)).toBeInTheDocument();
  }, 10000);

  it('renders F025 direct route without navigation state', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    expect(screen.getAllByText('Fraction Rescue Mission').length).toBeGreaterThan(0);
    expect(screen.getByText(/Find what matters/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Need a hint/i })).toBeInTheDocument();
    expect(screen.queryByText(/Guided thinking steps/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Name the Target/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Math Challenge/i)).not.toBeInTheDocument();
  });

  it('renders F026 direct route without navigation state', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F026', 'true');
    expect(screen.getByText('Remainder Rescue Mission')).toBeInTheDocument();
    expect(screen.getByText(/Scene 1 of/i)).toBeInTheDocument();
  });

  it('uses scene progress language instead of generic question language', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    expect(screen.getByText(/Scene 1 of/i)).toBeInTheDocument();
    expect(screen.queryByText(/Question 1 of/i)).not.toBeInTheDocument();
  });

  it('renders the simplified story, visual, answer, and primary action layout', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    expect(screen.getByLabelText(/Story problem/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('story-visual-model').length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Your answer/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check Answer/i })).toBeInTheDocument();
  });

  it('renders fraction visuals from the actual story values', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    expect(screen.getAllByTestId('story-visual-model').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Used 2\/5/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Left 3\/5/i).length).toBeGreaterThan(0);
  });

  it('reveals progressive hints only after the student asks', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    expect(screen.queryByText(/Hint 1:/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Need a hint/i }));
    expect(screen.getByText(/Hint 1:/i)).toBeInTheDocument();
    expect(screen.queryByText(/Hint 2:/i)).not.toBeInTheDocument();
  });

  it('keeps working space collapsed until requested', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    expect(screen.queryByLabelText(/Working canvas/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Show working space/i }));
    expect(screen.getByLabelText(/Working canvas/i)).toBeInTheDocument();
  });

  it('shows story-specific retry guidance for a wrong answer', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'How many given away' }));
    fireEvent.click(screen.getByRole('button', { name: /Check Answer/i }));
    expect(screen.getByText(/Check the question again/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check Answer/i })).toBeInTheDocument();
  });

  it('shows success narration before unlocking the next scene', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'How many at first' }));
    fireEvent.click(screen.getByRole('button', { name: /Check Answer/i }));
    expect(screen.getByText(/Good. This clue is now clear/i)).toBeInTheDocument();
    expect(screen.getByText(/Scene 2 is unlocked/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next Scene/i })).toBeInTheDocument();
  });

  it('shows a safe pilot unavailable state when Story Mode is gated', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'false');
    expect(screen.queryByText(/Problem Solving Story is not available yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Return to MathPath to continue practice/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Story Mode is not available for this pilot yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to MathPath/i })).toBeInTheDocument();
  });

  it('handles invalid skill routes safely', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F099', 'true');
    expect(screen.getByText(/supported Story Mode skill/i)).toBeInTheDocument();
    expect(screen.getByText(/Start F025 Story/i)).toBeInTheDocument();
    expect(screen.getByText(/Start F026 Story/i)).toBeInTheDocument();
  });

  it('shows a graceful coming-soon state for unsupported story domains', async () => {
    await renderDomainStoryRoute('/student/mathpath/geometry/story');
    expect(screen.getByText(/Story Mode for this topic is coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/Fractions Story Mode is ready now/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Fractions Story/i)).toBeInTheDocument();
  });
});
