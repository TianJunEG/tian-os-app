import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AnswerInputRenderer from './AnswerInputRenderer';

function ControlledAnswer({ question, onSubmit = () => {} }) {
  const [answer, setAnswer] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(answer);
      }}
    >
      <AnswerInputRenderer question={question} value={answer} onChange={setAnswer} />
      <button type="submit">Submit answer</button>
    </form>
  );
}

const fractionQuestion = {
  questionId: 'q-f001',
  skillId: 'F001',
  prompt: 'What fraction of the shape is shaded?',
  answerFormat: 'fraction',
  allowedInputTools: ['fraction', 'clear'],
  answer: { type: 'fraction', numerator: 1, denominator: 8, display: '1/8' },
};

const mixedNumberQuestion = {
  questionId: 'q-mixed',
  skillId: 'F016',
  prompt: 'Write 8/5 as a mixed number.',
  answerFormat: 'mixed_number',
  allowedInputTools: ['fraction', 'clear'],
  answer: { type: 'mixed', whole: 1, numerator: 3, denominator: 5, display: '1 3/5' },
};

function openFractionPopup() {
  fireEvent.click(screen.getByRole('button', { name: 'Fraction' }));
}

function openMixedPopup() {
  fireEvent.click(screen.getByRole('button', { name: 'Mixed Number' }));
}

