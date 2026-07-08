import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { CATEGORY_ORDER, getMisconception } from './utils/misconceptions';
import { speak, setVoiceEnabled, isVoiceEnabled } from '../../../utils/sound';
import { getMascotVoice } from '../../../config/mascots';
import { BackLink, Button, Card, EmptyState, Spinner, StatTile } from '../../../components/ui';

// Spoken script for a PSL mistake: the story stem, then the student's answer
// and the correct answer so the read-aloud reinforces the gap.
function buildPSLReadAloudText(mistake = {}) {
  const parts = [mistake.questionText || mistake.questionStem || ''];
  if (mistake.studentAnswer) parts.push(`Your answer was ${mistake.studentAnswer}.`);
  if (mistake.correctAnswer) parts.push(`The correct answer is ${mistake.correctAnswer}.`);
  if (mistake.workedSolution) parts.push(mistake.workedSolution);
  return parts.filter(Boolean).join(' ');
}

// Read-aloud toggle for a PSL mistake (lejo is the PSL mascot). Voice is gated
// behind a localStorage flag, so the first click enables it before speaking.
function PSLReadAloudButton({ mistake }) {
  const [speaking, setSpeaking] = useState(false);
  const onClick = () => {
    if (speaking) {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    if (!isVoiceEnabled()) setVoiceEnabled(true);
    speak(buildPSLReadAloudText(mistake), getMascotVoice('lejo'));
    setSpeaking(true);
  };
  return (
    <Button variant="secondary" size="s" onClick={onClick} icon={speaking ? VolumeX : Volume2} className="mt-2">
      {speaking ? 'Stop' : 'Read aloud'}
    </Button>
  );
}

const TAG_TO_HEURISTIC = {
  'psl/missed-ratio': 'ratio', 'psl/missed-ratio-term': 'ratio',
  'psl/wrong-model-type': 'bar-model', 'psl/wrong-unknown-position': 'bar-model',
  'psl/confused-excess-shortage': 'excess-shortage', 'psl/excess-shortage-confusion': 'excess-shortage', 'psl/excess-shortage-mix': 'excess-shortage',
  'psl/reversed-steps': 'work-backwards',
  'psl/missed-step': 'multi-step', 'psl/skipped-step': 'multi-step',
  'psl/misread-data': 'data-interpretation',
};

const HEURISTIC_NAMES = {
  'bar-model': 'Model / Diagram', 'ratio': 'Ratio Reasoning',
  'data-interpretation': 'Data Interpretation', 'excess-shortage': 'Excess & Shortage',
  'work-backwards': 'Working Backwards', 'multi-step': 'Multi-Step Arithmetic',
  'find-pattern': 'Find a Pattern', 'make-list': 'Make a List',
  'simultaneous': 'Simultaneous', 'guess-check': 'Guess and Check',
};

export default function PSLMistakeReview() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    pslAPI.mistakes()
      .then((res) => setMistakes(res.data?.mistakes || []))
      .catch((e) => console.warn("PSLMistakeReview: fetch failed", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading mistakes…" />;

  const tagCounts = {};
  const mistakesByTag = {};
  for (const m of mistakes) {
    const tag = m.misconceptionTag || 'unknown';
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    (mistakesByTag[tag] = mistakesByTag[tag] || []).push(m);
  }

  const grouped = {};
  for (const [tag, count] of Object.entries(tagCounts)) {
    const info = getMisconception(tag);
    if (!grouped[info.category]) grouped[info.category] = [];
    grouped[info.category].push({ tag, count, ...info });
  }

  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped[c]);
  if (grouped['Other']) sortedCategories.push('Other');

  const totalCategories = sortedCategories.length;

  // Derive heuristics that have identifiable mistakes → show targeted retry CTAs
  const weakHeuristics = [...new Set(
    Object.keys(tagCounts).map((t) => TAG_TO_HEURISTIC[t]).filter(Boolean)
  )];

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3 pt-4 pb-8 sm:px-6 sm:pt-6">
      {/* Header */}
      <div>
        <BackLink to="/student/psl" className="mb-3">Problem Solving</BackLink>
        <h1 className="text-lg font-bold text-ink sm:text-xl">Mistake Review</h1>
        <p className="text-sm text-body-muted">
          {mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''} to learn from
        </p>
      </div>

      {mistakes.length === 0 ? (
        <EmptyState
          mascot="lejo"
          message="No mistakes yet! Complete some practice sessions to see your learning areas here."
        >
          <Button onClick={() => navigate('/student/psl')}>Start Practising</Button>
        </EmptyState>
      ) : (
        <>
          {/* Summary */}
          <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
            <StatTile label="Total mistakes" value={mistakes.length} />
            <StatTile label="Categories" value={totalCategories} />
            <StatTile label="Unique types" value={Object.keys(tagCounts).length} />
          </Card>

          {/* Category groups */}
          <Card className="space-y-4 p-4 sm:p-5">
            {sortedCategories.map((category) => {
              const isOpen = expanded[category] !== false;
              const items = grouped[category];
              return (
                <div key={category}>
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [category]: !isOpen }))}
                    className="mb-2 flex w-full items-center gap-2 text-left"
                  >
                    {isOpen
                      ? <ChevronDown className="h-4 w-4 text-body-faint" />
                      : <ChevronRight className="h-4 w-4 text-body-faint" />}
                    <span className="text-xs font-bold uppercase tracking-wider text-body-soft">{category} errors</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-body-faint">
                      {items.reduce((s, i) => s + i.count, 0)}x
                    </span>
                  </button>

                  {isOpen && (
                    <div className="space-y-2 pl-6">
                      {items.map(({ tag, count, label, tip }) => (
                        <div
                          key={tag}
                          className="flex items-start gap-3 rounded-btn border border-gold-border bg-gold-tint2 p-3"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-ink">{label}</p>
                              <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-gold-deep">{count}x</span>
                            </div>
                            {tip && <p className="mt-1 text-xs text-body-soft">{tip}</p>}
                            {/* Individual mistakes for this tag: the story stem plus
                                the student's and correct answers the endpoint returns,
                                each read-aloud-able. */}
                            {(mistakesByTag[tag] || [])
                              .filter((m) => (m.questionText || m.questionStem))
                              .map((m, idx) => (
                                <div
                                  key={m._id || m.id || `${tag}-${idx}`}
                                  className="mt-2 rounded-lg border border-line bg-surface-white p-2"
                                >
                                  <p className="text-xs text-ink">
                                    {m.questionText || m.questionStem}
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                                    {m.studentAnswer && (
                                      <span className="text-gold-deep">Your answer: {m.studentAnswer}</span>
                                    )}
                                    {m.correctAnswer && (
                                      <span className="text-emerald-deep">Correct: {m.correctAnswer}</span>
                                    )}
                                  </div>
                                  <PSLReadAloudButton mistake={m} />
                                </div>
                              ))}
                            {tag === 'psl/arithmetic-error' && (
                              <Button
                                variant="secondary"
                                size="s"
                                onClick={() => navigate('/student/mathpath')}
                                className="mt-2"
                              >
                                Practice in MathPath
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>

          {/* Retry CTAs */}
          <div className="space-y-3">
            {weakHeuristics.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-body-soft">Practice your weak areas</p>
                <div className="flex flex-wrap gap-2">
                  {weakHeuristics.map((h) => (
                    <Button
                      key={h}
                      variant="secondary"
                      size="s"
                      icon={RotateCcw}
                      onClick={() => navigate(`/student/psl?heuristic=${h}`)}
                    >
                      {HEURISTIC_NAMES[h] || h}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button icon={RotateCcw} onClick={() => navigate('/student/psl')} className="w-full sm:w-auto">
                Practice Again
              </Button>
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/student/psl')} className="w-full sm:w-auto">
                Back to Skills
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
