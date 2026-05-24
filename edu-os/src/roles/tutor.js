// roles/tutor.js — Tutor dashboard. Efficiency, less admin, better teaching.
import * as S from '../store.js';
import * as AI from '../ai.js';
import * as U from '../ui.js';
import { icon } from '../icons.js';
import { topicsOf } from '../data.js';

export const nav = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'students', label: 'Students', icon: 'users' },
  { id: 'insights', label: 'Insights', icon: 'sparkles' },
  { id: 'earnings', label: 'Earnings', icon: 'dollar' },
];

export function render(tab, param) {
  const t = S.tutor(S.user().id);
  if (!t) return '<div class="card">No tutor profile for this session.</div>';
  if (tab === 'students') return param ? studentDetail(t, param) : students(t);
  if (tab === 'insights') return insights(t);
  if (tab === 'earnings') return earnings(t);
  return home(t);
}

const upcoming = (t) => S.lessonsByTutor(t.id).filter((l) => l.status === 'scheduled' || l.status === 'pending-confirm');

// ---------------- Home ----------------
function home(t) {
  const roster = S.studentsOfTutor(t.id);
  const ins = AI.tutorInsights(t.id);
  const up = upcoming(t);
  const pending = up.filter((l) => l.status === 'pending-confirm');
  return `<div class="pagehead"><h1>Hi ${t.name} 👋</h1><p>${roster.length} students · ${up.length} sessions this week.</p></div>
  <div class="stack">
    <div class="stats">
      ${U.statTile('users', 'brand', roster.length, 'Students')}
      ${U.statTile('calendar', 'info', up.length, 'Upcoming')}
      ${U.statTile('alert', ins.risks.length ? 'warn' : 'ok', ins.risks.length, 'At risk')}
      ${U.statTile('dollar', 'ok', U.money(t.earningsMonth), 'This month')}
    </div>

    ${pending.length ? `<div class="card" style="border-color:var(--warn)">
      ${U.cardHead('clock', 'Awaiting your confirmation')}
      <div class="stack-sm">${pending.map((l) => lessonRow(l, true)).join('')}</div>
    </div>` : ''}

    <div class="card">${U.cardHead('calendar', 'Upcoming sessions', { link: 'Earnings', linkGo: '#/tutor/earnings' })}
      ${up.length ? `<div class="list">${up.map((l) => lessonRow(l)).join('')}</div>` : '<p class="sm muted">No sessions scheduled.</p>'}
    </div>

    ${ins.risks.length ? `<div class="ai"><div class="ai-h">${icon('sparkles')} Teaching insight</div>
      ${ins.risks.slice(0, 2).map((r) => U.recoRow({ icon: 'alert', tone: 'warn', title: `${r.name} needs attention`, desc: r.reason, action: { act: 'nav', go: `#/tutor/students/${r.studentId}` } })).join('')}
    </div>` : ''}
  </div>`;
}
function lessonRow(l, confirm = false) {
  const s = S.student(l.studentId); const su = S.subject(l.subjectId);
  return `<div class="rowitem ${confirm ? 'plain' : ''}" ${confirm ? '' : `data-act="nav" data-go="#/tutor/students/${l.studentId}"`}>
    ${U.avatar(s.name, 36)}
    <div class="grow"><div class="t">${s.name}</div><div class="d">${su.name} · ${S.fmtDate(l.date)}${l.status === 'pending-confirm' ? ' · needs confirm' : ''}</div></div>
    ${confirm ? `<button class="btn primary sm" data-act="confirm-lesson" data-lesson="${l.id}">Confirm</button>` : `<span class="chev">${icon('right')}</span>`}
  </div>`;
}

// ---------------- Students roster ----------------
function students(t) {
  const roster = S.studentsOfTutor(t.id);
  return `<div class="pagehead"><h1>My students</h1><p>Progress, weak topics and schedules at a glance.</p></div>
  <div class="content-grid">
    ${roster.map((s) => {
      const subj = Object.keys(s.tutors).find((k) => s.tutors[k] === t.id);
      const m = S.subjectMastery(s.id, subj); const weak = AI.weakTopics(s.id).length;
      return `<div class="card tap" data-act="nav" data-go="#/tutor/students/${s.id}">
        <div class="row" style="margin-bottom:10px">${U.avatar(s.name, 44)}<div class="grow"><h3>${s.name}</h3><div class="sm muted">${s.level} · ${S.subject(subj).name}</div></div>${U.ring(m.pct, { size: 50, color: S.subject(subj).color })}</div>
        <div class="row between sm"><span class="badge ${weak ? 'b-warn' : 'b-ok'}">${weak ? `${weak} weak topics` : 'On track'}</span><span class="muted">🔥 ${s.streak}-day streak</span></div>
      </div>`;
    }).join('')}
  </div>`;
}