describe('AnswerInputRenderer contextual math input', () => {
  it('renders contextual tools and opens a structured fraction popup for F001', () => {
    render(<ControlledAnswer question={fractionQuestion} />);

    expect(screen.getByText('Answer as a fraction')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Math answer value' })).toHaveTextContent('Tap to enter');
    expect(screen.getByRole('button', { name: 'Fraction' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Mixed Number' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Whole Number' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Clear answer' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Root' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exponent' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Angle' })).not.toBeInTheDocument();

    openFractionPopup();
    expect(screen.getByRole('textbox', { name: 'Numerator' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Denominator' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert' })).toBeVisible();
  });

  it('submits numerator and denominator as a fraction string', () => {
    const onSubmit = vi.fn();
    render(<ControlledAnswer question={fractionQuestion} onSubmit={onSubmit} />);

    openFractionPopup();
    fireEvent.change(screen.getByRole('textbox', { name: 'Numerator' }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Denominator' }), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));

    expect(onSubmit).toHaveBeenCalledWith('1/8');
  });

  it('clears numerator and denominator from the contextual toolbar', () => {
    render(<ControlledAnswer question={fractionQuestion} />);

    openFractionPopup();
    const numerator = screen.getByRole('textbox', { name: 'Numerator' });
    const denominator = screen.getByRole('textbox', { name: 'Denominator' });
    fireEvent.change(numerator, { target: { value: '1' } });
    fireEvent.change(denominator, { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear answer' }));
    openFractionPopup();

    expect(screen.getByRole('textbox', { name: 'Numerator' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Denominator' })).toHaveValue('');
  });

  it('switches between fraction and mixed number modes without losing values', () => {
    render(<ControlledAnswer question={fractionQuestion} />);

    openFractionPopup();
    fireEvent.change(screen.getByRole('textbox', { name: 'Numerator' }), { target: { value: '7' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Denominator' }), { target: { value: '6' } });
    openMixedPopup();
    fireEvent.change(screen.getByRole('textbox', { name: 'Whole number' }), { target: { value: '1' } });

    expect(screen.getByRole('textbox', { name: 'Whole number' })).toHaveValue('1');
    expect(screen.getByRole('textbox', { name: 'Numerator' })).toHaveValue('7');
    expect(screen.getByRole('textbox', { name: 'Denominator' })).toHaveValue('6');

    fireEvent.click(screen.getByRole('button', { name: 'Fraction' }));
    expect(screen.queryByRole('textbox', { name: 'Whole number' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Numerator' })).toHaveValue('7');
    expect(screen.getByRole('textbox', { name: 'Denominator' })).toHaveValue('6');

    openMixedPopup();
    expect(screen.getByRole('textbox', { name: 'Whole number' })).toHaveValue('1');
  });

  it('can switch to whole number mode and clear all fields', () => {
    render(<ControlledAnswer question={fractionQuestion} />);

    openFractionPopup();
    fireEvent.change(screen.getByRole('textbox', { name: 'Numerator' }), { target: { value: '7' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Denominator' }), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Whole Number' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Whole number' }), { target: { value: '2' } });

    expect(screen.queryByRole('textbox', { name: 'Numerator' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Whole number' })).toHaveValue('2');

    fireEvent.click(screen.getByRole('button', { name: 'Clear answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mixed Number' }));
    expect(screen.getByRole('textbox', { name: 'Whole number' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Numerator' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Denominator' })).toHaveValue('');
  });

  it('fills numerator and denominator when pasting a fraction', () => {
    render(<ControlledAnswer question={fractionQuestion} />);

    openFractionPopup();
    const numerator = screen.getByRole('textbox', { name: 'Numerator' });
    fireEvent.paste(numerator, {
      clipboardData: { getData: () => '1/8' },
    });

    expect(numerator).toHaveValue('1');
    expect(screen.getByRole('textbox', { name: 'Denominator' })).toHaveValue('8');
  });

  it('moves from numerator to denominator on Tab', () => {
    render(<ControlledAnswer question={fractionQuestion} />);

    openFractionPopup();
    const numerator = screen.getByRole('textbox', { name: 'Numerator' });
    const denominator = screen.getByRole('textbox', { name: 'Denominator' });
    numerator.focus();
    fireEvent.keyDown(numerator, { key: 'Tab' });

    expect(denominator).toHaveFocus();
  });

  it('does not render the old raw-template toolbar for expression answer formats', () => {
    render(
      <ControlledAnswer
        question={{
          questionId: 'q-expression',
          answerFormat: 'expression',
          allowedInputTools: ['fraction', 'power', 'root', 'angle', 'clear'],
          answer: { type: 'text', value: 'x^2', display: 'x^2' },
        }}
      />
    );

    expect(screen.getByText('Expression answer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fraction' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exponent' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Root' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Angle' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  it('preserves a mixed number when the whole number is entered first', () => {
    const onSubmit = vi.fn();
    render(<ControlledAnswer question={mixedNumberQuestion} onSubmit={onSubmit} />);

    openMixedPopup();
    const whole = screen.getByRole('textbox', { name: 'Whole number' });
    const numerator = screen.getByRole('textbox', { name: 'Numerator' });
    const denominator = screen.getByRole('textbox', { name: 'Denominator' });

    fireEvent.change(whole, { target: { value: '2' } });
    numerator.focus();
    fireEvent.change(numerator, { target: { value: '3' } });
    denominator.focus();
    fireEvent.change(denominator, { target: { value: '5' } });
    whole.focus();
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));

    expect(whole).toHaveValue('2');
    expect(numerator).toHaveValue('3');
    expect(denominator).toHaveValue('5');

    fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(onSubmit).toHaveBeenCalledWith('2 3/5');
  });

  it('shows mixed-number helper text for improper fraction answers', () => {
    render(
      <ControlledAnswer
        question={{
          ...fractionQuestion,
          answer: { type: 'fraction', numerator: 7, denominator: 6, display: '7/6' },
        }}
      />
    );

    expect(screen.getByText('Answer as a fraction or mixed number.')).toBeInTheDocument();
  });

  it('marks denominator zero as invalid in the input', () => {
    render(<ControlledAnswer question={fractionQuestion} />);

    openFractionPopup();
    fireEvent.change(screen.getByRole('textbox', { name: 'Denominator' }), { target: { value: '0' } });

    expect(screen.getByRole('textbox', { name: 'Denominator' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Denominator cannot be zero.')).toBeInTheDocument();
  });

  it('preserves a mixed number when the numerator is entered first', () => {
    render(<ControlledAnswer question={mixedNumberQuestion} />);

    openMixedPopup();
    const whole = screen.getByRole('textbox', { name: 'Whole number' });
    const numerator = screen.getByRole('textbox', { name: 'Numerator' });
    const denominator = screen.getByRole('textbox', { name: 'Denominator' });

    fireEvent.change(numerator, { target: { value: '3' } });
    whole.focus();
    fireEvent.change(whole, { target: { value: '2' } });
    denominator.focus();
    fireEvent.change(denominator, { target: { value: '5' } });

    expect(whole).toHaveValue('2');
    expect(numerator).toHaveValue('3');
    expect(denominator).toHaveValue('5');
  });

  it('preserves a mixed number when the denominator is entered first', () => {
    render(<ControlledAnswer question={mixedNumberQuestion} />);

    openMixedPopup();
    const whole = screen.getByRole('textbox', { name: 'Whole number' });
    const numerator = screen.getByRole('textbox', { name: 'Numerator' });
    const denominator = screen.getByRole('textbox', { name: 'Denominator' });

    fireEvent.change(denominator, { target: { value: '5' } });
    whole.focus();
    fireEvent.change(whole, { target: { value: '2' } });
    numerator.focus();
    fireEvent.change(numerator, { target: { value: '3' } });

    expect(whole).toHaveValue('2');
    expect(numerator).toHaveValue('3');
    expect(denominator).toHaveValue('5');
  });

  it('does not clear mixed number fields when switching focus while partially complete', () => {
    render(<ControlledAnswer question={mixedNumberQuestion} />);

    openMixedPopup();
    const whole = screen.getByRole('textbox', { name: 'Whole number' });
    const numerator = screen.getByRole('textbox', { name: 'Numerator' });
    const denominator = screen.getByRole('textbox', { name: 'Denominator' });

    fireEvent.change(whole, { target: { value: '2' } });
    fireEvent.change(numerator, { target: { value: '3' } });
    denominator.focus();
    whole.focus();
    numerator.focus();

    expect(whole).toHaveValue('2');
    expect(numerator).toHaveValue('3');
    expect(denominator).toHaveValue('');
  });

  it('keeps incomplete mixed numbers visible until submission validation', () => {
    const onSubmit = vi.fn();
    render(<ControlledAnswer question={mixedNumberQuestion} onSubmit={onSubmit} />);

    openMixedPopup();
    const whole = screen.getByRole('textbox', { name: 'Whole number' });
    const numerator = screen.getByRole('textbox', { name: 'Numerator' });
    const denominator = screen.getByRole('textbox', { name: 'Denominator' });

    fireEvent.change(whole, { target: { value: '2' } });
    fireEvent.change(numerator, { target: { value: '3' } });

    expect(whole).toHaveValue('2');
    expect(numerator).toHaveValue('3');
    expect(denominator).toHaveValue('');

    fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(onSubmit).toHaveBeenCalledWith('2 3/');
  });
});
