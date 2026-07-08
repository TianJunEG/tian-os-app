// ELPath · Comprehension Cloze — passage bank (prototype)
// ----------------------------------------------------------------------------
// One real P6 open-cloze passage, marked up for the grader. `{n}` in `text` is
// blank n; each blank carries:
//   accept — every word a marker would accept (the answer + valid alternatives)
//   skill  — grammar | collocation | content  (drives the per-skill readiness)
//   note   — a one-line "why" shown in feedback
// A real deployment harvests dozens of these from papers with the same pipeline
// used for the vocabulary bank; this single passage proves the grader.

export const clozePassages = [
  {
    id: 'cz_p6_museum_of_toys',
    level: 'P6',
    source: 'Prelim (open cloze)',
    title: 'The Museum of Toys',
    text:
      'The Museum of Toys is nestled in the heart of our city. Driven by his passion for design and art, Marcus, an enthusiastic toy {46}, often imagined a space where visitors from all {47} of life could rediscover the past, and rekindle childhood memories of playing with favourite figurines and stuffed toys. His dream finally came true in 2007 when he successfully set up this museum, {48} his personal collection from more than forty countries.\n\n' +
      'Offering a fascinating journey through time, the museum displays toys from the 1840s. Toys {49} action figures, wind-up robots and miniature cars awe children and adults {50}. These toys were carefully designed to move or make sounds when {51} up with a key in the winding slot, showing the creativity of the toy designers. {52} of the highlights of the museum is the mechanical toy, which can be powered by winding a key, {53} a button, or pushing a lever, {54} of relying on batteries.\n\n' +
      '"These toys were not mere ornaments. In fact, they were companions during our childhood days," said the museum owner, his {55} carrying a note of nostalgia. He hoped that the place would provide visitors with a holistic experience, educating them about the stories behind each toy and how toys had gradually evolved {56} the years.\n\n' +
      'It is indeed amazing to note {57} these toy characters were part of the children’s playtime {58} technology took over. Central to the museum’s mission of learning and discovery, the place offers an educational experience which helps visitors {59} to the past in an entertaining and informative way. Truly, the Museum of Toys is a magical place where toys come to {60}.',
    blanks: [
      { n: 46, accept: ['designer', 'enthusiast', 'collector', 'lover', 'maker', 'hobbyist', 'fanatic'], skill: 'content', note: 'a noun for someone passionate about toys' },
      { n: 47, accept: ['walks'], skill: 'collocation', note: "fixed phrase: 'all walks of life'" },
      { n: 48, accept: ['showcasing', 'displaying', 'featuring', 'using', 'exhibiting', 'presenting', 'housing'], skill: 'content', note: 'a verb introducing the collection' },
      { n: 49, accept: ['like', 'including', 'from', 'spanning'], skill: 'grammar', note: 'introduces examples of toys' },
      { n: 50, accept: ['alike'], skill: 'collocation', note: "collocation: 'children and adults alike'" },
      { n: 51, accept: ['wound'], skill: 'content', note: "past form of 'wind' (wind up with a key)" },
      { n: 52, accept: ['one'], skill: 'grammar', note: "'One of the highlights ...'" },
      { n: 53, accept: ['pressing', 'pushing'], skill: 'content', note: 'parallel with "winding" and "pushing"' },
      { n: 54, accept: ['instead'], skill: 'grammar', note: "'instead of' — a contrast connector" },
      { n: 55, accept: ['voice', 'eyes', 'tone', 'expression', 'face'], skill: 'content', note: 'a noun that can carry nostalgia' },
      { n: 56, accept: ['over', 'through', 'across', 'throughout'], skill: 'grammar', note: "'over/through the years'" },
      { n: 57, accept: ['how', 'that'], skill: 'grammar', note: "'note how/that ...'" },
      { n: 58, accept: ['before', 'until', 'when'], skill: 'grammar', note: 'a time conjunction' },
      { n: 59, accept: ['connect', 'relate', 'reconnect', 'link', 'travel', 'journey', 'return'], skill: 'content', note: 'a verb: connect to the past' },
      { n: 60, accept: ['life'], skill: 'collocation', note: "idiom: 'come to life'" },
    ],
  },
];

export const SKILL_LABELS = { grammar: 'Grammar', collocation: 'Collocations & idioms', content: 'Vocabulary' };
