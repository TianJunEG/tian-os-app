// ELPath · Comprehension Cloze — standalone practice page logic.
// External module (not inline) so it runs under a strict `script-src 'self'` CSP
// when served by the API host, and so it can be embedded as a free resource.
import { clozePassages, gradePassage, SKILL_LABELS } from '../shared/englishpath/cloze/index.js';
import { initPartner } from './partner.js';

// Embed / co-brand mode (e.g. ?partner=brightdesk). No-op without the param.
initPartner();
// Keep the partner/embed context when crossing to the vocabulary page.
if (location.search) {
  const toVocab = document.getElementById('to-vocab');
  if (toVocab) toVocab.href = './index.html' + location.search;
}

let passage = clozePassages[0];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Render the passage, turning each {n} into an input.
function render() {
  document.getElementById('ptitle').textContent = passage.title;
  const html = passage.text
    .split('\n\n')
    .map((para) => {
      const body = esc(para).replace(/\{(\d+)\}/g, (_, n) =>
        `<span class="blank" data-blank="${n}"><input data-n="${n}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="blank ${n}" /><span class="n">${n}</span></span>`
      );
      return `<p>${body}</p>`;
    })
    .join('');
  document.getElementById('passage').innerHTML = html;
}

const answers = () => {
  const a = {};
  for (const inp of document.querySelectorAll('input[data-n]')) a[inp.dataset.n] = inp.value;
  return a;
};
const clearState = () => document.querySelectorAll('.blank').forEach((b) => b.classList.remove('correct', 'typo', 'review'));

function check() {
  clearState();
  const res = gradePassage(answers(), passage);
  for (const r of res.perBlank) {
    const el = document.querySelector(`.blank[data-blank="${r.n}"]`);
    if (r.verdict !== 'blank') el.classList.add(r.verdict);
  }
  showResults(res);
}

function showResults(res) {
  const pct = Math.round((res.score / res.total) * 100);
  const skills = Object.entries(res.bySkill).map(([k, s]) => {
    const p = Math.round((s.correct / s.total) * 100);
    return `<div class="skill"><div class="top"><b>${SKILL_LABELS[k] || k}</b><span>${s.correct}/${s.total}</span></div><div class="bar"><span style="width:${p}%"></span></div></div>`;
  }).join('');
  const fb = res.perBlank.map((r) => {
    if (r.verdict === 'correct') return `<li><span class="mk ok">✓</span><span><b>${r.n}.</b> ${esc(document.querySelector(`input[data-n="${r.n}"]`).value)}</span></li>`;
    if (r.verdict === 'typo') return `<li><span class="mk amber">≈</span><span><b>${r.n}.</b> ${esc(r.note)}</span></li>`;
    if (r.verdict === 'blank') return `<li><span class="mk err">–</span><span><b>${r.n}.</b> left blank · <span class="acc">accepted: ${esc(r.accepted.join(', '))}</span></span></li>`;
    return `<li><span class="mk err">✗</span><span><b>${r.n}.</b> you wrote “${esc(document.querySelector(`input[data-n="${r.n}"]`).value)}” · <span class="acc">accepted: ${esc(r.accepted.join(', '))}</span></span></li>`;
  }).join('');
  document.getElementById('results').innerHTML = `
    <div class="card">
      <div class="eyebrow">Your score</div>
      <div class="score">${res.score} <small>/ ${res.total}</small></div>
      <p class="note">${pct}% · a mark-worthy answer in green, a spelling slip in amber, and everything you missed with the answers that were accepted.</p>
      <div style="margin-top:14px">${skills}</div>
    </div>
    <div class="card"><div class="eyebrow">Every blank</div><ul class="fb">${fb}</ul></div>`;
}

function reveal() {
  clearState();
  for (const b of passage.blanks) {
    const inp = document.querySelector(`input[data-n="${b.n}"]`);
    inp.value = b.accept[0];
    document.querySelector(`.blank[data-blank="${b.n}"]`).classList.add('correct');
  }
  document.getElementById('results').innerHTML = '';
}

// Passage picker — browse all authored passages.
const picker = document.getElementById('picker');
picker.innerHTML = clozePassages.map((p, i) => `<option value="${i}">${esc(p.title)}</option>`).join('');
picker.onchange = () => {
  passage = clozePassages[+picker.value];
  document.getElementById('results').innerHTML = '';
  render();
};

render();
document.getElementById('check').onclick = check;
document.getElementById('reveal').onclick = reveal;
document.getElementById('reset').onclick = () => {
  document.querySelectorAll('input[data-n]').forEach((i) => (i.value = ''));
  clearState();
  document.getElementById('results').innerHTML = '';
};
