import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MathSymbolBar, { SYMBOL_DEFS, DEFAULT_SYMBOLS } from './MathSymbolBar';
import AnswerInputRenderer from './AnswerInputRenderer';

describe('MathSymbolBar', () => {
  it('appends a symbol token to the current value', () => {
    const onChange = vi.fn();
    render(<MathSymbolBar symbols={['pi', 'root']} value="3" onChange={onChange} />);
    fireEvent.mouseDown(screen.getByTitle('Pi'));
    expect(onChange).toHaveBeenCalledWith('3π');
  });

  it('backspace removes the last character', () => {
    const onChange = vi.fn();
    render(<MathSymbolBar symbols={['pi']} value="12π" onChange={onChange} />);
    fireEvent.mouseDown(screen.getByTitle('Delete last character'));
    expect(onChange).toHaveBeenCalledWith('12');
  });

  it('renders nothing when no symbols are given', () => {
    const { container } = render(<MathSymbolBar symbols={[]} value="" onChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('exposes the symbols needed for circles/geometry/algebra', () => {
    for (const key of ['pi', 'degree', 'angle', 'root', 'power', 'square']) {
      expect(SYMBOL_DEFS[key], key).toBeTruthy();
    }
    expect(DEFAULT_SYMBOLS.length).toBeGreaterThan(0);
  });
});

describe('AnswerInputRenderer expression symbols', () => {
  it('shows a math symbol bar for expression/algebra answers', () => {
    render(
      <AnswerInputRenderer
        question={{ answerFormat: 'expression', prompt: 'Simplify 2x + 3x' }}
        value=""
        onChange={() => {}}
      />,
    );
    // π is one of the EXPRESSION_SYMBOLS — proves the bar is wired in.
    expect(screen.getByTitle('Pi')).toBeTruthy();
    expect(screen.getByTitle('To the power of')).toBeTruthy();
  });

  it('does not show the symbol bar for a plain decimal answer', () => {
    render(
      <AnswerInputRenderer
        question={{ answerFormat: 'decimal', prompt: '0.5 + 0.25' }}
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.queryByTitle('Pi')).toBeNull();
  });
});
