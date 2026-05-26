// ui.js — shared presentational helpers. Every helper returns an HTML string; app.js paints it
// and uses delegated [data-act] handlers, so there's no per-component wiring.
import { icon } from './icons.js';
import { STATUS } from './data.js';

const PALETTE = ['#4f46e5', '#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#14b8a6', '#ec4899'];
export function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}
export function avatarColor(name = '') { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length; return PALETTE[h]; }
export function avatar(name, size = 36, sq = false) {
  const c = avatarColor(name);
  return `<div class="avatar av-${size} ${sq ? 'sq' : ''}" style="background:linear-gradient(135deg, ${c}, ${shade(c)})">${initials(name)}</div>`;
}
function shade(hex) { // lighten toward violet for a soft gradient
  return hex === '#4f46e5' ? '#7c5cff' : hex;
}
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function badge(status) {
  const s = STATUS[status]; if (!s) return '';
  return `<span class="badge ${s.cls}"><span class="dotb" style="background:${s.color}"></span>${s.label}</span>`;
}
export const pill = (text, ic) => `<span class="pill">${ic ? icon(ic) : ''}${esc(text)}</span>`;

export const TONE = {
  warn: { bg: 'var(--warn-soft)', fg: '#b45309' },
  info: { bg: 'var(--info-soft)', fg: '#1d4ed8' },
  brand: { bg: 'var(--brand-soft)', fg: 'var(--brand)' },
  bad: { bg: 'var(--bad-soft)', fg: '#b91c1c' },
  ok: { bg: 'var(--ok-soft)', fg: '#047857' },
};

export function statTile(ic, tone, k, l) {
  const t = TONE[tone] || TONE.brand;
  return `<div class="stat"><div class="ic" style="background:${t.bg};color:${t.fg}">${icon(ic)}</div><div class="k">${k}</div><div class="l">${esc(l)}</div></div>`;
}
export const bar = (pct, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;

export function ring(pct, { size = 78, color = '#4f46e5', sub = '' } = {}) {
  const r = (size - 12) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return `<div class="ring-wrap" style="width:${size}px;height:${size}px">
    <svg class="ring" width="${size}" height="${size}">
      <circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}"></circle>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${color}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"></circle>
    </svg>
    <div class="ctr"><b>${pct}%</b>${sub ? `<div class="tiny faint">${esc(sub)}</div>` : ''}</div>
  </div>`;
}

export function cardHead(ic, title, { sub = '', link = '', linkGo = '' } = {}) {
  return `<div class="card-h">
    ${ic ? `<div class="lead">${icon(ic)}</div>` : ''}
    <div class="grow"><h3>${esc(title)}</h3>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>
    ${link ? `<a class="link" ${linkGo ? `href="${linkGo}"` : 'data-act="noop"'}>${esc(link)} ${icon('right')}</a>` : ''}
  </div>`;
}

export function emptyState({ ic = 'sparkles', title, body, ctaLabel, ctaAttrs = '', secondaryLabel, secondaryAttrs = '', dormant = false }) {
  return `<div class="card ${dormant ? 'dormant' : ''} empty">
    <div class="ic">${icon(ic)}</div>
    <h3>${esc(title)}</h3>
    <p>${esc(body)}</p>
    ${ctaLabel ? `<button class="btn primary block" ${ctaAttrs}>${esc(ctaLabel)}</button>` : ''}
    ${secondaryLabel ? `<button class="btn ghost block" ${secondaryAttrs} style="margin-top:8px">${esc(secondaryLabel)}</button>` : ''}
  </div>`;
}

export function recoBlock(title, recos) {
  if (!recos.length) return '';
  return `<div class="ai">
    <div class="ai-h">${icon('sparkles')} ${esc(title)}</div>
    ${recos.map(recoRow).join('')}
  </div>`;
}
export function recoRow(r) {
  const t = TONE[r.tone] || TONE.brand;
  const attrs = r.action ? actAttrs(r.action) : '';
  return `<div class="reco ${r.action ? 'tap' : ''}" ${attrs}>
    <div class="ric" style="background:${t.bg};color:${t.fg}">${icon(r.icon)}</div>
    <div class="grow"><div class="rt">${esc(r.title)}</div><div class="rd">${esc(r.desc)}</div></div>
    ${r.action ? `<div class="chev faint">${icon('right')}</div>` : ''}
  </div>`;
}
function actAttrs(a) {
  if (a.act === 'nav') return `data-act="nav" data-go="${a.go}"`;
  return `data-act="${a.act}" ${a.studentId ? `data-student="${a.studentId}"` : ''} ${a.subjectId ? `data-subject="${a.subjectId}"` : ''} ${a.go ? `data-go="${a.go}"` : ''}`;
}

export function note(n) {
  const t = TONE[n.type] || TONE.info;
  return `<div class="note"><div class="ni" style="background:${t.bg};color:${t.fg}">${icon(n.icon)}</div>
    <div class="grow"><div class="nt">${esc(n.text)}</div><div class="nd">${esc(n.time)}</div></div></div>`;
}

export function subjectTile(subject, subText, go) {
  return `<a class="subtile" href="${go}">
    <div class="si" style="background:${hexSoft(subject.color)};color:${subject.color}">${icon(subject.icon)}</div>
    <div class="sn">${esc(subject.name)}</div><div class="sm2">${esc(subText)}</div>
  </a>`;
}
export function hexSoft(hex) { return hex + '1f'; } // ~12% alpha

export const money = (n) => `$${Number(n).toLocaleString()}`;

// segmented control (links via hash) and chips
export function seg(items, activeId) {
  return `<div class="seg">${items.map((i) => `<button class="${i.id === activeId ? 'on' : ''}" data-act="nav" data-go="${i.go}">${esc(i.label)}</button>`).join('')}</div>`;
}

// ---- imperative bits: toast + bottom sheet ----
let toastT;
export function toast(msg, ok = true) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.className = 'toast show' + (ok ? ' ok' : '');
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.className = 'toast'; }, 2400);
}

export function openSheet(html) {
  closeSheet();
  const scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.id = '_scrim';
  scrim.addEventListener('click', closeSheet);
  const sheet = document.createElement('div'); sheet.className = 'sheet'; sheet.id = '_sheet';
  sheet.innerHTML = `<div class="grip"></div>${html}`;
  document.body.append(scrim, sheet);
  requestAnimationFrame(() => { scrim.classList.add('show'); sheet.classList.add('show'); });
}
export function closeSheet() {
  const s = document.getElementById('_sheet'), sc = document.getElementById('_scrim');
  if (s) { s.classList.remove('show'); setTimeout(() => s.remove(), 260); }
  if (sc) { sc.classList.remove('show'); setTimeout(() => sc.remove(), 260); }
}
