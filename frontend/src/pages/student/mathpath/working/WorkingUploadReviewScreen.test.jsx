import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WorkingUploadReviewScreen from './WorkingUploadReviewScreen';
import { mathpathAPI } from '../../../../services/api';

vi.mock('../../../../services/api', () => ({
  mathpathAPI: {
    createWorkingSession: vi.fn(),
    uploadWorking: vi.fn(),
    markNoWorking: vi.fn(),
  },
}));

function MathPathLandingProbe() {
  const location = useLocation();
  return (
    <div>
      <h1>MathPath Landing</h1>
      <p>{location.state?.workingStatus}</p>
      <p>{location.state?.workingSummary?.allNoWorkingDeclarations ? 'all-no-working' : 'not-all-no-working'}</p>
    </div>
  );
}

function renderReview(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/student/mathpath/working/review', state }]}>
      <Routes>
        <Route path="/student/mathpath/working/review" element={<WorkingUploadReviewScreen />} />
        <Route path="/student/mathpath" element={<MathPathLandingProbe />} />
        <Route path="/student/mathpath/working/success" element={<h1>Upload Success</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('WorkingUploadReviewScreen', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('skips upload success when all questions are declared no-working and no files were uploaded', async () => {
    renderReview({
      practiceSessionId: 'practice-1',
      questionRefs: [
        { questionId: 'q1', workingRequired: true, workingNotNeeded: true },
        { questionId: 'q2', workingRequired: true, workingNotNeeded: true },
      ],
      rawFiles: [],
      files: [],
      noWorkingChecked: {},
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Working' }));

    await waitFor(() => expect(screen.getByText('MathPath Landing')).toBeInTheDocument());
    expect(screen.getByText('ready_to_continue')).toBeInTheDocument();
    expect(screen.getByText('all-no-working')).toBeInTheDocument();
    expect(screen.queryByText('Upload Success')).not.toBeInTheDocument();
  });

  it('does not allow zero-file success when required working is still missing', async () => {
    renderReview({
      practiceSessionId: 'practice-1',
      questionRefs: [
        { questionId: 'q1', workingRequired: true, workingNotNeeded: true },
        { questionId: 'q2', workingRequired: true },
      ],
      rawFiles: [],
      files: [],
      noWorkingChecked: {},
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Working' }));

    await waitFor(() => expect(screen.getByText('Please upload working or mark working not needed for each required question before continuing.')).toBeInTheDocument());
    expect(screen.queryByText('Upload Success')).not.toBeInTheDocument();
  });

  it('uploads working and continues when the backend confirms saved metadata', async () => {
    const file = new File(['working page'], 'working.png', { type: 'image/png' });
    mathpathAPI.uploadWorking.mockResolvedValue({
      data: {
        workingSession: {
          workingSessionId: 'work-1',
          fileMetadata: [{ originalName: 'working.png', storageRef: '/uploads/mathpath-working/work-1/working.png' }],
          questionWorkingMap: [{ questionId: 'q1', workingRequired: true }],
          analysisStatus: 'pending_analysis',
        },
      },
    });

    renderReview({
      workingSessionId: 'work-1',
      practiceSessionId: 'practice-1',
      questionRefs: [{ questionId: 'q1', workingRequired: true }],
      rawFiles: [file],
      files: [{ id: 'page-1', file, name: 'working.png', type: 'image/png', size: file.size }],
      noWorkingChecked: {},
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Working' }));

    await waitFor(() => expect(screen.getByText('Upload Success')).toBeInTheDocument());
    expect(mathpathAPI.uploadWorking).toHaveBeenCalledWith('work-1', expect.any(FormData));
  });

  it('shows a retryable error and re-enables submit when upload fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const file = new File(['working page'], 'working.png', { type: 'image/png' });
    mathpathAPI.uploadWorking.mockRejectedValue(new Error('backend unavailable'));

    renderReview({
      workingSessionId: 'work-1',
      practiceSessionId: 'practice-1',
      questionRefs: [{ questionId: 'q1', workingRequired: true }],
      rawFiles: [file],
      files: [{ id: 'page-1', file, name: 'working.png', type: 'image/png', size: file.size }],
      noWorkingChecked: {},
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Working' }));

    await waitFor(() => expect(screen.getByText('We could not save your working. Please try again.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Submit Working' })).toBeEnabled();
    expect(screen.queryByText('Upload Success')).not.toBeInTheDocument();
  });

  it('times out a hanging upload and re-enables submit', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const file = new File(['working page'], 'working.png', { type: 'image/png' });
    mathpathAPI.uploadWorking.mockReturnValue(new Promise(() => {}));

    renderReview({
      workingSessionId: 'work-1',
      practiceSessionId: 'practice-1',
      questionRefs: [{ questionId: 'q1', workingRequired: true }],
      rawFiles: [file],
      files: [{ id: 'page-1', file, name: 'working.png', type: 'image/png', size: file.size }],
      noWorkingChecked: {},
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Working' }));
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(12001);
      await Promise.resolve();
    });

    expect(screen.getByText('We could not save your working. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Working' })).toBeEnabled();
  });
});
