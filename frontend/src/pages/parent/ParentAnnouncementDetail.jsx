import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { announcementsAPI } from '../../services/api';
import { Card, Button, Spinner } from '../../components/ui';

export default function ParentAnnouncementDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    announcementsAPI.get(id)
      .then((r) => { if (active) setData(r.data); })
      .catch((e) => { if (active) setError(e?.response?.data?.error || 'This announcement is not available.'); });
    return () => { active = false; };
  }, [id]);

  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const { data: r } = await announcementsAPI.comment(id, text.trim());
      setData((d) => ({ ...d, comments: [...(d.comments || []), r.comment] }));
      setText('');
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not post your comment.');
    } finally { setBusy(false); }
  }

  if (error && !data) return <Card className="p-6 text-center text-ink-500">{error}</Card>;
  if (!data) return <Spinner />;
  const { announcement: a, comments } = data;

  return (
    <>
      <Link to="/parent/announcements" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
        <ArrowLeft size={16} /> Announcements
      </Link>
      <Card className="p-5">
        <h1 className="text-xl font-bold text-ink-900">{a.title}</h1>
        <p className="mt-1 text-xs text-ink-400">{a.authorName} · {new Date(a.createdAt).toLocaleString()}</p>
        {a.body && <p className="mt-3 whitespace-pre-wrap text-ink-700">{a.body}</p>}
      </Card>

      <div className="mt-4">
        <h2 className="mb-2 font-semibold text-ink-700">Comments</h2>
        {comments.length === 0 ? <p className="text-sm text-ink-400">No comments yet.</p> : (
          <div className="space-y-2">
            {comments.map((c) => (
              <Card key={c.commentId} className="p-3">
                <p className="text-xs font-semibold text-ink-600">
                  {c.authorName}{c.authorRole && c.authorRole !== 'parent' ? ' · teacher' : ''}
                </p>
                <p className="text-sm text-ink-700">{c.content}</p>
              </Card>
            ))}
          </div>
        )}
        {a.allowComments ? (
          <div className="mt-3 flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…"
              className="flex-1 rounded-lg border border-border-subtle px-3 py-2 text-sm" />
            <Button onClick={send} disabled={busy || !text.trim()}>Send</Button>
          </div>
        ) : <p className="mt-3 text-sm text-ink-400">Comments are turned off for this announcement.</p>}
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>
    </>
  );
}
