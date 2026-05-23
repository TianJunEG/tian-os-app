import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, ArrowLeft, Plus } from 'lucide-react';
import SpellingHeader from '../../components/spelling/SpellingHeader';
import { spellingAPI } from '../../services/api';
import MockTest from '../../components/spelling/MockTest';
import ScrambleGame from '../../components/spelling/ScrambleGame';
import MissingLetters from '../../components/spelling/MissingLetters';
import LookCoverCheck from '../../components/spelling/LookCoverCheck';

const ACTIVITIES = [
  ['mock', 'Mock test', MockTest],
  ['lookcover', 'Look · Cover · Check', LookCoverCheck],
  ['scramble', 'Scramble', ScrambleGame],
  ['missing', 'Missing letters', MissingLetters]
];

export default function SurpriseSpellingPage() {
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [poolSize, setPoolSize] = useState(0);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);

  const load = (n = count) => {
    setLoading(true);
    setActivity(null);
    spellingAPI
      .getSurprise({ count: n })
      .then((r) => {
        setWords(r.data.words || []);
        setPoolSize(r.data.poolSize || 0);
      })
      .catch(() => setWords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const record = (word, correct) =>
    spellingAPI.recordAttempts({ word, correct, mode: 'surprise' }).catch(() => {});

  const ActiveComp = useMemo(() => ACTIVITIES.find(([k]) => k === activity)?.[2], [activity]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader title="Surprise spelling" subtitle="Random words from all your lists" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Shuffling words…</p>
        ) : words.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <Sparkles className="w-12 h-12 text-pink-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No words yet — create a spelling list first and they'll show up here.</p>
            <button onClick={() => navigate('/spelling/lists/new')} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-flex items-center gap-2">
              <Plus className="w-5 h-5" /> Create a list
            </button>
          </div>
        ) : activity && ActiveComp ? (
          <div className="bg-white rounded-xl shadow-sm p-5 sm:p-7">
            <button onClick={() => setActivity(null)} className="text-sm text-gray-500 hover:text-purple-600 inline-flex items-center gap-1 mb-5">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <ActiveComp words={words} onAttempt={record} />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <span className="font-semibold">{words.length}</span> surprise words
                <span className="text-sm text-gray-400">from {poolSize} in your lists</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <select value={count} onChange={(e) => { const n = Number(e.target.value); setCount(n); load(n); }} className="px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-sm outline-none">
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n} words</option>
                  ))}
                </select>
                <button onClick={() => load()} className="px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm inline-flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" /> New
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ACTIVITIES.map(([key, label]) => (
                <button key={key} onClick={() => setActivity(key)} className="py-3 px-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
