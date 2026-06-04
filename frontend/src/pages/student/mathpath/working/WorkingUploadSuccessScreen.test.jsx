import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WorkingUploadSuccessScreen from './WorkingUploadSuccessScreen';

function renderSuccess(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/student/mathpath/working/success', state }]}>
      <Routes>
        <Route path="/student/mathpath/working/success" element={<WorkingUploadSuccessScreen />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('WorkingUploadSuccessScreen', () => {
  it('does not call zero-page declarations an upload success', () => {
    renderSuccess({
      pagesUploaded: 0,
      requiringWorkingCount: 2,
      workingNotNeededCount: 2,
      nextRecommendedAction: 'continuePractice',
      prepared: { missingWorkingQuestions: [] },
    });

    expect(screen.getByText('No Working Upload Needed')).toBeInTheDocument();
    expect(screen.queryByText('Working Uploaded Successfully')).not.toBeInTheDocument();
    expect(screen.getByText('No working upload needed. You have declared working was not needed for these questions.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Continue Practice' }).length).toBeGreaterThan(0);
  });

  it('preserves uploaded working success when pages were uploaded', () => {
    renderSuccess({
      pagesUploaded: 2,
      requiringWorkingCount: 2,
      nextRecommendedAction: 'continuePractice',
      prepared: { status: 'pending_analysis', mappedQuestions: ['q1', 'q2'], missingWorkingQuestions: [] },
    });

    expect(screen.getByText('Working Uploaded Successfully')).toBeInTheDocument();
    expect(screen.getByText('Pages Uploaded:')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });
});
