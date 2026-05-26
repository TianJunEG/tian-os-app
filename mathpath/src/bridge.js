// bridge.js — MathPath → Education OS link (emit side).
// When launched from a dashboard (…/mathpath/?student=ethan&subject=emath&return=/), MathPath
// tags finished sessions to that student/subject and appends a result record to a shared event
// log. Education OS ingests the log and folds it into the unified student profile. All wrapped
// in try/catch so the bridge can never break the learner experience.

const SHARED_KEY = 'tutormatch.learning';
const qp = () => new URLSearchParams(location.search);

function token() {
  try { return localStorage.getItem('token') || JSON.parse(localStorage.getItem('user') || '{}').token || ''; } catch { return ''; }
}

export function emitResult(r) {
  let rec;
  try {
    if (typeof localStorage === 'undefined') return;
    const q = qp();
    rec = {
      source: 'mathpath',
      studentId: q.get('student') || 'ethan',
      subjectHint: q.get('subject') || 'emath',
      curriculumId: r.curriculumId || '',
      skillId: r.skillId || '',
      skillName: r.skillName || '',
      topicId: q.get('topic') || '', // exact Education OS topic, when launched from a worksheet
      accuracy: Math.max(0, Math.min(100, Math.round(r.accuracy || 0))),
      mastered: !!r.mastered,
      minutes: Math.max(5, Math.round((r.questions || 10) * 0.6)),
      ts: Date.now(),
    };
    const log = JSON.parse(localStorage.getItem(SHARED_KEY) || '[]');
    log.push(rec);
    localStorage.setItem(SHARED_KEY, JSON.stringify(log.slice(-300)));
  } catch { return; /* never block practice */ }
  try {
    // Real-app path: persist to the unified profile API (same contract as the event log).
    const tok = token();
    if (tok) {
      fetch('/api/learning/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ source: 'mathpath', subject: rec.subjectHint, topic: rec.skillName || 'Practice', accuracy: rec.accuracy, mastered: rec.mastered, minutes: rec.minutes }),
      }).catch(() => {});
    }
  } catch { /* best effort */ }
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
