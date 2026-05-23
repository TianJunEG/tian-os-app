// Pure helpers that turn a list of words into interactive activities:
// scramble, missing letters, word search and crossword. Kept framework-free
// so they are easy to unit test and reuse across components.

export const normalizeSpelling = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

// Spelling comparison: case-insensitive, ignores surrounding whitespace.
export const isCorrect = (input, target) =>
  normalizeSpelling(input) === normalizeSpelling(target);

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const pickRandom = (arr, n) => shuffle(arr).slice(0, n);

// ---- Scramble -------------------------------------------------------------
// Returns tiles [{ id, letter }] so duplicate letters stay distinguishable
// when the user taps them. Guaranteed not identical to the original order
// (unless the word is a single character).
export function scrambleWord(word) {
  const letters = String(word).split('');
  const tiles = letters.map((letter, i) => ({ id: `${i}-${letter}`, letter }));
  if (tiles.length < 2) return tiles;

  let scrambled = shuffle(tiles);
  let attempts = 0;
  while (scrambled.map((t) => t.letter).join('') === word && attempts < 10) {
    scrambled = shuffle(tiles);
    attempts += 1;
  }
  return scrambled;
}

// ---- Missing letters ------------------------------------------------------
// Returns a template [{ char, hidden }] where ~ratio of the letters are hidden
// (never spaces, never all letters, always at least one). The hidden letters,
// read left to right, are the answer.
export function makeMissingLetters(word, ratio = 0.4) {
  const chars = String(word).split('');
  const letterIndexes = chars
    .map((c, i) => (/[A-Za-z]/.test(c) ? i : -1))
    .filter((i) => i >= 0);

  if (letterIndexes.length <= 1) {
    // Too short to hide anything meaningfully — hide the single letter.
    return chars.map((char, i) => ({ char, hidden: letterIndexes.includes(i) }));
  }

  const hideCount = Math.min(
    Math.max(1, Math.round(letterIndexes.length * ratio)),
    letterIndexes.length - 1
  );
  const hidden = new Set(pickRandom(letterIndexes, hideCount));
  return chars.map((char, i) => ({ char, hidden: hidden.has(i) }));
}

// ---- Word search ----------------------------------------------------------
const WS_DIRECTIONS = [
  [0, 1], // east
  [0, -1], // west
  [1, 0], // south
  [-1, 0], // north
  [1, 1], // south-east
  [-1, -1], // north-west
  [1, -1], // south-west
  [-1, 1] // north-east
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateWordSearch(rawWords, options = {}) {
  const words = [...new Set(
    rawWords
      .map((w) => String(w).toUpperCase().replace(/[^A-Z]/g, ''))
      .filter((w) => w.length >= 2)
  )];

  const longest = words.reduce((m, w) => Math.max(m, w.length), 0);
  const size = Math.min(Math.max(options.size || longest + 2, 8), 16);

  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const placements = [];
  const unplaced = [];

  const fits = (word, r, c, [dr, dc]) => {
    const cells = [];
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) return null;
      const existing = grid[rr][cc];
      if (existing !== null && existing !== word[i]) return null;
      cells.push({ r: rr, c: cc });
    }
    return cells;
  };

  for (const word of words) {
    if (word.length > size) {
      unplaced.push(word);
      continue;
    }
    let placed = false;
    for (let attempt = 0; attempt < 120 && !placed; attempt++) {
      const dir = WS_DIRECTIONS[Math.floor(Math.random() * WS_DIRECTIONS.length)];
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      const cells = fits(word, r, c, dir);
      if (cells) {
        cells.forEach((cell, i) => {
          grid[cell.r][cell.c] = word[i];
        });
        placements.push({ word, cells });
        placed = true;
      }
    }
    if (!placed) unplaced.push(word);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = ALPHABET[Math.floor(Math.random() * 26)];
      }
    }
  }

  return { grid, size, placements, unplaced };
}

