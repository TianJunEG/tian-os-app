import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, PartyPopper, Target, Plus } from 'lucide-react';
import SpellingHeader from '../../components/spelling/SpellingHeader';
import { spellingAPI } from '../../services/api';
import MockTest from '../../components/spelling/MockTest';
import ScrambleGame from '../../components/spelling/ScrambleGame';
import MissingLetters from '../../components/spelling/MissingLetters';
import LookCoverCheck from '../../components/spelling/LookCoverCheck';
import { useLanguageScope, LanguageScopeTabs } from '../../components/spelling/LanguageScope';
import { activitiesForLanguage, activityCopy } from '../../utils/spellingLang';

const ACTIVITIES = [
  { key: 'mock', label: 'Mock test', Comp: MockTest },
  { key: 'lookcover', label: 'Look · Cover · Check', Comp: LookCoverCheck },
  { key: 'scramble', label: 'Scramble', Comp: ScrambleGame },
  { key: 'missing', label: 'Missing letters', Comp: MissingLetters }
];

export default function SpellingRevisionPage() {
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [weakCount, setWeakCount] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);

  const load = () => {
    setLoading(true);
    setActivity(null);
    spellingAPI
      .getRevision({ count: 15 })
      .then((r) => {
        setWords(r.data.words || []);
        setWeakCount(r.data.weakCount || 0);
        setMessage(r.data.message || '');
      })
      .catch(() => setWords([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Revisiting a word feeds back into mastery; record under the revision mode.
  const record = (word, correct) =>
    spellingAPI.recordAttempts({ word, correct, mode: 'revision' }).catch((e) => console.warn("SpellingRevisionPage: fetch failed", e));

  const { langs, lang, setLang, filtered } = useLanguageScope(words);
  const ActiveComp = useMemo(() => ACTIVITIES.find((a) => a.key === activity)?.Comp, [activity]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader title="Revision" subtitle="Practise the words you find tricky" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Finding words to revise…</p>
        ) : words.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <PartyPopper className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-1">Nothing to revise right now!</p>
            <p className="text-gray-500 mb-6">{message || 'Take a test or play a game and any tricky words will show up here.'}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/spelling/lists')} className="px-5 py-2.5 bg-emerald text-white rounded-lg hover:bg-emerald-deep font-medium">
                Practise a list
              </button>
              <button onClick={() => navigate('/spelling/surprise')} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Surprise me
              </button>
            </div>
          </div>
        ) : activity && ActiveComp ? (
          <div className="bg-white rounded-xl shadow-sm p-5 sm:p-7">
            <button onClick={() => setActivity(null)} className="text-sm text-gray-500 hover:text-emerald inline-flex items-center gap-1 mb-5">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <ActiveComp key={lang} words={filtered} onAttempt={record} lang={lang} />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Target className="w-5 h-5 text-rose-500" />
                <span className="font-semibold">{filtered.length}</span> words to revise
                {weakCount > filtered.length && <span className="text-sm text-gray-400">of {weakCount} total</span>}
              </div>
              <button onClick={load} className="ml-auto px-3 py-1.5 bg-danger text-white rounded-lg hover:bg-danger-deep text-sm inline-flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            <LanguageScopeTabs langs={langs} lang={lang} setLang={setLang} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {activitiesForLanguage(ACTIVITIES, lang).map((a) => (
                <button key={a.key} onClick={() => setActivity(a.key)} className="py-3 px-2 bg-emerald text-white rounded-lg hover:bg-emerald-deep text-sm font-medium">
                  {activityCopy(a, lang).label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Words you've missed</h2>
              <ul className="divide-y divide-gray-50">
                {filtered.map((w) => (
                  <li key={w.word} className="flex items-center gap-3 py-2.5">
                    <span className="font-medium text-gray-900 flex-1">{w.word}</span>
                    {w.listTitle && <span className="text-xs text-gray-400">{w.listTitle}</span>}
                    <span className="px-2 py-0.5 bg-danger-tint text-danger rounded text-xs font-medium">
                      missed {w.misses}×
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
