import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { Card, Badge, PageHeader, Spinner, EmptyState, ErrorState } from '../../components/ui';

function timeAgo(date) {
  const d = new Date(date);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

// Parent in-app notification feed. User-scoped, so it spans all of the parent's
// children. Clicking an item marks it read and follows its deep link.
export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    setItems(null);
    notificationsAPI
      .list()
      .then((r) => setItems(r.data.notifications || []))
      .catch((e) => setError(e.response?.data?.error || 'Could not load notifications.'));
  };
  useEffect(() => { load(); }, []);

  const open = async (n) => {
    try { if (!n.readAt) await notificationsAPI.markRead(n._id); } catch { /* non-blocking */ }
    if (n.linkPath) navigate(n.linkPath);
    else load();
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <Spinner />;

  return (
    <>
      <PageHeader title="Notifications" subtitle="Updates from your child's tutor." />
      {items.length === 0 ? (
        <EmptyState icon={Bell} message="No notifications yet." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card
              key={n._id}
              interactive
              onClick={() => open(n)}
              className="flex items-start gap-3 p-4"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? 'bg-transparent' : 'bg-emerald-deep'}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-medium text-ink-700">{n.title}</p>
                  <span className="shrink-0 text-xs text-ink-300">{timeAgo(n.createdAt)}</span>
                </div>
                {n.body && <p className="mt-0.5 text-sm text-ink-500">{n.body}</p>}
              </div>
              {!n.readAt && <Badge tone="navy">New</Badge>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
