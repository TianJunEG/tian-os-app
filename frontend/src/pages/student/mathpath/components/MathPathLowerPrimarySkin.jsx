import React, { createContext, useContext } from 'react';

const FREDOKA = "'Fredoka', 'Nunito', system-ui, sans-serif";
const NUNITO = "'Nunito', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const emeraldPlayfulTokens = {
  headingFont: FREDOKA,
  bodyFont: NUNITO,
  primary: '#1f8a5b',
  primaryLight: '#e3f5ea',
  primaryMid: '#1f9d57',
  primaryDark: '#157a44',
  accentPurple: '#3a2f4a',
  bgGradient: 'linear-gradient(165deg, #edf3fa 0%, #f4f6f9 50%, #fbf6f1 100%)',
  cardRadius: 26,
  btnRadius: 22,
  btnShadow3d: '0 3px 0',
};

const SkinContext = createContext(null);

export function useMathPathLowerPrimarySkin() {
  return useContext(SkinContext);
}

function StarBuddy({ size = 56, style }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #5bbf8d 0%, #1f8a5b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 3px 0 #157a44, 0 6px 16px rgba(31,138,91,0.25)',
      fontSize: size * 0.5, lineHeight: 1, ...style,
    }}>
      ⭐
    </div>
  );
}

function PlayfulProgressPills({ total, current, completed }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < completed;
        const isCurrent = i === current;
        const emoji = isDone ? '✅' : isCurrent ? '🌟' : '🔒';
        return (
          <div key={i} style={{
            background: isCurrent ? '#fff' : 'rgba(255,255,255,0.6)',
            border: isCurrent ? '2px solid #5bbf8d' : '1px solid rgba(31,138,91,0.1)',
            borderRadius: 18,
            padding: '5px 12px',
            fontSize: 15,
            boxShadow: isCurrent ? '0 2px 8px rgba(31,138,91,0.15)' : 'none',
          }}>
            {emoji}
          </div>
        );
      })}
    </div>
  );
}

