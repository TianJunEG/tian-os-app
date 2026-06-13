import React from 'react';
import { Check, Lightbulb } from 'lucide-react';
import { getMisconception } from '../utils/misconceptions';

export default function StepFeedbackCard({ correct, partial, feedback, misconceptionTag, onContinue, onTryAgain, onShowHint, retriesLeft }) {
  const misconception = misconceptionTag ? getMisconception(misconceptionTag) : null;

  if (correct) {
    return (
      <div style={{
        background: '#fff', border: '1px solid #e7eaef', borderRadius: 16,
        boxShadow: '0 1px 3px rgba(30,42,66,0.05)', padding: '26px 22px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
        fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
      }}>
        <div style={{ position: 'absolute', top: 14, left: 0, right: 0, height: 50, pointerEvents: 'none' }}>
          <span style={{ position: 'absolute', left: '20%', top: 6, width: 7, height: 7, background: '#d9892e', borderRadius: 2, transform: 'rotate(20deg)' }} />
          <span style={{ position: 'absolute', left: '42%', top: 24, width: 6, height: 6, background: '#2f80d8', borderRadius: 2, transform: 'rotate(-15deg)' }} />
          <span style={{ position: 'absolute', left: '64%', top: 10, width: 8, height: 8, background: '#1f8a5b', borderRadius: 2, transform: 'rotate(35deg)' }} />
          <span style={{ position: 'absolute', left: '80%', top: 28, width: 6, height: 6, background: '#d9892e', borderRadius: 2 }} />
        </div>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: '#e7f3ec',
          border: '2px solid #1f8a5b', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '6px auto 16px',
        }}>
          <Check style={{ width: 38, height: 38, color: '#1f8a5b', strokeWidth: 2.4 }} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#232c39', letterSpacing: '-0.01em' }}>
          {feedback || 'Correct!'}
        </div>
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            style={{
              height: 50, borderRadius: 12, background: '#d9892e', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 15.5, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', marginTop: 20,
              boxShadow: '0 2px 8px rgba(217,137,46,0.35)',
            }}
          >
            Continue
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #e7eaef', borderRadius: 16,
      boxShadow: '0 1px 3px rgba(30,42,66,0.05)', padding: 20,
      fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
    }}>
      <div style={{
        border: '1.5px solid #d8694f', borderRadius: 12, padding: 15,
        background: '#fdeeea', marginBottom: 14,
      }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: '#46505f' }}>
          {partial ? 'Almost there' : 'Not quite'}
        </div>
      </div>

      {(feedback || misconception?.tip) && (
        <div style={{
          border: '1px solid #f0dcb8', background: '#fdf6ea', borderRadius: 12,
          padding: 14, display: 'flex', gap: 11,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#fbf1e1',
            border: '1.5px solid #d9892e', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flex: '0 0 auto',
          }}>
            <Lightbulb style={{ width: 16, height: 16, color: '#b06f1f' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#232c39', marginBottom: 4 }}>
              {feedback}
            </div>
            {misconception?.tip && (
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#6b7585' }}>
                {misconception.tip}
              </div>
            )}
          </div>
        </div>
      )}

      {retriesLeft > 0 && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", marginTop: 12,
          fontSize: 12, color: '#a8743a', display: 'flex', alignItems: 'center',
          gap: 6, justifyContent: 'center',
        }}>
          {retriesLeft} {retriesLeft === 1 ? 'TRY' : 'TRIES'} LEFT
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        {onTryAgain && (
          <button
            type="button"
            onClick={onTryAgain}
            style={{
              flex: 1, height: 48, borderRadius: 12, background: '#d9892e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 15, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
        )}
        {onShowHint && (
          <button
            type="button"
            onClick={onShowHint}
            style={{
              flex: 1, height: 48, borderRadius: 12, border: '1.5px solid #d9892e',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: '#b06f1f', fontWeight: 700, fontSize: 14, background: '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Lightbulb style={{ width: 17, height: 17 }} />
            Show me how
          </button>
        )}
        {onContinue && !onTryAgain && (
          <button
            type="button"
            onClick={onContinue}
            style={{
              flex: 1, height: 48, borderRadius: 12, background: '#d9892e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 15, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