function studentDetail(t, studentId) {
  const s = S.student(studentId);
  if (!s) return `<div class="card">Student not found.</div>`;
  const subj = Object.keys(s.tutors).find((k) => s.tutors[k] === t.id) || s.subjects[0];
  const m = S.subjectMastery(s.id, subj); const rc = AI.revisionConsistency(s.id);
  const weak = AI.weakTopics(s.id, 4);
  const lessons = S.lessonsByTutor(t.id).filter((l) => l.studentId === s.id);
  return `
  <a class="link" href="#/tutor/students" style="margin-bottom:10px">${icon('left')} Students</a>
  <div class="stack">
    <div class="card">
      <div class="row" style="gap:12px">${U.avatar(s.name, 56)}<div class="grow"><h2 style="font-size:18px">${s.name}</h2><div class="sm muted">${s.level} · ${S.subject(subj).name}</div></div>${U.ring(m.pct, { size: 58, color: S.subject(subj).color })}</div>
      <div class="row" style="gap:10px;margin-top:12px">
        <button class="btn primary grow" data-act="open-report" data-tutor="${t.id}" data-student="${s.id}">${icon('upload')} Lesson summary</button>
        <button class="btn" data-act="soon">${icon('message')} Message</button>
      </div>
    </div>

    <div class="card">${U.cardHead('alert', 'Weak topics — plan your lesson')}
      ${weak.length ? `<div class="list">${weak.map((w) => `<div class="rowitem plain"><div class="lead" style="background:var(--warn-soft);color:#b45309">${icon('target')}</div><div class="grow"><div class="t">${w.name}</div><div class="d">${w.subject} · ${w.accuracy}%</div></div>${U.badge(w.status)}</div>`).join('')}</div>` : '<p class="sm muted">No weak topics flagged.</p>'}
    </div>

    <div class="card">${U.cardHead('bolt', 'App engagement', { sub: 'Independent revision in MathPath' })}
      <div class="row between sm"><span class="muted">This week</span><b>${rc.minutesWeek} min · ${rc.activeDays}/7 days</b></div>
      <div style="margin-top:10px">${weekBars(rc.series)}</div>
    </div>

    <div class="card">${U.cardHead('clipboard', 'Lesson history')}
      ${lessons.length ? `<div class="list">${lessons.map(lhist).join('')}</div>` : '<p class="sm muted">No lessons yet.</p>'}
    </div>
  </div>`;
}
function lhist(l) {
  const su = S.subject(l.subjectId);
  const st = { completed: 'b-ok', scheduled: 'b-info', 'pending-confirm': 'b-warn' }[l.status] || 'b-mute';
  return `<div class="rowitem plain"><div class="grow"><div class="t" style="font-size:14px">${su.name} · ${S.fmtDate(l.date)}</div>${l.summary ? `<div class="d">${U.esc(l.summary)}</div>` : `<div class="d">No summary</div>`}</div><span class="badge ${st}">${l.status.replace('-', ' ')}</span></div>`;
}

// ---------------- AI Insights ----------------
function insights(t) {
  const ins = AI.tutorInsights(t.id);
  return `<div class="pagehead"><h1>Teaching insights</h1><p>Patterns across your ${ins.count} students, surfaced by AI.</p></div>
  <div class="stack">
    <div class="card">${U.cardHead('layers', 'Recurring weak concepts', { sub: 'Worth a group recap' })}
      ${ins.recurring.length ? `<div class="stack-sm">${ins.recurring.map((c) => `<div class="row between"><div><b class="sm">${c.name}</b><div class="tiny faint">${c.subject}</div></div><span class="badge ${c.count > 1 ? 'b-warn' : 'b-mute'}">${c.count} student${c.count > 1 ? 's' : ''}</span></div>`).join('')}</div>` : '<p class="sm muted">No recurring gaps — nice work.</p>'}
    </div>
    <div class="card">${U.cardHead('alert', 'Student risk alerts')}
      ${ins.risks.length ? `<div class="list">${ins.risks.map((r) => `<div class="rowitem" data-act="nav" data-go="#/tutor/students/${r.studentId}"><div class="lead" style="background:var(--bad-soft);color:#b91c1c">${icon('alert')}</div><div class="grow"><div class="t">${r.name}</div><div class="d">${r.reason}</div></div><span class="chev">${icon('right')}</span></div>`).join('')}</div>` : '<p class="sm muted">All students on track.</p>'}
    </div>
    <div class="ai"><div class="ai-h">${icon('sparkles')} Suggested worksheets</div>
      ${ins.suggested.length ? ins.suggested.map((sg) => U.recoRow({ icon: 'clipboard', tone: 'brand', title: `${sg.topic} for ${sg.name}`, desc: `${sg.subject} · assign a remediation set before the next lesson`, action: { act: 'nav', go: `#/tutor/students/${sg.studentId}` } })).join('') : '<p class="sm muted">Nothing to assign right now.</p>'}
    </div>
  </div>`;
}

// ---------------- Earnings & operations ----------------
function earnings(t) {
  const up = upcoming(t);
  return `<div class="pagehead"><h1>Earnings & sessions</h1><p>Payouts, schedule and confirmations.</p></div>
  <div class="stack">
    <div class="card hero"><div class="faint sm">This month</div><h2 style="font-size:26px">${U.money(t.earningsMonth)}</h2><div class="faint sm" style="margin-top:3px">${up.length} sessions upcoming · $${t.rate}/hr</div></div>
    <div class="card">${U.cardHead('calendar', 'Upcoming & confirmations')}
      ${up.length ? `<div class="stack-sm">${up.map((l) => lessonRow(l, l.status === 'pending-confirm')).join('')}</div>` : '<p class="sm muted">No upcoming sessions.</p>'}
    </div>
    <div class="card">${U.cardHead('swap', 'Replacement requests')}
      <div class="empty" style="padding:12px"><p class="muted sm" style="margin:0">No replacement requests. We'll route any here if you're unavailable.</p></div>
    </div>
  </div>`;
}
function weekBars(series) {
  const max = Math.max(...series, 1); const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return `<div class="row" style="gap:6px;align-items:flex-end;height:54px">${series.map((m, i) => `<div class="grow" style="text-align:center"><div style="height:42px;display:flex;align-items:flex-end"><div style="width:100%;height:${Math.max(6, (m / max) * 42)}px;border-radius:6px;background:${m ? 'var(--grad)' : 'var(--line)'}"></div></div><div class="tiny faint" style="margin-top:3px">${days[i]}</div></div>`).join('')}</div>`;
}
