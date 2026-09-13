import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Lock, ArrowRight } from 'lucide-react';
import { episodes, MASCOT_COLORS, getResumeEpisode, getEpisodeById } from '../../../data/comics/episodes';
import { comicMomentum } from '../../../data/comics/comicMomentum';
import { comicsAPI } from '../../../services/api';

function EpisodeCard({ episode, isLatest, isCompleted }) {
  const navigate = useNavigate();
  const isAvailable = true; // future: lock based on release date
  const leftChar = episode.coverCharacters[0];
  const rightChar = episode.coverCharacters[1];

  return (
    <div
      onClick={() => isAvailable && navigate(`/student/comics/${episode.slug}`)}
      style={{
        background: '#fff',
        border: '2.5px solid #1c1917',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: isAvailable ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: '3px 3px 0 #1c1917',
      }}
      onMouseEnter={(e) => {
        if (isAvailable) {
          e.currentTarget.style.transform = 'translate(-2px, -2px)';
          e.currentTarget.style.boxShadow = '5px 5px 0 #1c1917';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '3px 3px 0 #1c1917';
      }}
    >
      {/* Cover */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 60%, #fbbf24 100%)',
          height: 120,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          padding: '0 16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img
          src={`/comics/backgrounds/${episode.coverBg}.jpg`}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div style={{ position: 'absolute', top: 8, left: 10, background: '#1c1917', color: '#fbbf24', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>
          EP {episode.episode}
        </div>
        {isLatest && (
          <div style={{ position: 'absolute', top: 8, right: 10, background: '#dc2626', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800, letterSpacing: '0.03em' }}>
            LATEST
          </div>
        )}
        {!isLatest && isCompleted && (
          <div style={{ position: 'absolute', top: 6, right: 8, display: 'flex', alignItems: 'center', gap: 3, background: '#16a34a', color: '#fff', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>
            <CheckCircle size={12} /> Done
          </div>
        )}
        {[leftChar, rightChar].filter(Boolean).map((key) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
            <img
              src={`/comics/characters/${key}-standing.png`}
              alt={key}
              style={{ height: key === 'kylo' ? 72 : 90, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{
              display: 'none', width: key === 'kylo' ? 44 : 56, height: key === 'kylo' ? 44 : 56,
              borderRadius: '50%', background: MASCOT_COLORS[key] ?? '#888',
              alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20,
            }}>
              {key[0].toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#a8a29e', fontWeight: 600 }}>{episode.grade}</span>
          {!isAvailable && <Lock size={13} style={{ color: '#d4d4d4' }} />}
        </div>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#1c1917', marginBottom: 4 }}>{episode.title}</p>
        <p style={{ fontSize: 12, color: '#78716c', lineHeight: 1.4 }}>{episode.tagline}</p>
      </div>
    </div>
  );
}

export default function ComicsHome() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(() => new Set());
  const [momentum, setMomentum] = useState({ thisWeek: 0, streak: 0 });
  // Adaptive pick: the episode that practises the student's weakest skill.
  const [recommended, setRecommended] = useState(null); // { episode, skillName } | null

  useEffect(() => {
    let on = true;
    comicsAPI.progress()
      .then((res) => {
        if (!on) return;
        const items = res.data?.completed ?? [];
        setCompleted(new Set(items.map((c) => c.episodeId)));
        setMomentum(comicMomentum(items.map((c) => c.completedAt)));
      })
      .catch(() => { /* progress is non-critical; show archive without badges */ });
    comicsAPI.recommended()
      .then((res) => {
        const rec = res.data?.recommended;
        const episode = rec && getEpisodeById(rec.episodeId);
        if (on && episode) setRecommended({ episode, skillName: rec.skillName });
      })
      .catch(() => { /* non-critical; fall back to chronological resume */ });
    return () => { on = false; };
  }, []);

  // Chronological order (Ep 1 first): the comics are a learning progression, so
  // a first-time reader should see the start, not the finale.
  const ordered = episodes;
  const latestId = episodes[episodes.length - 1]?.id;
  const doneCount = episodes.filter((e) => completed.has(e.id)).length;
  const allDone = doneCount === episodes.length;
  // Prefer the adaptive recommendation; fall back to chronological resume.
  const resume = recommended?.episode || getResumeEpisode(completed);
  const isAdaptive = Boolean(recommended?.episode);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <BookOpen size={20} style={{ color: '#f59e0b' }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1c1917' }}>The Tian 7 Chronicles</h1>
        </div>
        <p style={{ fontSize: 14, color: '#78716c' }}>
          Comic word problems — solve the maths, follow the story. New episode every week.
        </p>
        {doneCount > 0 && (
          <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginTop: 6 }}>
            {doneCount} of {episodes.length} episodes completed
          </p>
        )}
        {(momentum.streak >= 2 || momentum.thisWeek > 0) && (
          <p style={{ fontSize: 12, color: '#b45309', fontWeight: 700, marginTop: 4 }}>
            {momentum.streak >= 2
              ? `🔥 ${momentum.streak}-day streak — keep it going!`
              : `✨ ${momentum.thisWeek} this week — nice work!`}
          </p>
        )}

        {resume && (
          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => navigate(`/student/comics/${resume.slug}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#f59e0b',
                color: '#fff',
                border: '2.5px solid #1c1917',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '3px 3px 0 #1c1917',
              }}
            >
              {isAdaptive ? 'Practise next' : allDone ? 'Re-read' : doneCount > 0 ? 'Continue' : 'Start reading'} · Ep {resume.episode}: {resume.title}
              <ArrowRight size={16} />
            </button>
            {isAdaptive && recommended.skillName && (
              <p style={{ fontSize: 12, color: '#b45309', fontWeight: 600, marginTop: 6 }}>
                ✨ Picked to help with: {recommended.skillName}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Episode grid — newest first */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {ordered.map((ep) => (
          <EpisodeCard
            key={ep.id}
            episode={ep}
            isLatest={ep.id === latestId}
            isCompleted={completed.has(ep.id)}
          />
        ))}
      </div>
    </div>
  );
}
