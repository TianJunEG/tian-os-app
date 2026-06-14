import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Check, ChevronRight, FileText, GraduationCap, Search } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import { Spinner } from '../../components/ui';

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
      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border-none cursor-pointer font-sans ${
        active
          ? 'bg-emerald-50 text-emerald-800 font-semibold'
          : 'bg-transparent text-slate-500'
      }`}
    >
      {label}
    </button>
  );
}

function StudentCard({ name, initials, level, schedule, statusBg, statusFg, statusText, statusIcon, onClick }) {
  const avatarClasses = {
    '#e7f3ec': 'bg-emerald-50 text-emerald-600',
    '#fdeeea': 'bg-rose-100 text-rose-600',
    '#eaf3fc': 'bg-sky-100 text-sky-600',
    '#f5f6f8': 'bg-slate-100 text-slate-500',
  };
  const pillClasses = {
    '#fdeeea': 'bg-rose-50 text-rose-600',
    '#eaf3fc': 'bg-sky-50 text-sky-600',
    '#e7f3ec': 'bg-emerald-50 text-emerald-700',
  };
  const avatarCls = avatarClasses[statusBg] || 'bg-emerald-50 text-emerald-600';
  const pillCls = pillClasses[statusBg] || 'bg-slate-100 text-slate-500';

  return (
    <div
      className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-resting cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`flex h-[38px] w-[38px] items-center justify-center rounded-full text-xs font-bold ${avatarCls}`}>
          {initials}
        </div>
        <div>
          <div className="text-sm font-bold text-ink-900">{name}</div>
          <div className="font-mono text-[11px] text-slate-400">{level}{schedule ? ` · ${schedule}` : ''}</div>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${pillCls}`}>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-resting">
      <div className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-emerald-600">
        Next session{student.nextTime ? ` · ${student.nextTime}` : ''}
      </div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-emerald-50 text-base font-bold text-emerald-600">{initials}</div>
        <div>
          <div className="text-lg font-extrabold text-ink-900">{student.name}</div>
          <div className="text-sm text-slate-400">{student.level}{student.sessionCount ? ` · ${student.sessionCount} session` : ''}</div>
        </div>
      </div>

      {student.focus && (
        <>
          <div className="mb-2 text-sm font-bold text-ink-600">Focus on</div>
          <div className="mb-4 flex items-start gap-2.5 rounded-[11px] border border-sunshine-200 bg-sunshine-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-[17px] w-[17px] flex-shrink-0 text-sunshine-700" />
            <div>
              <div className="text-sm font-bold text-ink-900">{student.focus.skill}</div>
              <div className="mt-0.5 text-sm leading-relaxed text-sunshine-700">{student.focus.note}</div>
            </div>
          </div>
        </>
      )}

      {student.recentMistakes?.length > 0 && (
        <>
          <div className="mb-2 text-sm font-bold text-ink-600">Recent mistakes to coach</div>
          <div className="mb-4 flex flex-col gap-2">
            {student.recentMistakes.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-ink-600">
                <span className="rounded bg-rose-100 px-1.5 py-0.5 font-mono text-[11px] text-rose-600">{m.count}×</span>
                {m.text}
              </div>
            ))}
          </div>
        </>
      )}

      {student.lastNote && (
        <>
          <div className="mb-2 text-sm font-bold text-ink-600">Your last note</div>
          <div className="mb-5 border-l-[3px] border-slate-200 pl-3 text-sm italic leading-relaxed text-slate-500">
            &ldquo;{student.lastNote}&rdquo;
          </div>
        </>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onStartSession}
          className="flex-1 rounded-[11px] border-none bg-emerald-600 px-3 py-3 text-center text-sm font-bold text-white shadow-md cursor-pointer"
        >
          Start session
        </button>
        <button
          type="button"
          onClick={onOpenNotes}
          className="rounded-[11px] border-none bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-ink-600 cursor-pointer"
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 font-sans text-ink-900">
      <div className="text-center">
        <div className="mb-2 text-base font-bold text-rose-500">{error}</div>
        <button
          type="button"
          onClick={load}
          className="rounded-[11px] border-none bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md cursor-pointer"
        >
          Retry
        </button>
      </div>
    </div>
  );
  if (!data) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;

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
    if (s.status === 'on_track' || s.trend === 'up') return { bg: '#e7f3ec', fg: '#1f8a5b', text: `On track${s.trend ? ` · +${s.trend}` : ''}`, icon: <Check className="h-3.5 w-3.5" /> };
    if (s.status === 'needs_review' || s.flagged) return { bg: '#fdeeea', fg: '#c8472f', text: s.reason || `${s.weakestSkill} · needs review`, icon: <AlertCircle className="h-3.5 w-3.5" /> };
    if (s.status === 'missed') return { bg: '#fef3ed', fg: '#b06f1f', text: 'Missed last session', icon: <AlertCircle className="h-3.5 w-3.5" /> };
    return { bg: '#f5f6f8', fg: '#6b7585', text: s.weakestSkill || 'Building up', icon: null };
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24 font-sans text-ink-900" style={{ backgroundImage: 'radial-gradient(#d3d8e0 1px, transparent 1.4px)', backgroundSize: '26px 26px' }}>
      <div className="mx-auto max-w-[1360px] px-11">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-active">
          {/* Nav */}
          <div className="flex h-[54px] items-center justify-between border-b border-slate-200 bg-white px-5">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-emerald-400 to-emerald-600 text-[17px] font-extrabold text-white shadow-md">T</div>
                <span className="text-lg font-extrabold tracking-tight">TianOS</span>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-emerald-600">TUTOR</span>
              </div>
              <div className="flex items-center gap-1">
                {['Today', 'Students', 'Sessions', 'Notes'].map((tab) => (
                  <NavTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {initials(data.tutorName || 'Tutor')}
              </div>
              <span className="text-sm font-semibold">{data.tutorName || 'Tutor'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-5 p-7 lg:grid-cols-[1.35fr_1fr]">
            {/* Caseload */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xl font-extrabold tracking-tight">My students</div>
                  <div className="mt-0.5 font-mono text-sm text-slate-400">
                    {studentCount} active · {sessionsToday} session{sessionsToday !== 1 ? 's' : ''} today
                  </div>
                </div>
                <div className="flex cursor-pointer items-center gap-2 rounded-[11px] border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-600">
                  <Search className="h-4 w-4 text-slate-400" />
                  Search
                </div>
              </div>

              {/* Certification banner */}
              {data.certificationStatus && data.certificationStatus !== 'approved' && (
                <Link to="/tutor/training" className="mb-3.5 block text-inherit no-underline">
                  <div className="flex items-center justify-between gap-3 rounded-[14px] border border-slate-200 border-l-4 border-l-sunshine-500 bg-white p-4 shadow-resting">
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="h-[18px] w-[18px] text-sunshine-700" />
                      <div>
                        <div className="text-sm font-bold">Certification: {CERT_LABEL[data.certificationStatus]}</div>
                        <div className="mt-0.5 text-xs text-slate-400">Continue training to unlock more levels.</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </Link>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div className="mt-6">
            <div className="mb-2.5 pl-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">Recent lesson notes</div>
            <div className="flex flex-col gap-2">
              {data.recentNotes.map((n) => (
                <div key={n.id} className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white p-4 shadow-resting">
                  <FileText className="h-4 w-4 flex-shrink-0 text-slate-300" />
                  <span className="flex-1 truncate text-sm text-ink-600">
                    {n.covered || 'Lesson note'}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
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
