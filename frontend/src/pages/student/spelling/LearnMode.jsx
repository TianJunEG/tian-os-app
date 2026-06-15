import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { spellingPracticeAPI } from '../../../services/api';
import { Card, Button, PageHeader, Spinner } from '../../../components/ui';

// Learn mode: see each word, its sentence/meaning, cover-and-spell guidance,
// then start the self-test. Audio is a placeholder until TTS is wired.
export default function LearnMode() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => { spellingPracticeAPI.list(listId).then((r) => setList(r.data)).catch(() => setList(null)); }, [listId]);

  const startTest = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const { data } = await spellingPracticeAPI.startSession({ listId });
      navigate(`/student/spelling/practice/${data.session_id}`, { state: { items: data.items, listTitle: data.listTitle } });
    } catch (_) { setStarting(false); }
  };

  if (!list) return <Spinner />;
  return (
    <>
      <button onClick={() => navigate('/student/spelling/lists')} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep">
        <ArrowLeft className="h-4 w-4" /> Word lists
      </button>
      <PageHeader title={list.title} subtitle="Look, cover, and remember each word — then self-test." />

      <div className="mb-6 space-y-3">
        {list.words.map((w) => (
          <Card key={w.wordId} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-xl font-semibold text-emerald-deep">{w.word}</span>
            </div>
            {w.sentence && <p className="mt-1 text-sm text-ink-500">{w.sentence}</p>}
            {w.definition && <p className="mt-0.5 text-xs text-ink-400">{w.definition}</p>}
          </Card>
        ))}
      </div>

      <Button size="l" icon={ArrowRight} disabled={starting} onClick={startTest} className="w-full">{starting ? 'Starting…' : 'Start self-test'}</Button>
    </>
  );
}
