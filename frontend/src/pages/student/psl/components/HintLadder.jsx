import React, { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

const RUNG_META = [
  { key: 'nudge', label: 'A NUDGE', level: '1 of 3', topColor: '#d9892e', iconBg: '#fbf1e1', iconBorder: '#d9892e', iconDotColor: '#b06f1f', labelColor: '#a8743a' },
  { key: 'clue', label: 'A CLUE', level: '2 of 3', topColor: '#d9892e', iconBg: '#fbf1e1', iconBorder: '#d9892e', iconDotColor: '#b06f1f', labelColor: '#a8743a' },
  { key: 'reveal', label: 'THE REVEAL', level: '3 of 3', topColor: '#1f8a5b', iconBg: '#e7f3ec', iconBorder: '#1f8a5b', iconDotColor: '#1f8a5b', labelColor: '#1f8a5b' },
];

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(18,28,46,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
};

const modalStyle = {
  width: 480,
  maxWidth: '100%',
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 18px 40px -22px rgba(30,42,66,0.3)',
  overflow: 'hidden',
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
};

export default function HintLadder({ hints = [], onClose, onTryAgain }) {
  const [rung, setRung] = useState(0);

  if (!hints.length) return null;

  const currentHint = hints[rung] || hints[hints.length - 1];
  const meta = RUNG_META[rung] || RUNG_META[2];
  const isLast = rung >= hints.length - 1 || rung >= 2;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ height: 6, background: meta.topColor }} />
        <div style={{ padding: '20px 22px 22px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: meta.iconBg,
              border: `1.5px solid ${meta.iconBorder}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flex: '0 0 auto',
            }}>
              <Lightbulb style={{ width: 18, height: 18, color: meta.iconDotColor }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', color: meta.labelColor, fontWeight: 600 }}>
                HINT · {meta.label}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#aab2bf', marginTop: 2 }}>
                Level {meta.level}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <X style={{ width: 20, height: 20, color: '#c2c7d1' }} />
            </button>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  flex: 1, height: 5, borderRadius: 3,
                  background: i <= rung ? (rung >= 2 ? '#1f8a5b' : '#d9892e') : '#eef0f3',
                }}
              />
            ))}
          </div>

          {/* Hint title */}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#232c39', marginBottom: 9 }}>
            {currentHint.title || (rung === 0 ? 'A question first…' : rung === 1 ? 'Here\'s the method' : 'Let\'s walk it through')}
          </div>

          {/* Hint body */}
          <div style={{ fontSize: 15, lineHeight: 1.6, color: '#46505f', marginBottom: 22 }}
            dangerouslySetInnerHTML={{ __html: currentHint.html || currentHint.text || '' }}
          />

          {/* Steps for reveal rung */}
          {currentHint.steps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
              {currentHint.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: i === currentHint.steps.length - 1 ? '#1f8a5b' : '#e7f3ec',
                    color: i === currentHint.steps.length - 1 ? '#fff' : '#1f8a5b',
                    fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flex: '0 0 auto',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: '#232c39' }}
                    dangerouslySetInnerHTML={{ __html: step }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Clue cards for clue rung */}
          {currentHint.clueCards && (
            <div style={{ display: 'flex', gap: 9, marginBottom: 22 }}>
              {currentHint.clueCards.map((card, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div style={{ alignSelf: 'center', fontWeight: 700, color: '#aab2bf' }}>+</div>}
                  <div style={{
                    flex: 1, border: '1px solid #f0dcb8', background: '#fbf1e1',
                    borderRadius: 10, padding: 11, textAlign: 'center',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 15,
                    color: '#b06f1f', fontWeight: 600,
                  }}>
                    {card}
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* CTA */}
          {isLast ? (
            <button
              type="button"
              onClick={onTryAgain || onClose}
              style={{
                height: 46, borderRadius: 11, background: '#1f8a5b', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 14.5, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Okay — let me try
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRung((r) => Math.min(r + 1, 2))}
              style={{
                height: 46, borderRadius: 11, border: '1.5px solid #d9892e', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#b06f1f', fontWeight: 700, fontSize: 14.5, background: '#fff',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Still stuck? Show me more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
