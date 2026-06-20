import React, { useState, useEffect } from 'react';

// Convert a math prompt to a TTS-friendly string (strips dot-array lines and symbols).
export function toSpeakable(text = '') {
  return String(text)
    .split('\n')
    .filter((line) => !/^[\s⬤●○+\-×÷=?]+$/.test(line.trim()))
    .join(' ')
    .replace(/[⬤●○]/g, '')
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

// Return the numeric equation line from a dot-array prompt (strips the ⬤ line).
export function numericLine(prompt = '') {
  return String(prompt)
    .split('\n')
    .find((l) => /\d/.test(l))
    ?.trim() || String(prompt).trim();
}

function Dot({ color, removed, counted, onClick, label }) {
  return (
    <button
      type="button"
      onClick={removed ? undefined : onClick}
      disabled={removed}
      aria-label={label}
      className={`flex shrink-0 items-center justify-center rounded-full transition-all select-none ${!removed ? 'active:scale-90 cursor-pointer' : 'cursor-default'}`}
      style={{
        width: 44,
        height: 44,
        background: removed ? '#fee2e2' : counted ? '#d1fae5' : color,
        border: removed
          ? '2px solid #fca5a5'
          : counted
            ? '2px solid #34d399'
            : '2px solid rgba(0,0,0,0.10)',
      }}
    >
      {removed && <span className="text-xl font-bold text-red-400">×</span>}
      {!removed && counted && <span className="text-xl font-bold text-emerald-600">✓</span>}
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
      <div className="rounded-2xl bg-blue-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: a }, (_, i) => (
              <Dot
                key={`a${i}`}
                color="#3b82f6"
                counted={counted.has(`a${i}`)}
                onClick={() => toggle(`a${i}`)}
                label={`Group 1, dot ${i + 1}`}
              />
            ))}
          </div>
          <span className="text-2xl font-bold text-ink-500">+</span>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: b }, (_, i) => (
              <Dot
                key={`b${i}`}
                color="#f97316"
                counted={counted.has(`b${i}`)}
                onClick={() => toggle(`b${i}`)}
                label={`Group 2, dot ${i + 1}`}
              />
            ))}
          </div>
          <span className="text-2xl font-bold text-ink-500">= ?</span>
        </div>
        <p className="text-center text-xs text-ink-400">Tap the dots to count</p>
      </div>
    );
  }

  if (operator === '−' || operator === '-') {
    const remaining = a - b;
    return (
      <div className="rounded-2xl bg-orange-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: a }, (_, i) => {
            const isRemoved = i >= remaining;
            const key = `d${i}`;
            return (
              <Dot
                key={key}
                color="#3b82f6"
                removed={isRemoved}
                counted={counted.has(key)}
                onClick={() => toggle(key)}
                label={isRemoved ? `Taken away` : `Dot ${i + 1}`}
              />
            );
          })}
          <span className="text-2xl font-bold text-ink-500">= ?</span>
        </div>
        <p className="text-center text-xs text-ink-400">Tap the dots left to count</p>
      </div>
    );
  }

  return null;
}
