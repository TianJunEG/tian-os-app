import React, { createContext, useContext } from 'react';

const FREDOKA = "'Fredoka', 'Nunito', system-ui, sans-serif";
const NUNITO = "'Nunito', system-ui, sans-serif";

const lowerPrimaryTokens = {
  headingFont: FREDOKA,
  bodyFont: NUNITO,
  accentPurple: '#3a2f4a',
  accentGold: '#d9892e',
  accentGreen: '#1f8a5b',
  bgGradient: 'linear-gradient(165deg, #f4eefe 0%, #fdf5ec 55%, #fdeef4 100%)',
  cardRadius: 26,
  cardBg: '#fff',
  cardBorder: '1px solid rgba(58,47,74,0.08)',
  cardShadow: '0 2px 8px rgba(58,47,74,0.06)',
  btnRadius: 22,
  btnShadow3d: '0 3px 0',
  progressEmojis: { mastered: '✅', learning: '⭐', locked: '🔒', current: '🌟' },
};

const SkinContext = createContext(null);

export function useLowerPrimarySkin() {
  return useContext(SkinContext);
}

function StarBuddy({ size = 56, style }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 3px 0 #6d28d9, 0 6px 16px rgba(124,58,237,0.25)',
      fontSize: size * 0.5, lineHeight: 1, ...style,
    }}>
      ⭐
    </div>
  );
}

function PlayfulProgressPills({ steps, currentIdx, completedSteps }) {
  const emojis = lowerPrimaryTokens.progressEmojis;
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
      {steps.map((step, i) => {
        const isDone = completedSteps?.[step.id];
        const isCurrent = i === currentIdx;
        const isLocked = i > currentIdx && !isDone;
        const emoji = isDone ? emojis.mastered : isCurrent ? emojis.current : emojis.locked;
        return (
          <div key={step.id} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: isCurrent ? '#fff' : 'rgba(255,255,255,0.6)',
            border: isCurrent ? '2px solid #a78bfa' : '1px solid rgba(58,47,74,0.08)',
            borderRadius: 20,
            padding: '6px 14px 6px 8px',
            boxShadow: isCurrent ? '0 2px 8px rgba(167,139,250,0.2)' : 'none',
          }}>
            <span style={{ fontSize: 16 }}>{emoji}</span>
            <span style={{
              fontFamily: NUNITO,
              fontSize: 13,
              fontWeight: isCurrent ? 800 : 600,
              color: isLocked ? '#b0a8c0' : '#3a2f4a',
            }}>
              {step.label}
            </span>
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
          background: 'linear-gradient(135deg, #d9892e, #e6a040)',
          color: '#fff',
          boxShadow: '0 3px 0 #b8701e, 0 6px 14px rgba(217,137,46,0.3)',
        } : {
          background: '#fff',
          color: '#3a2f4a',
          border: '2px solid rgba(58,47,74,0.12)',
          boxShadow: '0 3px 0 #e8e4f0',
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
      border: highlight ? '2px solid #a78bfa' : '1px solid rgba(58,47,74,0.08)',
      borderRadius: 26,
      padding: '18px 20px',
      boxShadow: highlight
        ? '0 4px 16px rgba(167,139,250,0.15)'
        : '0 2px 8px rgba(58,47,74,0.06)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function PlayfulFeedbackCorrect({ feedback, onContinue }) {
  return (
    <PlayfulCard highlight style={{ textAlign: 'center', padding: '28px 22px' }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
      <div style={{ fontFamily: FREDOKA, fontSize: 26, fontWeight: 700, color: '#3a2f4a' }}>
        {feedback || 'Amazing!'}
      </div>
      <div style={{ fontFamily: NUNITO, fontSize: 15, color: '#7c6f94', marginTop: 6 }}>
        You got it right — great thinking!
      </div>
      {onContinue && (
        <PlayfulCTA onClick={onContinue} style={{ marginTop: 18 }}>
          Keep going! 🚀
        </PlayfulCTA>
      )}
    </PlayfulCard>
  );
}

function PlayfulFeedbackWrong({ feedback, misconceptionTip, onTryAgain, onShowHint, retriesLeft }) {
  return (
    <PlayfulCard style={{ padding: '20px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 28 }}>🤔</span>
        <div>
          <div style={{ fontFamily: FREDOKA, fontSize: 18, fontWeight: 700, color: '#3a2f4a' }}>
            Hmm, not quite!
          </div>
          <div style={{ fontFamily: NUNITO, fontSize: 14, color: '#7c6f94', marginTop: 2 }}>
            That's okay — let's think about it together.
          </div>
        </div>
      </div>

      {(feedback || misconceptionTip) && (
        <div style={{
          background: '#fdf6ea', border: '1px dashed #f0dcb8', borderRadius: 18,
          padding: 14, marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              {feedback && <div style={{ fontFamily: NUNITO, fontSize: 14, fontWeight: 700, color: '#3a2f4a', marginBottom: 3 }}>{feedback}</div>}
              {misconceptionTip && <div style={{ fontFamily: NUNITO, fontSize: 13.5, color: '#7c6f94', lineHeight: 1.5 }}>{misconceptionTip}</div>}
            </div>
          </div>
        </div>
      )}

      {retriesLeft > 0 && (
        <div style={{ fontFamily: FREDOKA, fontSize: 14, color: '#a78bfa', textAlign: 'center', marginBottom: 10 }}>
          {retriesLeft} {retriesLeft === 1 ? 'try' : 'tries'} left — you can do it!
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        {onTryAgain && <PlayfulCTA onClick={onTryAgain}>Try again! 💪</PlayfulCTA>}
        {onShowHint && <PlayfulCTA onClick={onShowHint} variant="secondary">Show me how 🔍</PlayfulCTA>}
      </div>
    </PlayfulCard>
  );
}

export default function LowerPrimarySkin({ children }) {
  return (
    <SkinContext.Provider value={lowerPrimaryTokens}>
      <div style={{
        fontFamily: NUNITO,
        color: '#3a2f4a',
        minHeight: '100vh',
        background: lowerPrimaryTokens.bgGradient,
        padding: '20px 20px 96px',
      }}>
        {children}
      </div>
    </SkinContext.Provider>
  );
}

LowerPrimarySkin.StarBuddy = StarBuddy;
LowerPrimarySkin.ProgressPills = PlayfulProgressPills;
LowerPrimarySkin.CTA = PlayfulCTA;
LowerPrimarySkin.Card = PlayfulCard;
LowerPrimarySkin.FeedbackCorrect = PlayfulFeedbackCorrect;
LowerPrimarySkin.FeedbackWrong = PlayfulFeedbackWrong;
LowerPrimarySkin.tokens = lowerPrimaryTokens;
LowerPrimarySkin.FREDOKA = FREDOKA;
LowerPrimarySkin.NUNITO = NUNITO;
