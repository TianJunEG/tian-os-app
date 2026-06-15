// Composes a parent dashboard snapshot into a short, warm progress update
// "spoken" by Chelya (the progress mascot). Tier 1: pure + deterministic — no
// LLM. Picks a win, a focus area, and one concrete next step, in a
// growth-mindset tone (effort/process framing, never "behind/failing").
//
// Input shape: the snapshot produced by deriveParentSnapshot()
//   { childName, mastered, total, masteryPercent, streak, attentionSkill,
//     currentFocus, accuracy, recommendation }

const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'Your child';

export function buildMascotNarration(snapshot = {}, opts = {}) {
  const name = firstName(opts.childName || snapshot.childName);
  const mastered = Number(snapshot.mastered) || 0;
  const total = Number(snapshot.total) || 0;
  const streak = Number(snapshot.streak) || 0;
  const accuracy = Number(snapshot.accuracy) || 0;
  const focus = snapshot.attentionSkill || snapshot.currentFocus || '';
  const nextStep = snapshot.recommendation
    || (focus ? `about 10 minutes on ${focus}, then review one mistake together` : '');

  // Win — framed around effort/progress, with a sensible cold-start fallback.
  let win;
  if (streak >= 3) {
    win = `${name} has kept a ${streak}-day streak going — that consistency is exactly what builds mastery`;
  } else if (mastered > 0) {
    win = `${name} has mastered ${mastered}${total ? ` of ${total}` : ''} fraction skills so far`;
  } else {
    win = `${name} is just getting started — every session from here builds momentum`;
  }

  // Focus — supportive, not deficit-framed.
  let focusLine = '';
  if (focus) {
    focusLine = accuracy && accuracy < 70
      ? ` Right now ${focus} is the growth area (around ${accuracy}% so far) — that's normal, it just needs more reps.`
      : ` The next thing to build on is ${focus}.`;
  }

  const nextLine = nextStep ? ` Best next step: ${nextStep}.` : '';

  const headline = `Chelya's update on ${name}`;
  const body = `${win}.${focusLine}${nextLine}`.replace(/\s{2,}/g, ' ').trim();
  return { headline, body };
}

export default buildMascotNarration;
