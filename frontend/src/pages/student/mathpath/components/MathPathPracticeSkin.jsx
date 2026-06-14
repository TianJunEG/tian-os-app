import React, { createContext, useContext } from 'react';

const FONT = "'Hanken Grotesk', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const emeraldTokens = {
  primary: '#1f8a5b',
  primaryLight: '#e3f5ea',
  primaryMid: '#1f9d57',
  primaryDark: '#157a44',
  navBg: '#e3f5ea',
  navText: '#157a44',
  pageBg: '#e7eaef',
  dotGrid: 'radial-gradient(#d3d8e0 1px, transparent 1.4px)',
  dotSize: '26px 26px',
  shellBg: '#f5f6f8',
  shellBorder: '#dde1e8',
  cardBg: '#fff',
  cardBorder: '#e7eaef',
  ruledPaper: {
    bg: '#fafaf8',
    line: '#e8eef7',
    margin: '#f0b8b8',
    marginLeft: 52,
  },
  font: FONT,
  mono: MONO,
};

const SkinContext = createContext(null);

export function useMathPathSkin() {
  return useContext(SkinContext);
}

const pageStyle = {
  fontFamily: FONT,
  color: '#232c39',
  minHeight: '100vh',
  background: emeraldTokens.pageBg,
  backgroundImage: emeraldTokens.dotGrid,
  backgroundSize: emeraldTokens.dotSize,
  padding: '24px 24px 96px',
};

const shellStyle = {
  background: emeraldTokens.shellBg,
  border: `1px solid ${emeraldTokens.shellBorder}`,
  borderRadius: 16,
  boxShadow: '0 20px 44px -30px rgba(30,42,66,0.4)',
  overflow: 'hidden',
};

const twoColumnStyle = {
  display: 'grid',
  gridTemplateColumns: '1.62fr 1fr',
  gap: 0,
  minHeight: '60vh',
};

const notebookStyle = {
  position: 'relative',
  background: '#fafaf8',
  backgroundImage: `repeating-linear-gradient(0deg, #fafaf8, #fafaf8 31px, #e8eef7 32px)`,
  padding: '26px 28px 26px 72px',
  borderRight: '1px solid #e7eaef',
};

const marginLineStyle = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 52,
  width: 1.5,
  background: '#f0b8b8',
  opacity: 0.5,
};

const actionPanelStyle = {
  background: '#fff',
  padding: '22px 24px',
  display: 'flex',
  flexDirection: 'column',
};

const emeraldCTAStyle = {
  height: 50,
  borderRadius: 12,
  background: emeraldTokens.primaryMid,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  color: '#fff',
  fontWeight: 700,
  fontSize: '15.5px',
  boxShadow: `0 2px 8px rgba(31,138,91,0.35)`,
  cursor: 'pointer',
  border: 'none',
  width: '100%',
  fontFamily: FONT,
};

const emeraldOutlineStyle = {
  height: 48,
  borderRadius: 12,
  border: `1.5px solid ${emeraldTokens.primary}`,
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  color: emeraldTokens.primaryDark,
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: FONT,
  width: '100%',
};

function ProgressSegments({ total, current, completed }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 0' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 5, borderRadius: 3,
          background: i < completed ? emeraldTokens.primary
            : i === current ? emeraldTokens.primaryLight
            : '#eef0f3',
        }} />
      ))}
    </div>
  );
}

function QuestionCard({ children, style }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e7eaef',
      borderRadius: 14,
      padding: '16px 18px',
      boxShadow: '0 1px 3px rgba(30,42,66,0.05)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function FractionVisual({ parts, shaded, label, style }) {
  return (
    <div style={{ textAlign: 'center', ...style }}>
      <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 8 }}>
        {Array.from({ length: parts || 4 }, (_, i) => (
          <div key={i} style={{
            width: 36, height: 22, borderRadius: 5,
            background: i < (shaded || 0) ? emeraldTokens.primary : '#e3f5ea',
            border: `1px solid ${i < (shaded || 0) ? emeraldTokens.primaryDark : '#c8e6d4'}`,
          }} />
        ))}
      </div>
      {label && (
        <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: emeraldTokens.primaryDark }}>
          {label}
        </span>
      )}
    </div>
  );
}

function EmeraldBadge({ children, tone = 'default' }) {
  const styles = {
    mastered: { background: '#e3f5ea', color: '#157a44' },
    learning: { background: '#fbf1e1', color: '#a8743a' },
    default: { background: '#eef0f4', color: '#6b7585' },
  };
  const s = styles[tone] || styles.default;
  return (
    <span style={{
      fontFamily: MONO, fontSize: 11, fontWeight: 600,
      padding: '4px 10px', borderRadius: 7, letterSpacing: '0.03em',
      ...s,
    }}>
      {children}
    </span>
  );
}

export default function MathPathPracticeSkin({ children }) {
  return (
    <SkinContext.Provider value={emeraldTokens}>
      <div style={pageStyle}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </SkinContext.Provider>
  );
}

MathPathPracticeSkin.Shell = function Shell({ children }) {
  return <div style={shellStyle}>{children}</div>;
};

MathPathPracticeSkin.TwoColumn = function TwoColumn({ notebook, action }) {
  return (
    <div style={twoColumnStyle}>
      <div style={notebookStyle}>
        <div style={marginLineStyle} />
        {notebook}
      </div>
      <div style={actionPanelStyle}>
        {action}
      </div>
    </div>
  );
};

MathPathPracticeSkin.CTA = function CTA({ children, onClick, disabled, style }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ ...emeraldCTAStyle, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer', ...style }}>
      {children}
    </button>
  );
};

MathPathPracticeSkin.OutlineBtn = function OutlineBtn({ children, onClick, style }) {
  return (
    <button type="button" onClick={onClick} style={{ ...emeraldOutlineStyle, ...style }}>
      {children}
    </button>
  );
};

MathPathPracticeSkin.ProgressSegments = ProgressSegments;
MathPathPracticeSkin.QuestionCard = QuestionCard;
MathPathPracticeSkin.FractionVisual = FractionVisual;
MathPathPracticeSkin.Badge = EmeraldBadge;
MathPathPracticeSkin.tokens = emeraldTokens;
