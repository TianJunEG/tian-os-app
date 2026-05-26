// roles/parent.js — Parent dashboard. Reassuring, organised, actionable.
import * as S from '../store.js';
import * as AI from '../ai.js';
import * as U from '../ui.js';
import { icon } from '../icons.js';
import { topicsOf } from '../data.js';

export const nav = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'children', label: 'Children', icon: 'users' },
  { id: 'tutors', label: 'Tutors', icon: 'cap' },
  { id: 'billing', label: 'Billing', icon: 'card' },
];

export function render(tab, param) {
  const p = S.parent(S.user().id);
  if (!p) return '<div class="card">No parent profile for this session.</div>';
  if (tab === 'children') return param ? childDetail(param) : children(p);
  if (tab === 'tutors') return tutors(p);
  if (tab === 'billing') return billing(p);
  return home(p);
}

// ---------------- Home ----------------
function home(p) {
  const kids = S.childrenOf(p.id);
  const readiness = Math.round(kids.reduce((a, k) => a + AI.overallReadiness(k.id).score, 0) / kids.length);
  const weak = kids.reduce((a, k) => a + AI.weakTopics(k.id).length, 0);
  const doneWk = kids.reduce((a, k) => a + S.worksheetsFor(k.id).filter((w) => w.status === 'done').length, 0);
  const recos = AI.recommendationsForParent(p.id);
  const notes = S.notificationsFor(p.id).slice(0, 3);

  return `
  <div class="pagehead"><h1>Hi ${p.name.split(' ')[0]} 👋</h1><p>Here's how ${kids.length === 1 ? kids[0].name : 'your children'} are doing this week.</p></div>
  <div class="stack">
    <div class="stats">
      ${U.statTile('users', 'brand', kids.length, 'Children')}
      ${U.statTile('target', readiness >= 70 ? 'ok' : 'warn', readiness + '%', 'Avg readiness')}
      ${U.statTile('alert', weak ? 'warn' : 'ok', weak, 'Weak topics')}
      ${U.statTile('checkCircle', 'info', doneWk, 'Worksheets done')}
    </div>
    <div class="content-grid">
      <div class="full">${U.recoBlock('AI recommendations', recos)}</div>
      <div class="card">
        ${U.cardHead('users', 'Children', { link: 'All', linkGo: '#/parent/children' })}
        <div class="list">${kids.map((k) => childRow(k)).join('')}</div>
      </div>
      <div class="card">
        ${U.cardHead('bell', 'Recent activity', { link: 'All', linkGo: '#/parent/home' })}
        ${notes.length ? notes.map(U.note).join('') : '<p class="muted sm">Nothing new.</p>'}
      </div>
    </div>
  </div>`;
}

function childRow(k) {
  const r = AI.overallReadiness(k.id);
  return `<a class="rowitem" href="#/parent/children/${k.id}">
    ${U.avatar(k.name, 36)}
    <div class="grow"><div class="t">${k.name}</div><div class="d">${k.level} · ${k.subjects.length} subjects · 🔥 ${k.streak}-day streak</div></div>
    <span class="badge ${r.score >= 70 ? 'b-ok' : r.score >= 50 ? 'b-warn' : 'b-bad'}">${r.score}%</span>
    <span class="chev">${icon('right')}</span>
  </a>`;
}

