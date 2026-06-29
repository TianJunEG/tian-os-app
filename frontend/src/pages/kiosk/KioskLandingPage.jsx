import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { kioskAPI, setAttemptToken } from '../../services/kioskApi';

const DOMAIN_LABELS = {
  fractions: 'Fractions', decimals: 'Decimals', percentage: 'Percentage', ratioRate: 'Ratio & Rate',
  operations: 'Four Operations', numberSense: 'Number Sense', money: 'Money', time: 'Time',
  measurement: 'Measurement', geometry: 'Geometry', areaPerimeter: 'Area & Perimeter',
  circles: 'Circles', volume: 'Volume', statistics: 'Statistics', algebra: 'Algebra',
  earlyNumeracy: 'Early Numeracy',
};

export default function KioskLandingPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await kioskAPI.getSession(code);
        if (active) setSession(data);
      } catch (e) {
        if (active) setError(e?.response?.data?.error || 'This class session could not be found. Check the code with your teacher.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [code]);

  async function pickName(student) {
    if (student.taken || busyId) return;
    setBusyId(student.ref);
    setError('');
    try {
      const { data } = await kioskAPI.begin(code, student.ref);
      setAttemptToken(data.attemptToken);
      const sessionId = data.sessionId || data.session?.sessionId;
      navigate(`/kiosk/${code}/q/${sessionId}`, {
        state: {
          session: data.session || { sessionId, mode: data.mode, studentLevel: data.studentLevel },
          questions: data.questions || [],
          currentQuestion: data.currentQuestion || null,
          progress: data.progress || null,
          studentName: student.name,
          code,
        },
      });
    } catch (e) {
      setBusyId('');
      setError(e?.response?.data?.error || 'Could not start. Please tell your teacher.');
    }
  }

  if (loading) {
    return <div style={shell}><p style={{ fontSize: 20, color: '#5a6675' }}>Loading…</p></div>;
  }

  if (error && !session) {
    return (
      <div style={shell}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1c2433', marginBottom: 8 }}>Class check-in</h1>
          <p style={{ fontSize: 18, color: '#b23b54' }}>{error}</p>
        </div>
      </div>
    );
  }

  const domainName = DOMAIN_LABELS[session.domainId] || session.domainId;

  return (
    <div style={shell}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontSize: 14, letterSpacing: 2, fontWeight: 700, color: '#3f8f6f', textTransform: 'uppercase' }}>{domainName} check-in</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1c2433', marginTop: 6 }}>Tap your name to begin</h1>
          <p style={{ fontSize: 16, color: '#5a6675', marginTop: 6 }}>Just do your best — this helps your teacher find the right starting point for you.</p>
        </div>
        {error && <p style={{ textAlign: 'center', color: '#b23b54', marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {session.roster.map((s) => (
            <button
              key={s.ref}
              type="button"
              disabled={s.taken || Boolean(busyId)}
              onClick={() => pickName(s)}
              style={{
                padding: '22px 16px', borderRadius: 16, fontSize: 20, fontWeight: 700,
                border: '2px solid', cursor: s.taken ? 'default' : 'pointer',
                background: s.taken ? '#f1f3f5' : (busyId === s.ref ? '#3f8f6f' : '#ffffff'),
                color: s.taken ? '#aab2bd' : (busyId === s.ref ? '#ffffff' : '#1c2433'),
                borderColor: s.taken ? '#e3e7eb' : '#cfe3d8',
                transition: 'all .15s ease',
              }}
            >
              {s.name}
              {s.taken && <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: '#aab2bd' }}>done</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const shell = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 24, background: 'linear-gradient(160deg, #f3f7f5, #eef1f6)',
};
