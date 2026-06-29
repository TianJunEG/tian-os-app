import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { announcementsAPI } from '../../services/api';
import { PageHeader, Card, Spinner, EmptyState } from '../../components/ui';

export default function ParentAnnouncements() {
  const [list, setList] = useState(null);
  useEffect(() => {
    announcementsAPI.feed().then((r) => setList(r.data.announcements || [])).catch(() => setList([]));
  }, []);

  if (!list) return <Spinner />;
  return (
    <>
      <PageHeader title="Announcements" subtitle="Updates from your child's teachers." />
      {list.length === 0 ? (
        <EmptyState icon={Megaphone} message="No announcements yet." />
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <Link key={a.announcementId} to={`/parent/announcements/${a.announcementId}`} className="block">
              <Card interactive className="p-4">
                <h3 className="font-semibold text-ink-800">{a.title}</h3>
                {a.body && <p className="mt-1 line-clamp-2 text-sm text-ink-600">{a.body}</p>}
                <p className="mt-2 text-xs text-ink-400">
                  {a.authorName} · {new Date(a.createdAt).toLocaleDateString()} · {a.commentCount} comment{a.commentCount === 1 ? '' : 's'}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
