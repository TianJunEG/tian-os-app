import React, { useEffect, useState } from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import { tutorAPI, announcementsAPI } from '../../services/api';
import { PageHeader, Card, Button, Spinner } from '../../components/ui';

function CommentThread({ announcementId }) {
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    announcementsAPI.get(announcementId).then((r) => setComments(r.data.comments || [])).catch(() => setComments([]));
  }, [announcementId]);

  async function reply() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const { data } = await announcementsAPI.comment(announcementId, text.trim());
      setComments((c) => [...(c || []), data.comment]);
      setText('');
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  if (comments === null) return <p className="mt-2 text-sm text-ink-400">Loading comments…</p>;
  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      {comments.length === 0 ? <p className="text-sm text-ink-400">No comments yet.</p> : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.commentId} className="rounded-lg bg-surface-muted px-3 py-2">
              <p className="text-xs font-semibold text-ink-600">{c.authorName}{c.authorRole === 'parent' ? ' · parent' : ''}</p>
              <p className="text-sm text-ink-700">{c.content}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…"
          className="flex-1 rounded-md border border-border-subtle px-2 py-1 text-sm" />
        <Button size="s" onClick={reply} disabled={busy || !text.trim()}>Reply</Button>
      </div>
    </div>
  );
}

export default function TutorAnnouncements() {
  const [list, setList] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = () => { setList(null); tutorAPI.listAnnouncements().then((r) => setList(r.data.announcements || [])).catch(() => setList([])); };
  useEffect(() => { load(); }, []);

  async function post(e) {
    e?.preventDefault?.();
    if (!title.trim() || saving) return;
    setSaving(true); setError('');
    try {
      await tutorAPI.createAnnouncement({ title: title.trim(), body: body.trim(), allowComments });
      setTitle(''); setBody(''); setShowForm(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not post the announcement.');
    } finally { setSaving(false); }
  }

  async function remove(aid) {
    if (!window.confirm('Delete this announcement and its comments?')) return;
    try { await tutorAPI.deleteAnnouncement(aid); load(); } catch { /* ignore */ }
  }

  return (
    <>
      <PageHeader title="Announcements" subtitle="Posts go to the parents of all your students — they're notified and can comment." />

      <div className="mb-3 flex justify-end">
        <Button size="s" onClick={() => setShowForm((v) => !v)}><Megaphone size={16} className="mr-1" /> New announcement</Button>
      </div>

      {showForm && (
        <Card className="mb-4 p-4">
          <form onSubmit={post} className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Lesson rescheduled)" autoFocus
              className="w-full rounded-lg border border-border-subtle px-3 py-2 text-ink-800" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Write your message to parents…"
              className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-800" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-600">
                <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
                Allow parents to comment
              </label>
              <Button type="submit" disabled={saving || !title.trim()}>{saving ? 'Posting…' : 'Post to parents'}</Button>
            </div>
          </form>
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </Card>
      )}

      {!list ? <Spinner /> : list.length === 0 ? (
        <Card className="p-6 text-center text-ink-500">No announcements yet.</Card>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <Card key={a.announcementId} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink-800">{a.title}</h3>
                  {a.body && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">{a.body}</p>}
                  <p className="mt-2 text-xs text-ink-400">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <button type="button" onClick={() => remove(a.announcementId)} className="text-ink-400 hover:text-rose-600" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
              {a.allowComments ? (
                <button type="button" onClick={() => setOpenId(openId === a.announcementId ? null : a.announcementId)}
                  className="mt-2 text-sm font-medium text-emerald-700 hover:underline">
                  {openId === a.announcementId ? 'Hide comments' : `Comments (${a.commentCount})`}
                </button>
              ) : <p className="mt-2 text-xs text-ink-400">Comments off</p>}
              {openId === a.announcementId && <CommentThread announcementId={a.announcementId} />}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
