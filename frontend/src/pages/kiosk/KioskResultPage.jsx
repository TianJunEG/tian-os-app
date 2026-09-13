import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { clearAttempt } from '../../services/kioskApi';

export default function KioskResultPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const studentName = location.state?.studentName || '';
  // Practice sets pass a summary so the student sees their score; the diagnostic
  // deliberately does not (it's an assessment).
  const summary = location.state?.summary || null;
  const hasScore = summary && Number.isFinite(summary.total) && summary.total > 0;

  function nextStudent() {
    clearAttempt();
    navigate(`/kiosk/${code}`, { replace: true });
  }

  return (
    <div style={shell}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1c2433' }}>
          {studentName ? `Great work, ${studentName}!` : 'Great work!'}
        </h1>
        {hasScore ? (
          <>
            <p style={{ fontSize: 40, fontWeight: 800, color: '#2f8f5b', marginTop: 14 }}>
              You got {summary.correct} / {summary.total}
            </p>
            <p style={{ fontSize: 18, color: '#5a6675', marginTop: 8, lineHeight: 1.5 }}>
              Nice effort! Log in later to review any you missed and try again.
            </p>
          </>
        ) : (
          <p style={{ fontSize: 18, color: '#5a6675', marginTop: 10, lineHeight: 1.5 }}>
            You finished the check-in. Your teacher can now see where to help you next.
          </p>
        )}
        <button type="button" style={primaryBtn} onClick={nextStudent}>
          Pass the iPad to the next person →
        </button>
      </div>
    </div>
  );
}

const shell = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 24, background: 'linear-gradient(160deg, #f3f7f5, #eef1f6)',
};
const primaryBtn = {
  marginTop: 28, padding: '18px 26px', borderRadius: 14, border: 'none', cursor: 'pointer',
  background: '#2f8f5b', color: '#fff', fontSize: 18, fontWeight: 700,
};
