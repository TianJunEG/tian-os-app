import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Lock } from 'lucide-react';
import { episodes, MASCOT_COLORS } from '../../../data/comics/episodes';

function EpisodeCard({ episode, index }) {
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
        {[leftChar, rightChar].filter(Boolean).map((key, i) => (
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
      </div>

      {/* Episode grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {episodes.map((ep, i) => (
          <EpisodeCard key={ep.id} episode={ep} index={i} />
        ))}
      </div>
    </div>
  );
}
