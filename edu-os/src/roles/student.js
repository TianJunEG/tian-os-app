// roles/student.js — Student dashboard. Motivating, focused, reduces overwhelm.
import * as S from '../store.js';
import * as AI from '../ai.js';
import * as U from '../ui.js';
import { icon } from '../icons.js';
import { topicsOf } from '../data.js';

export const nav = [
  { id: 'home', label: 'Today', icon: 'home' },
  { id: 'subjects', label: 'Subjects', icon: 'grid' },
  { id: 'planner', label: 'Plan', icon: 'calendar' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
];

export function render(tab, param) {
  const me = S.student(S.user().id);
  if (!me) return '<div class="card">No student profile for this session.</div>';
  if (tab === 'subjects') return param ? subjectMap(me, param) : subjects(me);
  if (tab === 'planner') return planner(me);
  if (tab === 'progress') return progress(me);
  return home(me);
}

const assignedWorksheet = (studentId, topicId) => S.worksheetsFor(studentId).find((w) => w.topicId === topicId && w.status === 'assigned');

// ---------------- Today ----------------
function home(me) {
  const ex = AI.examInfo();
  const tasks = AI.weakTopics(me.id, 3);
  const recos = AI.recommendationsForStudent(me.id);
  const goalPct = Math.round((me.weeklyDone / me.weeklyGoal) * 100);
  return `
  <div class="pagehead"><h1>Hey ${me.name.split(' ')[0]} 👋</h1><p>Small steps today beat cramming later.</p></div>
  <div class="stack">
    <div class="card hero">
      <div class="row between">
        <div><div class="faint sm">${ex.name}</div><h2>${ex.daysLeft} days to go</h2><div class="faint sm" style="margin-top:2px">Your plan front-loads weak topics.</div></div>
        <div class="ring-wrap" style="width:64px;height:64px"><svg class="ring" width="64" height="64"><circle class="track" cx="32" cy="32" r="26" stroke="rgba(255,255,255,.25)"></circle><circle cx="32" cy="32" r="26" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${(2 * Math.PI * 26).toFixed(0)}" stroke-dashoffset="${(2 * Math.PI * 26 * (1 - goalPct / 100)).toFixed(0)}"></circle></svg><div class="ctr"><b style="color:#fff">${me.weeklyDone}/${me.weeklyGoal}</b></div></div>
      </div>
    </div>

    <div class="card">
      ${U.cardHead('target', "Today's focus", { sub: '3 quick wins picked for you' })}
      ${tasks.length ? `<div class="stack-sm">${tasks.map((t) => taskRow(me, t)).join('')}</div>`
        : `<div class="row" style="gap:10px"><div class="lead" style="background:var(--ok-soft);color:#047857">${icon('checkCircle')}</div><div><b>You're all caught up 🎉</b><div class="sm muted">Keep your streak with a quick review.</div></div></div>`}
    </div>

    <div class="row" style="gap:12px">
      <div class="stat grow"><div class="ic" style="background:var(--warn-soft);color:#b45309">${icon('flame')}</div><div class="k">${me.streak}</div><div class="l">Day streak</div></div>
      <div class="stat grow"><div class="ic" style="background:var(--brand-soft);color:var(--brand)">${icon('layers')}</div><div class="k">${me.subjects.length}</div><div class="l">Subjects</div></div>
    </div>

    ${U.recoBlock('Your AI coach', recos)}
  </div>`;
}
function taskRow(me, t) {
  const ws = assignedWorksheet(me.id, t.topicId);
  return `<div class="rowitem plain" style="gap:10px">
    <div class="lead" style="background:var(--warn-soft);color:#b45309">${icon('target')}</div>
    <div class="grow"><div class="t">${t.name}</div><div class="d">${t.subject} · ${t.accuracy}% accuracy</div></div>
    ${ws ? `<button class="btn primary sm" data-act="open-worksheet" data-worksheet="${ws.id}">Practise</button>`
      : `<button class="btn soft sm" data-act="mark-revised" data-student="${me.id}" data-topic="${t.topicId}">Revise</button>`}
  </div>`;
}

// ---------------- Subjects hub ----------------
function subjects(me) {
  return `<div class="pagehead"><h1>Subjects</h1><p>Your MOE syllabus mastery map.</p></div>
  <div class="subjects">
    ${me.subjects.map((s) => {
      const su = S.subject(s); const m = S.subjectMastery(me.id, s);
      return U.subjectTile(su, `${m.pct}% mastered · ${m.counts['needs-revision']} to revise`, `#/student/subjects/${s}`);
    }).join('')}
  </div>`;
}

function subjectMap(me, subjectId) {
  const su = S.subject(subjectId);
  if (!su || !me.subjects.includes(subjectId)) return `<div class="card">Subject not found.</div>`;
  const m = S.subjectMastery(me.id, subjectId);
  const topics = topicsOf(subjectId);
  return `
  <a class="link" href="#/student/subjects" style="margin-bottom:10px">${icon('left')} Subjects</a>
  <div class="stack">
    <div class="card">
      <div class="row" style="gap:12px">
        <div class="si" style="width:46px;height:46px;border-radius:13px;display:grid;place-items:center;background:${U.hexSoft(su.color)};color:${su.color}">${icon(su.icon)}</div>
        <div class="grow"><h2 style="font-size:18px">${su.name}</h2><div class="sm muted">${m.counts.mastered}/${m.total} topics mastered</div></div>
        ${U.ring(m.pct, { size: 58, color: su.color })}
      </div>
      <div class="row wrap" style="gap:10px;margin-top:12px">
        ${statusKey('mastered', m.counts.mastered)} ${statusKey('learning', m.counts.learning)}
        ${statusKey('needs-revision', m.counts['needs-revision'])} ${statusKey('not-started', m.counts['not-started'])}
      </div>
    </div>

    <div class="card">
      ${U.cardHead('layers', 'Topic mastery map')}
      <div class="list">${topics.map((t) => topicRow(me, t)).join('')}</div>
    </div>

    <a class="btn primary block" href="/mathpath/?student=${me.id}&subject=${subjectId}&return=/" target="_blank" rel="noopener">${icon('play')} Practise ${su.name} in MathPath</a>

    ${tutorSupport(me, subjectId)}
  </div>`;
}
function statusKey(status, n) {
  const c = { mastered: '#10b981', learning: '#3b82f6', 'needs-revision': '#f59e0b', 'not-started': '#94a3b8' }[status];
  return `<span class="row" style="gap:5px"><span class="mkey" style="background:${c}"></span><span class="tiny faint">${n}</span></span>`;
}
function topicRow(me, t) {
  const p = S.progressFor(me.id, t.id);
  const ws = assignedWorksheet(me.id, t.id);
  const action = ws ? `<button class="btn soft sm" data-act="open-worksheet" data-worksheet="${ws.id}">Worksheet</button>`
    : (p.status === 'not-started' || p.status === 'needs-revision') ? `<button class="btn soft sm" data-act="mark-revised" data-student="${me.id}" data-topic="${t.id}">Revise</button>` : '';
  return `<div class="rowitem plain">
    <div class="grow"><div class="t" style="font-size:14px">${t.name}</div>
      <div style="margin-top:6px;max-width:150px">${U.bar(p.accuracy, p.status === 'mastered' ? 'ok' : p.status === 'needs-revision' ? 'warn' : '')}</div>
    </div>
    ${U.badge(p.status)} ${action}
  </div>`;
}
function tutorSupport(me, subjectId) {
  const su = S.subject(subjectId);
  if (S.hasTutor(me, subjectId)) {
    const t = S.tutor(me.tutors[subjectId]);
    const last = S.lessonsFor(me.id).filter((l) => l.subjectId === subjectId && l.summary).slice(-1)[0];
    return `<div class="card">
      ${U.cardHead('cap', 'Tutor support')}
      <div class="row" style="gap:10px;margin-bottom:10px">${U.avatar(t.name, 36)}<div class="grow"><b class="sm">${t.name}</b><div class="tiny faint">${su.name} · ★ ${t.rating}</div></div><span class="badge b-ok">Active</span></div>
      ${last ? `<div class="card flat" style="background:var(--surface-2);border:none"><div class="tiny faint" style="margin-bottom:3px">Last lesson · ${S.fmtDate(last.date)}</div><div class="sm">${U.esc(last.summary)}</div>${last.homework ? `<div class="tiny" style="margin-top:8px"><b>Homework:</b> ${U.esc(last.homework)}</div>` : ''}</div>` : '<p class="sm muted">No lesson notes yet.</p>'}
    </div>`;
  }
  return U.emptyState({
    ic: 'cap', dormant: true,
    title: `Need help with ${su.name}?`,
    body: 'Stuck on a topic? Book focused topic support or get a recommended tutor — your weak areas come pre-loaded for them.',
    ctaLabel: 'Book topic support', ctaAttrs: `data-act="request-tutor" data-student="${me.id}" data-subject="${subjectId}"`,
  });
}

// ---------------- Planner ----------------
function planner(me) {
  const ex = AI.examInfo();
  const weak = AI.weakTopics(me.id, 5);
  const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri'];
  const plan = days.map((d, i) => ({ d, topic: weak[i % Math.max(1, weak.length)] }));
  return `<div class="pagehead"><h1>Revision planner</h1><p>Adaptive — it re-prioritises as you improve.</p></div>
  <div class="stack">
    <div class="card hero"><div class="row between"><div><div class="faint sm">${ex.name}</div><h2>${ex.daysLeft} days left</h2></div><div class="lead" style="background:rgba(255,255,255,.16);color:#fff">${icon('calendar')}</div></div></div>
    <div class="card">${U.cardHead('route', 'Weak-topic priority', { sub: 'Tackle these first for the biggest gains' })}
      ${weak.length ? `<div class="list">${weak.map((w, i) => `<div class="rowitem plain"><div class="lead" style="background:var(--brand-soft);color:var(--brand);font-weight:800">${i + 1}</div>
        <div class="grow"><div class="t">${w.name}</div><div class="d">${w.subject} · ${w.accuracy}%</div></div>
        <button class="btn soft sm" data-act="mark-revised" data-student="${me.id}" data-topic="${w.topicId}">Revise</button></div>`).join('')}</div>`
        : '<p class="sm muted">No weak topics — keep reviewing to stay sharp.</p>'}
    </div>
    <div class="card">${U.cardHead('calendar', 'This week')}
      <div class="list">${plan.map(({ d, topic }) => `<div class="rowitem plain"><div class="grow"><div class="t" style="font-size:14px">${d}</div><div class="d">${topic ? `${topic.subject} · ${topic.name}` : 'Light review + past paper'}</div></div>${icon('right')}</div>`).join('')}</div>
    </div>
    <div class="ai"><div class="ai-h">${icon('sparkles')} Adaptive note</div><p class="sm muted">Master a topic and it drops off your plan automatically; slip on a worksheet and it comes back. Practising in MathPath keeps this accurate.</p></div>
  </div>`;
}

// ---------------- Progress analytics ----------------
function progress(me) {
  const ov = AI.overallReadiness(me.id);
  const rc = AI.revisionConsistency(me.id);
  return `<div class="pagehead"><h1>Progress</h1><p>Your trends — calm and clear.</p></div>
  <div class="stack">
    <div class="card"><div class="row between"><div><div class="tiny faint">Overall readiness</div><h2 style="font-size:24px">${ov.score}%</h2><span class="badge ${ov.score >= 70 ? 'b-ok' : ov.score >= 50 ? 'b-warn' : 'b-bad'}">${ov.band}</span></div>${U.ring(ov.score, { size: 76, color: ov.score >= 70 ? '#10b981' : '#f59e0b' })}</div></div>
    <div class="card">${U.cardHead('chart', 'Mastery by subject')}
      <div class="stack-sm">${me.subjects.map((s) => { const m = S.subjectMastery(me.id, s); const su = S.subject(s); return `<div><div class="row between" style="margin-bottom:5px"><b class="sm">${su.name}</b><span class="sm muted">${m.pct}%</span></div>${U.bar(m.pct)}</div>`; }).join('')}</div>
    </div>
    <div class="card">${U.cardHead('flame', 'Revision consistency', { sub: `${rc.activeDays}/7 days · ${rc.minutesWeek} min this week` })}
      ${weekBars(rc.series)}
    </div>
    <div class="stats">
      ${U.statTile('flame', 'warn', me.streak, 'Day streak')}
      ${U.statTile('checkCircle', 'ok', S.worksheetsFor(me.id).filter((w) => w.status === 'done').length, 'Worksheets done')}
    </div>
  </div>`;
}
function weekBars(series) {
  const max = Math.max(...series, 1); const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return `<div class="row" style="gap:6px;align-items:flex-end;height:60px">${series.map((m, i) => `<div class="grow" style="text-align:center"><div style="height:46px;display:flex;align-items:flex-end"><div style="width:100%;height:${Math.max(6, (m / max) * 46)}px;border-radius:6px;background:${m ? 'var(--grad)' : 'var(--line)'}"></div></div><div class="tiny faint" style="margin-top:3px">${days[i]}</div></div>`).join('')}</div>`;
}
