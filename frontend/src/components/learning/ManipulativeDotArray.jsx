import React, { useState, useEffect } from 'react';

// Convert a math prompt to a TTS-friendly string (strips dot-array lines and symbols).
export function toSpeakable(text = '') {
  return String(text)
    .split('\n')
    .filter((line) => !/^[\s⬤●○+\-×÷=?]+$/.test(line.trim()))
    .join(' ')
    .replace(/[⬤●○]/g, '')
    // Mixed numbers before fractions: "4 1/4" → "4 and 1 out of 4"
    .replace(/(\d+)\s+(\d+)\/(\d+)/g, '$1 and $2 out of $3')
    // Plain fractions: "10/14" → "10 out of 14"
    .replace(/(\d+)\/(\d+)/g, '$1 out of $2')
    .replace(/\+/g, ' plus ')
    .replace(/[−–-]/g, ' minus ')
    .replace(/[×]/g, ' times ')
    .replace(/[÷]/g, ' divided by ')
    .replace(/=/g, ' equals ')
    .replace(/\?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse a question prompt that contains dot arrays (⬤ characters) and return
// {a, b, operator} for rendering the manipulative. Returns null if not a dot-array question.
export function parseDotStem(prompt = '') {
  const lines = String(prompt).split('\n');
  for (const line of lines) {
    const add = line.match(/^\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/);
    if (add) return { a: parseInt(add[1], 10), b: parseInt(add[2], 10), operator: '+' };
    // Match − (minus sign) or - (hyphen)
    const sub = line.match(/^\s*(\d+)\s*[−–\-]\s*(\d+)\s*=\s*\?/);
    if (sub) return { a: parseInt(sub[1], 10), b: parseInt(sub[2], 10), operator: '−' };
  }
  return null;
}

// Parse a money addition/subtraction prompt: "$8.00 + $5.00" → {a:8, b:5, operator:'+', unit:'$'}
// Only matches whole-dollar amounts (cents-only prompts not handled here).
export function parseMoneyPrompt(prompt = '') {
  const text = String(prompt);
  const add = text.match(/\$(\d+)(?:\.\d+)?\s*\+\s*\$(\d+)(?:\.\d+)?/);
  if (add) return { a: parseInt(add[1], 10), b: parseInt(add[2], 10), operator: '+', unit: '$' };
  const sub = text.match(/\$(\d+)(?:\.\d+)?\s*[−–-]\s*\$(\d+)(?:\.\d+)?/);
  if (sub) return { a: parseInt(sub[1], 10), b: parseInt(sub[2], 10), operator: '−', unit: '$' };
  return null;
}

// Return the numeric equation line from a dot-array prompt (strips the ⬤ line).
export function numericLine(prompt = '') {
  return String(prompt)
    .split('\n')
    .find((l) => /\d/.test(l))
    ?.trim() || String(prompt).trim();
}

function Dot({ removed, counted, onClick, label }) {
  return (
    <button
      type="button"
      onClick={removed ? undefined : onClick}
      disabled={removed}
      aria-label={label}
      className="relative flex shrink-0 items-center justify-center select-none transition-all"
      style={{
        width: 52,
        height: 52,
        fontSize: 38,
        lineHeight: 1,
        cursor: removed ? 'default' : 'pointer',
        filter: removed ? 'grayscale(1) opacity(0.25)' : 'none',
        transform: counted ? 'scale(0.82)' : 'scale(1)',
      }}
    >
      🍎
      {!removed && counted && (
        <span className="absolute bottom-0 right-0 text-base leading-none">✓</span>
      )}
    </button>
  );
}

// Interactive dot-array manipulative for K2/P1 addition and subtraction.
// - Addition: blue group (a) + orange group (b) = ?
// - Subtraction: blue group (a total), last b dots grayed/crossed as "taken away"
// Tapping an active dot toggles a counted checkmark to help students count by finger.
// Pass questionId as key from the parent so state resets between questions.
export default function ManipulativeDotArray({ a, b, operator }) {
  const [counted, setCounted] = useState(new Set());

  useEffect(() => {
    setCounted(new Set());
  }, [a, b, operator]);

  const toggle = (key) =>
    setCounted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (operator === '+') {
    return (
      <div className="rounded-2xl bg-red-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex flex-wrap justify-center gap-1">
            {Array.from({ length: a }, (_, i) => (
              <Dot
                key={`a${i}`}
                counted={counted.has(`a${i}`)}
                onClick={() => toggle(`a${i}`)}
                label={`Apple ${i + 1}`}
              />
            ))}
          </div>
          <span className="text-3xl font-bold text-ink-500">+</span>
          <div className="flex flex-wrap justify-center gap-1">
            {Array.from({ length: b }, (_, i) => (
              <Dot
                key={`b${i}`}
                counted={counted.has(`b${i}`)}
                onClick={() => toggle(`b${i}`)}
                label={`Apple ${i + 1}`}
              />
            ))}
          </div>
          <span className="text-3xl font-bold text-ink-500">= ?</span>
        </div>
        <p className="text-center text-xs text-ink-400">Tap the apples to count</p>
      </div>
    );
  }

  if (operator === '−' || operator === '-') {
    const remaining = a - b;
    return (
      <div className="rounded-2xl bg-red-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-1">
          {Array.from({ length: a }, (_, i) => {
            const isRemoved = i >= remaining;
            const key = `d${i}`;
            return (
              <Dot
                key={key}
                removed={isRemoved}
                counted={counted.has(key)}
                onClick={() => toggle(key)}
                label={isRemoved ? `Taken away` : `Apple ${i + 1}`}
              />
            );
          })}
          <span className="text-3xl font-bold text-ink-500">= ?</span>
        </div>
        <p className="text-center text-xs text-ink-400">Tap the apples left to count</p>
      </div>
    );
  }

  return null;
}

// Break a whole-dollar amount into $5 notes and $1 coins for visual display.
function denominationsFor(dollars) {
  const fives = Math.floor(dollars / 5);
  const ones = dollars % 5;
  return { fives, ones };
}

function MoneyToken({ type, counted, onClick, label }) {
  const isFive = type === 'five';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex shrink-0 items-center justify-center select-none transition-all rounded-full"
      style={{
        width: isFive ? 64 : 48,
        height: isFive ? 64 : 48,
        background: isFive ? '#16a34a' : '#ca8a04',
        border: `3px solid ${isFive ? '#15803d' : '#a16207'}`,
        transform: counted ? 'scale(0.82)' : 'scale(1)',
        boxShadow: counted ? 'none' : '0 2px 4px rgba(0,0,0,0.18)',
      }}
    >
      <span className="font-bold text-white" style={{ fontSize: isFive ? 15 : 13, lineHeight: 1 }}>
        {isFive ? '$5' : '$1'}
      </span>
      {counted && (
        <span className="absolute bottom-0 right-0 text-sm leading-none">✓</span>
      )}
    </button>
  );
}

// Interactive coin/note array for K2/P1 money questions.
// Shows $5 notes (green circles) and $1 coins (gold circles) for each dollar group.
// Only supports whole-dollar amounts ≤ $20 per group.
export function ManipulativeCoinArray({ a, b, operator }) {
  const [counted, setCounted] = useState(new Set());

  useEffect(() => { setCounted(new Set()); }, [a, b, operator]);

  const toggle = (key) =>
    setCounted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  function TokenGroup({ prefix, dollars }) {
    const { fives, ones } = denominationsFor(dollars);
    const tokens = [
      ...Array.from({ length: fives }, (_, i) => ({ type: 'five', key: `${prefix}f${i}`, label: `$5 note ${i + 1}` })),
      ...Array.from({ length: ones }, (_, i) => ({ type: 'one', key: `${prefix}o${i}`, label: `$1 coin ${i + 1}` })),
    ];
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {tokens.map(({ type, key, label }) => (
          <MoneyToken
            key={key}
            type={type}
            counted={counted.has(key)}
            onClick={() => toggle(key)}
            label={label}
          />
        ))}
      </div>
    );
  }

  if (operator === '+') {
    return (
      <div className="rounded-2xl bg-yellow-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <TokenGroup prefix="a" dollars={a} />
          <span className="text-3xl font-bold text-ink-500">+</span>
          <TokenGroup prefix="b" dollars={b} />
          <span className="text-3xl font-bold text-ink-500">= ?</span>
        </div>
        <p className="text-center text-xs text-ink-400">Tap to count the money</p>
      </div>
    );
  }

  if (operator === '−' || operator === '-') {
    const { fives: af, ones: ao } = denominationsFor(a);
    const { fives: rf, ones: ro } = denominationsFor(a - b);
    const remainingCount = rf + ro;
    const tokens = [
      ...Array.from({ length: af }, (_, i) => ({ type: 'five', key: `f${i}`, label: `$5 note ${i + 1}` })),
      ...Array.from({ length: ao }, (_, i) => ({ type: 'one', key: `o${i}`, label: `$1 coin ${i + 1}` })),
    ];
    const total = tokens.length;
    return (
      <div className="rounded-2xl bg-yellow-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tokens.map(({ type, key, label }, idx) => {
            const isRemoved = idx >= remainingCount;
            return (
              <button
                key={key}
                type="button"
                disabled={isRemoved}
                onClick={isRemoved ? undefined : () => toggle(key)}
                aria-label={isRemoved ? 'Spent' : label}
                className="relative flex shrink-0 items-center justify-center select-none rounded-full transition-all"
                style={{
                  width: type === 'five' ? 64 : 48,
                  height: type === 'five' ? 64 : 48,
                  background: isRemoved ? '#e5e7eb' : (type === 'five' ? '#16a34a' : '#ca8a04'),
                  border: `3px solid ${isRemoved ? '#d1d5db' : (type === 'five' ? '#15803d' : '#a16207')}`,
                  opacity: isRemoved ? 0.35 : 1,
                  transform: counted.has(key) ? 'scale(0.82)' : 'scale(1)',
                }}
              >
                {!isRemoved && (
                  <span className="font-bold text-white" style={{ fontSize: type === 'five' ? 15 : 13 }}>
                    {type === 'five' ? '$5' : '$1'}
                  </span>
                )}
                {!isRemoved && counted.has(key) && <span className="absolute bottom-0 right-0 text-sm">✓</span>}
              </button>
            );
          })}
          <span className="text-3xl font-bold text-ink-500">= ?</span>
        </div>
        <p className="text-center text-xs text-ink-400">Tap the money you have left to count</p>
      </div>
    );
  }

  return null;
}
