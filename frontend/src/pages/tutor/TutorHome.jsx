import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Check, ChevronRight, FileText, GraduationCap, Search } from 'lucide-react';
import { tutorAPI } from '../../services/api';
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
  borderRadius: 14,
  boxShadow: '0 1px 3px rgba(30,42,66,0.05)',
  padding: '16px 17px',
};

const emeraldCTAStyle = {
  flex: 1,
  textAlign: 'center',
  background: '#1f8a5b',
  color: '#fff',
  borderRadius: 11,
  padding: 12,
  fontWeight: 700,
  fontSize: 14,
  boxShadow: '0 2px 8px rgba(31,138,91,0.35)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: FONT,
};

const CERT_LABEL = {
  not_started: 'Not started',
  in_training: 'In training',
  assessment_pending: 'Assessment pending',
  interview_pending: 'Interview pending',
  approved: 'Approved',
  suspended: 'Suspended',
};

function NavTab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 13px',
        borderRadius: 8,
        background: active ? '#e7f3ec' : 'transparent',
        color: active ? '#1c5b3e' : '#6b7585',
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        border: 'none',
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      {label}
    </button>
  );
}

function StudentCard({ name, initials, level, schedule, statusBg, statusFg, statusIcon, statusText, onClick }) {
  return (
    <div style={cardStyle} onClick={onClick} role="button" tabIndex={0}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: statusBg || '#e7f3ec', color: statusFg || '#1f8a5b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{name}</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#8a93a3' }}>{level}{schedule ? ` · ${schedule}` : ''}</div>
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: statusBg === '#fdeeea' ? '#fef3ed' : statusBg === '#eaf3fc' ? '#eaf3fc' : statusBg === '#e7f3ec' ? '#e7f3ec' : '#f5f6f8',
        borderRadius: 8, padding: '7px 10px',
        fontSize: 12.5,
        color: statusFg || '#6b7585',
        fontWeight: 600,
      }}>
        {statusIcon}
        {statusText}
      </div>
    </div>
  );
}

function SessionPrepPanel({ student, onStartSession, onOpenNotes }) {
  if (!student) return null;
  const initials = student.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div style={{ background: '#fff', border: '1px solid #e7eaef', borderRadius: 16, boxShadow: '0 1px 3px rgba(30,42,66,0.05)', padding: '22px 24px' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1f8a5b', marginBottom: 6 }}>
        Next session{student.nextTime ? ` · ${student.nextTime}` : ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#e7f3ec', color: '#1f8a5b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>{initials}</div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800 }}>{student.name}</div>
          <div style={{ fontSize: 13, color: '#8a93a3' }}>{student.level}{student.sessionCount ? ` · ${student.sessionCount} session` : ''}</div>
        </div>
      </div>

      {student.focus && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#46505f', marginBottom: 9 }}>Focus on</div>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#fef8f2', border: '1px solid #f5e3d0', borderRadius: 11,
            padding: '13px 15px', marginBottom: 18,
          }}>
            <AlertCircle style={{ width: 17, height: 17, color: '#b06f1f', marginTop: 1, flex: '0 0 auto' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#232c39' }}>{student.focus.skill}</div>
              <div style={{ fontSize: 13, color: '#8a6a4a', lineHeight: 1.5, marginTop: 3 }}>{student.focus.note}</div>
            </div>
          </div>
        </>
      )}

      {student.recentMistakes?.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#46505f', marginBottom: 9 }}>Recent mistakes to coach</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {student.recentMistakes.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#46505f' }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#c8472f', background: '#fdeeea', padding: '2px 7px', borderRadius: 5 }}>{m.count}×</span>
                {m.text}
              </div>
            ))}
          </div>
        </>
      )}

      {student.lastNote && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#46505f', marginBottom: 9 }}>Your last note</div>
          <div style={{ fontSize: 13, color: '#5a6675', lineHeight: 1.55, fontStyle: 'italic', borderLeft: '3px solid #e7eaef', paddingLeft: 12, marginBottom: 20 }}>
            "{student.lastNote}"
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onStartSession} style={emeraldCTAStyle}>Start session</button>
        <button
          type="button"
          onClick={onOpenNotes}
          style={{ textAlign: 'center', background: '#f0f2f5', color: '#46505f', borderRadius: 11, padding: '12px 16px', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: FONT }}
        >
          Notes
        </button>
      </div>
    </div>
  );
}

