import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Spinner, CollapsibleSection } from '../../components/ui';

const FONT = "'Hanken Grotesk', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const cardStyle = {
  background: '#fff',
  border: '1px solid #e7eaef',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(30,42,66,0.05)',
  padding: '20px 22px',
};

function KPICard({ label, value, suffix, color, barPct, barColor }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a93a3' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: color || '#232c39' }}>{value}</span>
        {suffix && <span style={{ fontSize: 14, fontWeight: 600, color: '#8a93a3' }}>{suffix}</span>}
      </div>
      {barPct != null && (
        <div style={{ height: 7, borderRadius: 5, background: '#eef0f3', marginTop: 12, overflow: 'hidden' }}>
          <div style={{ width: `${barPct}%`, height: '100%', background: barColor || '#1f8a5b' }} />
        </div>
      )}
    </div>
  );
}

function SkillBar({ name, pct }) {
  const color = pct < 50 ? '#d8694f' : pct < 70 ? '#e3a64f' : '#1f8a5b';
  const monoColor = pct < 50 ? '#c8472f' : pct < 70 ? '#b06f1f' : '#1f8a5b';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13.5, color: '#46505f', fontWeight: 600 }}>{name}</span>
        <span style={{ fontFamily: MONO, fontSize: 12.5, color: monoColor, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 9, borderRadius: 6, background: '#eef0f3', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
}

export default function ClassOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useClass(id);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => { setLoadError(false); setData(null); teacherAPI.classOverview(id).then((r) => setData(r.data)).catch(() => setLoadError(true)); };
  useEffect(() => { load(); }, [id]);

  if (loadError) return (
    <div style={{ fontFamily: FONT, textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#d8694f', marginBottom: 12 }}>Couldn't load class overview.</div>
      <button type="button" onClick={load} style={{ background: '#d9892e', color: '#fff', borderRadius: 11, padding: '10px 20px', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: FONT }}>Retry</button>
    </div>
  );
  if (!data) return <Spinner />;

  return (
    <div style={{ fontFamily: FONT }}>
      <ClassNav classId={id} name={meta?.name || data.class.name} level={meta?.level || data.class.level} />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <KPICard label="Overall mastery" value={data.overallMastery} suffix="%" barPct={data.overallMastery} />
        <KPICard label="Students" value={data.studentCount} />
        <KPICard
          label="Need support"
          value={data.studentsNeedingSupport.length}
          color={data.studentsNeedingSupport.length > 0 ? '#c8472f' : undefined}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(`/teacher/classes/${id}/weak-groups`)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#d9892e', borderRadius: 11, padding: '10px 17px', color: '#fff', fontWeight: 700, fontSize: 14, boxShadow: '0 2px 8px rgba(217,137,46,0.35)', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
          Open weak groups <ArrowRight style={{ width: 14, height: 14 }} />
        </button>
        <button type="button" onClick={() => navigate(`/teacher/classes/${id}/interventions`)} style={{ background: '#f0f2f5', color: '#46505f', borderRadius: 11, padding: '10px 15px', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: FONT }}>Intervention overview</button>
        <button type="button" onClick={() => navigate(`/teacher/classes/${id}/mathpath`)} style={{ background: '#f0f2f5', color: '#46505f', borderRadius: 11, padding: '10px 15px', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: FONT }}>MathPath dashboard</button>
      </div>

      {/* Mastery + attention */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Top weak topics</div>
            <span style={{ fontFamily: MONO, fontSize: 12, color: '#8a93a3' }}>{data.topWeakTopics.length} topics</span>
          </div>
          {data.topWeakTopics.length === 0 ? (
            <div style={{ fontSize: 14, color: '#8a93a3' }}>No data yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.topWeakTopics.map((t) => (
                <SkillBar key={t.topic} name={t.topic} pct={t.avg} />
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Need support</div>
            {data.studentsNeedingSupport.length > 0 && (
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#c8472f', background: '#fdeeea', padding: '3px 8px', borderRadius: 6 }}>{data.studentsNeedingSupport.length}</span>
            )}
          </div>
          {data.studentsNeedingSupport.length === 0 ? (
            <div style={{ fontSize: 14, color: '#8a93a3' }}>None right now.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {data.studentsNeedingSupport.map((s, i) => (
                <React.Fragment key={s.studentId}>
                  {i > 0 && <div style={{ height: 1, background: '#f0f2f5' }} />}
                  <Link to={`/teacher/students/${s.studentId}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fdeeea', color: '#c8472f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                      {s.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#232c39' }}>{s.name}</span>
                  </Link>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.science?.available && (
        <CollapsibleSection
          title="Science Adaptive Revision"
          summary={data.science.attemptedCount === 0 ? 'No students have started yet.' : `${data.science.attemptedCount}/${data.studentCount} students started`}
          className="mt-5"
        >
          {data.science.attemptedCount === 0 ? (
            <p className="text-sm text-ink-500">No students in this class have started Science Adaptive Revision yet.</p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                <KPICard label="Class mastery" value={data.science.overallMastery} suffix="%" barPct={data.science.overallMastery} />
                <KPICard label="Students started" value={`${data.science.attemptedCount} / ${data.studentCount}`} />
                <KPICard label="Need support" value={data.science.needsSupport.length} color={data.science.needsSupport.length > 0 ? '#c8472f' : undefined} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Top weak Science topics</div>
                  {data.science.topWeakTopics.length === 0 ? <div style={{ fontSize: 14, color: '#8a93a3' }}>No data yet.</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {data.science.topWeakTopics.map((t) => <SkillBar key={t.topic} name={t.topic} pct={t.avg} />)}
                    </div>
                  )}
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Students needing Science support</div>
                  {data.science.needsSupport.length === 0 ? <div style={{ fontSize: 14, color: '#8a93a3' }}>None right now.</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {data.science.needsSupport.map((s) => (
                        <Link key={s.studentId} to={`/teacher/students/${s.studentId}`} style={{ textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#232c39' }}>{s.name}</Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
}
