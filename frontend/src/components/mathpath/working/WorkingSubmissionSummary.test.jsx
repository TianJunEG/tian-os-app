import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WorkingSubmissionSummary from './WorkingSubmissionSummary';

describe('WorkingSubmissionSummary', () => {
  it('counts submitted, not-needed, and missing working decisions', () => {
    render(
      <WorkingSubmissionSummary
        questionRefs={[
          { questionId: 'q1', prompt: 'Q1', workingRequired: true, workingSubmitted: true },
          { questionId: 'q2', prompt: 'Q2', workingRequired: true, workingNotNeeded: true },
          { questionId: 'q3', prompt: 'Q3', workingRequired: true },
        ]}
      />
    );

    expect(screen.getByText('Questions shown')).toBeInTheDocument();
    expect(screen.getByText('Working submitted')).toBeInTheDocument();
    expect(screen.getByText('Working not needed')).toBeInTheDocument();
    expect(screen.getByText('Missing working')).toBeInTheDocument();
    expect(screen.getByText('Working still needed')).toBeInTheDocument();
  });

  it('shows ready-to-continue copy when every question is marked no working needed', () => {
    render(
      <WorkingSubmissionSummary
        questionRefs={[
          { questionId: 'q1', prompt: 'Q1', workingRequired: true, workingNotNeeded: true },
          { questionId: 'q2', prompt: 'Q2', workingRequired: true, workingNotNeeded: true },
        ]}
      />
    );

    expect(screen.getByText('Ready to continue')).toBeInTheDocument();
    expect(screen.getByText('No working upload needed. You have declared working was not needed for these questions.')).toBeInTheDocument();
  });
});
