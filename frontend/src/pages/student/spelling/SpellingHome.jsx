import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, SpellCheck, ListChecks, Wrench } from 'lucide-react';
import { spellingPracticeAPI } from '../../../services/api';
import { Card, Button, PageHeader, Spinner, EmptyState } from '../../../components/ui';

// Spelling Practice home — a secondary Tian OS module (calm, not louder than MathPath).
export default function SpellingHome() {
  const navigate = useNavigate();
  const [home, setHome] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => { spellingPracticeAPI.home().then((r) => setHome(r.data)).catch(() => setHome({ recommended: null })); }, []);

  const start = async (listId) => {
    if (!listId || starting) return;
    setStarting(true);
    try {
      const { data } = await spellingPracticeAPI.startSession({ listId });
      navigate(`/student/spelling/practice/${data.session_id}`, { state: { items: data.items, listTitle: data.listTitle } });
    } catch (_) { setStarting(false); }
  };

  if (!home) return <Spinner label="Loading spelling…" />;

  return (
    <>
      <PageHeader title="Spelling Practice" subtitle="English · Spelling" />

      {home.recommended ? (
        <Card className="mb-6 p-5">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700"><SpellCheck className="h-3.5 w-3.5" /> Recommended list</div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-navy-700">{home.recommended.title}</h2>
              <p className="mt-1 text-sm text-ink-500">
                {home.recentAccuracy != null ? `Recent accuracy ${home.recentAccuracy}%` : 'No attempts yet'}
                {home.misspeltCount ? ` · ${home.misspeltCount} to review` : ''}
              </p>
            </div>
            <Button size="l" icon={ArrowRight} disabled={starting} onClick={() => start(home.recommended.listId)} className="shrink-0">Start spelling practice</Button>
          </div>
        </Card>
      ) : (
        <EmptyState icon={SpellCheck} message="Spelling practice is ready. Start with a word list." >
          <Button to="/student/spelling/lists" variant="secondary" size="s">View word lists</Button>
        </EmptyState>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card interactive className="p-5" onClick={() => navigate('/student/spelling/lists')} role="button">
          <ListChecks className="mb-2 h-6 w-6 text-navy-700" />
          <h3 className="font-semibold text-ink-700">Word lists</h3>
          <p className="text-sm text-ink-500">Browse and practise any list.</p>
        </Card>
        <Card interactive className="p-5" onClick={() => navigate('/student/spelling/mistakes')} role="button">
          <Wrench className="mb-2 h-6 w-6 text-gold-700" />
          <h3 className="font-semibold text-ink-700">Misspelled words</h3>
          <p className="text-sm text-ink-500">{home.misspeltCount || 0} to review.</p>
        </Card>
      </div>
    </>
  );
}
