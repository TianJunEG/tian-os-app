import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, BookOpen, Target } from 'lucide-react';
import { Card, Button, PageHeader, ProgressBar, Badge, EmptyState } from '../../../components/ui';
import { MascotBubble } from '../../../components/MascotAvatar';
import { useAuth } from '../../../context/AuthContext';
import {
  clozePassages,
  SKILL_LABELS,
  weakBlanks,
  skillReadiness,
} from '../../../../../shared/englishpath/cloze/index.js';
import {
  weakWords,
  vocabularyWordBank,
  VOCAB_SUBSKILLS,
} from '../../../../../shared/englishpath/vocabulary/index.js';
import { loadClozeState, loadClozeStateSync } from './clozeStore';
import { loadVocabState, loadVocabStateSync } from './vocabStore';

const SUBSKILL_LABELS = {
  [VOCAB_SUBSKILLS.MEANING]: 'Meaning',
  [VOCAB_SUBSKILLS.SYNONYM]: 'Synonym',
  [VOCAB_SUBSKILLS.NUANCE]: 'Nuance',
  [VOCAB_SUBSKILLS.CONNOTATION]: 'Connotation',
  [VOCAB_SUBSKILLS.COLLOCATION]: 'Collocation',
  [VOCAB_SUBSKILLS.PHRASAL_VERB]: 'Phrasal verb',
  [VOCAB_SUBSKILLS.WORD_FORM]: 'Word form',
  [VOCAB_SUBSKILLS.CONFUSABLE]: 'Confusable',
};

function groupBySkill(blanks) {
  const groups = { grammar: [], collocation: [], content: [] };
  for (const b of blanks) (groups[b.skill] || (groups[b.skill] = [])).push(b);
  return groups;
}

export default function ELPathMistakes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || user?._id;

  const [clozeState, setClozeState] = useState(() => loadClozeStateSync(studentId));
  const [vocabState, setVocabState] = useState(() => loadVocabStateSync(studentId));

  useEffect(() => {
    let stale = false;
    Promise.all([loadClozeState(studentId), loadVocabState(studentId)]).then(([cs, vs]) => {
      if (stale) return;
      setClozeState(cs);
      setVocabState(vs);
    });
    return () => { stale = true; };
  }, [studentId]);

  const weak = useMemo(() => weakBlanks(clozeState, { passages: clozePassages }), [clozeState]);
  const clozeBySkill = useMemo(() => groupBySkill(weak), [weak]);
  const readiness = useMemo(() => skillReadiness(clozeState), [clozeState]);

  const vocabWeak = useMemo(() => weakWords(vocabState, { bank: vocabularyWordBank }), [vocabState]);

  const totalMistakes = weak.length + vocabWeak.length;

  return (
    <>
      <PageHeader title="My Mistakes" subtitle="English · Vocabulary & Cloze" />
      <MascotBubble
        name="lysa"
        message={
          totalMistakes === 0
            ? 'No mistakes right now — keep it up!'
            : `You have ${totalMistakes} item${totalMistakes > 1 ? 's' : ''} to work on. Let's turn them around.`
        }
        size="sm"
        className="mb-5"
      />

      {totalMistakes === 0 && (
        <EmptyState icon={Target} message="Nothing here yet — practise some passages or vocabulary to see mistake analysis.">
          <div className="flex gap-3">
            <Button to="/student/english/cloze" variant="secondary" size="s">Cloze practice</Button>
            <Button to="/student/english/vocab" variant="secondary" size="s">Vocab practice</Button>
          </div>
        </EmptyState>
      )}

      {/* ── Cloze mistakes ── */}
      {weak.length > 0 && (
        <>
          <h2 className="mb-3 mt-2 text-lg font-semibold text-ink-700">Comprehension Cloze</h2>

          <Card className="mb-5 p-5">
            <h3 className="mb-3 font-semibold text-ink-700">Skill readiness</h3>
            {['grammar', 'collocation', 'content'].map((skill) => (
              <div key={skill} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-ink-700">{SKILL_LABELS[skill]}</span>
                  <span className="font-mono text-sm tabular-nums text-ink-500">{readiness[skill] || 0}%</span>
                </div>
                <ProgressBar value={readiness[skill] || 0} max={100} />
              </div>
            ))}
          </Card>

          {['grammar', 'collocation', 'content'].map((skill) => {
            const items = clozeBySkill[skill] || [];
            if (!items.length) return null;
            return (
              <Card key={skill} tone="rose" className="mb-4 p-5">
                <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-error-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {SKILL_LABELS[skill]} mistakes · {items.length}
                </div>
                <ul className="mt-3 space-y-2">
                  {items.slice(0, 12).map((b) => (
                    <li key={`${b.passageId}-${b.n}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="font-medium text-ink-700">{b.passageTitle}</span>
                        <span className="text-ink-400"> · blank #{b.n}</span>
                      </span>
                      <span className="flex-none font-mono text-xs tabular-nums text-ink-500">{b.misses} miss{b.misses !== 1 ? 'es' : ''}</span>
                    </li>
                  ))}
                  {items.length > 12 && (
                    <li className="text-xs text-ink-400">+{items.length - 12} more</li>
                  )}
                </ul>
              </Card>
            );
          })}

          <div className="mb-8">
            <Button size="l" icon={ArrowRight} onClick={() => navigate('/student/english/cloze/focus')}>
              Drill tricky blanks
            </Button>
          </div>
        </>
      )}

      {/* ── Vocabulary mistakes ── */}
      {vocabWeak.length > 0 && (
        <>
          <h2 className="mb-3 mt-2 text-lg font-semibold text-ink-700">Vocabulary</h2>

          <Card className="mb-5 p-5">
            <h3 className="mb-3 font-semibold text-ink-700">Tricky words · {vocabWeak.length}</h3>
            <ul className="space-y-3">
              {vocabWeak.slice(0, 20).map((w) => (
                <li key={w.wordId} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium text-ink-700">{w.word}</span>
                    {w.topConfusion && (
                      <span className="ml-2 text-xs text-ink-400">
                        often confused with <span className="text-error-600">{w.topConfusion}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    <span className="font-mono text-xs tabular-nums text-ink-500">{Math.round(w.accuracy * 100)}%</span>
                    {w.lapses > 0 && (
                      <Badge tone="warning" size="xs">{w.lapses} lapse{w.lapses !== 1 ? 's' : ''}</Badge>
                    )}
                  </div>
                </li>
              ))}
              {vocabWeak.length > 20 && (
                <li className="text-xs text-ink-400">+{vocabWeak.length - 20} more</li>
              )}
            </ul>
          </Card>

          <div className="mb-8">
            <Button size="l" icon={ArrowRight} onClick={() => navigate('/student/english/vocab/practice')}>
              Practice vocabulary
            </Button>
          </div>
        </>
      )}
    </>
  );
}
