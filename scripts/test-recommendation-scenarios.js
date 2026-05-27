// Scenario tests for the MathPath recommendation/placement logic. Simulates
// distinct student profiles and asserts the engine triggers the right response
// (mastery/fluency classification, remediation, fluency drills, prerequisite
// reinforcement, next-skill unlocking, sensible explanations).
//
//   MONGODB_URI=mongodb://localhost:27017/<seeded-db> node scripts/test-recommendation-scenarios.js
// (DB must already have the domains seeded: seed:foundation + seed:domains + reconcile:domains)
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';
import MasteryRecord from '../models/MasteryRecord.js';
import { runPlacement } from '../utils/placementEngine.js';
import { recommendNextSkill, recordAttempt } from '../utils/masteryEngine.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
let pass = 0, fail = 0;
const check = (name, cond, detail = '') => { console.log(`  ${cond ? 'PASS' : 'FAIL'} — ${name}${detail ? '  (' + detail + ')' : ''}`); cond ? pass++ : fail++; };
const att = (slug, correct, responseMs, extra = {}) => ({ slug, correct, responseMs, hesitationMs: extra.hesitationMs || 600, retries: extra.retries || 0, misconceptionTag: extra.tag });

async function main() {
  await mongoose.connect(URI);
  const ws = await Workspace.findOne();
  const TARGET = 'op.mult.facts';   // target 3s; prereqs ns.count.skip, op.add.facts
  const prof = (p) => p.masteryProfile.find((x) => x.slug === TARGET) || {};

  console.log('\n1) High accuracy + FAST');
  let p = await runPlacement(new mongoose.Types.ObjectId(), Array.from({ length: 6 }, () => att(TARGET, true, 2400)));
  check('classified mastered', prof(p).mastery === 'mastered', prof(p).mastery);
  check('fluency automatic', prof(p).fluency === 'automatic');
  check('no fluency drill triggered', !p.fluencyRecommendations.some((f) => f.slug === TARGET));

  console.log('\n2) High accuracy + SLOW');
  p = await runPlacement(new mongoose.Types.ObjectId(), Array.from({ length: 6 }, () => att(TARGET, true, 9000)));
  check('classified accurate-but-slow', prof(p).mastery === 'accurate-but-slow', prof(p).mastery);
  check('fluency drill TRIGGERED', p.fluencyRecommendations.some((f) => f.slug === TARGET));
  check('not flagged for remediation', !p.remediationPathways.some((r) => r.slug === TARGET));

  console.log('\n3) Low accuracy');
  p = await runPlacement(new mongoose.Types.ObjectId(), [att(TARGET, false, 12000), att(TARGET, true, 11000), att(TARGET, false, 13000), att(TARGET, false, 10000)]);
  check('classified not-secure', prof(p).mastery === 'not-secure', prof(p).mastery);
  check('remediation TRIGGERED', p.remediationPathways.some((r) => r.slug === TARGET));
  check('prerequisite reinforcement present', (p.remediationPathways.find((r) => r.slug === TARGET)?.reinforce || []).length > 0);

  console.log('\n4) Repeated misconception');
  p = await runPlacement(new mongoose.Types.ObjectId(), Array.from({ length: 4 }, () => att(TARGET, false, 8000, { tag: 'mult/adjacent-fact' })));
  check('misconception detected', prof(p).misconception?.tag === 'mult/adjacent-fact', prof(p).misconception?.tag);
  check('remediation carries the misconception', p.remediationPathways.find((r) => r.slug === TARGET)?.misconception?.tag === 'mult/adjacent-fact');

  console.log('\n5) Inconsistent performance');
  p = await runPlacement(new mongoose.Types.ObjectId(), [att(TARGET, true, 2500), att(TARGET, false, 14000, { retries: 2 }), att(TARGET, true, 3000), att(TARGET, false, 12000, { retries: 1, hesitationMs: 8000 })]);
  check('low confidence flagged', prof(p).confidence < 0.6, 'conf=' + prof(p).confidence);

  console.log('\n6) Mastery regression (via recordAttempt → recommendNextSkill explanation)');
  const sid = new mongoose.Types.ObjectId();
  for (let i = 0; i < 6; i++) await recordAttempt({ studentId: sid, skillId: (await skillId('op.add.facts')), workspaceId: ws._id, correct: true });
  // master a couple of foundations so the recommender can advance
  for (const s of ['ns.count.to-20', 'ns.count.to-100', 'ns.count.skip']) for (let i = 0; i < 6; i++) await recordAttempt({ studentId: sid, skillId: await skillId(s), workspaceId: ws._id, correct: true });
  let rec = await recommendNextSkill(sid);
  check('next-skill unlocking advances past mastered', rec && rec.skill.slug !== 'ns.count.to-20', '→ ' + rec?.skill.slug);
  check('recommendation has an explanation', !!rec?.reason, rec?.reason);
  // now regress op.add.facts with wrong answers until status drops
  for (let i = 0; i < 8; i++) await recordAttempt({ studentId: sid, skillId: await skillId('op.add.facts'), workspaceId: ws._id, correct: false });
  rec = await recommendNextSkill(sid);
  const regressed = await MasteryRecord.findOne({ studentId: sid, skillId: await skillId('op.add.facts') });
  check('regressed skill no longer mastered', regressed.status !== 'mastered', regressed.status);
  check('recommender surfaces the regressed skill with a review reason',
    rec?.skill.slug === 'op.add.facts' && /review|slipped/i.test(rec.reason || ''), (rec?.skill.slug || '') + ': ' + (rec?.reason || ''));

  await MasteryRecord.deleteMany({ studentId: sid });
  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  await mongoose.disconnect();
  process.exit(fail ? 1 : 0);
}
async function skillId(slug) { const S = (await import('../models/Skill.js')).default; return (await S.findOne({ slug }))._id; }
main().catch((e) => { console.error(e); process.exit(1); });
