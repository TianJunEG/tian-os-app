import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle, BookOpen } from 'lucide-react';
import api from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../components/ui';

// Paged lesson reader. The backend returns either a curated structured lesson
// (one page per authored section) or an auto-built one assembled from the
// topic's questions (one page per concept). Same shape both ways: { pages: [
// { title, body, terms, diagram, heading } ] }.
export default function ScienceTopicLesson() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/science/lessons?topicId=${topicId}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || 'Could not load lesson.'))
      .finally(() => setLoading(false));
  }, [topicId]);

  if (loading) return <Spinner label="Loading lesson…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  const pages = data?.pages || [];
  if (!pages.length) {
    return (
      <>
        <PageHeader title="Topic lesson" subtitle={data?.topic || ''} />
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/student/science/topics')}>Back to topics</Button>
        <EmptyState icon={BookOpen} message="No lesson available for this topic yet." />
      </>
    );
  }

  const page = pages[idx];
  const terms = String(page.terms || '').split(',').map((t) => t.trim()).filter(Boolean);
  const pct = Math.round(100 * (idx + 1) / pages.length);

  return (
    <>
      <PageHeader title={data.topic} subtitle={`Lesson · ${data.moeLevel || 'Primary Science'} · ${data.kind === 'structured' ? 'Guided' : 'Concept by concept'}`} />
      <div className="mb-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/student/science/topics')}>Back to topics</Button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full bg-[#2F6B7E] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-ink-500 whitespace-nowrap">{idx + 1} / {pages.length}</span>
      </div>

      <Card className="p-5">
        {data.kind === 'structured'
          ? <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">Section {idx + 1} of {pages.length}</div>
          : page.heading
            ? <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">{page.heading}</div>
            : null}
        <h2 className="mb-3 font-display text-xl font-semibold text-ink-700">{page.title}</h2>
        {page.diagram && (
          <div className="my-4 rounded-lg border border-ink-100 bg-paper p-3" dangerouslySetInnerHTML={{ __html: page.diagram }} />
        )}
        <p className="whitespace-pre-wrap leading-relaxed text-ink-600">{page.body}</p>
        {terms.length > 0 && (
          <div className="mt-5 border-t border-ink-100 pt-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">Key terms</div>
            <div className="flex flex-wrap gap-2">
              {terms.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="secondary" icon={ArrowLeft} disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>Previous</Button>
        {idx + 1 < pages.length
          ? <Button icon={ArrowRight} onClick={() => setIdx((i) => Math.min(pages.length - 1, i + 1))}>Next</Button>
          : <Button variant="gold" onClick={() => navigate('/student/science/topics')}>Finish</Button>}
      </div>
    </>
  );
}
