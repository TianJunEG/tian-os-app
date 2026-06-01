import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../services/api', () => ({
  mathpathAPI: {
    startSession: vi.fn(),
    attempt: vi.fn(),
    complete: vi.fn(),
  },
}));

async function renderStoryRoute(path, flagValue = 'true') {
  vi.resetModules();
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
    expect(screen.getByText(/F025/)).toBeInTheDocument();
  });

  it('renders F025 direct route without navigation state', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F025', 'true');
    expect(screen.getByText(/F025/)).toBeInTheDocument();
    expect(screen.getByText(/Story support/)).toBeInTheDocument();
  });

  it('renders F026 direct route without navigation state', async () => {
    await renderStoryRoute('/student/mathpath/fractions/story/F026', 'true');
    expect(screen.getByText(/F026/)).toBeInTheDocument();
    expect(screen.getByText(/Story support/)).toBeInTheDocument();
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