// ---- Crossword ------------------------------------------------------------
// A connected-grid crossword built greedily: the first (longest) word is laid
// across, then each subsequent word is placed where it can cross an existing
// letter without creating accidental adjacent words. Words that cannot be
// connected are returned in `unplaced`.
export function generateCrossword(entries) {
  const cleaned = entries
    .map((e) => ({
      word: String(e.word || '').toUpperCase().replace(/[^A-Z]/g, ''),
      clue: e.clue || ''
    }))
    .filter((e) => e.word.length >= 2)
    .sort((a, b) => b.word.length - a.word.length);

  if (cleaned.length === 0) {
    return { cells: [], rows: 0, cols: 0, across: [], down: [], unplaced: [] };
  }

  const occupied = new Map(); // "r,c" -> letter
  const placed = []; // { word, clue, row, col, dir }
  const unplaced = [];
  const key = (r, c) => `${r},${c}`;
  const at = (r, c) => occupied.get(key(r, c)) ?? null;

  // Lay the first word across.
  const first = cleaned[0];
  first.word.split('').forEach((ch, i) => occupied.set(key(0, i), ch));
  placed.push({ ...first, row: 0, col: 0, dir: 'across' });

  const canPlace = (word, row, col, dir) => {
    const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0];
    let intersections = 0;

    // No letter immediately before the start or after the end.
    const beforeR = row - dr;
    const beforeC = col - dc;
    const afterR = row + dr * word.length;
    const afterC = col + dc * word.length;
    if (at(beforeR, beforeC) !== null) return false;
    if (at(afterR, afterC) !== null) return false;

    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const existing = at(r, c);
      if (existing !== null) {
        if (existing !== word[i]) return false;
        intersections += 1;
      } else {
        // Empty cell: its perpendicular neighbours must be empty too, so we
        // don't run two parallel words side by side.
        if (dir === 'across') {
          if (at(r - 1, c) !== null || at(r + 1, c) !== null) return false;
        } else {
          if (at(r, c - 1) !== null || at(r, c + 1) !== null) return false;
        }
      }
    }
    return intersections >= 1;
  };

  for (let idx = 1; idx < cleaned.length; idx++) {
    const { word, clue } = cleaned[idx];
    let done = false;
    for (let i = 0; i < word.length && !done; i++) {
      for (const [k, letter] of occupied) {
        if (letter !== word[i]) continue;
        const [pr, pc] = k.split(',').map(Number);
        // Cross perpendicular to nothing in particular: try both orientations.
        for (const dir of ['down', 'across']) {
          const row = dir === 'across' ? pr : pr - i;
          const col = dir === 'across' ? pc - i : pc;
          if (canPlace(word, row, col, dir)) {
            const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0];
            word.split('').forEach((ch, j) => occupied.set(key(row + dr * j, col + dc * j), ch));
            placed.push({ word, clue, row, col, dir });
            done = true;
            break;
          }
        }
        if (done) break;
      }
    }
    if (!done) unplaced.push(word);
  }

  // Normalise coordinates so the grid starts at (0,0).
  let minR = Infinity;
  let minC = Infinity;
  let maxR = -Infinity;
  let maxC = -Infinity;
  for (const k of occupied.keys()) {
    const [r, c] = k.split(',').map(Number);
    minR = Math.min(minR, r);
    minC = Math.min(minC, c);
    maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c);
  }
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  const norm = placed.map((p) => ({ ...p, row: p.row - minR, col: p.col - minC }));

  // Build the dense solution grid.
  const cells = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const [k, letter] of occupied) {
    const [r, c] = k.split(',').map(Number);
    cells[r - minR][c - minC] = { solution: letter, number: null };
  }

  // Number the starting cells in reading order.
  const startKey = (p) => `${p.row},${p.col}`;
  const starts = [...new Set(norm.map(startKey))]
    .map((s) => s.split(',').map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const numberByCell = new Map();
  starts.forEach(([r, c], i) => {
    numberByCell.set(`${r},${c}`, i + 1);
    if (cells[r][c]) cells[r][c].number = i + 1;
  });

  const across = [];
  const down = [];
  for (const p of norm) {
    const number = numberByCell.get(startKey(p));
    const clueEntry = { number, clue: p.clue, word: p.word, row: p.row, col: p.col };
    if (p.dir === 'across') across.push(clueEntry);
    else down.push(clueEntry);
  }
  across.sort((a, b) => a.number - b.number);
  down.sort((a, b) => a.number - b.number);

  return { cells, rows, cols, across, down, unplaced };
}
