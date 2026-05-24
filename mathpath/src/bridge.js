// bridge.js — MathPath → Education OS link (emit side).
// When launched from a dashboard (…/mathpath/?student=ethan&subject=emath&return=/), MathPath
// tags finished sessions to that student/subject and appends a result record to a shared event
// log. Education OS ingests the log and folds it into the unified student profile. All wrapped
// in try/catch so the bridge can never break the learner experience.

const SHARED_KEY = 'tutormatch.learning';
const qp = () => new URLSearchParams(location.search);

export function emitResult(r) {
  try {
    if (typeof localStorage === 'undefined') return;
    const q = qp();
    const rec = {
      source: 'mathpath',
      studentId: q.get('student') || 'ethan',
      subjectHint: q.get('subject') || 'emath',
      curriculumId: r.curriculumId || '',
      skillId: r.skillId || '',
      skillName: r.skillName || '',
      accuracy: Math.max(0, Math.min(100, Math.round(r.accuracy || 0))),
      mastered: !!r.mastered,
      minutes: Math.max(5, Math.round((r.questions || 10) * 0.6)),
      ts: Date.now(),
    };
    const log = JSON.parse(localStorage.getItem(SHARED_KEY) || '[]');
    log.push(rec);
    localStorage.setItem(SHARED_KEY, JSON.stringify(log.slice(-300)));
  } catch { /* never block practice */ }
}

// Thin banner linking back to the dashboard, shown only when launched with context.
export function mountReturnBanner() {
  try {
    const q = qp(), ret = q.get('return'), stu = q.get('student');
    if (!ret || !stu || document.getElementById('__eduback')) return;
    const bar = document.createElement('a');
    bar.id = '__eduback';
    bar.href = ret;
    bar.textContent = '← Back to Education OS · results sync automatically';
    bar.style.cssText = 'display:block;text-align:center;background:linear-gradient(135deg,#5b54f0,#8b5cf6);color:#fff;font:600 12.5px system-ui,sans-serif;padding:8px 12px;text-decoration:none';
    document.body.prepend(bar);
  } catch { /* ignore */ }
}
