// One-off extractor for the legacy standalone Science Lab at
// frontend/public/science/index.html. Pulls three const declarations
// (TOPIC_MIND_MAPS, STRUCTURED_LESSONS, DIAGRAMS) out of the HTML and writes
// them to JSON under data/, so the new /student/science module can serve them
// as Notes + Lesson + Diagram content without re-keying the source HTML.
//
//   node scripts/extractScienceContent.mjs
//
// Re-run only when the legacy HTML changes (which it shouldn't — it's frozen).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '../frontend/public/science/index.html');
const OUT_DIR = path.join(__dirname, '../data');

const html = fs.readFileSync(SRC, 'utf8');

// Each const is a JS object literal starting with '{' and ending with the next
// '\n};' that closes it (no nested template literals in these blocks, so this
// brace-counting-free match holds).
function grab(name) {
  const re = new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`);
  const m = html.match(re);
  if (!m) throw new Error(`Could not find ${name} in ${SRC}`);
  // Evaluate in a tight sandbox: these are trusted in-repo data literals.
  return new Function(`return (${m[1]});`)();
}

const TOPIC_MIND_MAPS = grab('TOPIC_MIND_MAPS');
const STRUCTURED_LESSONS = grab('STRUCTURED_LESSONS');
const DIAGRAMS = grab('DIAGRAMS');

// The QUESTIONS array is bigger and an array literal, not an object, so it
// gets its own line-based extractor: collect lines from `const QUESTIONS = [`
// up to the standalone `];` line, then evaluate. Each question is one line,
// so no `];` ever appears inside an entry.
function grabQuestionsArray() {
  const lines = html.split('\n');
  const start = lines.findIndex((l) => /^const QUESTIONS = \[/.test(l));
  if (start === -1) throw new Error('Could not find QUESTIONS array start');
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\];\s*$/.test(lines[i])) { end = i; break; }
  }
  if (end === -1) throw new Error('Could not find QUESTIONS array end');
  const body = lines.slice(start, end + 1).join('\n').replace(/^const QUESTIONS = /, '').replace(/;\s*$/, '');
  return new Function(`return (${body});`)();
}

const QUESTIONS = grabQuestionsArray();

// Pull every question that names a diagram. Key by `${topic}::${heading}`
// so the join in routes/science.js doesn't accidentally merge same-name
// definitions across topics.
const questionDiagrams = {};
let qWithDiagram = 0;
for (const q of QUESTIONS) {
  if (q && q.diagram && q.heading && q.topic && DIAGRAMS[q.diagram]) {
    questionDiagrams[`${q.topic}::${q.heading}`] = q.diagram;
    qWithDiagram++;
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// Merge legacy extractions into any existing file so hand-authored content
// (e.g. mind maps for topics absent from the legacy HTML, like P6
// Reproductive System) survives a re-run. Legacy keys still win on conflict
// so the extraction stays the source of truth for topics it covers.
function mergeWrite(file, fresh) {
  const target = path.join(OUT_DIR, file);
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(target, 'utf8')); } catch { /* first run */ }
  const merged = { ...existing, ...fresh };
  fs.writeFileSync(target, JSON.stringify(merged, null, 2));
  return { kept: Object.keys(existing).length, total: Object.keys(merged).length };
}
const notesStats = mergeWrite('scienceNotes.json', TOPIC_MIND_MAPS);
const lessonsStats = mergeWrite('scienceLessons.json', STRUCTURED_LESSONS);
fs.writeFileSync(path.join(OUT_DIR, 'scienceDiagrams.json'), JSON.stringify(DIAGRAMS, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'scienceQuestionDiagrams.json'), JSON.stringify(questionDiagrams, null, 2));

console.log(`✅ Extracted from legacy Science Lab`);
console.log(`   ${Object.keys(TOPIC_MIND_MAPS).length} legacy mind maps (${notesStats.total} total after merge) → data/scienceNotes.json`);
console.log(`   ${Object.keys(STRUCTURED_LESSONS).length} legacy structured lessons (${lessonsStats.total} total after merge) → data/scienceLessons.json`);
console.log(`   ${Object.keys(DIAGRAMS).length} inline SVG diagrams → data/scienceDiagrams.json`);
console.log(`   ${qWithDiagram} question→diagram mappings → data/scienceQuestionDiagrams.json`);
