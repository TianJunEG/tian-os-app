// app.js — shell, hash router, login, and the delegated action dispatcher that lets one role's
// action ripple through the shared store to every other role.
import * as S from './store.js';
import * as U from './ui.js';
import { icon } from './icons.js';
import { SUBJECTS, topicsOf } from './data.js';
import { sourceForSubject } from './learning.js';
import * as parent from './roles/parent.js';
import * as student from './roles/student.js';
import * as tutor from './roles/tutor.js';
import * as admin from './roles/admin.js';

const ROLES = { parent, student, tutor, admin };
const app = document.getElementById('app');

// ---------- routing ----------
function parseHash() {
  const m = location.hash.replace(/^#\/?/, '').split('/');
  return { role: m[0] || '', tab: m[1] || '', param: m[2] || '' };
}
function go(hash) { location.hash = hash; }
window.addEventListener('hashchange', render);

function render() {
  const u = S.user();
  if (!u) return renderLogin();
  const mod = ROLES[u.role];
  let { role, tab, param } = parseHash();
  if (role !== u.role) { go(`#/${u.role}/${mod.nav[0].id}`); return; }
  if (!tab || !mod.nav.some((n) => n.id === tab)) tab = mod.nav[0].id;

  const unread = S.notificationsFor(S.mailbox()).length;
  app.innerHTML = `
    <div class="shell">
      ${sidebar(u, mod, tab)}
      <div class="main">
        ${topbar(u, unread)}
        <div class="content">${safe(() => mod.render(tab, param))}</div>
        ${bottomnav(u, mod, tab)}
      </div>
    </div>`;
  window.scrollTo(0, 0);
}
function safe(fn) { try { return fn(); } catch (e) { console.error(e); return `<div class="card">Something went wrong rendering this view.</div>`; } }

function topbar(u, unread) {
  return `<div class="topbar"><div class="topbar-in">
    <div class="brand"><span class="logo">${icon('cap')}</span><div>Tian OS<small>Tutor Match</small></div></div>
    <div class="spacer"></div>
    <button class="iconbtn" data-act="notifications" aria-label="Notifications">${icon('bell')}${unread ? '<span class="dot"></span>' : ''}</button>
    <button class="iconbtn" data-act="account" aria-label="Account">${U.avatar(u.name, 28)}</button>
  </div></div>`;
}
function sidebar(u, mod, tab) {
  return `<aside class="sidebar only-desktop">
    <div class="brand sbrand"><span class="logo">${icon('cap')}</span><div>Tian OS<small>${roleLabel(u.role)}</small></div></div>
    ${mod.nav.map((n) => `<a class="snav ${n.id === tab ? 'on' : ''}" href="#/${u.role}/${n.id}">${icon(n.icon)} ${n.label}</a>`).join('')}
    <div style="flex:1"></div>
    <a class="snav" data-act="account">${icon('swap')} Switch role</a>
  </aside>`;
}
function bottomnav(u, mod, tab) {
  return `<nav class="bottomnav only-mobile">
    ${mod.nav.map((n) => `<a class="${n.id === tab ? 'on' : ''}" href="#/${u.role}/${n.id}">${icon(n.icon)}<span>${n.label}</span></a>`).join('')}
  </nav>`;
}
const roleLabel = (r) => ({ parent: 'Parent', student: 'Student', tutor: 'Tutor', admin: 'Operations' }[r]);

// ---------- login / role switcher ----------
function renderLogin() {
  app.innerHTML = `<div class="login">
    <div class="center" style="margin-bottom:26px">
      <div class="brand" style="justify-content:center;font-size:20px"><span class="logo" style="width:38px;height:38px">${icon('cap')}</span> Tian OS</div>
      <p class="muted" style="margin-top:10px;font-size:14px">One connected learning platform.<br/>Choose how you'd like to sign in.</p>
    </div>
    <div class="stack">
      ${S.PERSONAS.map((p) => {
        const name = p.role === 'admin' ? 'Operations' : (S.parent(p.id) || S.student(p.id) || S.tutor(p.id)).name;
        return `<button class="persona" data-act="login" data-id="${p.id}">
          ${U.avatar(name, 44)}
          <div class="grow"><div style="font-weight:750">${U.esc(name)}</div><div class="sm muted">${p.sub}</div></div>
          <div class="chev">${icon('right')}</div>
        </button>`;
      }).join('')}
    </div>
    <p class="center tiny faint" style="margin-top:22px">Same data, four lenses · prototype · <a class="link" data-act="reset" style="display:inline">reset demo</a></p>
  </div>`;
}

// ---------- delegated actions ----------
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const d = t.dataset;
  const act = d.act;
  if (act === 'noop') return;
  e.preventDefault();

  switch (act) {
    case 'nav': go(d.go); break;
    case 'login': S.login(d.id); go(`#/${S.user().role}/${ROLES[S.user().role].nav[0].id}`); break;
    case 'account': S.logout(); renderLogin(); break;
    case 'reset': S.resetAll(); renderLogin(); break;
    case 'notifications': openNotifications(); break;

    case 'request-tutor':
      if (d.subject) { S.requestTutor(d.student, d.subject); U.toast('Tutor request sent — Operations notified'); render(); }
      else openRequestTutor(d.student);
      break;
    case 'open-child': go(`#/parent/children/${d.student}`); break;
    case 'tutor-profile': openTutorProfile(d.tutor, d.student, d.subject, d.queue); break;
    case 'assign-tutor':
      S.assignTutor(d.student, d.subject, d.tutor, d.queue || '');
      U.closeSheet(); U.toast(`${S.tutor(d.tutor).name} assigned`); render();
      break;
    case 'approve-match':
      S.approveMatch(d.queue, d.tutor);
      U.closeSheet(); U.toast(`Match approved — ${S.tutor(d.tutor).name}`); render();
      break;
    case 'pay-invoice': S.payInvoice(d.invoice); U.toast('Payment recorded'); render(); break;

    case 'open-report': openReportForm(d.tutor, d.student); break;
    case 'save-report': {
      const txt = (document.getElementById('rep-text') || {}).value || 'Lesson completed. Good progress today.';
      const focus = (document.getElementById('rep-focus') || {}).value || '';
      S.addReport(d.tutor, d.student, txt, focus); U.closeSheet(); U.toast('Lesson summary uploaded'); render();
      break;
    }
    case 'confirm-lesson': S.confirmLesson(d.lesson); U.toast('Lesson confirmed'); render(); break;

    case 'open-worksheet':
      if (d.worksheet) openWorksheet(d.worksheet); else go('#/student/worksheets');
      break;
    case 'complete-worksheet': S.completeWorksheet(d.worksheet, 82); U.closeSheet(); U.toast('Worksheet done — progress updated', true); render(); break;
    case 'mark-revised': S.markRevised(d.student, d.topic); U.toast('Nice — revision logged 🔥'); render(); break;

    case 'advance-lead': S.advanceLead(d.lead); U.toast('Lead updated'); render(); break;
    case 'resolve-ticket': S.resolveTicket(d.ticket); U.toast('Ticket resolved'); render(); break;
    case 'close-sheet': U.closeSheet(); break;
    case 'app-soon': U.toast(`${d.app} plugs in here once its app is added`); break;
    case 'soon': U.toast('Prototype — not wired yet'); break;
    default: break;
  }
});

