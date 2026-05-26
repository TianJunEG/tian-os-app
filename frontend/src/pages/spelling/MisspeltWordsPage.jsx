import React, { useEffect, useMemo, useState } from 'react';
import { Volume2, ArrowLeft } from 'lucide-react';
import SpellingHeader from '../../components/spelling/SpellingHeader';
import { spellingAPI } from '../../services/api';
import { speakOnce } from '../../utils/tts';
import MockTest from '../../components/spelling/MockTest';
import ScrambleGame from '../../components/spelling/ScrambleGame';
import MissingLetters from '../../components/spelling/MissingLetters';
import LookCoverCheck from '../../components/spelling/LookCoverCheck';

const DIFFICULTIES = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];
const ACTIVITIES = [
  ['mock', 'Mock test', MockTest],
  ['lookcover', 'Look · Cover · Check', LookCoverCheck],
  ['scramble', 'Scramble', ScrambleGame],
  ['missing', 'Missing letters', MissingLetters]
];

export default function MisspeltWordsPage() {
  const [data, setData] = useState({});
  const [difficulty, setDifficulty] = useState('easy');
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    spellingAPI
      .getMisspelt()
      .then((r) => setData(r.data.data || {}))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  // Map { word, hint } -> activity word shape, using the hint as the definition.
  const words = useMemo(
    () => (data[difficulty] || []).map((w) => ({ word: w.word, sentence: '', definition: w.hint || '' })),
    [data, difficulty]
  );

  const record = (word, correct) =>
    spellingAPI.recordAttempts({ word, correct, mode: 'misspelt' }).catch(() => {});

  const ActiveComp = ACTIVITIES.find(([k]) => k === activity)?.[2];

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader title="Commonly misspelt words" subtitle="Tricky words grouped by difficulty" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Difficulty tabs */}
        <div className="flex gap-2 mb-6">
          {DIFFICULTIES.map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setDifficulty(key);
                setActivity(null);
              }}
              className={`flex-1 py-2.5 rounded-lg font-medium capitalize transition ${
                difficulty === key ? 'bg-amber-500 text-white shadow' : 'bg-white text-gray-600 hover:bg-amber-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading…</p>
        ) : activity && ActiveComp ? (
          <div className="bg-white rounded-xl shadow-sm p-5 sm:p-7">
            <button onClick={() => setActivity(null)} className="text-sm text-gray-500 hover:text-navy-600 inline-flex items-center gap-1 mb-5">
              <ArrowLeft className="w-4 h-4" /> Back to words
            </button>
            <ActiveComp words={words} onAttempt={record} />
          </div>
        ) : (
          <>
            {/* Practice launchers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {ACTIVITIES.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActivity(key)}
                  className="py-3 px-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 text-sm font-medium"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Word reference list */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">{words.length} words</h2>
              <ul className="divide-y divide-gray-50">
                {words.map((w) => (
                  <li key={w.word} className="flex items-center gap-3 py-2.5">
                    <button onClick={() => speakOnce(w.word)} className="p-1.5 text-navy-500 hover:bg-navy-50 rounded" aria-label="Hear word">
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <span className="font-medium text-gray-900 w-40">{w.word}</span>
                    <span className="text-sm text-gray-500 flex-1">{w.definition}</span>
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
