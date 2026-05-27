import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpellCheck } from 'lucide-react';
import { spellingPracticeAPI } from '../../../services/api';
import { Card, Button, Badge, StatusBadge, PageHeader, Spinner, EmptyState } from '../../../components/ui';

export default function WordLists() {
  const navigate = useNavigate();
  const [lists, setLists] = useState(null);
  useEffect(() => { spellingPracticeAPI.lists().then((r) => setLists(r.data.lists || [])).catch(() => setLists([])); }, []);

  if (!lists) return <Spinner />;
  return (
    <>
      <PageHeader title="Word lists" subtitle="Choose a list to learn and self-test." />
      {lists.length === 0 ? (
        <EmptyState icon={SpellCheck} message="No word lists yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lists.map((l) => (
            <Card key={l.listId} className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <div><h3 className="font-semibold text-ink-700">{l.title}</h3><p className="text-sm text-ink-500">{l.level} · {l.wordCount} words</p></div>
                <Badge tone="navy">{l.level}</Badge>
              </div>
              <div className="mb-3"><StatusBadge status={l.status} /></div>
              <Button size="s" onClick={() => navigate(`/student/spelling/lists/${l.listId}/learn`)}>Practise</Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
