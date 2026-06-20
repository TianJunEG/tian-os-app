import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, Pencil, ChevronDown } from 'lucide-react';
import { mathpathAPI, comicsAPI } from '../../services/api';
import { getEpisodeById } from '../../data/comics/episodes';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import ComicWorkingReview from './ComicWorkingReview';
import { Card, Button, StatTile, ProgressBar, Spinner, ErrorState } from '../../components/ui';
import { summariseMastery, statusTone } from './masterySummary';

// Math-first progress overview for one child.
export default function ChildProgress() {
  const { studentId } = useParams();
  const child = useChild(studentId);
  const [mastery, setMastery] = useState(null);
  const [topics, setTopics] = useState([]);
  const [comics, setComics] = useState(null);
  const [openWorking, setOpenWorking] = useState(null); // episodeId whose working is expanded
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null); setMastery(null); setTopics([]); setComics(null);
    Promise.all([
      mathpathAPI.mastery({ studentId }).then((r) => setMastery(r.data)),
      mathpathAPI.map({ studentId }).then((r) => setTopics(r.data.topics || [])),
    ]).catch((e) => setError(e));
    // Comics activity is a bonus surface — never let it block or error the page.
    comicsAPI.activity(studentId).then((r) => setComics(r.data)).catch(() => setComics(null));
  }, [studentId]);
  useEffect(() => { load(); }, [load]);

  const { mastered, learning, overall } = summariseMastery(mastery?.records || []);
  const recentTitle = comics?.completed?.[0]?.episodeId
    ? getEpisodeById(comics.completed[0].episodeId)?.title
    : null;

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      {error ? <ErrorState message="Couldn't load mastery data." onRetry={load} /> : !mastery ? <Spinner label="Loading…" /> : (
        <>
          <Card className="mb-6 p-5">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Maths · MathPath</div>
            <div className="mt-2 flex items-center gap-6">
              <StatTile label="Overall mastery" value={overall} suffix="%" />
              <StatTile label="Mastered" value={mastered} />
              <StatTile label="Learning" value={learning} />
            </div>
            <ProgressBar value={overall} className="mt-4" />
          </Card>

          {comics?.completed?.length > 0 && (
            <Card className="mb-6 p-5">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Comics · The Tian 7 Chronicles</div>
              <div className="mt-2 flex items-center gap-6">
                <StatTile label="Episodes done" value={comics.completed.length} />
                {recentTitle && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Most recent</div>
                    <div className="mt-1 text-sm font-medium text-ink-700">{recentTitle}</div>
                  </div>
                )}
              </div>
              {comics.skills?.length > 0 && (
                <p className="mt-3 text-sm text-ink-500">
                  Practising {comics.skills.slice(0, 4).map((s) => s.name).join(', ')}
                  {comics.skills.length > 4 ? '…' : ''}
                </p>
              )}

              {comics.completed.some((c) => c.hasWorking) && (
                <div className="mt-4 border-t border-line-soft pt-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Their working</div>
                  <div className="mt-2 space-y-2">
                    {comics.completed.filter((c) => c.hasWorking).map((c) => {
                      const title = getEpisodeById(c.episodeId)?.title || c.episodeId;
                      const open = openWorking === c.episodeId;
                      return (
                        <div key={c.episodeId}>
                          <button
                            type="button"
                            onClick={() => setOpenWorking(open ? null : c.episodeId)}
                            aria-expanded={open}
                            className="flex w-full items-center gap-2 rounded-xl border border-line-soft px-3 py-2 text-left text-sm font-medium text-ink-700"
                          >
                            <Pencil size={14} className="text-ink-500" />
                            {title}
                            <ChevronDown size={16} className={`ml-auto text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </button>
                          {open && <ComicWorkingReview studentId={studentId} episodeId={c.episodeId} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}

          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">By topic</h3>
          <div className="mb-6 space-y-3">
            {topics.map((t) => (
              <Card key={t.topicId} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium text-ink-700">{t.name}</p>
                  <span className="font-mono text-xs tabular-nums text-ink-500">{t.masteredCount}/{t.total} mastered</span>
                </div>
                {/* One tile per skill, coloured by status. A flat 0/N progress bar
                    would read "no progress" for a topic full of in-flight skills;
                    this shows what's been started, what's stuck, what's mastered. */}
                <div className="mt-2 flex gap-0.5" aria-label={`Skill mastery for ${t.name}`}>
                  {(t.skills || []).map((s, i) => (
                    <span
                      key={s.skillId || i}
                      className={`h-2 flex-1 rounded ${statusTone(s.status)}`}
                      title={`${s.name} — ${s.statusLabel || s.status}`}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Button to={`/parent/children/${studentId}/weak-topics`} icon={ArrowRight}>View weak topics</Button>
        </>
      )}
    </>
  );
}
