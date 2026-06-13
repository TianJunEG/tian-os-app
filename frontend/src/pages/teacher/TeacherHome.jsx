import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ChevronRight, Plus, Search } from 'lucide-react';
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
};

const goldCTAStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#d9892e',
  borderRadius: 11,
  padding: '10px 17px',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  boxShadow: '0 2px 8px rgba(217,137,46,0.35)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: FONT,
};

function NavTab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 13px',
        borderRadius: 8,
        background: active ? '#eef0f4' : 'transparent',
        color: active ? '#232c39' : '#6b7585',
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

function KPICard({ label, value, suffix, delta, deltaColor, bar, barColor, borderColor, children }) {
  return (
    <div style={{ ...cardStyle, padding: '18px 20px', border: borderColor ? `1px solid ${borderColor}` : cardStyle.border }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: deltaColor || '#8a93a3' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: deltaColor && deltaColor !== '#8a93a3' ? deltaColor : '#232c39' }}>{value}</span>
        {suffix && <span style={{ fontSize: 13, color: '#8a93a3' }}>{suffix}</span>}
        {delta && <span style={{ fontSize: 12.5, fontWeight: 600, color: deltaColor || '#1f8a5b' }}>{delta}</span>}
      </div>
      {bar != null && (
        <div style={{ height: 7, borderRadius: 5, background: '#eef0f3', marginTop: 12, overflow: 'hidden' }}>
          <div style={{ width: `${bar}%`, height: '100%', background: barColor || '#1f8a5b' }} />
        </div>
      )}
      {children}
    </div>
  );
}

function MasteryBar({ label, pct }) {
  const color = pct >= 70 ? '#1f8a5b' : pct >= 55 ? '#e3a64f' : '#d8694f';
  const textColor = pct >= 70 ? '#1f8a5b' : pct >= 55 ? '#b06f1f' : '#c8472f';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13.5, color: '#46505f', fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 12.5, color: textColor, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 9, borderRadius: 6, background: '#eef0f3', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
}

function AvatarStack({ items, max = 4 }) {
  const shown = items.slice(0, max);
  const extra = items.length - max;
  return (
    <div style={{ display: 'flex' }}>
      {shown.map((item, i) => (
        <span key={i} style={{
          width: 24, height: 24, borderRadius: '50%',
          background: item.bg || '#fdeeea', border: '1.5px solid #fff',
          color: item.fg || '#c8472f', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: i > 0 ? -8 : 0,
        }}>{item.initials}</span>
      ))}
      {extra > 0 && (
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: '#eef0f3', border: '1.5px solid #fff',
          color: '#8a93a3', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: -8,
        }}>+{extra}</span>
      )}
    </div>
  );
}

function AttentionRow({ name, initials, detail, bg, fg, onClick }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }} onClick={onClick}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: bg || '#fdeeea', color: fg || '#c8472f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 12.5, color: '#c8472f' }}>{detail}</div>
      </div>
      <ChevronRight style={{ width: 16, height: 16, color: '#c2c8d0' }} />
    </div>
  );
}

function MistakeCard({ count, title, context, severity }) {
  const countColor = severity === 'high' ? '#c8472f' : '#b06f1f';
  return (
    <div style={{ border: '1px solid #eef0f3', borderRadius: 12, padding: '14px 16px', background: '#fbfbfc' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: countColor, marginBottom: 7 }}>{count} STUDENTS</div>
      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: '#8a93a3', marginTop: 6 }}>{context}</div>
    </div>
  );
}

