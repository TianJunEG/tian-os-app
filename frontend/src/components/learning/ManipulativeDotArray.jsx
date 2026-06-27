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

// ── Money coin/note diagram (driven by the generated question.diagram) ────────
// Real SGD denominations (in cents) → display metadata. Coins render as circles,
// notes as rounded rectangles, so a child can tell them apart at a glance. The
// label is what matters pedagogically; colours just help differentiate values.
const SGD_DENOM_META = {
  5:     { label: '5¢',   shape: 'coin', bg: '#b08d57', ring: '#8a6d3b', fg: '#fff' },
  10:    { label: '10¢',  shape: 'coin', bg: '#b9bcc2', ring: '#8a8f98', fg: '#1f2937' },
  20:    { label: '20¢',  shape: 'coin', bg: '#b9bcc2', ring: '#8a8f98', fg: '#1f2937' },
  50:    { label: '50¢',  shape: 'coin', bg: '#b9bcc2', ring: '#8a8f98', fg: '#1f2937' },
  100:   { label: '$1',   shape: 'coin', bg: '#d4a017', ring: '#a16207', fg: '#fff' },
  200:   { label: '$2',   shape: 'note', bg: '#7c3aed', ring: '#6d28d9', fg: '#fff' },
  500:   { label: '$5',   shape: 'note', bg: '#16a34a', ring: '#15803d', fg: '#fff' },
  1000:  { label: '$10',  shape: 'note', bg: '#dc2626', ring: '#b91c1c', fg: '#fff' },
  5000:  { label: '$50',  shape: 'note', bg: '#2563eb', ring: '#1d4ed8', fg: '#fff' },
  10000: { label: '$100', shape: 'note', bg: '#ea580c', ring: '#c2410c', fg: '#fff' },
};

// Extract the generated coin/note diagram from a question into a flat token list.
// The money generator emits diagram: { kind:'coins', items:[{ valueCents, count }] }.
// Returns null when the question has no usable coins diagram.
export function parseCoinsDiagram(question) {
  const d = question?.diagram;
  if (!d || d.kind !== 'coins' || !Array.isArray(d.items)) return null;
  const tokens = [];
  d.items.forEach((it, gi) => {
    const value = Number(it.valueCents);
    const count = Math.max(0, Number(it.count) || 0);
    if (!SGD_DENOM_META[value]) return;
    for (let i = 0; i < count; i += 1) tokens.push({ value, key: `g${gi}-${value}-${i}` });
  });
  return tokens.length ? tokens : null;
}

function MoneyPiece({ value, counted, onClick }) {
  const meta = SGD_DENOM_META[value];
  // Prefer a real coin/note image (transparent PNG) from /public/money/ when one
  // exists; fall back to the styled circle/rectangle if the file is missing or
  // fails to load, so the diagram always renders. Files: /money/coin-{cents}.png
  // (coins) and /money/note-{cents}.png (notes) — e.g. coin-100.png for $1.
  const [imgFailed, setImgFailed] = useState(false);
  if (!meta) return null;
  const isCoin = meta.shape === 'coin';
  const imgSrc = `/money/${isCoin ? 'coin' : 'note'}-${value}.png`;
  // Coin images render slightly larger than the drawn circles so the artwork
  // is legible; notes are landscape (~1.9:1, matching real SGD notes).
  const dim = isCoin ? { width: 58, height: 58 } : { width: 112, height: 60 };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={meta.label}
      className="relative flex shrink-0 items-center justify-center select-none transition-all"
      style={{
        ...dim,
        borderRadius: imgFailed ? (isCoin ? '9999px' : 8) : 0,
        background: imgFailed ? meta.bg : 'transparent',
        border: imgFailed ? `3px solid ${meta.ring}` : 'none',
        transform: counted ? 'scale(0.82)' : 'scale(1)',
        boxShadow: !counted && imgFailed ? '0 2px 4px rgba(0,0,0,0.18)' : 'none',
      }}
    >
      {imgFailed ? (
        <span className="font-bold" style={{ color: meta.fg, fontSize: isCoin ? 14 : 16, lineHeight: 1 }}>
          {meta.label}
        </span>
      ) : (
        <img
          src={imgSrc}
          alt={meta.label}
          draggable={false}
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        />
      )}
      {counted && <span className="absolute -bottom-1 -right-1 text-sm leading-none">✓</span>}
    </button>
  );
}

