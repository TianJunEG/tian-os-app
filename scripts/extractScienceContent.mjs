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

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'scienceNotes.json'), JSON.stringify(TOPIC_MIND_MAPS, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'scienceLessons.json'), JSON.stringify(STRUCTURED_LESSONS, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'scienceDiagrams.json'), JSON.stringify(DIAGRAMS, null, 2));

console.log(`✅ Extracted from legacy Science Lab`);
console.log(`   ${Object.keys(TOPIC_MIND_MAPS).length} topic mind maps → data/scienceNotes.json`);
console.log(`   ${Object.keys(STRUCTURED_LESSONS).length} structured lessons → data/scienceLessons.json`);
console.log(`   ${Object.keys(DIAGRAMS).length} inline SVG diagrams → data/scienceDiagrams.json`);