export default function TutorHome() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Today');

  const load = () => {
    setError(null);
    setData(null);
    tutorAPI.home().then((r) => setData(r.data)).catch((e) => setError(e.response?.data?.error || 'Could not load.'));
  };
  useEffect(() => { load(); }, []);

  if (error) return (
    <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#d8694f', marginBottom: 8 }}>{error}</div>
        <button type="button" onClick={load} style={emeraldCTAStyle}>Retry</button>
      </div>
    </div>
  );
  if (!data) return <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
  const students = data.students || data.attention || [];
  const studentCount = data.studentCount || students.length;
  const sessionsToday = data.sessionsToday || 0;
  const prepStudent = data.nextSession || (students[0] ? {
    name: students[0].name,
    level: students[0].level || 'P5',
    focus: students[0].weakestSkill ? { skill: students[0].weakestSkill, note: 'Needs review' } : null,
    recentMistakes: [],
    lastNote: null,
  } : null);

  const getStudentStatus = (s) => {
    if (s.status === 'on_track' || s.trend === 'up') return { bg: '#e7f3ec', fg: '#1f8a5b', text: `On track${s.trend ? ` · +${s.trend}` : ''}`, icon: <Check style={{ width: 13, height: 13 }} /> };
    if (s.status === 'needs_review' || s.flagged) return { bg: '#fdeeea', fg: '#c8472f', text: s.reason || `${s.weakestSkill} · needs review`, icon: <AlertCircle style={{ width: 13, height: 13 }} /> };
    if (s.status === 'missed') return { bg: '#fef3ed', fg: '#b06f1f', text: 'Missed last session', icon: <AlertCircle style={{ width: 13, height: 13 }} /> };
    return { bg: '#f5f6f8', fg: '#6b7585', text: s.weakestSkill || 'Building up', icon: null };
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 44px' }}>
        <div style={shellStyle}>
          {/* Nav */}
          <div style={navStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(150deg, #39b07e, #1f8a5b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17, boxShadow: '0 2px 6px rgba(31,138,91,0.4)' }}>T</div>
                <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>TianOS</span>
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#1f8a5b', background: '#e7f3ec', border: '1px solid #c7e6d4', padding: '3px 7px', borderRadius: 6 }}>TUTOR</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {['Today', 'Students', 'Sessions', 'Notes'].map((tab) => (
                  <NavTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1f8a5b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {initials(data.tutorName || 'Tutor')}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{data.tutorName || 'Tutor'}</span>
            </div>
          </div>

          <div style={{ padding: '24px 30px 30px', display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 20, alignItems: 'start' }}>
            {/* Caseload */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.01em' }}>My students</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: '#8a93a3', marginTop: 2 }}>
                    {studentCount} active · {sessionsToday} session{sessionsToday !== 1 ? 's' : ''} today
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fff', border: '1px solid #e2e6ec', borderRadius: 11,
                  padding: '9px 13px', fontSize: 13.5, fontWeight: 600, color: '#46505f',
                  cursor: 'pointer',
                }}>
                  <Search style={{ width: 15, height: 15, color: '#8a93a3' }} />
                  Search
                </div>
              </div>

              {/* Certification banner */}
              {data.certificationStatus && data.certificationStatus !== 'approved' && (
                <Link to="/tutor/training" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 14 }}>
                  <div style={{
                    ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    borderLeft: '4px solid #d9892e',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <GraduationCap style={{ width: 18, height: 18, color: '#b06f1f' }} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Certification: {CERT_LABEL[data.certificationStatus]}</div>
                        <div style={{ fontSize: 12.5, color: '#8a93a3', marginTop: 1 }}>Continue training to unlock more levels.</div>
                      </div>
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, color: '#c2c8d0' }} />
                  </div>
                </Link>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {students.map((s, i) => {
                  const st = getStudentStatus(s);
                  return (
                    <StudentCard
                      key={s.studentId || i}
                      name={s.name}
                      initials={initials(s.name)}
                      level={s.level || 'P5'}
                      schedule={s.schedule}
                      statusBg={st.bg}
                      statusFg={st.fg}
                      statusText={st.text}
                      statusIcon={st.icon}
                      onClick={() => navigate(`/tutor/students/${s.studentId}`)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Session prep */}
            <SessionPrepPanel
              student={prepStudent}
              onStartSession={() => {
                const id = prepStudent?.studentId || students[0]?.studentId;
                if (id) navigate(`/tutor/students/${id}/session`);
              }}
              onOpenNotes={() => {
                const id = prepStudent?.studentId || students[0]?.studentId;
                if (id) navigate(`/tutor/students/${id}/notes`);
              }}
            />
          </div>
        </div>

        {/* Recent notes */}
        {data.recentNotes?.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a93a3', marginBottom: 10, paddingLeft: 4 }}>Recent lesson notes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.recentNotes.map((n) => (
                <div key={n.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText style={{ width: 16, height: 16, color: '#c2c8d0', flex: '0 0 auto' }} />
                  <span style={{ flex: 1, fontSize: 14, color: '#46505f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.covered || 'Lesson note'}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: '#aab2bf' }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