function PlayfulCTA({ children, onClick, disabled, variant = 'primary', style }) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 54,
        borderRadius: 22,
        border: 'none',
        fontFamily: FREDOKA,
        fontWeight: 700,
        fontSize: 17,
        cursor: disabled ? 'default' : 'pointer',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.5 : 1,
        ...(isPrimary ? {
          background: 'linear-gradient(135deg, #1f9d57, #2db86a)',
          color: '#fff',
          boxShadow: '0 3px 0 #157a44, 0 6px 14px rgba(31,138,91,0.3)',
        } : {
          background: '#fff',
          color: '#3a2f4a',
          border: '2px solid rgba(31,138,91,0.15)',
          boxShadow: '0 3px 0 #dce8e2',
        }),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function PlayfulCard({ children, style, highlight }) {
  return (
    <div style={{
      background: '#fff',
      border: highlight ? '2px solid #5bbf8d' : '1px solid rgba(31,138,91,0.1)',
      borderRadius: 26,
      padding: '18px 20px',
      boxShadow: highlight
        ? '0 4px 16px rgba(31,138,91,0.12)'
        : '0 2px 8px rgba(31,138,91,0.05)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function FractionVisual({ parts, shaded, label, style }) {
  return (
    <div style={{ textAlign: 'center', ...style }}>
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 8 }}>
        {Array.from({ length: parts || 4 }, (_, i) => (
          <div key={i} style={{
            width: 40, height: 26, borderRadius: 10,
            background: i < (shaded || 0) ? '#1f9d57' : '#e3f5ea',
            border: `1.5px solid ${i < (shaded || 0) ? '#157a44' : '#c8e6d4'}`,
          }} />
        ))}
      </div>
      {label && (
        <span style={{ fontFamily: FREDOKA, fontSize: 16, fontWeight: 700, color: '#157a44' }}>
          {label}
        </span>
      )}
    </div>
  );
}

function NumberPad({ onPress, columns = 5, style }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 8,
      ...style,
    }}>
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onPress?.(k)}
          style={{
            height: 50,
            borderRadius: 16,
            border: 'none',
            background: '#fff',
            boxShadow: '0 3px 0 #dce8e2, 0 1px 3px rgba(31,138,91,0.08)',
            fontFamily: FREDOKA,
            fontSize: 22,
            fontWeight: 700,
            color: '#3a2f4a',
            cursor: 'pointer',
          }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function FeedbackCorrect({ feedback, onContinue }) {
  return (
    <PlayfulCard highlight style={{ textAlign: 'center', padding: '28px 22px' }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
      <div style={{ fontFamily: FREDOKA, fontSize: 26, fontWeight: 700, color: '#157a44' }}>
        {feedback || 'You got it!'}
      </div>
      <div style={{ fontFamily: NUNITO, fontSize: 15, color: '#5a8570', marginTop: 6 }}>
        Great work — keep it up!
      </div>
      {onContinue && (
        <PlayfulCTA onClick={onContinue} style={{ marginTop: 18 }}>
          Next one! 🚀
        </PlayfulCTA>
      )}
    </PlayfulCard>
  );
}

function FeedbackWrong({ feedback, misconceptionTip, onTryAgain, onShowHint, retriesLeft }) {
  return (
    <PlayfulCard style={{ padding: '20px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 28 }}>🤔</span>
        <div>
          <div style={{ fontFamily: FREDOKA, fontSize: 18, fontWeight: 700, color: '#3a2f4a' }}>
            Not quite!
          </div>
          <div style={{ fontFamily: NUNITO, fontSize: 14, color: '#7c6f94', marginTop: 2 }}>
            That's okay — let's try again.
          </div>
        </div>
      </div>
      {(feedback || misconceptionTip) && (
        <div style={{
          background: '#e3f5ea', border: '1px dashed #b8dfc8', borderRadius: 18,
          padding: 14, marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              {feedback && <div style={{ fontFamily: NUNITO, fontSize: 14, fontWeight: 700, color: '#157a44', marginBottom: 3 }}>{feedback}</div>}
              {misconceptionTip && <div style={{ fontFamily: NUNITO, fontSize: 13.5, color: '#5a8570', lineHeight: 1.5 }}>{misconceptionTip}</div>}
            </div>
          </div>
        </div>
      )}
      {retriesLeft > 0 && (
        <div style={{ fontFamily: FREDOKA, fontSize: 14, color: '#1f9d57', textAlign: 'center', marginBottom: 10 }}>
          {retriesLeft} {retriesLeft === 1 ? 'try' : 'tries'} left — you've got this!
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        {onTryAgain && <PlayfulCTA onClick={onTryAgain}>Try again! 💪</PlayfulCTA>}
        {onShowHint && <PlayfulCTA onClick={onShowHint} variant="secondary">Help me 🔍</PlayfulCTA>}
      </div>
    </PlayfulCard>
  );
}

export default function MathPathLowerPrimarySkin({ children }) {
  return (
    <SkinContext.Provider value={emeraldPlayfulTokens}>
      <div style={{
        fontFamily: NUNITO,
        color: '#3a2f4a',
        minHeight: '100vh',
        background: emeraldPlayfulTokens.bgGradient,
        padding: '20px 20px 96px',
      }}>
        {children}
      </div>
    </SkinContext.Provider>
  );
}

MathPathLowerPrimarySkin.StarBuddy = StarBuddy;
MathPathLowerPrimarySkin.ProgressPills = PlayfulProgressPills;
MathPathLowerPrimarySkin.CTA = PlayfulCTA;
MathPathLowerPrimarySkin.Card = PlayfulCard;
MathPathLowerPrimarySkin.FractionVisual = FractionVisual;
MathPathLowerPrimarySkin.NumberPad = NumberPad;
MathPathLowerPrimarySkin.FeedbackCorrect = FeedbackCorrect;
MathPathLowerPrimarySkin.FeedbackWrong = FeedbackWrong;
MathPathLowerPrimarySkin.tokens = emeraldPlayfulTokens;
MathPathLowerPrimarySkin.FREDOKA = FREDOKA;
MathPathLowerPrimarySkin.NUNITO = NUNITO;
