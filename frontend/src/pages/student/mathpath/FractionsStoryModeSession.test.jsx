import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../services/api', () => ({
  mathpathAPI: {
    startSession: vi.fn(),
    attempt: vi.fn(),
    complete: vi.fn(),
  },
}));

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

describe('FractionsStoryModeSession direct routes', () => {
  it('renders the default direct story route when enabled', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story', 'true');
    expect(screen.getByText('Problem Solving Story')).toBeInTheDocument();
    expect(screen.getByText('Fraction Rescue Mission')).toBeInTheDocument();
    expect(screen.getAllByText(/F025/).length).toBeGreaterThan(0);
  });

  it('renders F025 direct route without navigation state', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    expect(screen.getAllByText(/F025/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/This is a remainder problem/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Guided thinking steps/i)).toBeInTheDocument();
  });

  it('renders F026 direct route without navigation state', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F026', 'true');
    expect(screen.getAllByText(/F026/).length).toBeGreaterThan(0);
    expect(screen.getByText('Remainder Rescue Mission')).toBeInTheDocument();
    expect(screen.getAllByText(/multi-step remainder story/i).length).toBeGreaterThan(0);
  });

  it('uses scene progress language instead of generic question language', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    expect(screen.getByText(/Scene 1 of/i)).toBeInTheDocument();
    expect(screen.queryByText(/Question 1 of/i)).not.toBeInTheDocument();
  });

  it('shows story-specific retry guidance for a wrong answer', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'How many given away' }));
    fireEvent.click(screen.getByRole('button', { name: /Check this scene/i }));
    expect(screen.getByText(/Check the question again/i)).toBeInTheDocument();
    expect(screen.getByText(/Focus step:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check this scene/i })).toBeInTheDocument();
  });

  it('shows success narration before unlocking the next scene', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'How many at first' }));
    fireEvent.click(screen.getByRole('button', { name: /Check this scene/i }));
    expect(screen.getByText(/Good. This clue is now clear/i)).toBeInTheDocument();
    expect(screen.getByText(/Scene 2 is unlocked/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unlock next scene/i })).toBeInTheDocument();
  });

  it('blocks Story Mode when the feature flag is disabled', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'false');
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });

  it('handles invalid skill routes safely', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F099', 'true');
    expect(screen.getByText(/supported Story Mode skill/i)).toBeInTheDocument();
    expect(screen.getByText(/Start F025 Story/i)).toBeInTheDocument();
    expect(screen.getByText(/Start F026 Story/i)).toBeInTheDocument();
  });
});
