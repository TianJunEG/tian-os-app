// roles/admin.js — Operations control center. Matching, leads, support, platform health.
import * as S from '../store.js';
import * as AI from '../ai.js';
import * as U from '../ui.js';
import { icon } from '../icons.js';

export const nav = [
  { id: 'home', label: 'Control', icon: 'grid' },
  { id: 'matching', label: 'Matching', icon: 'route' },
  { id: 'leads', label: 'Leads', icon: 'inbox' },
  { id: 'support', label: 'Support', icon: 'ticket' },
];

export function render(tab) {
  if (tab === 'matching') return matching();
  if (tab === 'leads') return leads();
  if (tab === 'support') return support();
  return home();
}

function churnRisks() {
  return S.db().parents.map((p) => {
    const kids = S.childrenOf(p.id);
    const worst = Math.min(...kids.map((k) => AI.overallReadiness(k.id).score));
    const lowRev = kids.some((k) => S.revisionFor(k.id).filter((m) => m > 0).length < 3);
    return { p, worst, lowRev, risk: worst < 55 || lowRev };
  }).filter((x) => x.risk);
}

// ---------------- Control ----------------
function home() {
  const q = S.db().matchQueue.filter((m) => m.status === 'open');
  const newLeads = S.db().leads.filter((l) => l.status === 'new');
  const tickets = S.db().tickets.filter((t) => t.status === 'open');
  const churn = churnRisks();
  return `<div class="pagehead"><h1>Operations</h1><p>Control center · ${S.db().students.length} students · ${S.db().tutors.length} tutors</p></div>
  <div class="stack">
    <div class="stats">
      ${U.statTile('route', q.length ? 'warn' : 'ok', q.length, 'Open matches')}
      ${U.statTile('inbox', 'info', newLeads.length, 'New leads')}
      ${U.statTile('ticket', tickets.length ? 'warn' : 'ok', tickets.length, 'Open tickets')}
      ${U.statTile('heart', churn.length ? 'bad' : 'ok', churn.length, 'Churn risks')}
    </div>

    ${churn.length ? `<div class="card" style="border-color:var(--bad)">
      ${U.cardHead('heart', 'Churn alerts', { sub: 'AI flagged declining engagement' })}
      <div class="list">${churn.map((c) => `<div class="rowitem plain"><div class="lead" style="background:var(--bad-soft);color:#b91c1c">${icon('alert')}</div>
        <div class="grow"><div class="t">${c.p.name}</div><div class="d">${c.lowRev ? 'Revision down sharply' : ''}${c.lowRev && c.worst < 55 ? ' · ' : ''}${c.worst < 55 ? `Readiness ${c.worst}%` : ''}</div></div>
        <button class="btn soft sm" data-act="soon">Intervene</button></div>`).join('')}</div>
    </div>` : ''}

    <div class="card">${U.cardHead('route', 'Matching queue', { link: 'Open', linkGo: '#/admin/matching' })}
      ${q.length ? `<div class="list">${q.slice(0, 3).map(queueMini).join('')}</div>` : '<p class="sm muted">Queue is clear.</p>'}
    </div>

    <div class="card">${U.cardHead('shield', 'Platform health')}
      <div class="stats c3" style="grid-template-columns:repeat(3,1fr)">
        ${miniStat(S.db().tutors.filter((t) => t.status === 'active').length, 'Active tutors')}
        ${miniStat(S.db().lessons.filter((l) => l.status !== 'completed').length, 'Lessons booked')}
        ${miniStat(paymentRate() + '%', 'On-time pay')}
      </div>
    </div>
  </div>`;
}
const miniStat = (k, l) => `<div class="center"><div style="font-size:20px;font-weight:800">${k}</div><div class="tiny faint">${l}</div></div>`;
function paymentRate() { const inv = S.db().invoices; return Math.round((inv.filter((i) => i.status === 'paid').length / inv.length) * 100); }
function queueMini(m) {
  const su = S.subject(m.subjectId);
  return `<div class="rowitem" data-act="nav" data-go="#/admin/matching"><div class="si" style="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:${U.hexSoft(su.color)};color:${su.color}">${icon(su.icon)}</div>
    <div class="grow"><div class="t">${U.esc(m.studentName)}</div><div class="d">${su.name} · ${m.level}</div></div>
    <span class="badge ${m.urgency === 'high' ? 'b-bad' : 'b-mute'}">${m.urgency}</span><span class="chev">${icon('right')}</span></div>`;
}

