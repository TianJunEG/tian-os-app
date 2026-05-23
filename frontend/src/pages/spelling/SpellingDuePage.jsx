import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, CalendarCheck, CalendarClock, CheckCircle2 } from 'lucide-react';
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

// Friendly "when next" label from an ISO date, in whole days.
const relativeDay = (iso) => {
  if (!iso) return null;
  const DAY = 24 * 60 * 60 * 1000;
  const today = Math.floor(Date.now() / DAY);
  const then = Math.floor(new Date(iso).getTime() / DAY);
  const diff = then - today;
  if (diff <= 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return `in ${diff} days`;
};

export default function SpellingDuePage() {
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [dueCount, setDueCount] = useState(0);
  const [nextDue, setNextDue] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);

  const load = () => {
    setLoading(true);
    setActivity(null);
    spellingAPI
      .getDue({ count: 20 })
      .then((r) => {
        setWords(r.data.words || []);
        setDueCount(r.data.dueCount || 0);
        setNextDue(r.data.nextDue || null);
        setMessage(r.data.message || '');
      })
      .catch(() => setWords([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Reviewing a due word feeds back into mastery and reschedules it.
  const record = (word, correct) =>
    spellingAPI.recordAttempts({ word, correct, mode: 'due' }).catch(() => {});

  const ActiveComp = useMemo(() => ACTIVITIES.find(([k]) => k === activity)?.[2], [activity]);
  const nextLabel = relativeDay(nextDue);

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader title="Due today" subtitle="Your spaced-repetition review" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Checking what's due…</p>
        ) : words.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-1">You're all caught up!</p>
            <p className="text-gray-500 mb-6">
              {nextLabel
                ? `Nothing due right now. Your next review is ${nextLabel}.`
                : message || 'Practise some words and they will be scheduled for review here.'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => navigate('/spelling/lists')} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                Practise a list
              </button>
              <button onClick={() => navigate('/spelling/surprise')} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Surprise me
              </button>
            </div>
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
                <CalendarClock className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">{dueCount}</span> word{dueCount === 1 ? '' : 's'} due today
                {dueCount > words.length && <span className="text-sm text-gray-400">(showing {words.length})</span>}
              </div>
              <button onClick={load} className="ml-auto px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm inline-flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-gray-400" />
              Pick an activity — getting a word right pushes its next review further out; missing it brings the word back tomorrow.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {ACTIVITIES.map(([key, label]) => (
                <button key={key} onClick={() => setActivity(key)} className="py-3 px-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
                  {label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Words to review</h2>
              <ul className="divide-y divide-gray-50">
                {words.map((w) => (
                  <li key={w.word} className="flex items-center gap-3 py-2.5">
                    <span className="font-medium text-gray-900 flex-1">{w.word}</span>
                    {w.listTitle && <span className="text-xs text-gray-400">{w.listTitle}</span>}
                    {w.mastered ? (
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">mastered</span>
                    ) : w.misses > 0 ? (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-xs font-medium">missed {w.misses}×</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-medium">learning</span>
                    )}
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
