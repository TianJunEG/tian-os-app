import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, X, Lightbulb } from 'lucide-react';
import { Card, Button, ProgressBar, Badge, EmptyState } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import {
  buildSession,
  recordResult,
  TIERS,
} from '../../../../../shared/englishpath/vocabulary/index.js';
import { loadVocabState, saveVocabState } from './vocabStore';
import VocabPrompt from './VocabPrompt';

const SESSION_SIZE = 10;

// One adaptive practice session. The task list is planned once from the saved
// state; each answer updates and persists the engine state so progress (mastery,
// spaced-review schedule, confusions) carries across sessions.
export default function VocabSession() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || user?._id;

  const stateRef = useRef(null);
  const [tasks, setTasks] = useState(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null); // chosen option id
  const [answered, setAnswered] = useState(false);
  const logRef = useRef([]);

  useEffect(() => {
    const initial = loadVocabState(studentId);
    stateRef.current = initial;
    setTasks(buildSession(initial, { size: SESSION_SIZE }));
  }, [studentId]);

  const task = tasks && tasks[idx];

  const persist = (next) => {
    stateRef.current = next;
    saveVocabState(studentId, next);
  };

  const finish = () => {
    const log = logRef.current;
    const graded = log.filter((e) => e.kind === 'mcq');
    navigate('/student/english/vocab/results', {
      state: {
        correct: graded.filter((e) => e.correct).length,
        total: graded.length,
        log,
      },
      replace: true,
    });
  };

  const advance = () => {
    if (idx + 1 >= tasks.length) return finish();
    setIdx((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  };

  const onMeet = () => {
    persist(recordResult(stateRef.current, { wordId: task.wordId, taskType: 'meet_word', correct: true }, {}));
    logRef.current.push({ kind: 'teach', word: task.word, label: task.label, correct: true });
    advance();
  };

  const onAnswer = (option) => {
    if (answered) return;
    setSelected(option.id);
    setAnswered(true);
    const correct = !!option.correct;
    persist(
      recordResult(
        stateRef.current,
        { wordId: task.wordId, taskType: task.taskType, correct, chosenText: correct ? undefined : option.text },
        {}
      )
    );
    logRef.current.push({ kind: 'mcq', word: task.word, label: task.label, correct });
  };

  if (!tasks) return null;

  if (tasks.length === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <BackLink navigate={navigate} />
        <EmptyState icon={BookOpen} message="You're all caught up — no words are due right now. Come back later for spaced review!">
          <Button to="/student/english/vocab" variant="secondary" size="s">Back to Vocabulary</Button>
        </EmptyState>
      </div>
    );
  }

  const tier = TIERS[(task.tier || 1) - 1];

  return (
    <div className="mx-auto max-w-xl">
      <BackLink navigate={navigate} />

      <div className="mb-2 flex items-center justify-between gap-3 text-sm text-ink-500">
        <span className="font-mono tabular-nums">Question {idx + 1} of {tasks.length}</span>
        <span className="flex items-center gap-2">
          {task.mode === 'review' && <Badge tone="gold">Review</Badge>}
          {tier && <Badge tone="neutral">{tier.name}</Badge>}
        </span>
      </div>
      <ProgressBar value={idx + (answered || task.kind === 'teach' ? 1 : 0)} max={tasks.length} className="mb-6" />

      {task.kind === 'teach' ? (
        <TeachCard task={task} onNext={onMeet} />
      ) : (
        <Card className="flex min-h-[26rem] flex-col p-6">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-deep">{task.label}</div>
          <p className="mb-4 text-sm text-ink-500">{task.instruction}</p>

          <VocabPrompt text={task.prompt} className="mb-5 text-lg text-ink-900" />

          <div className="space-y-2.5">
            {task.options.map((option) => (
              <OptionButton
                key={option.id}
                option={option}
                answered={answered}
                selected={selected === option.id}
                onClick={() => onAnswer(option)}
              />
            ))}
          </div>

          <div className="mt-auto pt-5">
            {answered ? (
              <div className="space-y-4">
                <div className={`flex gap-2 rounded-xl p-3 text-sm ${selectedCorrect(task, selected) ? 'bg-success-100 text-emerald-deep' : 'bg-error-100 text-error-700'}`}>
                  <Lightbulb className="h-4 w-4 flex-none translate-y-0.5" />
                  <span>{task.rationale}</span>
                </div>
                <Button size="l" icon={ArrowRight} className="w-full" onClick={advance}>
                  {idx + 1 >= tasks.length ? 'See results' : 'Next'}
                </Button>
              </div>
            ) : (
              <p className="text-center text-xs text-ink-400">Choose the best answer.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function selectedCorrect(task, selectedId) {
  return task.options?.find((o) => o.id === selectedId)?.correct;
}

function OptionButton({ option, answered, selected, onClick }) {
  let cls = 'border-line-soft hover:border-emerald hover:bg-emerald-tint';
  let mark = null;
  if (answered) {
    if (option.correct) {
      cls = 'border-emerald bg-success-100 text-emerald-deep';
      mark = <Check className="h-4 w-4 flex-none text-emerald" />;
    } else if (selected) {
      cls = 'border-error-400 bg-error-100 text-error-700';
      mark = <X className="h-4 w-4 flex-none text-error-600" />;
    } else {
      cls = 'border-line-soft opacity-55';
    }
  }
  return (
    <button
      type="button"
      disabled={answered}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${cls}`}
    >
      <span>{option.text}</span>
      {mark}
    </button>
  );
}

function TeachCard({ task, onNext }) {
  const c = task.card;
  return (
    <Card className="flex min-h-[26rem] flex-col p-6">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-deep">New word</div>
      <h2 className="font-display text-3xl font-semibold text-emerald-deep">{c.word}</h2>
      <p className="mt-0.5 text-sm italic text-ink-400">{c.pos}</p>

      <p className="mt-4 text-lg text-ink-900">{c.meaning}</p>

      {c.example && (
        <div className="mt-4 rounded-xl bg-ink-100 p-4 text-ink-700">
          <VocabPrompt text={c.example} />
        </div>
      )}

      <div className="mt-4 space-y-1.5 text-sm">
        {c.synonyms?.length > 0 && (
          <p><span className="font-semibold text-ink-700">Similar:</span> <span className="text-ink-500">{c.synonyms.join(', ')}</span></p>
        )}
        {c.mnemonic && (
          <p className="flex gap-2 text-ink-500"><Lightbulb className="h-4 w-4 flex-none translate-y-0.5 text-gold-deep" />{c.mnemonic}</p>
        )}
      </div>

      <div className="mt-auto pt-6">
        <Button size="l" icon={ArrowRight} className="w-full" onClick={onNext}>Got it</Button>
      </div>
    </Card>
  );
}

function BackLink({ navigate }) {
  return (
    <button
      onClick={() => navigate('/student/english/vocab')}
      className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Vocabulary
    </button>
  );
}