// ---------- sheets ----------
function openNotifications() {
  const list = S.notificationsFor(S.mailbox());
  U.openSheet(`<h3 style="margin-bottom:4px">Notifications</h3><p class="sm muted" style="margin-bottom:6px">Synced across the platform in real time.</p>
    ${list.length ? list.map(U.note).join('') : '<p class="muted" style="padding:18px 0">You’re all caught up.</p>'}`);
}
function openRequestTutor(studentId) {
  const s = S.student(studentId);
  const subs = s.subjects.filter((sub) => !S.hasTutor(s, sub));
  U.openSheet(`<h3>Request a tutor</h3><p class="sm muted" style="margin:4px 0 14px">For ${U.esc(s.name)} · pick a subject. Operations will match within 48h.</p>
    <div class="stack-sm">${(subs.length ? subs : s.subjects).map((sub) => {
      const su = S.subject(sub);
      return `<button class="rowitem" style="border:1px solid var(--line);border-radius:14px;padding:12px;border-bottom:1px solid var(--line)" data-act="request-tutor" data-student="${studentId}" data-subject="${sub}">
        <div class="si" style="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:${U.hexSoft(su.color)};color:${su.color}">${icon(su.icon)}</div>
        <div class="grow"><div class="t">${su.name}</div></div>${icon('right')}</button>`;
    }).join('')}</div>`);
}
function openTutorProfile(tutorId, studentId, subjectId, queueId) {
  const t = S.tutor(tutorId);
  import('./ai.js').then((AI) => {
    const score = subjectId && studentId ? AI.suitability(tutorId, studentId, subjectId) : null;
    U.openSheet(`
      <div class="row" style="margin-bottom:12px">${U.avatar(t.name, 56)}
        <div class="grow"><h3>${U.esc(t.name)}</h3><div class="sm muted">${t.subjects.map((s) => S.subject(s).name).join(' · ')}</div>
        <div class="row" style="gap:6px;margin-top:5px">${U.badge('mastered').replace('Mastered', `★ ${t.rating}`)}<span class="pill">${t.reviews} reviews</span><span class="pill">${t.yearsExp} yrs</span></div></div>
      </div>
      <p class="sm muted" style="margin-bottom:12px">${U.esc(t.blurb)}</p>
      ${score != null ? `<div class="card flat" style="background:var(--brand-soft);border:none;margin-bottom:12px"><div class="row between"><div><div class="sm" style="font-weight:700;color:var(--brand)">AI suitability for this student</div><div class="tiny muted">subject fit · rating · experience</div></div><div style="font-size:26px;font-weight:800;color:var(--brand)">${score}%</div></div></div>` : ''}
      <div class="row" style="gap:10px">
        ${queueId ? `<button class="btn primary grow" data-act="approve-match" data-tutor="${tutorId}" data-queue="${queueId}">Approve match</button>`
          : (studentId && subjectId ? `<button class="btn primary grow" data-act="assign-tutor" data-tutor="${tutorId}" data-student="${studentId}" data-subject="${subjectId}">Assign &amp; start trial</button>` : '')}
        <button class="btn ${queueId || (studentId && subjectId) ? '' : 'primary block'}" data-act="soon">Message</button>
      </div>`);
  });
}
function openReportForm(tutorId, studentId) {
  const s = S.student(studentId);
  const weak = topicsOf(Object.keys(s.tutors).find((k) => s.tutors[k] === tutorId) || s.subjects[0]);
  U.openSheet(`<h3>Lesson summary</h3><p class="sm muted" style="margin:4px 0 12px">For ${U.esc(s.name)} — parents see this instantly.</p>
    <textarea id="rep-text" class="card" style="width:100%;min-height:96px;border:1px solid var(--line);font:inherit;resize:vertical" placeholder="What did you cover? What needs work?">Covered key concepts today. Good engagement.</textarea>
    <label class="sm muted" style="display:block;margin:12px 0 6px">Flag a focus topic</label>
    <select id="rep-focus" class="card" style="width:100%;border:1px solid var(--line);font:inherit;padding:11px">
      <option value="">— none —</option>
      ${weak.map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}
    </select>
    <button class="btn primary block" style="margin-top:14px" data-act="save-report" data-tutor="${tutorId}" data-student="${studentId}">Upload summary</button>`);
}
function openWorksheet(worksheetId) {
  const w = S.db().worksheets.find((x) => x.id === worksheetId);
  const subjectId = w.topicId.split('-')[0];
  const t = topicsOf(subjectId).find((x) => x.id === w.topicId) || {};
  const src = sourceForSubject(subjectId);
  const launch = src && src.live
    ? `<a class="btn primary block" href="${src.path}?student=${w.studentId}&subject=${subjectId}&topic=${w.topicId}&return=/" target="_blank" rel="noopener">${icon('play')} Practise in ${src.label}</a>`
    : `<button class="btn block" data-act="app-soon" data-app="${src ? src.label : 'A companion app'}">${icon('play')} ${src ? `${src.label} — coming soon` : 'No companion app yet'}</button>`;
  U.openSheet(`<h3>${w.type} worksheet</h3><p class="sm muted" style="margin:4px 0 14px">${U.esc(t.name || 'Topic practice')} · adaptive difficulty${src && src.live ? `, powered by ${src.label}. Your results sync straight back here.` : '.'}</p>
    ${launch}
    <button class="btn ghost block" style="margin-top:8px" data-act="complete-worksheet" data-worksheet="${worksheetId}">Mark complete (demo)</button>`);
}

// When the user returns from practising in MathPath (same origin), pull in new results.
window.addEventListener('focus', () => {
  if (S.user() && S.syncLearning()) { U.toast('Synced from MathPath'); render(); }
});

render();