export default function TeacherHome() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  const load = () => {
    setLoadError(false);
    setData(null);
    teacherAPI.home().then((r) => setData(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, []);

  if (loadError) return (
    <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#d8694f', marginBottom: 8 }}>Couldn't load Teacher dashboard.</div>
        <button type="button" onClick={load} style={{ ...goldCTAStyle, margin: '0 auto' }}>Retry</button>
      </div>
    </div>
  );
  if (!data) return <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;

  const classCount = data.classCount || 0;
  const attentionCount = data.attention?.length || 0;
  const mastery = data.classMastery || 0;
  const activeCount = data.activeThisWeek || 0;
  const totalStudents = data.totalStudents || 32;
  const avgTime = data.avgTimePerDay || '22m';
  const attentionStudents = data.attention || [];
  const mistakePatterns = data.commonMistakes || [];
  const masteryBySkill = data.masteryBySkill || [];

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

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
                {['Overview', 'Students', 'Skills', 'Mistakes', 'Assignments'].map((tab) => (
                  <NavTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#3a4a63', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {initials(data.teacherName || 'Teacher')}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{data.teacherName || 'Teacher'}</span>
            </div>
          </div>

          <div style={{ padding: '24px 30px 30px' }}>
            {/* Class row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-0.01em' }}>
                  {data.className || `${classCount} Class${classCount !== 1 ? 'es' : ''}`}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: '#8a93a3', marginTop: 3 }}>
                  {totalStudents} students · updated recently
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" style={goldCTAStyle} onClick={() => navigate('/teacher/assignments/new')}>
                  <Plus style={{ width: 16, height: 16 }} />
                  Assign work
                </button>
              </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
              <KPICard label="Class mastery" value={`${mastery}%`} bar={mastery} barColor="#1f8a5b" />
              <KPICard label="Needs attention" value={attentionCount} suffix="flagged" borderColor="#f3cabf" deltaColor="#d8694f">
                {attentionStudents.length > 0 && (
                  <div style={{ marginTop: 13 }}>
                    <AvatarStack items={attentionStudents.map((s) => ({ initials: initials(s.name), bg: '#fdeeea', fg: '#c8472f' }))} />
                  </div>
                )}
              </KPICard>
              <KPICard label="Active this week" value={activeCount} suffix={`/ ${totalStudents}`} bar={Math.round(activeCount / totalStudents * 100)} barColor="#2f80d8" />
              <KPICard label="Avg time / day" value={avgTime}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 22, marginTop: 11 }}>
                  {[12, 18, 14, 20, 16].map((h, i) => (
                    <span key={i} style={{ flex: 1, height: h, background: h >= 18 ? '#e3a64f' : '#f1d6a3', borderRadius: 3 }} />
                  ))}
                </div>
              </KPICard>
            </div>

            {/* Mastery + Attention */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ ...cardStyle, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Mastery by skill</div>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: '#8a93a3' }}>
                    {masteryBySkill.length || 5} strands
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(masteryBySkill.length > 0 ? masteryBySkill : [
                    { label: 'Number sense', pct: 81 },
                    { label: 'Measurement', pct: 73 },
                    { label: 'Multiplication & division', pct: 68 },
                    { label: 'Fractions', pct: 52 },
                    { label: 'Ratio & proportion', pct: 44 },
                  ]).map((skill) => (
                    <MasteryBar key={skill.label} label={skill.label} pct={skill.pct} />
                  ))}
                </div>
              </div>

              <div style={{ ...cardStyle, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Needs attention</div>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: '#c8472f', background: '#fdeeea', padding: '3px 8px', borderRadius: 6 }}>{attentionCount}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {attentionStudents.length === 0 ? (
                    <div style={{ fontSize: 14, color: '#8a93a3', padding: 12 }}>No urgent needs today.</div>
                  ) : (
                    attentionStudents.slice(0, 4).map((s, i) => (
                      <React.Fragment key={s.studentId || i}>
                        {i > 0 && <div style={{ height: 1, background: '#f0f2f5' }} />}
                        <AttentionRow
                          name={s.name}
                          initials={initials(s.name)}
                          detail={s.reason || s.weakestSkill || 'Needs review'}
                          onClick={() => navigate(`/teacher/students/${s.studentId || s.classId}`)}
                        />
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Common mistakes */}
            <div style={{ ...cardStyle, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Common mistakes this week</div>
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#2f80d8', cursor: 'pointer' }}>View all →</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {(mistakePatterns.length > 0 ? mistakePatterns : [
                  { count: 14, title: 'Adds numerators & denominators directly', context: 'Fractions · addition', severity: 'high' },
                  { count: 9, title: 'Misreads remainder as decimal', context: 'Division · long division', severity: 'high' },
                  { count: 7, title: 'Drops units when scaling ratios', context: 'Ratio · word problems', severity: 'medium' },
                ]).map((m, i) => (
                  <MistakeCard key={i} count={m.count} title={m.title} context={m.context} severity={m.severity || 'medium'} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
