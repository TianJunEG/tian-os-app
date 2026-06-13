import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

const OPTIONS = [
  { id: 'submitted', label: 'Working submitted', description: null },
  { id: 'paper', label: 'I did my working on paper', description: null },
  { id: 'skip', label: "I really didn't need working for this one", description: null },
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
  width: 560,
  maxWidth: '100%',
  background: '#fff',
  borderRadius: 20,
  boxShadow: '0 30px 70px -20px rgba(0,0,0,0.5)',
  overflow: 'hidden',
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
};

export default function BeforeYouSubmit({ hasWorking, onSubmit, onGoBack, onClose }) {
  const [selected, setSelected] = useState(hasWorking ? 'submitted' : null);

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #eef1f4' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#232c39' }}>Before you submit</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X style={{ width: 22, height: 22, color: '#9aa1b0' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px 24px' }}>
          <div style={{ fontSize: 16.5, fontWeight: 700, color: '#232c39', marginBottom: 14 }}>Show your working</div>

          <div style={{ border: '1px solid #eaedf2', borderRadius: 16, padding: 18, background: '#fcfcfd' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#232c39' }}>Show your working</div>
                <div style={{ fontSize: 13.5, color: '#8a93a3', marginTop: 2 }}>Tell us how you solved this before you submit.</div>
              </div>
              <span style={{
                flex: '0 0 auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                fontWeight: 600, color: '#6b7585', background: '#eef0f4', borderRadius: 8,
                padding: '6px 11px', letterSpacing: '0.02em',
              }}>
                Working optional
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTIONS.map((opt) => {
                const isSelected = selected === opt.id;
                const isDone = opt.id === 'submitted' && hasWorking;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelected(opt.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      border: isSelected ? '2px solid #d9892e' : '1px solid #eaedf2',
                      borderRadius: 12,
                      padding: isSelected ? '12px 14px' : '13px 15px',
                      background: isSelected ? '#fdf6ea' : isDone ? '#fbfbfc' : '#fff',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    {isDone && !isSelected ? (
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e7f3ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                        <Check style={{ width: 14, height: 14, color: '#1f8a5b', strokeWidth: 3 }} />
                      </span>
                    ) : isSelected ? (
                      <span style={{ width: 21, height: 21, borderRadius: 6, background: '#d9892e', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                        <Check style={{ width: 13, height: 13, color: '#fff', strokeWidth: 3.4 }} />
                      </span>
                    ) : (
                      <span style={{ width: 21, height: 21, borderRadius: 6, border: '2px solid #cfd5dd', flex: '0 0 auto' }} />
                    )}
                    <span style={{ fontSize: 14.5, fontWeight: isSelected ? 700 : 600, color: isSelected ? '#232c39' : isDone ? '#6b7585' : '#232c39' }}>
                      {isDone && opt.id === 'submitted' ? 'Working submitted' : opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 22 }}>
            <button
              type="button"
              onClick={onGoBack}
              style={{
                border: '1.5px solid #d9b98a', background: '#fff', borderRadius: 12,
                padding: '11px 22px', color: '#b06f1f', fontWeight: 700, fontSize: 14.5,
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              Go back
            </button>
            <button
              type="button"
              onClick={() => onSubmit(selected)}
              disabled={!selected}
              style={{
                background: '#d9892e', borderRadius: 12, padding: '11px 26px',
                color: '#fff', fontWeight: 700, fontSize: 14.5, border: 'none',
                cursor: selected ? 'pointer' : 'default',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px -4px rgba(217,137,46,0.55)',
                opacity: selected ? 1 : 0.5,
              }}
            >
              Submit answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
