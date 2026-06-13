import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { Spinner } from '../../../components/ui';
import { getMisconception, CATEGORY_ORDER } from './utils/misconceptions';

const STEP_LABELS = {
  understand: 'Read the story',
  identify_info: 'Find the clues',
  identify_question: 'The question',
  plan: 'Make a plan',
  solve: 'Work it out',
  check: 'Check it',
};

const pageStyle = {
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  color: '#232c39',
  minHeight: '100vh',
  background: '#e7eaef',
  backgroundImage: 'radial-gradient(#d3d8e0 1px, transparent 1.4px)',
  backgroundSize: '26px 26px',
  padding: '24px 24px 96px',
};

const shellStyle = {
  background: '#f5f6f8',
  border: '1px solid #dde1e8',
  borderRadius: 16,
  boxShadow: '0 20px 44px -30px rgba(30,42,66,0.4)',
  padding: '26px 30px 30px',
  minHeight: '60vh',
  display: 'flex',
  flexDirection: 'column',
};

const errorCardStyle = {
  background: '#fff',
  border: '1px solid #e7eaef',
  borderRadius: 14,
  padding: 18,
};

const stepBadgeStyle = {
  width: 26, height: 26, borderRadius: 8,
  background: '#fbece9', border: '1px solid #ecc3ba',
  color: '#d8694f', fontWeight: 700, fontSize: 13,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flex: '0 0 auto',
};

const noteStyle = {
  background: '#fdf6ea',
  border: '1px dashed #f0dcb8',
  borderRadius: 10,
  padding: 12,
};

const goldCTAStyle = {
  height: 52,
  borderRadius: 13,
  background: '#d9892e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  color: '#fff',
  fontWeight: 700,
  fontSize: '15.5px',
  marginTop: 'auto',
  boxShadow: '0 2px 8px rgba(217,137,46,0.35)',
  cursor: 'pointer',
  border: 'none',
  width: '100%',
  fontFamily: 'inherit',
};

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export default function PSLMistakeReview() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    pslAPI.mistakes()
      .then((res) => setMistakes(res.data?.mistakes || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;
  if (loadError) return <div style={{ padding: 24, textAlign: 'center', color: '#d8694f' }}>Could not load mistakes.</div>;

  if (mistakes.length === 0) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ ...shellStyle, alignItems: 'center', justifyContent: 'center' }}>
            <Brain style={{ width: 40, height: 40, color: '#d9892e', marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700 }}>No mistakes yet!</div>
            <div style={{ fontSize: 14, color: '#8a93a3', marginTop: 4 }}>Complete some practice sessions to see your learning areas here.</div>
          </div>
        </div>
      </div>
    );
  }

  const stepNumMap = { understand: 1, identify_info: 2, identify_question: 3, plan: 4, solve: 5, check: 6 };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={shellStyle}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#232c39' }}>Let's review</div>
          <div style={{ fontSize: 14, color: '#8a93a3', marginTop: 3, marginBottom: 20 }}>
            {mistakes.length} step{mistakes.length !== 1 ? 's' : ''} from this session {mistakes.length === 1 ? 'is' : 'are'} worth another look.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {mistakes.map((m, i) => {
              const info = getMisconception(m.misconceptionTag);
              const stepNum = stepNumMap[m.stepId] || '?';
              const stepLabel = STEP_LABELS[m.stepId] || m.stepId;
              const problemLabel = m.problemIndex != null ? `PROBLEM ${m.problemIndex + 1}` : '';

              return (
                <div key={i} style={errorCardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={stepBadgeStyle}>{stepNum}</span>
                    <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#232c39' }}>{stepLabel}</span>
                    {problemLabel && (
                      <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#d8694f' }}>
                        {problemLabel}
                      </span>
                    )}
                  </div>
                  <div style={noteStyle}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#b06f1f', fontWeight: 700, marginBottom: 5 }}>
                      {info.label.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7585', lineHeight: 1.5 }}>
                      {info.tip || m.feedback}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => navigate('/student/psl')}
            style={{ ...goldCTAStyle, marginTop: 24 }}
          >
            Replay these {mistakes.length} step{mistakes.length !== 1 ? 's' : ''}
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
