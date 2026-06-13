import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { Spinner } from '../../../components/ui';

const pageStyle = {
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  color: '#232c39',
  minHeight: '100vh',
  background: '#e7eaef',
  backgroundImage: 'radial-gradient(#d3d8e0 1px, transparent 1.4px)',
  backgroundSize: '26px 26px',
  padding: '24px 24px 96px',
};

const panelStyle = {
  background: 'linear-gradient(160deg, #13223e, #101d36)',
  border: '1px solid #0c1730',
  borderRadius: 16,
  boxShadow: '0 24px 50px -30px rgba(13,23,48,0.6)',
  padding: 34,
  color: '#f4f0e8',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 34,
  alignItems: 'start',
  minHeight: '60vh',
};

const tileStyle = {
  flex: 1,
  border: '1px solid #2a3a59',
  borderRadius: 14,
  padding: 15,
  background: '#172a49',
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
  boxShadow: '0 4px 14px -4px rgba(217,137,46,0.6)',
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

export default function PSLResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pslAPI.getSession(sessionId)
      .then((res) => setData(res.data))
      .catch(() => navigate('/student/psl'))
      .finally(() => setLoading(false));
  }, [sessionId, navigate]);

  if (loading) return <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;
  if (!data) return null;

  const summary = data.summary || {};
  const totalProblems = summary.totalProblems || data.problems?.length || 5;
  const xpEarned = summary.xpEarned || Math.round((summary.overallScore || 0) * totalProblems * 12);
  const streak = summary.streak || 0;
  const xpToNext = summary.xpToNextBadge || 140;
  const xpProgress = summary.xpProgress || 0.72;
  const studentName = data.studentName || 'there';
  const mistakeCount = Object.keys(summary.misconceptionCounts || {}).length;

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={panelStyle}>
          {/* Left: celebration */}
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <span style={{ width: 7, height: 7, background: '#d9892e', borderRadius: 2, transform: 'rotate(20deg)' }} />
              <span style={{ width: 6, height: 6, background: '#4f7bf0', borderRadius: 2, transform: 'rotate(-15deg)' }} />
              <span style={{ width: 8, height: 8, background: '#1f9d57', borderRadius: 2, transform: 'rotate(35deg)' }} />
              <span style={{ width: 6, height: 6, background: '#d9892e', borderRadius: 2 }} />
            </div>

            <div style={{
              width: 74, height: 74, borderRadius: '50%', background: '#1d3157',
              border: '2px solid #3f9d6a', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: 18,
            }}>
              <Check style={{ width: 38, height: 38, color: '#5fd095', strokeWidth: 2.4 }} />
            </div>

            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.01em', color: '#f6f2ea' }}>
              Nice work, {studentName}!
            </div>
            <div style={{ fontSize: 15, color: '#aebbd2', marginTop: 6 }}>
              {totalProblems} of {totalProblems} problems done &middot; you worked through every step.
            </div>
          </div>

          {/* Right: stats */}
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={tileStyle}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 600, color: '#e3a64f', lineHeight: 1 }}>
                  +{xpEarned}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10.5px', color: '#8a98b2', marginTop: 6, letterSpacing: '0.08em' }}>
                  XP EARNED
                </div>
              </div>
              <div style={tileStyle}>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#f0ab63', lineHeight: 1 }}>
                  {streak || 1}🔥
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10.5px', color: '#8a98b2', marginTop: 6, letterSpacing: '0.08em' }}>
                  DAY STREAK
                </div>
              </div>
            </div>

            <div style={{
              height: 10, borderRadius: 6, background: '#172a49',
              border: '1px solid #2a3a59', overflow: 'hidden', marginBottom: 8,
            }}>
              <div style={{ width: `${Math.round(xpProgress * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #d9892e, #e3a64f)' }} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11.5px', color: '#8a98b2', marginBottom: 18 }}>
              {xpToNext} XP to your next badge
            </div>

            <button
              type="button"
              onClick={() => {
                if (mistakeCount > 0) {
                  navigate(`/student/psl/mistakes/${sessionId}`);
                } else {
                  navigate('/student/psl');
                }
              }}
              style={goldCTAStyle}
            >
              {mistakeCount > 0 ? 'See what to review' : 'Back to skills'}
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
