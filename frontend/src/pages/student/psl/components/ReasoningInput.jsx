import React, { useState } from 'react';

export default function ReasoningInput({ value = '', onChange, placeholder = 'Explain your thinking (optional)' }) {
  const [expanded, setExpanded] = useState(!!value);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-2 text-xs font-medium text-gold-600 hover:text-gold-700"
      >
        + Write my reasoning
      </button>
    );
  }

  return (
    <div className="mt-3">
      <label className="mb-1 block text-xs font-medium text-ink-400">My reasoning</label>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-ink-200 bg-ink-50/30 px-3 py-2 text-sm text-ink-700 outline-none placeholder:text-ink-300 focus:border-gold-400"
      />
    </div>
  );
}