// ---------------- Children list ----------------
function children(p) {
  const kids = S.childrenOf(p.id);
  return `<div class="pagehead"><h1>Children</h1><p>Tap a child for full progress, tutors and app activity.</p></div>
  <div class="content-grid">
    ${kids.map((k) => {
      const r = AI.overallReadiness(k.id); const weak = AI.weakTopics(k.id).length;
      return `<div class="card tap" data-act="nav" data-go="#/parent/children/${k.id}">
        <div class="row" style="margin-bottom:12px">${U.avatar(k.name, 44)}
          <div class="grow"><h3>${k.name}</h3><div class="sm muted">${k.level}</div></div>
          ${U.ring(AI.overallReadiness(k.id).score, { size: 56, color: r.score >= 70 ? '#10b981' : r.score >= 50 ? '#f59e0b' : '#ef4444' })}
        </div>
        <div class="row wrap" style="gap:6px;margin-bottom:10px">${k.subjects.map((s) => `<span class="pill">${S.subject(s).name}</span>`).join('')}</div>
        <div class="row between sm">
          <span class="${weak ? 'b-warn badge' : 'b-ok badge'}">${weak ? `${weak} weak topics` : 'No weak topics'}</span>
          <span class="muted">${S.anyTutor(k) ? `${Object.keys(k.tutors).length} active tutor(s)` : 'No tutor yet'}</span>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ---------------- Child detail ----------------
function childDetail(studentId) {
  const k = S.student(studentId);
  if (!k) return `<div class="card">Child not found.</div>`;
  const ov = AI.overallReadiness(k.id);
  const reports = S.reportsFor(k.id);
  const rc = AI.revisionConsistency(k.id);
  const wsDone = S.worksheetsFor(k.id).filter((w) => w.status === 'done');
  const wsAssigned = S.worksheetsFor(k.id).filter((w) => w.status === 'assigned');

  return `
  <a class="link" href="#/parent/children" style="margin-bottom:10px">${icon('left')} Children</a>
  <div class="stack">
    <div class="card hero">
      <div class="row">${U.avatar(k.name, 56)}
        <div class="grow"><h2>${k.name}</h2><div class="faint sm">${k.level} · joined ${k.joined}</div></div>
        ${U.ring(ov.score, { size: 64, color: '#ffffff' })}
      </div>
      <div class="row" style="gap:8px;margin-top:12px">
        <span class="pill" style="background:rgba(255,255,255,.16);border:none;color:#fff">🔥 ${k.streak}-day streak</span>
        <span class="pill" style="background:rgba(255,255,255,.16);border:none;color:#fff">${ov.band}</span>
      </div>
    </div>

    <div class="card">
      ${U.cardHead('chart', 'Progress tracking', { sub: 'Mastery & exam readiness by subject' })}
      <div class="stack-sm">${k.subjects.map((s) => subjectProgressRow(k.id, s)).join('')}</div>
    </div>

    ${weakCard(k)}

    <div class="card">
      ${U.cardHead('cap', 'Tutors & reports')}
      <div class="stack-sm">${k.subjects.map((s) => tutorLine(k, s)).join('')}</div>
      ${reports.length ? `<div class="section-title" style="margin-top:14px">Latest summaries</div>${reports.slice(0, 2).map(reportRow).join('')}` : ''}
    </div>

    <div class="card">
      ${U.cardHead('bolt', 'Learning app activity', { sub: 'MathPath revision & worksheets' })}
      <div class="row between" style="margin-bottom:10px">
        <div><div class="tiny faint">Revision this week</div><b>${rc.minutesWeek} min · ${rc.activeDays}/7 days</b></div>
        <span class="badge ${rc.trend === 'down' ? 'b-bad' : rc.trend === 'up' ? 'b-ok' : 'b-mute'}">${icon('trend')} ${rc.trend}</span>
      </div>
      ${weekBars(rc.series)}
      <div class="row between sm" style="margin-top:12px"><span class="muted">Worksheets completed</span><b>${wsDone.length}</b></div>
      <div class="row between sm" style="margin-top:6px"><span class="muted">Remediation assigned (from mistakes)</span><b>${wsAssigned.length}</b></div>
      ${wsAssigned.length ? `<div class="tiny faint" style="margin-top:6px">AI generated these from recent app mistakes — ${k.name.split(' ')[0]} can clear them by practising in the app.</div>` : ''}
    </div>
  </div>`;
}

function subjectProgressRow(studentId, subjectId) {
  const su = S.subject(subjectId); const m = S.subjectMastery(studentId, subjectId);
  const er = AI.examReadiness(studentId, subjectId);
  return `<div>
    <div class="row between" style="margin-bottom:5px">
      <div class="row" style="gap:8px"><span class="mkey" style="background:${su.color}"></span><b class="sm">${su.name}</b></div>
      <span class="sm muted">${m.pct}% mastered · ${er.band}</span>
    </div>
    ${U.bar(m.pct, er.score >= 70 ? 'ok' : er.score >= 50 ? 'warn' : 'bad')}
  </div>`;
}
function weakCard(k) {
  const weak = AI.weakTopics(k.id, 3);
  if (!weak.length) return `<div class="card"><div class="row" style="gap:10px"><div class="lead" style="background:var(--ok-soft);color:#047857">${icon('checkCircle')}</div><div><b>No weak topics 🎉</b><div class="sm muted">${k.name} is on track across all subjects.</div></div></div></div>`;
  return `<div class="card">
    ${U.cardHead('alert', 'Weak topics flagged by AI')}
    <div class="list">${weak.map((w) => `<div class="rowitem plain">
      <div class="lead" style="background:var(--warn-soft);color:#b45309">${icon('target')}</div>
      <div class="grow"><div class="t">${w.name}</div><div class="d">${w.subject} · ${w.accuracy}% accuracy</div></div>
      ${U.badge(w.status)}</div>`).join('')}</div>
  </div>`;
}
function tutorLine(k, subjectId) {
  const su = S.subject(subjectId);
  const tid = k.tutors[subjectId];
  if (tid) {
    const t = S.tutor(tid);
    return `<div class="row between"><div class="row" style="gap:8px">${U.avatar(t.name, 28)}<div><b class="sm">${t.name}</b><div class="tiny faint">${su.name} · ★ ${t.rating}</div></div></div><span class="badge b-ok">${icon('check')} active</span></div>`;
  }
  return `<div class="row between"><div class="row" style="gap:8px"><div class="si" style="width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:${U.hexSoft(su.color)};color:${su.color}">${icon(su.icon)}</div><div><b class="sm">${su.name}</b><div class="tiny faint">No tutor assigned</div></div></div>
    <button class="btn soft sm" data-act="request-tutor" data-student="${k.id}" data-subject="${subjectId}">Request</button></div>`;
}
function reportRow(r) {
  const t = S.tutor(r.tutorId);
  return `<div class="rowitem plain"><div class="lead" style="background:var(--brand-soft);color:var(--brand)">${icon('clipboard')}</div>
    <div class="grow"><div class="t" style="font-weight:600;font-size:13.5px">${U.esc(r.text)}</div><div class="d">${t.name} · ${S.fmtDate(r.date)}</div></div></div>`;
}
function weekBars(series) {
  const max = Math.max(...series, 1);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return `<div class="row" style="gap:6px;align-items:flex-end;height:54px">${series.map((m, i) => `
    <div class="grow" style="text-align:center"><div style="height:42px;display:flex;align-items:flex-end"><div style="width:100%;height:${Math.max(6, (m / max) * 42)}px;border-radius:6px;background:${m ? 'var(--grad)' : 'var(--line)'}"></div></div>
    <div class="tiny faint" style="margin-top:3px">${days[i]}</div></div>`).join('')}</div>`;
}

// ---------------- Tutor services ----------------
function tutors(p) {
  const kids = S.childrenOf(p.id);
  const gaps = [];
  kids.forEach((k) => k.subjects.filter((s) => !S.hasTutor(k, s)).forEach((s) => gaps.push({ k, s })));
  const active = [];
  kids.forEach((k) => Object.entries(k.tutors).forEach(([s, tid]) => active.push({ k, s, t: S.tutor(tid) })));
  const recommendFor = gaps[0];
  const recoTutors = recommendFor ? S.db().tutors.filter((t) => t.subjects.includes(recommendFor.s)).map((t) => ({ t, score: AI.suitability(t.id, recommendFor.k.id, recommendFor.s) })).sort((a, b) => b.score - a.score) : [];

  return `<div class="pagehead"><h1>Tutor services</h1><p>Matched by AI on subject fit, results and teaching style.</p></div>
  <div class="stack">
    ${gaps.length ? `<div class="card">
      ${U.cardHead('alert', 'Needs a tutor')}
      <div class="stack-sm">${gaps.map(({ k, s }) => `<div class="row between"><div><b class="sm">${k.name}</b><div class="tiny faint">${S.subject(s).name}</div></div>
        <button class="btn soft sm" data-act="request-tutor" data-student="${k.id}" data-subject="${s}">Request tutor</button></div>`).join('')}</div>
    </div>` : ''}

    ${active.length ? `<div class="card">${U.cardHead('check', 'Active tutors')}
      <div class="list">${active.map(({ k, s, t }) => `<div class="rowitem plain">${U.avatar(t.name, 36)}
        <div class="grow"><div class="t">${t.name}</div><div class="d">${k.name} · ${S.subject(s).name} · ★ ${t.rating}</div></div>
        <span class="badge b-ok">Active</span></div>`).join('')}</div></div>` : ''}

    ${recommendFor ? `<div class="card">
      ${U.cardHead('sparkles', `Recommended for ${recommendFor.k.name}`, { sub: `${S.subject(recommendFor.s).name} · suitability scored by AI` })}
      <div class="list">${recoTutors.map(({ t, score }) => `<div class="rowitem" data-act="tutor-profile" data-tutor="${t.id}" data-student="${recommendFor.k.id}" data-subject="${recommendFor.s}">
        ${U.avatar(t.name, 36)}
        <div class="grow"><div class="t">${t.name}</div><div class="d">★ ${t.rating} · ${t.yearsExp} yrs · $${t.rate}/hr</div></div>
        <div style="text-align:right"><div style="font-weight:800;color:var(--brand)">${score}%</div><div class="tiny faint">fit</div></div>
        <span class="chev">${icon('right')}</span></div>`).join('')}</div>
    </div>` : ''}
  </div>`;
}

// ---------------- Billing ----------------
function billing(p) {
  const inv = S.invoicesFor(p.id);
  const due = inv.filter((i) => i.status === 'due');
  return `<div class="pagehead"><h1>Billing</h1><p>Subscriptions, tuition invoices and payment history.</p></div>
  <div class="stack">
    <div class="card hero">
      <div class="faint sm">Current plan</div><h2>${p.plan}</h2>
      <div class="faint sm" style="margin-top:4px">App access for all children · cancel anytime</div>
      <button class="btn block" style="margin-top:14px;background:rgba(255,255,255,.16);color:#fff;border:none" data-act="soon">Manage subscription</button>
    </div>
    ${due.length ? `<div class="card" style="border-color:var(--warn)">
      ${U.cardHead('alert', `${due.length} payment(s) due`)}
      <div class="stack-sm">${due.map(invoiceRow).join('')}</div>
    </div>` : `<div class="card"><div class="row" style="gap:10px"><div class="lead" style="background:var(--ok-soft);color:#047857">${icon('checkCircle')}</div><div><b>All paid up</b><div class="sm muted">No outstanding invoices.</div></div></div></div>`}
    <div class="card">${U.cardHead('card', 'History')}
      <div class="list">${inv.filter((i) => i.status === 'paid').map((i) => `<div class="rowitem plain"><div class="grow"><div class="t" style="font-size:14px">${U.esc(i.label)}</div><div class="d">Due ${S.fmtDate(i.due)}</div></div><div style="text-align:right"><b>${U.money(i.amount)}</b><div class="tiny"><span class="badge b-ok">Paid</span></div></div></div>`).join('') || '<p class="muted sm">No history yet.</p>'}</div>
    </div>
  </div>`;
}
function invoiceRow(i) {
  return `<div class="row between"><div class="grow"><div class="t sm" style="font-weight:650">${U.esc(i.label)}</div><div class="tiny faint">Due ${S.fmtDate(i.due)}</div></div>
    <b style="margin-right:10px">${U.money(i.amount)}</b>
    <button class="btn primary sm" data-act="pay-invoice" data-invoice="${i.id}">Pay</button></div>`;
}
