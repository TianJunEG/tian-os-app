import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DomainSkillMap from './DomainSkillMap';

const view = {
  progress: { mastered: 1, total: 4, inProgress: 1, percentageMastered: 25 },
  recommendedNext: { skillId: 'GE002', skillName: 'Measure angles' },
  strands: [
    {
      label: 'Angles',
      skills: [
        { id: 'GE001', name: 'Identify angles', statusLabel: 'Accurate', complete: true, locked: false, current: false, singaporeLevel: ['P3'], missingPrerequisiteNames: [] },
        { id: 'GE002', name: 'Measure angles', statusLabel: 'Learning', complete: false, locked: false, current: true, singaporeLevel: ['P4'], missingPrerequisiteNames: [] },
        { id: 'GE003', name: 'Angles on a line', statusLabel: 'Locked', complete: false, locked: true, current: false, singaporeLevel: ['P5'], missingPrerequisiteNames: ['Measure angles'] },
      ],
    },
  ],
};

function renderMap(onPractise = vi.fn()) {
  render(<MemoryRouter><DomainSkillMap domain="geometry" view={view} onPractise={onPractise} subtitle="Angles & shapes" /></MemoryRouter>);
  return onPractise;
}

describe('DomainSkillMap', () => {
  it('shows the themed domain label and subtitle', () => {
    renderMap();
    expect(screen.getByRole('heading', { name: 'Geometry' })).toBeTruthy();
    expect(screen.getByText('Angles & shapes')).toBeTruthy();
  });

  it('starts practice in one click on an unlocked skill', () => {
    const onPractise = renderMap();
    fireEvent.click(screen.getByLabelText('Practise Identify angles'));
    expect(onPractise).toHaveBeenCalledWith('GE001');
  });

  it('does not make a locked skill clickable', () => {
    const onPractise = renderMap();
    expect(screen.queryByLabelText('Practise Angles on a line')).toBeNull();
    expect(screen.getByLabelText('Angles on a line — locked')).toBeTruthy();
  });

  it('the recommended Practise button targets the recommended skill', () => {
    const onPractise = renderMap();
    fireEvent.click(screen.getByRole('button', { name: 'Practise' }));
    expect(onPractise).toHaveBeenCalledWith('GE002');
  });

  it('renders a footer slot when provided', () => {
    render(
      <MemoryRouter>
        <DomainSkillMap domain="decimals" view={view} onPractise={() => {}} footerSlot={<span>Speed Drill</span>} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Speed Drill')).toBeTruthy();
  });
});
