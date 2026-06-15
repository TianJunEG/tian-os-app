import React, { useEffect, useMemo, useState } from 'react';
import { langLabel } from '../../utils/spellingLang';

// Tracks which language a mixed practice pool (Due / Surprise / Revision) is
// currently scoped to. Returns the distinct languages present, the active one
// (defaulting to the first), a setter, and the words filtered to it. This keeps
// each practice session single-language so activities and the read-aloud voice
// stay consistent.
export function useLanguageScope(words) {
  const langs = useMemo(() => {
    const seen = [];
    for (const w of words) {
      const l = w.language || 'en';
      if (!seen.includes(l)) seen.push(l);
    }
    return seen;
  }, [words]);

  const [lang, setLang] = useState(null);
  useEffect(() => {
    if (langs.length && (lang == null || !langs.includes(lang))) setLang(langs[0]);
  }, [langs, lang]);

  const active = lang && langs.includes(lang) ? lang : langs[0] || 'en';
  const filtered = useMemo(
    () => words.filter((w) => (w.language || 'en') === active),
    [words, active]
  );
  return { langs, lang: active, setLang, filtered };
}

// Chips to switch the active language; renders nothing when only one language
// is present (the common case), so monolingual users see no change.
export function LanguageScopeTabs({ langs, lang, setLang, className = '' }) {
  if (!langs || langs.length < 2) return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 mb-4 ${className}`}>
      <span className="text-sm text-gray-500">Practise in:</span>
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
            l === lang
              ? 'bg-emerald text-white border-navy-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-navy-400'
          }`}
        >
          {langLabel(l)}
        </button>
      ))}
    </div>
  );
}
