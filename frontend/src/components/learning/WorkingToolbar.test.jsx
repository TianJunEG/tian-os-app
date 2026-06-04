import { describe, expect, it } from 'vitest';
import { WORKING_TOOLS } from './WorkingToolbar';

describe('WorkingToolbar tools', () => {
  it('includes bar-model drawing tools', () => {
    const toolIds = WORKING_TOOLS.map((tool) => tool.id);

    expect(toolIds).toEqual(expect.arrayContaining([
      'pen',
      'eraser',
      'line',
      'shade',
      'rectangle',
      'text',
    ]));
  });
});
