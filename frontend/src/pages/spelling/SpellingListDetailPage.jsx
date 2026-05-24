import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Volume2, Mic, Shuffle, Eraser, Eye, Grid, LayoutGrid,
  Pencil, Share2, Lock, ListChecks, ArrowLeft, Star, Printer
} from 'lucide-react';
import SpellingHeader from '../../components/spelling/SpellingHeader';
import { spellingAPI } from '../../services/api';
import { activitiesForLanguage, langLabel } from '../../utils/spellingLang';
import MockTest from '../../components/spelling/MockTest';
import Dictation from '../../components/spelling/Dictation';
import ScrambleGame from '../../components/spelling/ScrambleGame';
import MissingLetters from '../../components/spelling/MissingLetters';
import LookCoverCheck from '../../components/spelling/LookCoverCheck';
import WordSearch from '../../components/spelling/WordSearch';
import Crossword from '../../components/spelling/Crossword';
import { speakOnce } from '../../utils/tts';

const LEVEL_LABELS = { P1: 'Primary 1', P2: 'Primary 2', P3: 'Primary 3', P4: 'Primary 4', P5: 'Primary 5', P6: 'Primary 6', other: 'Other' };

const ACTIVITIES = [
  { key: 'mock', label: 'Mock test', desc: 'Listen & spell', icon: Volume2, color: 'bg-purple-600', Comp: MockTest, mode: 'mock' },
  { key: 'dictation', label: 'Dictation', desc: 'Write the passage', icon: Mic, color: 'bg-rose-500', Comp: Dictation, mode: 'dictation' },
  { key: 'scramble', label: 'Scramble', desc: 'Rearrange letters', icon: Shuffle, color: 'bg-blue-500', Comp: ScrambleGame, mode: 'scramble' },
  { key: 'missing', label: 'Missing letters', desc: 'Fill the gaps', icon: Eraser, color: 'bg-green-600', Comp: MissingLetters, mode: 'missing' },
  { key: 'lookcover', label: 'Look · Cover · Check', desc: 'Memory method', icon: Eye, color: 'bg-amber-500', Comp: LookCoverCheck, mode: 'lookcover' },
  { key: 'wordsearch', label: 'Word search', desc: 'Find the words', icon: Grid, color: 'bg-indigo-500', Comp: WordSearch, mode: 'wordsearch' },
  { key: 'crossword', label: 'Crossword', desc: 'Solve from clues', icon: LayoutGrid, color: 'bg-teal-600', Comp: Crossword, mode: 'crossword' }
];

export default function SpellingListDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null); // activity key or 'words'
  const [masteredSet, setMasteredSet] = useState(new Set());

  useEffect(() => {
    spellingAPI
      .getList(id)
      .then((r) => {
        setList(r.data.list);
        setIsOwner(r.data.isOwner);
      })
      .catch((e) => setError(e.response?.data?.error || 'Could not load this list.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Best-effort: highlight words the student has already mastered.
  useEffect(() => {
    spellingAPI
      .getStats()
      .then((r) => setMasteredSet(new Set((r.data.masteredWords || []).map((w) => w.toLowerCase()))))
      .catch(() => {});
  }, [active]);

  const words = useMemo(() => list?.words || [], [list]);

  const recordAttempt = (mode) => (word, correct) => {
    spellingAPI.recordAttempts({ word, correct, mode, list: id }).catch(() => {});
  };

  const toggleShare = async () => {
    try {
      const res = await spellingAPI.shareList(id, { isShared: !list.isShared, level: list.level });
      setList(res.data.list);
    } catch {
      alert('Could not update sharing.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SpellingHeader title="Loading…" />
        <p className="text-center text-gray-500 py-16">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SpellingHeader title="Spelling list" backTo="/spelling/lists" />
        <p className="text-center text-red-600 py-16">{error}</p>
      </div>
    );
  }

  const activity = ACTIVITIES.find((a) => a.key === active);
  const lang = list.language || 'en';
  const shownActivities = activitiesForLanguage(ACTIVITIES, lang);

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader
        title={list.title}
        subtitle={`${lang !== 'en' ? `${langLabel(lang)} · ` : ''}${LEVEL_LABELS[list.level]} · ${words.length} words${list.owner?.name ? ` · by ${list.owner.name}` : ''}`}
        backTo="/spelling/lists"
        right={
          isOwner && (
            <div className="flex gap-1">
              <button onClick={toggleShare} aria-label={list.isShared ? 'Shared — make private' : 'Private — share'} title={list.isShared ? 'Shared — click to make private' : 'Private — click to share'} className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg ${list.isShared ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
                {list.isShared ? <Share2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </button>
              <button onClick={() => navigate(`/spelling/lists/${id}/edit`)} aria-label="Edit list" title="Edit" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg">
                <Pencil className="w-5 h-5" />
              </button>
            </div>
          )
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {!active && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {shownActivities.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setActive(a.key)}
                  className="p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition text-left border border-gray-100"
                >
                  <span className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${a.color}`}>
                    <a.icon className="w-5 h-5 text-white" />
                  </span>
                  <h3 className="font-semibold text-gray-900 text-sm">{a.label}</h3>
                  <p className="text-xs text-gray-500">{a.desc}</p>
                </button>
              ))}
              <button onClick={() => setActive('words')} className="p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition text-left border border-gray-100">
                <span className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-gray-500">
                  <ListChecks className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-semibold text-gray-900 text-sm">View words</h3>
                <p className="text-xs text-gray-500">See the full list</p>
              </button>
              <button onClick={() => navigate(`/spelling/lists/${id}/print`)} className="p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition text-left border border-gray-100">
                <span className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-orange-500">
                  <Printer className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-semibold text-gray-900 text-sm">Print sheet</h3>
                <p className="text-xs text-gray-500">Test, practice & puzzles</p>
              </button>
            </div>
          </>
        )}

        {active && (
          <div className="bg-white rounded-xl shadow-sm p-5 sm:p-7">
            <button onClick={() => setActive(null)} className="text-sm text-gray-500 hover:text-purple-600 inline-flex items-center gap-1 mb-5">
              <ArrowLeft className="w-4 h-4" /> All activities
            </button>

            {active === 'words' ? (
              <div>
                <h2 className="font-semibold text-gray-900 mb-4">{words.length} words</h2>
                <ol className="space-y-2">
                  {words.map((w, i) => (
                    <li key={i} className="flex items-baseline gap-3 py-2 border-b border-gray-50">
                      <span className="text-gray-400 text-sm w-5 text-right">{i + 1}</span>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 inline-flex items-center gap-1">
                          {w.word}
                          {masteredSet.has(w.word.toLowerCase()) && (
                            <Star className="w-3.5 h-3.5 fill-green-500 text-green-500" title="Mastered" />
                          )}
                        </span>
                        {w.sentence && <p className="text-sm text-gray-600">{w.sentence}</p>}
                        {w.definition && <p className="text-sm text-gray-400">{w.definition}</p>}
                      </div>
                      <button onClick={() => speakOnce(w.word)} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded">
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <>
                <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <span className={`w-7 h-7 rounded flex items-center justify-center ${activity.color}`}>
                    <activity.icon className="w-4 h-4 text-white" />
                  </span>
                  {activity.label}
                </h2>
                <activity.Comp words={words} onAttempt={recordAttempt(activity.mode)} lang={lang} />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
