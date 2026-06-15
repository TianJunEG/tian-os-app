import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Plus } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { Spinner } from '../../components/ui';

const FONT = "'Hanken Grotesk', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const pageStyle = {
  fontFamily: FONT,
  color: '#232c39',
  minHeight: '100vh',
  background: '#e7eaef',
  backgroundImage: 'radial-gradient(#d3d8e0 1px, transparent 1.4px)',
  backgroundSize: '26px 26px',
  padding: '0 0 96px',
};

const shellStyle = {
  background: '#f5f6f8',
  border: '1px solid #dde1e8',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 36px 70px -34px rgba(30,42,66,0.45)',
};

const navStyle = {
  background: '#fff',
  borderBottom: '1px solid #eaedf2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 22px',
  height: 54,
};

const cardStyle = {
  background: '#fff',
  border: '1px solid #e7eaef',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(30,42,66,0.05)',
  padding: '18px 20px',
};

export default function TeacherHome() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false);
    setData(null);
    teacherAPI.home().then((r) => setData(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, []);

  if (loadError) return (
    <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#d8694f', marginBottom: 12 }}>Couldn't load Teacher dashboard.</div>
        <button type="button" onClick={load} style={{ background: '#d9892e', color: '#fff', borderRadius: 11, padding: '10px 20px', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: FONT, boxShadow: '0 2px 8px rgba(217,137,46,0.35)' }}>Retry</button>
      </div>
    </div>
  );
  if (!data) return <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 44px' }}>
        <div style={shellStyle}>
          {/* Nav */}
          <div style={navStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(150deg, #e3a64f, #d2812c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17, boxShadow: '0 2px 6px rgba(210,129,44,0.4)' }}>T</div>
                <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>TianOS</span>
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#a8743a', background: '#fbf1e1', border: '1px solid #f0dcb8', padding: '3px 7px', borderRadius: 6 }}>TEACHER</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ padding: '7px 13px', borderRadius: 8, background: '#eef0f4', color: '#232c39', fontSize: 13.5, fontWeight: 600 }}>Overview</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px 30px 30px' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-0.01em' }}>Good day</div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: '#8a93a3', marginTop: 3 }}>Your classes and what needs attention.</div>
              </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
              <div style={cardStyle}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a93a3' }}>Classes</div>
                <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{data.classCount}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a93a3' }}>Active interventions</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800 }}>{data.activeInterventions}</span>
                </div>
              </div>
              <div style={{ ...cardStyle, border: data.attention.length > 0 ? '1px solid #f3cabf' : '1px solid #e7eaef' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: data.attention.length > 0 ? '#d8694f' : '#8a93a3' }}>Need attention</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: data.attention.length > 0 ? '#c8472f' : '#232c39' }}>{data.attention.length}</span>
                  <span style={{ fontSize: 13, color: '#8a93a3' }}>flagged</span>
                </div>
              </div>
            </div>

            {/* Needs attention list */}
            <div style={{ ...cardStyle, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Classes needing attention</div>
                {data.attention.length > 0 && (
                  <span style={{ fontFamily: MONO, fontSize: 11, color: '#c8472f', background: '#fdeeea', padding: '3px 8px', borderRadius: 6 }}>{data.attention.length}</span>
                )}
              </div>
              {data.attention.length === 0 ? (
                <div style={{ fontSize: 14, color: '#8a93a3' }}>No urgent class needs today.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {data.attention.map((c, i) => (
                    <React.Fragment key={c.classId}>
                      {i > 0 && <div style={{ height: 1, background: '#f0f2f5' }} />}
                      <Link to={`/teacher/classes/${c.classId}/weak-groups`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fdeeea', color: '#c8472f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                            {c.name?.slice(0, 2).toUpperCase() || '??'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                            <div style={{ fontSize: 12.5, color: '#c8472f' }}>{c.flagged} student{c.flagged > 1 ? 's' : ''} need support</div>
                          </div>
                          <ChevronRight style={{ width: 16, height: 16, color: '#c2c8d0' }} />
                        </div>
                      </Link>
                    </React.Fragment>
                  ))}
                </div>
              )}
              {data.attention[0] && (
                <div style={{ marginTop: 16, paddingTop: 15, borderTop: '1px solid #f3f4f7' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/teacher/classes/${data.attention[0].classId}/weak-groups`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#d9892e', borderRadius: 10, padding: '8px 15px', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 2px 8px rgba(217,137,46,0.35)', border: 'none', cursor: 'pointer', fontFamily: FONT }}
                  >
                    Review intervention groups <ArrowRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