// Interactive coin/note display for money questions, driven by the question's
// GENERATED diagram (not a fragile prompt-text parse). Handles every SGD
// denomination the generator emits (5¢…$100), mixed in one question. Pass
// key={questionId} from the parent so the counted-state resets per question.
export function ManipulativeMoneyDiagram({ tokens = [] }) {
  const [counted, setCounted] = useState(new Set());
  const toggle = (key) =>
    setCounted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  if (!tokens.length) return null;
  return (
    <div className="rounded-2xl bg-yellow-50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {tokens.map(({ value, key }) => (
          <MoneyPiece key={key} value={value} counted={counted.has(key)} onClick={() => toggle(key)} />
        ))}
      </div>
      <p className="text-center text-xs text-ink-400">Tap the money to count</p>
    </div>
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

// ── K2 Early Numeracy: count & compare visuals (driven by question.diagram) ──
// Generator emits diagram:{kind:'count', emoji, count} and
// diagram:{kind:'compare', left:{emoji,count}, right:{emoji,count}}.
export function parseCountDiagram(question) {
  const d = question?.diagram;
  if (!d || d.kind !== 'count') return null;
  const count = Math.max(0, Math.min(30, Number(d.count) || 0));
  return { emoji: d.emoji || '🍎', count };
}

export function parseCompareDiagram(question) {
  const d = question?.diagram;
  if (!d || d.kind !== 'compare' || !d.left || !d.right) return null;
  const norm = (g) => ({ emoji: g.emoji || '🍎', count: Math.max(0, Math.min(20, Number(g.count) || 0)) });
  return { left: norm(d.left), right: norm(d.right) };
}

// One tappable emoji token that toggles a "counted" check — same affordance as
// the apple dots, but any emoji and reset-on-key handled by the parent.
function EmojiToken({ emoji, counted, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex shrink-0 items-center justify-center select-none transition-all"
      style={{ width: 48, height: 48, fontSize: 34, lineHeight: 1, transform: counted ? 'scale(0.82)' : 'scale(1)' }}
    >
      {emoji}
      {counted && <span className="absolute bottom-0 right-0 text-base leading-none">✓</span>}
    </button>
  );
}

// Single group of objects to count (EN001–EN004, EN006 whole). Pass
// key={questionId} from the parent so the counted-state resets per question.
export function ManipulativeCountArray({ emoji = '🍎', count = 0 }) {
  const [counted, setCounted] = useState(new Set());
  const toggle = (i) => setCounted((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  return (
    <div className="rounded-2xl bg-sky-50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-1">
        {Array.from({ length: count }, (_, i) => (
          <EmojiToken key={i} emoji={emoji} counted={counted.has(i)} onClick={() => toggle(i)} label={`Item ${i + 1}`} />
        ))}
      </div>
      <p className="text-center text-xs text-ink-400">Tap to count</p>
    </div>
  );
}

// Two rows to compare (EN005). Tapping counts within a row.
export function ManipulativeCompareSets({ left, right }) {
  const [counted, setCounted] = useState(new Set());
  const toggle = (key) => setCounted((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const Row = ({ group, prefix }) => (
    <div className="flex flex-wrap items-center justify-center gap-1 rounded-xl bg-white/70 p-2">
      {Array.from({ length: group.count }, (_, i) => (
        <EmojiToken
          key={`${prefix}${i}`}
          emoji={group.emoji}
          counted={counted.has(`${prefix}${i}`)}
          onClick={() => toggle(`${prefix}${i}`)}
          label={`${group.emoji} ${i + 1}`}
        />
      ))}
    </div>
  );
  return (
    <div className="rounded-2xl bg-sky-50 p-4 space-y-2">
      <Row group={left} prefix="l" />
      <Row group={right} prefix="r" />
      <p className="text-center text-xs text-ink-400">Tap to count each row</p>
    </div>
  );
}

// ── K2 Patterns: repeating-pattern strip (Strand B) ──────────────────────────
// Generator emits diagram:{kind:'pattern', items:[...emoji, null...], missingIndex}
// where the single null is the slot to work out (end = "what comes next",
// middle = "what's missing").
export function parsePatternDiagram(question) {
  const d = question?.diagram;
  if (!d || d.kind !== 'pattern' || !Array.isArray(d.items)) return null;
  return { items: d.items };
}

export function ManipulativePatternStrip({ items = [] }) {
  return (
    <div className="rounded-2xl bg-violet-50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 48,
              height: 48,
              fontSize: item == null ? 26 : 32,
              lineHeight: 1,
              background: item == null ? '#fff' : 'transparent',
              border: item == null ? '2px dashed #c4b5fd' : 'none',
              color: '#7c3aed',
              fontWeight: 700,
            }}
            aria-label={item == null ? 'missing' : `item ${i + 1}`}
          >
            {item == null ? '?' : item}
          </span>
        ))}
      </div>
      <p className="text-center text-xs text-ink-400">What goes in the box?</p>
    </div>
  );
}
