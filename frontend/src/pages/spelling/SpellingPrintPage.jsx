import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer, FileText, PenLine, Grid, ArrowLeft, Key } from 'lucide-react';
import { spellingAPI } from '../../services/api';
import { generateWordSearch } from '../../utils/spellingGames';

const LEVEL_LABELS = { P1: 'Primary 1', P2: 'Primary 2', P3: 'Primary 3', P4: 'Primary 4', P5: 'Primary 5', P6: 'Primary 6', other: 'Other' };

const TYPES = [
  { key: 'test', label: 'Spelling test', icon: FileText },
  { key: 'practice', label: 'Copy practice', icon: PenLine },
  { key: 'wordsearch', label: 'Word search', icon: Grid }
];

// Blank the target word out of an example sentence to use it as a clue.
const blankWord = (sentence, word) => {
  if (!sentence) return '';
  const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
  return sentence.replace(re, '_____');
};

function WorksheetHeader({ list }) {
  return (
    <div className="border-b-2 border-gray-800 pb-3 mb-5">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{list.title}</h1>
        <span className="text-sm text-gray-500">{LEVEL_LABELS[list.level] || ''}</span>
      </div>
      <div className="flex gap-8 mt-3 text-sm text-gray-700">
        <span className="flex-1">Name: <span className="inline-block border-b border-gray-400 w-40">&nbsp;</span></span>
        <span>Date: <span className="inline-block border-b border-gray-400 w-28">&nbsp;</span></span>
        <span>Score: <span className="inline-block border-b border-gray-400 w-16">&nbsp;</span></span>
      </div>
    </div>
  );
}

function TestSheet({ words, withClues }) {
  return (
    <ol className="space-y-1">
      {words.map((w, i) => {
        const clue = withClues ? w.definition || blankWord(w.sentence, w.word) : '';
        return (
          <li key={i} className="flex items-end gap-3 py-2">
            <span className="w-7 text-right text-gray-500 shrink-0">{i + 1}.</span>
            {clue && <span className="text-sm text-gray-600 w-2/5 shrink-0 self-center">{clue}</span>}
            <span className="flex-1 border-b border-dotted border-gray-500 h-7" />
          </li>
        );
      })}
    </ol>
  );
}

function PracticeSheet({ words }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-5">
      {words.map((w, i) => (
        <div key={i} className="break-inside-avoid">
          <div className="text-xl text-gray-900 font-medium tracking-wide mb-2">
            {i + 1}. {w.word}
          </div>
          {[0, 1, 2].map((n) => (
            <div key={n} className="border-b border-dotted border-gray-400 h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

function WordSearchSheet({ result, showAnswers }) {
  const placedSet = useMemo(() => {
    const s = new Set();
    for (const p of result.placements) for (const cell of p.cells) s.add(`${cell.r},${cell.c}`);
    return s;
  }, [result]);

  const Cell = ({ ch, highlighted }) => (
    <span
      className={`ws-cell inline-flex items-center justify-center border border-gray-300 font-mono uppercase ${
        highlighted ? 'font-bold text-navy-700 print:text-black' : 'text-gray-800'
      }`}
      style={{ width: '1.7rem', height: '1.7rem', fontSize: '0.95rem' }}
    >
      {ch}
    </span>
  );

  const renderGrid = (highlight) => (
    <div className="inline-block leading-none">
      {result.grid.map((row, r) => (
        <div key={r} className="flex">
          {row.map((ch, c) => (
            <Cell key={c} ch={ch} highlighted={highlight && placedSet.has(`${r},${c}`)} />
          ))}
        </div>
      ))}
    </div>
  );

  const found = result.placements.map((p) => p.word);

  return (
    <div>
      <div className="flex flex-wrap gap-8 items-start">
        {renderGrid(false)}
        <div className="flex-1 min-w-[180px]">
          <h3 className="font-semibold text-gray-900 mb-2">Find these words</h3>
          <ul className="columns-2 gap-4 text-gray-800 uppercase text-sm font-mono">
            {found.map((w) => (
              <li key={w} className="mb-1">{w}</li>
            ))}
          </ul>
          {result.unplaced.length > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              ({result.unplaced.length} word(s) didn't fit the grid)
            </p>
          )}
        </div>
      </div>

      {showAnswers && (
        <div className="page-break mt-8">
          <h3 className="font-semibold text-gray-900 mb-3 inline-flex items-center gap-2">
            <Key className="w-4 h-4" /> Answer key
          </h3>
          {renderGrid(true)}
        </div>
      )}
    </div>
  );
}

export default function SpellingPrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState('test');
  const [withClues, setWithClues] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);
  const [regen, setRegen] = useState(0);

  useEffect(() => {
    spellingAPI
      .getList(id)
      .then((r) => setList(r.data.list))
      .catch((e) => setError(e.response?.data?.error || 'Could not load this list.'))
      .finally(() => setLoading(false));
  }, [id]);

  const words = list?.words || [];
  const lang = list?.language || 'en';
  // Word search relies on the Latin alphabet, so it isn't offered for Chinese.
  const types = lang === 'zh' ? TYPES.filter((t) => t.key !== 'wordsearch') : TYPES;

  useEffect(() => {
    if (lang === 'zh' && type === 'wordsearch') setType('test');
  }, [lang, type]);

  const wordSearch = useMemo(
    () => generateWordSearch(words.map((w) => w.word)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, regen]
  );

  if (loading) return <p className="text-center text-gray-500 py-16">Loading…</p>;
  if (error) return <p className="text-center text-red-600 py-16">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <style>{`
        @media print {
          @page { margin: 1.4cm; }
          body { background: #fff !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* Controls — hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <button onClick={() => navigate(`/spelling/lists/${id}`)} className="text-sm text-gray-500 hover:text-navy-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {types.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-1.5 ${
                  type === t.key ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            {type === 'test' && (
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={withClues} onChange={(e) => setWithClues(e.target.checked)} /> Clues
              </label>
            )}
            {type === 'wordsearch' && (
              <>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} /> Answer key
                </label>
                <button onClick={() => setRegen((n) => n + 1)} className="text-navy-600 hover:underline">
                  Shuffle
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => window.print()}
            className="ml-auto px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 font-medium inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Worksheet */}
      <div className="max-w-3xl mx-auto bg-white my-6 p-8 shadow-sm rounded print:shadow-none print:my-0 print:rounded-none print:max-w-none print:p-0">
        {words.length === 0 ? (
          <p className="text-center text-gray-500 py-10">This list has no words to print.</p>
        ) : (
          <>
            <WorksheetHeader list={list} />
            {type === 'test' && <TestSheet words={words} withClues={withClues} />}
            {type === 'practice' && <PracticeSheet words={words} />}
            {type === 'wordsearch' && <WordSearchSheet result={wordSearch} showAnswers={showAnswers} />}

            {type === 'test' && showAnswers && (
              <div className="page-break mt-8">
                <h3 className="font-semibold text-gray-900 mb-3 inline-flex items-center gap-2">
                  <Key className="w-4 h-4" /> Answer key
                </h3>
                <ol className="columns-2 gap-8 text-gray-800">
                  {words.map((w, i) => (
                    <li key={i} className="mb-1">{i + 1}. {w.word}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
