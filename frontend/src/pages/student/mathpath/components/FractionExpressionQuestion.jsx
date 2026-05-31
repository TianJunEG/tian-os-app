import React from 'react';
import { MathText } from '../../../../components/ui/Fraction';
import FractionAnswerInput from './FractionAnswerInput';

const FRACTION_TOKEN = '(?:-?\d+\s+\d+\s*/\s*\d+|-?\d+\s*/\s*-?\d+)';
const FRACTION_EXPRESSION = new RegExp(`^(.*?)(${FRACTION_TOKEN}(?:\\s*[+\-−×÷*\\/]\\s*${FRACTION_TOKEN})(?:\\s*[+\-−×÷*\\/]\\s*${FRACTION_TOKEN})*)(.*)$`);

export function extractFractionExpression(prompt = '') {
  const text = String(prompt || '').trim();
  if (!text) return null;
  const match = text.match(FRACTION_EXPRESSION);
  if (!match) return null;

  const prefix = match[1].trim();
  const expression = match[2].trim();
  const rawSuffix = match[3].trim();
  const suffix = rawSuffix.replace(/^=+\s*/, '').replace(/^[:.,;]\s*/, '').trim();

  if (!expression.includes('+') && !expression.includes('-') && !expression.includes('×') && !expression.includes('÷')) {
    return null;
  }

  return { prefix: prefix || null, expression, suffix: suffix || null };
}

export default function FractionExpressionQuestion({
  prompt,
  value,
  onChange,
  onEnter,
  disabled = false,
  children,
}) {
  const parsed = extractFractionExpression(prompt);

  if (!parsed) {
    return <>{children || <MathText text={prompt} />}</>;
  }

  const { prefix, expression, suffix } = parsed;
  return (
    <div className="leading-relaxed text-ink-900">
      <div className="flex flex-wrap items-center gap-2 text-lg">
        {prefix ? <span><MathText text={`${prefix} `} /></span> : null}
        <MathText text={expression} />
        <span>=</span>
        <FractionAnswerInput
          value={value}
          onChange={onChange}
          disabled={disabled}
          onEnter={onEnter}
          mode="inline"
          allowWhole={false}
        />
        {suffix ? <span><MathText text={` ${suffix}`} /></span> : null}
      </div>
    </div>
  );
}