// ---------------- Matching ----------------
function matching() {
  const q = S.db().matchQueue;
  return `<div class="pagehead"><h1>Tutor matching</h1><p>AI-ranked candidates · you stay in control.</p></div>
  <div class="stack">
    ${q.map(matchCard).join('')}
    <div class="card">${U.cardHead('search', 'External tutor database')}
      <p class="sm muted" style="margin-bottom:12px">Can't fill a match from the active pool? Search the wider Tutor Match network and outreach.</p>
      <button class="btn block" data-act="soon">${icon('search')} Search external tutors</button>
    </div>
  </div>`;
}
function matchCard(m) {
  const su = S.subject(m.subjectId);
  const done = m.status !== 'open';
  return `<div class="card">
    <div class="row between" style="margin-bottom:10px">
      <div class="row" style="gap:10px"><div class="si" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:${U.hexSoft(su.color)};color:${su.color}">${icon(su.icon)}</div>
        <div><b>${U.esc(m.studentName)}</b><div class="tiny faint">${su.name} · ${m.level}</div></div></div>
      <span class="badge ${done ? 'b-ok' : m.urgency === 'high' ? 'b-bad' : 'b-warn'}">${done ? 'matched' : m.urgency + ' priority'}</span>
    </div>
    ${done ? `<p class="sm muted">Matched with ${S.tutor(m.matchedTutor || (m.candidates[0] || {}).tutorId)?.name || 'a tutor'} ✓</p>`
      : `<div class="section-title">AI candidates</div>
      <div class="list">${m.candidates.map((c, i) => candRow(m, c, i === 0)).join('')}</div>`}
  </div>`;
}
function candRow(m, c, top) {
  const t = S.tutor(c.tutorId);
  return `<div class="rowitem" data-act="tutor-profile" data-tutor="${t.id}" data-queue="${m.id}" ${m.studentId ? `data-student="${m.studentId}"` : ''} data-subject="${m.subjectId}">
    ${U.avatar(t.name, 36)}
    <div class="grow"><div class="t">${t.name} ${top ? '<span class="badge b-brand" style="margin-left:4px">top pick</span>' : ''}</div><div class="d">★ ${t.rating} · ${t.yearsExp} yrs · $${t.rate}/hr</div></div>
    <div style="text-align:right;margin-right:8px"><div style="font-weight:800;color:var(--brand)">${c.score}%</div><div class="tiny faint">fit</div></div>
    <button class="btn primary sm" data-act="approve-match" data-queue="${m.id}" data-tutor="${t.id}" onclick="event.stopPropagation()">Approve</button>
  </div>`;
}

// ---------------- Leads ----------------
function leads() {
  const ls = S.db().leads;
  const cols = { new: 'b-info', contacted: 'b-warn', 'trial booked': 'b-brand', converted: 'b-ok' };
  return `<div class="pagehead"><h1>Leads & enquiries</h1><p>Parent enquiries from web, ads and referrals.</p></div>
  <div class="card"><div class="list">
    ${ls.map((l) => `<div class="rowitem plain">${U.avatar(l.parent, 36)}
      <div class="grow"><div class="t">${U.esc(l.parent)}</div><div class="d">${U.esc(l.need)} · ${l.source} · ${l.age}</div></div>
      <span class="badge ${cols[l.status] || 'b-mute'}">${l.status}</span>
      ${l.status !== 'converted' ? `<button class="btn soft sm" data-act="advance-lead" data-lead="${l.id}">Advance</button>` : ''}
    </div>`).join('')}
  </div></div>`;
}

// ---------------- Support + payments ----------------
function support() {
  const tk = S.db().tickets;
  const overdue = S.db().invoices.filter((i) => i.status === 'due');
  return `<div class="pagehead"><h1>Support & payments</h1><p>Tickets, escalations and payment monitoring.</p></div>
  <div class="stack">
    <div class="card">${U.cardHead('ticket', 'Support tickets')}
      <div class="list">${tk.map((t) => `<div class="rowitem plain"><div class="lead" style="background:${t.status === 'resolved' ? 'var(--ok-soft)' : 'var(--brand-soft)'};color:${t.status === 'resolved' ? '#047857' : 'var(--brand)'}">${icon(t.status === 'resolved' ? 'check' : 'message')}</div>
        <div class="grow"><div class="t" style="font-size:14px">${U.esc(t.subject)}</div><div class="d">${t.from} · ${t.role} · ${t.age}</div></div>
        ${t.status === 'open' ? `<button class="btn soft sm" data-act="resolve-ticket" data-ticket="${t.id}">Resolve</button>` : '<span class="badge b-ok">Resolved</span>'}</div>`).join('')}</div>
    </div>
    <div class="card">${U.cardHead('dollar', 'Payment monitoring')}
      ${overdue.length ? `<div class="list">${overdue.map((i) => { const p = S.parent(i.parentId); return `<div class="rowitem plain"><div class="lead" style="background:var(--warn-soft);color:#b45309">${icon('card')}</div><div class="grow"><div class="t" style="font-size:14px">${p.name}</div><div class="d">${U.esc(i.label)} · due ${S.fmtDate(i.due)}</div></div><b>${U.money(i.amount)}</b></div>`; }).join('')}</div>`
        : '<p class="sm muted">No overdue payments.</p>'}
    </div>
    <div class="card">${U.cardHead('shield', 'Escalations')}
      <div class="empty" style="padding:12px"><p class="muted sm" style="margin:0">No open escalations. Critical issues surface here automatically.</p></div>
    </div>
  </div>`;
}
