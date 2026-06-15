import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, BookOpen } from 'lucide-react';
import api from '../../../services/api';
import { Card, Button, PageHeader, Spinner, EmptyState } from '../../../components/ui';

// Parse the legacy Mermaid `graph LR` source into a nested tree.
// Lines look like:
//   H[🔥 Heat]                           (node declaration with label)
//   H --> A[Heat gain<br/>gets warmer]   (edge with optional inline label on the target)
//   classDef root ...; class H root;     (visual class metadata — ignored for tree rendering)
// We don't run Mermaid; we just produce a parent → children map and render it
// as a styled nested list. Good enough for revision notes.
function parseMermaid(src) {
  if (!src) return null;
  const lines = src.split('\n').map((l) => l.trim()).filter(Boolean);
  const labels = new Map();
  const children = new Map();
  const parents = new Set();
  const allIds = new Set();
  const stripLabel = (s) => s.replace(/<br\s*\/?\s*>/gi, ' · ').trim();

  const captureLabel = (raw) => {
    const m = raw.match(/^(\w+)(?:\[(.+)\])?$/);
    if (!m) return null;
    const id = m[1];
    allIds.add(id);
    if (m[2] && !labels.has(id)) labels.set(id, stripLabel(m[2]));
    return id;
  };

  for (const line of lines) {
    if (/^graph\s/i.test(line)) continue;
    if (/^classDef\s|^class\s/.test(line)) continue;

    // Edge: A --> B[label]    or  A --> B
    const edge = line.match(/^(\w+)(?:\[.+\])?\s*-->\s*(\w+(?:\[.+\])?)/);
    if (edge) {
      const fromRaw = edge[1];
      const toRaw = edge[2];
      const from = captureLabel(fromRaw);
      const to = captureLabel(toRaw);
      if (from && to) {
        if (!children.has(from)) children.set(from, []);
        if (!children.get(from).includes(to)) children.get(from).push(to);
        parents.add(to);
      }
      continue;
    }
    // Pure node declaration
    captureLabel(line);
  }

  const roots = [...allIds].filter((id) => !parents.has(id));
  const build = (id, depth = 0, seen = new Set()) => {
    if (seen.has(id)) return null;
    seen = new Set(seen); seen.add(id);
    return {
      id, depth,
      label: labels.get(id) || id,
      children: (children.get(id) || []).map((c) => build(c, depth + 1, seen)).filter(Boolean),
    };
  };
  return roots.map((r) => build(r));
}

function TreeNode({ node }) {
  const depthClass = node.depth === 0
    ? 'bg-gradient-to-br from-[#2F6B7E] to-[#1d4452] text-paper'
    : node.depth === 1
      ? 'bg-surface-white border border-ink-100 text-ink-700 font-semibold'
      : 'bg-surface-white border border-ink-100/60 text-ink-600';
  return (
    <li className="mb-2 last:mb-0">
      <div className={`inline-block rounded-lg px-3 py-1.5 text-sm ${depthClass}`}>{node.label}</div>
      {node.children?.length > 0 && (
        <ul className="ml-5 mt-2 border-l border-ink-100 pl-4">
          {node.children.map((c) => <TreeNode key={c.id} node={c} />)}
        </ul>
      )}
    </li>
  );
}

export default function ScienceTopicNotes() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/science/notes?topicId=${topicId}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || 'Could not load notes.'))
      .finally(() => setLoading(false));
  }, [topicId]);

  const trees = useMemo(() => parseMermaid(data?.mermaid), [data]);

  if (loading) return <Spinner label="Loading notes…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  if (!data?.available) {
    return (
      <>
        <PageHeader title="Topic notes" subtitle={data?.topic || ''} />
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/student/science/topics')}>Back to topics</Button>
        <EmptyState icon={BookOpen} message="No mind-map notes available for this topic yet." />
      </>
    );
  }

  return (
    <>
      <PageHeader title={data.topic} subtitle={`Notes · ${data.moeLevel || 'Primary Science'}`} />
      <div className="mb-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/student/science/topics')}>Back to topics</Button>
      </div>
      <Card className="p-5">
        <ul className="space-y-2">
          {trees?.map((t) => t && <TreeNode key={t.id} node={t} />)}
        </ul>
      </Card>
    </>
  );
}
