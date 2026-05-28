import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StickyNote, AlertTriangle, ArrowLeft } from 'lucide-react';
import api from '../../../services/api';
import { Card, Button, PageHeader, Spinner, EmptyState } from '../../../components/ui';

// "My notes" — every personal Science note this student has written, grouped
// by topic. Each note is keyed by concept heading so the same note shows up
// on every question variant of that concept inside the lesson reader.
export default function ScienceNotes() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/science/student-notes')
      .then((r) => setList(r.data?.list || []))
      .catch((e) => setError(e.response?.data?.error || 'Could not load notes.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading notes…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  if (!list.length) {
    return (
      <>
        <PageHeader title="My Science notes" subtitle="Personal notes you write while studying" />
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/student/science')}>Back to Science</Button>
        <EmptyState icon={StickyNote} message="No notes yet. Open a topic lesson and tap 'Add a note' on any concept to start." />
      </>
    );
  }

  // Group by topic for review.
  const byTopic = {};
  for (const n of list) (byTopic[n.topicName || 'Other'] ||= []).push(n);
  const topics = Object.keys(byTopic).sort();

  return (
    <>
      <PageHeader title="My Science notes" subtitle={`${list.length} note${list.length === 1 ? '' : 's'} across ${topics.length} topic${topics.length === 1 ? '' : 's'}`} />
      <div className="mb-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/student/science')}>Back to Science</Button>
      </div>
      <div className="space-y-6">
        {topics.map((topic) => (
          <section key={topic}>
            <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">{topic}</h3>
            <div className="space-y-2">
              {byTopic[topic].map((n) => (
                <Card key={n._id} className="p-4">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">{n.heading}</div>
                  <div className="whitespace-pre-wrap text-sm text-ink-700">{n.text}</div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
