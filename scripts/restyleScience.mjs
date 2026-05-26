#!/usr/bin/env node
// Re-skin the standalone P6 Science app to the Edu OS brand (navy/gold + Poppins/DM Sans).
// Re-runnable: point it at a fresh export of the science app to re-apply the brand after updates.
//   node scripts/restyleScience.mjs <input.html> <output.html>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error('Usage: node scripts/restyleScience.mjs <in.html> <out.html>');
  process.exit(1);
}

// The app's indigo/blue palette → Edu OS navy. Semantic colours (amber/red/green/grey) untouched.
const COLORS = {
  '#4f46e5': '#1d3a63', '#6366f1': '#2f4f7e', '#4338ca': '#142b4d', '#3730a3': '#0a1a33',
  '#3b82f6': '#2f4f7e', '#2563eb': '#1d3a63', '#1d4ed8': '#142b4d',
  '#eef2ff': '#f3f6fb', '#e0e7ff': '#e2e9f3', '#c7d2fe': '#c5d3e7',
  '#a5b4fc': '#9fb3d1', '#818cf8': '#5d7aa8',
};

let html = readFileSync(inPath, 'utf8');
let swaps = 0;
for (const [from, to] of Object.entries(COLORS)) {
  html = html.replace(new RegExp(from, 'gi'), () => { swaps++; return to; });
}
// Fonts → Edu OS (Poppins headings, DM Sans body). Matches quoted CSS font-family names.
html = html.replace(/Plus Jakarta Sans/g, 'Poppins').replace(/(['"])Inter\1/g, "$1DM Sans$1");
html = html.replace(/<title>[^<]*<\/title>/i, '<title>Edu OS · Primary Science</title>');

const OVERRIDE = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
<style id="edu-os-theme">
  /* Edu OS brand layer — navy/gold + Poppins/DM Sans. */
  body { font-family: 'DM Sans', system-ui, sans-serif; }
  h1, h2, h3, .h1, .h2, .h3 { font-family: 'Poppins', 'DM Sans', sans-serif; }
  body::before { content: ''; position: fixed; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #c9a24b, #d4af37); z-index: 99999; }
  a { color: #1d3a63; }
  button:focus-visible, .btn:focus-visible { outline: 2px solid #c9a24b; outline-offset: 2px; }
</style>
`;
html = html.replace(/<\/head>/i, OVERRIDE + '</head>');

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html);
console.log(`✓ Re-skinned ${inPath} -> ${outPath} (${swaps} colour swaps, ${html.length} bytes)`);
console.log("  NOTE: place the app's image assets (lesson_*.png/jpg, q*.png) next to this file so question diagrams load.");
