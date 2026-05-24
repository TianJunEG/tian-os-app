import { seed } from './src/data.js';
import * as L from './src/learning.js';
import * as S from './src/store.js';
import * as student from './src/roles/student.js';
let fail = 0; const ok = (c, m) => { if (!c) fail++; console.log(`${c ? '✓' : '✗ FAIL'} ${m}`); };

// source registry / routing
ok(L.sourceForSubject('emath').id === 'mathpath' && L.sourceForSubject('emath').live, 'E-Math → MathPath (live)');
ok(L.sourceForSubject('eng').id === 'spelling' && !L.sourceForSubject('eng').live, 'English → Spell Master (coming soon)');
ok(L.sourceForSubject('chi').id === 'spelling', 'Chinese → Spell Master');
ok(L.sourceForSubject('chem').id === 'science' && L.sourceForSubject('phys').id === 'science', 'Chem/Phys → Science Lab');
ok(L.sourceForSubject('hum') === null, 'Humanities → no companion app');

// multi-source ingest (apps that don't exist yet, but would emit the shared contract)
const db = seed();
L.applyRecords(db, [
  { source: 'spelling', studentId: 'maya', subjectHint: 'eng', topicId: 'eng-2', skillName: 'Spelling list', accuracy: 52, mastered: false, minutes: 7, ts: 1 },
  { source: 'science', studentId: 'ethan', subjectHint: 'chem', topicId: 'chem-5', skillName: 'Redox', accuracy: 91, mastered: true, minutes: 9, ts: 2 },
  { source: 'science', studentId: 'ethan', subjectHint: 'phys', skillName: 'Forces and motion', accuracy: 80, mastered: false, minutes: 8, ts: 3 },
]);
ok(db.progress['maya:eng-2'].status === 'needs-revision', 'Spell Master result lowered Maya English grammar → needs-revision');
ok(db.worksheets.some((w) => w.studentId === 'maya' && w.topicId === 'eng-2' && w.status === 'assigned'), 'remediation worksheet generated for English (from spelling mistakes)');
ok(db.progress['ethan:chem-5'].status === 'mastered', 'Science Lab result mastered Ethan chemistry Redox');
ok(L.mapTopic('phys', 'Forces and motion') === 'phys-1', 'keyword maps Forces → Physics:Forces');

// UI: live vs coming-soon slots render
S.login('ethan');
ok(/Practise .*MathPath/.test(student.render('subjects', 'emath')), 'E-Math map shows a live MathPath launch');
ok(/coming soon/.test(student.render('subjects', 'chem')), 'Chemistry map shows a Science Lab "coming soon" slot');

console.log(fail === 0 ? '\n✅ Multi-source framework ready — apps drop in by emitting the shared contract' : `\n❌ ${fail} failed`);
process.exit(fail ? 1 : 0);
