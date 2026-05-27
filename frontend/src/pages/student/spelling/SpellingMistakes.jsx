import React, { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { spellingPracticeAPI } from '../../../services/api';
import { Card, PageHeader, Spinner, EmptyState } from '../../../components/ui';

// Misspelled words to review (from the shared Mistake store, module Spelling).
export default function SpellingMistakes() {
  const [mistakes, setMistakes] = useState(null);
  useEffect(() => { spellingPracticeAPI.mistakes().then((r) => setMistakes(r.data.mistakes || [])).catch(() => setMistakes([])); }, []);

  if (!mistakes) return <Spinner />;
  return (
    <>
      <PageHeader title="Misspelled words" subtitle="Review the words you got wrong." />
      {mistakes.length === 0 ? (
        <EmptyState icon={PartyPopper} message="No misspelled words right now. Great spelling!" />
      ) : (
        <div className="space-y-3">
          {mistakes.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-error-700 line-through">{m.studentSpelling || '(blank)'}</span>
                <span className="font-display text-lg font-semibold text-success-700">{m.correctSpelling}</span>
              </div>
              {m.sentence && <p className="mt-1 text-sm text-ink-500">{m.sentence}</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
