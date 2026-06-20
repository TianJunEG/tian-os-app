// Placeholder for the "Tian intro" onboarding splash.
//
// StudentDashboard.jsx imports { TianIntro, shouldShowTianIntro } and wires them
// in (gates a `showIntro` state, renders <TianIntro userId onDone />), but the
// real component was never committed — which broke `vite build` and the
// StudentDashboard test (a dangling import). This INERT stub unblocks the build
// and keeps the integration points intact rather than ripping the feature's
// wiring out of StudentDashboard:
//   - shouldShowTianIntro() returns false, so the intro never shows;
//   - TianIntro renders nothing.
// Replace this file with the real implementation when it lands — the call sites
// already pass { userId, onDone }.

export function shouldShowTianIntro(/* studentId */) {
  return false;
}

export function TianIntro(/* { userId, onDone } */) {
  return null;
}

export default TianIntro;
