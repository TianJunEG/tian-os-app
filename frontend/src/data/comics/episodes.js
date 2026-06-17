// The Tian 7 Chronicles — episode data
// Images live in /public/comics/characters/<key>-<pose>.png
//                 /public/comics/backgrounds/<scene>.jpg
// Until real assets land, the reader shows colored placeholders.

export const MASCOT_COLORS = {
  kylo: '#1e3a5f',
  lejo: '#ea6500',
  talia: '#e8856a',
  kaesy: '#2563eb',
  chelya: '#5c7a5c',
  lysa: '#9b7ecb',
  tiano: '#38bdf8',
};

export const episodes = [
  {
    id: 'ep-001',
    slug: 'hawker-heroes',
    title: 'Hawker Heroes',
    episode: 1,
    grade: 'P3–P4',
    publishedAt: '2026-06-16',
    tagline: 'Kylo discovers that a hawker centre is basically a maths problem.',
    coverCharacters: ['kylo', 'lejo'],
    coverBg: 'hawker-centre',
    panels: [
      {
        id: 'p1',
        scene: 'hawker-centre',
        characters: [
          { key: 'kylo', pose: 'excited', side: 'left' },
          { key: 'lejo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'kylo',
            side: 'left',
            text: 'LEJO. I can smell the char kway teow from the carpark.',
          },
          {
            character: 'lejo',
            side: 'right',
            text: "We've got money but we need to count properly first.",
          },
        ],
        problem: {
          id: 'p1-q1',
          question: 'Lejo has $13 and Kylo has $7. How much money do they have altogether?',
          hint: 'Add Lejo\'s money and Kylo\'s money together: $13 + $7.',
          answer: 20,
          unit: '$',
          unitPosition: 'prefix',
          skill: 'addition-within-100',
        },
      },
      {
        id: 'p2',
        scene: 'hawker-centre',
        characters: [
          { key: 'kylo', pose: 'pointing', side: 'left' },
          { key: 'lejo', pose: 'facepalm', side: 'right' },
        ],
        speech: [
          {
            character: 'kylo',
            side: 'left',
            text: 'One char kway teow! One chicken rice! One ice kachang!',
          },
          {
            character: 'lejo',
            side: 'right',
            text: "Kylo, that's three things—",
          },
          {
            character: 'kylo',
            side: 'left',
            text: "I'm a growing boy.",
          },
        ],
        menuNote: 'Char kway teow $4 · Chicken rice $3 · Ice kachang $2 · Kaya toast $1',
        problem: {
          id: 'p2-q1',
          question: 'Kylo orders char kway teow ($4), ice kachang ($2) and chicken rice ($3). What is the total cost?',
          hint: 'Add the prices of all three items: $4 + $2 + $3.',
          answer: 9,
          unit: '$',
          unitPosition: 'prefix',
          skill: 'money-addition',
        },
      },
      {
        id: 'p3',
        scene: 'hawker-centre',
        characters: [
          { key: 'kylo', pose: 'eating', side: 'left' },
          { key: 'lejo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'kylo',
            side: 'left',
            text: 'Lejo, how much change did we get?',
          },
          {
            character: 'lejo',
            side: 'right',
            text: "You figure it out. That's your maths for today.",
          },
          {
            character: 'kylo',
            side: 'left',
            text: 'Can I not do maths for ONE meal?',
          },
        ],
        problem: {
          id: 'p3-q1',
          question: 'They paid with $20. The food cost $9. How much change did they receive?',
          hint: 'Subtract the amount spent from the amount paid: $20 − $9.',
          answer: 11,
          unit: '$',
          unitPosition: 'prefix',
          skill: 'money-subtraction',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: Kaesy has 24 stickers to share equally with 3 friends. Will everyone get the same amount?',
      character: 'kaesy',
    },
  },
  {
    id: 'ep-002',
    slug: 'sticker-squad',
    title: 'Sticker Squad',
    episode: 2,
    grade: 'P3–P4',
    publishedAt: '2026-06-23',
    tagline: 'Kaesy hands out reward stickers — but only if everyone gets exactly the same.',
    coverCharacters: ['kaesy', 'kylo'],
    coverBg: 'classroom',
    panels: [
      {
        id: 'p1',
        scene: 'classroom',
        characters: [
          { key: 'kaesy', pose: 'presenting', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'kaesy',
            side: 'left',
            text: 'Game over! I have 24 reward stickers to share equally among 3 friends.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Equally? So everyone gets the exact same amount?',
          },
          {
            character: 'kaesy',
            side: 'left',
            text: 'That is the rule. Same for everyone.',
          },
        ],
        problem: {
          id: 'e2-p1-q1',
          question: 'Kaesy shares 24 stickers equally among 3 friends. How many stickers does each friend get?',
          hint: 'Split 24 into 3 equal groups: 24 ÷ 3.',
          answer: 8,
          unit: '',
          unitPosition: 'suffix',
          skill: 'division-equal-sharing',
        },
      },
      {
        id: 'p2',
        scene: 'classroom',
        characters: [
          { key: 'kaesy', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'kaesy',
            side: 'left',
            text: 'Next round! 36 stickers, but now there are 4 of us sharing.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'More stickers AND more friends. Let me work it out.',
          },
        ],
        problem: {
          id: 'e2-p2-q1',
          question: 'Kaesy shares 36 stickers equally among 4 friends. How many stickers does each friend get?',
          hint: 'Split 36 into 4 equal groups: 36 ÷ 4.',
          answer: 9,
          unit: '',
          unitPosition: 'suffix',
          skill: 'division-within-tables',
        },
      },
      {
        id: 'p3',
        scene: 'classroom',
        characters: [
          { key: 'kaesy', pose: 'cheeky', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'kaesy',
            side: 'left',
            text: 'Last batch — 30 stickers among 4 of us. Uh oh.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: '30 does not split evenly into 4... some will be left over!',
          },
          {
            character: 'kaesy',
            side: 'left',
            text: 'And the leftovers? Rewards mascot keeps those.',
          },
        ],
        problem: {
          id: 'e2-p3-q1',
          question: 'Kaesy shares 30 stickers equally among 4 friends. How many stickers are left over?',
          hint: 'Each friend gets 7 (because 4 × 7 = 28). Then 30 − 28 tells you how many are left over.',
          answer: 2,
          unit: '',
          unitPosition: 'suffix',
          skill: 'division-with-remainder',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: Talia is planning a class party on a $50 budget. How far will it stretch?',
      character: 'talia',
    },
  },
  {
    id: 'ep-003',
    slug: 'party-planner',
    title: 'Party Planner',
    episode: 3,
    grade: 'P3–P4',
    publishedAt: '2026-06-30',
    tagline: 'Talia has $50 to throw the class a party — every dollar has to count.',
    coverCharacters: ['talia', 'kylo'],
    coverBg: 'party-shop',
    panels: [
      {
        id: 'p1',
        scene: 'party-shop',
        characters: [
          { key: 'talia', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'talia',
            side: 'left',
            text: "I've got $50 to plan our class party. Let's start with the decorations.",
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Balloons! A party needs balloons.',
          },
        ],
        problem: {
          id: 'e3-p1-q1',
          question: 'Talia buys balloons for $8 and a banner for $6. How much does she spend on decorations altogether?',
          hint: 'Add the two prices together: $8 + $6.',
          answer: 14,
          unit: '$',
          unitPosition: 'prefix',
          skill: 'money-addition',
        },
      },
      {
        id: 'p2',
        scene: 'party-shop',
        characters: [
          { key: 'talia', pose: 'thinking', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'talia',
            side: 'left',
            text: 'Now the food. Let me get pizzas — 5 of them.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: "Five pizzas? Now we're talking.",
          },
        ],
        problem: {
          id: 'e3-p2-q1',
          question: 'Talia buys 5 pizzas that cost $4 each. How much do the pizzas cost in total?',
          hint: '5 groups of $4. Multiply: 5 × 4, or add $4 five times.',
          answer: 20,
          unit: '$',
          unitPosition: 'prefix',
          skill: 'money-multiplication',
        },
      },
      {
        id: 'p3',
        scene: 'party-shop',
        characters: [
          { key: 'talia', pose: 'happy', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'talia',
            side: 'left',
            text: 'Decorations and food are sorted. How much of our $50 is left?',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Enough for a treat, I hope!',
          },
          {
            character: 'talia',
            side: 'left',
            text: "Let's work it out together.",
          },
        ],
        problem: {
          id: 'e3-p3-q1',
          question: 'Talia started with $50 and spent $14 on decorations and $20 on food. How much money does she have left?',
          hint: 'First add what she spent: $14 + $20 = $34. Then subtract that from $50.',
          answer: 16,
          unit: '$',
          unitPosition: 'prefix',
          skill: 'money-subtraction',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: Lejo cracks a tricky number-pattern puzzle. Can you spot what comes next?',
      character: 'lejo',
    },
  },
  {
    id: 'ep-004',
    slug: 'pattern-detective',
    title: 'Pattern Detective',
    episode: 4,
    grade: 'P3–P4',
    publishedAt: '2026-07-07',
    tagline: 'Lejo says every pattern has a rule — find it, and you can predict what comes next.',
    coverCharacters: ['lejo', 'kylo'],
    coverBg: 'study-den',
    panels: [
      {
        id: 'p1',
        scene: 'study-den',
        characters: [
          { key: 'lejo', pose: 'pointing', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'lejo',
            side: 'left',
            text: 'Patterns are everywhere, Kylo. Find the rule and you can predict what comes next.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Okay, detective. Show me.',
          },
        ],
        problem: {
          id: 'e4-p1-q1',
          question: 'Look at this pattern: 3, 6, 9, 12, … What number comes next?',
          hint: 'Each number goes up by the same amount. 3, 6, 9, 12 — what is being added each time?',
          answer: 15,
          unit: '',
          unitPosition: 'suffix',
          skill: 'number-patterns',
        },
      },
      {
        id: 'p2',
        scene: 'study-den',
        characters: [
          { key: 'lejo', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'lejo',
            side: 'left',
            text: "This one's trickier. The numbers don't grow by adding the same amount.",
          },
          {
            character: 'kylo',
            side: 'right',
            text: "Wait… they're doubling!",
          },
        ],
        problem: {
          id: 'e4-p2-q1',
          question: 'Look at this pattern: 2, 4, 8, 16, … What number comes next?',
          hint: 'Each number is the one before it multiplied by 2.',
          answer: 32,
          unit: '',
          unitPosition: 'suffix',
          skill: 'number-patterns',
        },
      },
      {
        id: 'p3',
        scene: 'study-den',
        characters: [
          { key: 'lejo', pose: 'aha', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'lejo',
            side: 'left',
            text: 'Final puzzle. The gaps between the numbers keep changing.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: '1, 4, 9, 16… the jumps get bigger each time.',
          },
          {
            character: 'lejo',
            side: 'left',
            text: "Spot the rule and you've cracked it.",
          },
        ],
        problem: {
          id: 'e4-p3-q1',
          question: 'Look at this pattern: 1, 4, 9, 16, … What number comes next?',
          hint: 'Look at the gaps: +3, then +5, then +7. The gap grows by 2 each time, so the next gap is +9.',
          answer: 25,
          unit: '',
          unitPosition: 'suffix',
          skill: 'number-patterns',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: Chelya measures up — how many centimetres long is her mystery ribbon?',
      character: 'chelya',
    },
  },
  {
    id: 'ep-005',
    slug: 'measure-up',
    title: 'Measure Up',
    episode: 5,
    grade: 'P3–P4',
    publishedAt: '2026-07-14',
    tagline: 'Chelya is crafting a progress banner — and every centimetre has to be just right.',
    coverCharacters: ['chelya', 'kylo'],
    coverBg: 'craft-room',
    panels: [
      {
        id: 'p1',
        scene: 'craft-room',
        characters: [
          { key: 'chelya', pose: 'measuring', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'chelya',
            side: 'left',
            text: "I'm making a banner to celebrate everyone's progress. First, the ribbon.",
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Two pieces? Better measure them.',
          },
        ],
        problem: {
          id: 'e5-p1-q1',
          question: 'Chelya joins a 35 cm ribbon and a 28 cm ribbon end to end. How long is the ribbon now?',
          hint: 'Add the two lengths together: 35 cm + 28 cm.',
          answer: 63,
          unit: ' cm',
          unitPosition: 'suffix',
          skill: 'measurement-length-addition',
        },
      },
      {
        id: 'p2',
        scene: 'craft-room',
        characters: [
          { key: 'chelya', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'chelya',
            side: 'left',
            text: 'This long ribbon is 90 cm, but I only need part of it.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'So you cut some off. How much is left?',
          },
        ],
        problem: {
          id: 'e5-p2-q1',
          question: 'Chelya cuts 35 cm off a 90 cm ribbon. How many centimetres are left?',
          hint: 'Take away the piece she cut: 90 cm − 35 cm.',
          answer: 55,
          unit: ' cm',
          unitPosition: 'suffix',
          skill: 'measurement-length-subtraction',
        },
      },
      {
        id: 'p3',
        scene: 'craft-room',
        characters: [
          { key: 'chelya', pose: 'happy', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'chelya',
            side: 'left',
            text: 'Last step — 4 equal ribbons, each 25 cm, laid in a row.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: "That's 100 cm altogether. Is that a whole metre?",
          },
          {
            character: 'chelya',
            side: 'left',
            text: 'You tell me.',
          },
        ],
        problem: {
          id: 'e5-p3-q1',
          question: 'Four ribbons, each 25 cm, laid end to end, measure 100 cm in total. How many metres is that?',
          hint: 'Remember: 100 cm makes 1 metre.',
          answer: 1,
          unit: ' m',
          unitPosition: 'suffix',
          skill: 'measurement-conversion-cm-m',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: Tiano sets the squad a time challenge — how many minutes until the big match?',
      character: 'tiano',
    },
  },
  {
    id: 'ep-006',
    slug: 'beat-the-clock',
    title: 'Beat the Clock',
    episode: 6,
    grade: 'P3–P4',
    publishedAt: '2026-07-21',
    tagline: 'Captain Tiano runs a tight ship — and kick-off waits for no one.',
    coverCharacters: ['tiano', 'kylo'],
    coverBg: 'sports-field',
    panels: [
      {
        id: 'p1',
        scene: 'sports-field',
        characters: [
          { key: 'tiano', pose: 'pointing', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'tiano',
            side: 'left',
            text: "Listen up, team. Kick-off is at 3 o'clock sharp. We don't waste a second.",
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'What time is it now, captain?',
          },
          {
            character: 'tiano',
            side: 'left',
            text: 'Quarter past 2. You do the maths.',
          },
        ],
        problem: {
          id: 'e6-p1-q1',
          question: 'It is 2:15 now and the match kicks off at 3:00. How many minutes until kick-off?',
          hint: 'Count on from 2:15 to 3:00. From 2:15 to 3:00 is 45 minutes.',
          answer: 45,
          unit: ' min',
          unitPosition: 'suffix',
          skill: 'time-duration',
        },
      },
      {
        id: 'p2',
        scene: 'sports-field',
        characters: [
          { key: 'tiano', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'tiano',
            side: 'left',
            text: 'The match is two halves, 40 minutes each.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'So how long do we actually play?',
          },
        ],
        problem: {
          id: 'e6-p2-q1',
          question: 'A match has two halves of 40 minutes each. How many minutes of play is that in total?',
          hint: 'Two halves of 40 minutes: 40 × 2, or 40 + 40.',
          answer: 80,
          unit: ' min',
          unitPosition: 'suffix',
          skill: 'time-multiplication',
        },
      },
      {
        id: 'p3',
        scene: 'sports-field',
        characters: [
          { key: 'tiano', pose: 'confident', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'tiano',
            side: 'left',
            text: 'Add the 15-minute half-time and the whole thing runs 95 minutes.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: "95 minutes… that's more than an hour!",
          },
          {
            character: 'tiano',
            side: 'left',
            text: 'One hour and how many minutes? Last one, rookie.',
          },
        ],
        problem: {
          id: 'e6-p3-q1',
          question: 'The whole match, including half-time, lasts 95 minutes. That is 1 hour and how many minutes?',
          hint: '1 hour is 60 minutes. Take 60 away from 95 to find the extra minutes.',
          answer: 35,
          unit: ' min',
          unitPosition: 'suffix',
          skill: 'time-conversion-min-to-hour',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: Lysa reads the score chart — which team is really winning the league?',
      character: 'lysa',
    },
  },
  {
    id: 'ep-007',
    slug: 'chart-champions',
    title: 'Chart Champions',
    episode: 7,
    grade: 'P3–P4',
    publishedAt: '2026-07-28',
    tagline: 'The whole Tian 7 is here — Lysa reads the league chart to settle who is really on top.',
    coverCharacters: ['lysa', 'kylo'],
    coverBg: 'common-room',
    panels: [
      {
        id: 'p1',
        scene: 'common-room',
        characters: [
          { key: 'lysa', pose: 'presenting', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'lysa',
            side: 'left',
            text: "The league chart is up! Let's see who is really on top.",
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'The Bears are way ahead of the Eagles!',
          },
        ],
        menuNote: 'League points — Lions 12 · Tigers 9 · Bears 15 · Eagles 6',
        problem: {
          id: 'e7-p1-q1',
          question: 'On the chart, the Bears have 15 points and the Eagles have 6 points. How many more points do the Bears have than the Eagles?',
          hint: 'Find the difference: 15 − 6.',
          answer: 9,
          unit: '',
          unitPosition: 'suffix',
          skill: 'data-bar-chart-difference',
        },
      },
      {
        id: 'p2',
        scene: 'common-room',
        characters: [
          { key: 'lysa', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'lysa',
            side: 'left',
            text: 'Now add the two middle teams — the Lions and the Tigers.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Twelve and nine…',
          },
        ],
        menuNote: 'League points — Lions 12 · Tigers 9 · Bears 15 · Eagles 6',
        problem: {
          id: 'e7-p2-q1',
          question: 'The Lions have 12 points and the Tigers have 9 points. How many points do the Lions and Tigers have altogether?',
          hint: 'Add the two values: 12 + 9.',
          answer: 21,
          unit: '',
          unitPosition: 'suffix',
          skill: 'data-addition',
        },
      },
      {
        id: 'p3',
        scene: 'common-room',
        characters: [
          { key: 'lysa', pose: 'happy', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'lysa',
            side: 'left',
            text: 'Final question: how many points were scored across the whole league?',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'All four teams added up!',
          },
          {
            character: 'lysa',
            side: 'left',
            text: 'Exactly. Read every bar on the chart.',
          },
        ],
        menuNote: 'League points — Lions 12 · Tigers 9 · Bears 15 · Eagles 6',
        problem: {
          id: 'e7-p3-q1',
          question: 'Add up all four teams: 12 + 9 + 15 + 6. What is the total number of points scored in the league?',
          hint: 'Add them step by step: 12 + 9 = 21, then + 15 = 36, then + 6.',
          answer: 42,
          unit: '',
          unitPosition: 'suffix',
          skill: 'data-total',
        },
      },
    ],
    nextEpisode: {
      teaser: "That's the whole Tian 7! Next up: Talia and Kylo split a feast — but only if every share is fair.",
      character: 'talia',
    },
  },
  {
    id: 'ep-008',
    slug: 'fair-shares',
    title: 'Fair Shares',
    episode: 8,
    grade: 'P3–P4',
    publishedAt: '2026-08-04',
    tagline: 'Talia will only share the food if every portion is an exactly fair fraction.',
    coverCharacters: ['talia', 'kylo'],
    coverBg: 'hawker-centre',
    panels: [
      {
        id: 'p1',
        scene: 'hawker-centre',
        characters: [
          { key: 'talia', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'talia',
            side: 'left',
            text: "Pizza time! It's cut into 8 equal slices. We share fairly, agreed?",
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Half for you, half for me. How many slices is half?',
          },
        ],
        problem: {
          id: 'e8-p1-q1',
          question: 'A pizza is cut into 8 equal slices. How many slices make up 1/2 of the pizza?',
          hint: 'One half means splitting the 8 slices into 2 equal groups: 8 ÷ 2.',
          answer: 4,
          unit: '',
          unitPosition: 'suffix',
          skill: 'fraction-of-quantity',
        },
      },
      {
        id: 'p2',
        scene: 'hawker-centre',
        characters: [
          { key: 'talia', pose: 'thinking', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'talia',
            side: 'left',
            text: 'This kaya cake has 6 equal pieces. You may take one third.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'One third of six… let me work it out.',
          },
        ],
        problem: {
          id: 'e8-p2-q1',
          question: 'A cake is cut into 6 equal pieces. How many pieces make up 1/3 of the cake?',
          hint: 'One third means splitting the 6 pieces into 3 equal groups: 6 ÷ 3.',
          answer: 2,
          unit: '',
          unitPosition: 'suffix',
          skill: 'fraction-of-quantity',
        },
      },
      {
        id: 'p3',
        scene: 'hawker-centre',
        characters: [
          { key: 'talia', pose: 'happy', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'talia',
            side: 'left',
            text: "Last one. I have 12 sweets, and I'll give away three quarters.",
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Three quarters of twelve — that is a lot of sweets!',
          },
          {
            character: 'talia',
            side: 'left',
            text: 'Work it out and they are all yours.',
          },
        ],
        problem: {
          id: 'e8-p3-q1',
          question: 'Talia has 12 sweets and gives away 3/4 of them. How many sweets does she give away?',
          hint: 'First find 1/4 of 12 (that is 12 ÷ 4 = 3). Three quarters is 3 lots of that.',
          answer: 9,
          unit: '',
          unitPosition: 'suffix',
          skill: 'fraction-of-set',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: shapes, sides and angles — can the crew spot the odd one out?',
      character: 'kaesy',
    },
  },
  {
    id: 'ep-009',
    slug: 'shape-squad',
    title: 'Shape Squad',
    episode: 9,
    grade: 'P3–P4',
    publishedAt: '2026-08-11',
    tagline: 'Kaesy drills the crew on shapes — count every side and corner correctly.',
    coverCharacters: ['kaesy', 'kylo'],
    coverBg: 'study-den',
    panels: [
      {
        id: 'p1',
        scene: 'study-den',
        characters: [
          { key: 'kaesy', pose: 'presenting', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'kaesy',
            side: 'left',
            text: 'Welcome to Shape Squad! First up — this hexagon. Count its sides.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: "Sides of a hexagon… I've got this.",
          },
        ],
        problem: {
          id: 'e9-p1-q1',
          question: 'How many sides does a hexagon have?',
          hint: 'A hexagon is the six-sided shape — think of a honeycomb cell.',
          answer: 6,
          unit: '',
          unitPosition: 'suffix',
          skill: '2d-shape-sides',
        },
      },
      {
        id: 'p2',
        scene: 'study-den',
        characters: [
          { key: 'kaesy', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'kaesy',
            side: 'left',
            text: 'Now a pentagon. How many corners does it have?',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Corners means the pointy bits, right?',
          },
        ],
        problem: {
          id: 'e9-p2-q1',
          question: 'How many corners (vertices) does a pentagon have?',
          hint: 'A pentagon has the same number of corners as sides — and a pentagon has 5 sides.',
          answer: 5,
          unit: '',
          unitPosition: 'suffix',
          skill: '2d-shape-vertices',
        },
      },
      {
        id: 'p3',
        scene: 'study-den',
        characters: [
          { key: 'kaesy', pose: 'cheeky', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'kaesy',
            side: 'left',
            text: 'Final challenge — add up ALL the sides: a triangle, a square and a pentagon.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Three, four and five sides…',
          },
          {
            character: 'kaesy',
            side: 'left',
            text: 'Total them up, Squad!',
          },
        ],
        problem: {
          id: 'e9-p3-q1',
          question: 'A triangle has 3 sides, a square has 4 sides and a pentagon has 5 sides. How many sides do they have altogether?',
          hint: 'Add the three amounts: 3 + 4 + 5.',
          answer: 12,
          unit: '',
          unitPosition: 'suffix',
          skill: '2d-shape-sides-total',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: Lejo weighs in — grams, kilograms and a mystery parcel.',
      character: 'lejo',
    },
  },
  {
    id: 'ep-010',
    slug: 'weighing-in',
    title: 'Weighing In',
    episode: 10,
    grade: 'P3–P4',
    publishedAt: '2026-08-18',
    tagline: 'Parcel duty at the post desk — Lejo needs every mass measured to the gram.',
    coverCharacters: ['lejo', 'kylo'],
    coverBg: 'classroom',
    panels: [
      {
        id: 'p1',
        scene: 'classroom',
        characters: [
          { key: 'lejo', pose: 'pointing', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'lejo',
            side: 'left',
            text: 'Post duty! Two parcels to weigh — 250 g and 350 g.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Add them for the total weight?',
          },
        ],
        problem: {
          id: 'e10-p1-q1',
          question: 'One parcel weighs 250 g and another weighs 350 g. What is their total mass?',
          hint: 'Add the two masses: 250 g + 350 g.',
          answer: 600,
          unit: ' g',
          unitPosition: 'suffix',
          skill: 'mass-addition',
        },
      },
      {
        id: 'p2',
        scene: 'classroom',
        characters: [
          { key: 'lejo', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'lejo',
            side: 'left',
            text: 'This bag of flour says 1 kilogram. How many grams is that?',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Kilograms to grams… I remember this one.',
          },
        ],
        problem: {
          id: 'e10-p2-q1',
          question: 'How many grams are there in 1 kilogram?',
          hint: 'Remember the rule: 1 kilogram = 1000 grams.',
          answer: 1000,
          unit: ' g',
          unitPosition: 'suffix',
          skill: 'mass-conversion-kg-g',
        },
      },
      {
        id: 'p3',
        scene: 'classroom',
        characters: [
          { key: 'lejo', pose: 'aha', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'lejo',
            side: 'left',
            text: 'A box and a book together weigh 1500 g. The book alone is 600 g.',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'So the box is the difference…',
          },
          {
            character: 'lejo',
            side: 'left',
            text: 'Find the mass of the box.',
          },
        ],
        problem: {
          id: 'e10-p3-q1',
          question: 'A box and a book together weigh 1500 g. The book weighs 600 g. What is the mass of the box?',
          hint: 'Take the book away from the total: 1500 g − 600 g.',
          answer: 900,
          unit: ' g',
          unitPosition: 'suffix',
          skill: 'mass-subtraction',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: Chelya pours it out — millilitres, litres and a very leaky jug.',
      character: 'chelya',
    },
  },
  {
    id: 'ep-011',
    slug: 'topped-up',
    title: 'Topped Up',
    episode: 11,
    grade: 'P3–P4',
    publishedAt: '2026-08-25',
    tagline: 'Smoothie station is open — Chelya needs every pour measured to the millilitre.',
    coverCharacters: ['chelya', 'kylo'],
    coverBg: 'hawker-centre',
    panels: [
      {
        id: 'p1',
        scene: 'hawker-centre',
        characters: [
          { key: 'chelya', pose: 'measuring', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'chelya',
            side: 'left',
            text: "Smoothie station! This jug holds 400 ml, and I'll pour in 350 ml more.",
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Add them for the total?',
          },
        ],
        problem: {
          id: 'e11-p1-q1',
          question: 'A jug holds 400 ml of juice. Chelya adds 350 ml more. How much juice is in the jug now?',
          hint: 'Add the two amounts: 400 ml + 350 ml.',
          answer: 750,
          unit: ' ml',
          unitPosition: 'suffix',
          skill: 'capacity-addition',
        },
      },
      {
        id: 'p2',
        scene: 'hawker-centre',
        characters: [
          { key: 'chelya', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'chelya',
            side: 'left',
            text: 'This bottle says 1 litre. How many millilitres is that?',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Litres to millilitres… I know this!',
          },
        ],
        problem: {
          id: 'e11-p2-q1',
          question: 'How many millilitres are there in 1 litre?',
          hint: 'Remember the rule: 1 litre = 1000 millilitres.',
          answer: 1000,
          unit: ' ml',
          unitPosition: 'suffix',
          skill: 'capacity-conversion-l-ml',
        },
      },
      {
        id: 'p3',
        scene: 'hawker-centre',
        characters: [
          { key: 'chelya', pose: 'happy', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'chelya',
            side: 'left',
            text: 'Our 1000 ml flask is filled to 750 ml. How much more will fit?',
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Take 750 away from 1000…',
          },
          {
            character: 'chelya',
            side: 'left',
            text: 'Top it up!',
          },
        ],
        problem: {
          id: 'e11-p3-q1',
          question: 'A flask holds 1000 ml. It is filled to 750 ml. How many more millilitres are needed to fill it?',
          hint: 'Find the difference: 1000 ml − 750 ml.',
          answer: 250,
          unit: ' ml',
          unitPosition: 'suffix',
          skill: 'capacity-subtraction',
        },
      },
    ],
    nextEpisode: {
      teaser: "Next week: Kylo faces Lejo's times-table challenge — speed and accuracy!",
      character: 'kylo',
    },
  },
  {
    id: 'ep-012',
    slug: 'table-master',
    title: 'Table Master',
    episode: 12,
    grade: 'P3–P4',
    publishedAt: '2026-09-01',
    tagline: 'Lejo puts Kylo through a times-table gauntlet — no calculators allowed.',
    coverCharacters: ['kylo', 'lejo'],
    coverBg: 'study-den',
    panels: [
      {
        id: 'p1',
        scene: 'study-den',
        characters: [
          { key: 'kylo', pose: 'excited', side: 'left' },
          { key: 'lejo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'lejo',
            side: 'right',
            text: "Times-table drill, rookie. Quick — what's 7 times 6?",
          },
          {
            character: 'kylo',
            side: 'left',
            text: 'Seven sixes… give me a second!',
          },
        ],
        problem: {
          id: 'e12-p1-q1',
          question: 'What is 7 × 6?',
          hint: 'Seven sixes. If you know 7 × 5 = 35, add one more 7 to get 7 × 6.',
          answer: 42,
          unit: '',
          unitPosition: 'suffix',
          skill: 'multiplication-tables',
        },
      },
      {
        id: 'p2',
        scene: 'study-den',
        characters: [
          { key: 'kylo', pose: 'pointing', side: 'left' },
          { key: 'lejo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'lejo',
            side: 'right',
            text: 'Word problem. A box holds 8 cupcakes. There are 4 boxes.',
          },
          {
            character: 'kylo',
            side: 'left',
            text: 'Four lots of eight!',
          },
        ],
        problem: {
          id: 'e12-p2-q1',
          question: 'A box holds 8 cupcakes. How many cupcakes are there in 4 boxes?',
          hint: '4 groups of 8: multiply 4 × 8.',
          answer: 32,
          unit: '',
          unitPosition: 'suffix',
          skill: 'multiplication-word-problem',
        },
      },
      {
        id: 'p3',
        scene: 'study-den',
        characters: [
          { key: 'kylo', pose: 'standing', side: 'left' },
          { key: 'lejo', pose: 'aha', side: 'right' },
        ],
        speech: [
          {
            character: 'lejo',
            side: 'right',
            text: 'Two steps now. Kylo buys 3 packs of 6 stickers, then gets 5 more free.',
          },
          {
            character: 'kylo',
            side: 'left',
            text: 'Multiply first, then add the extra…',
          },
          {
            character: 'lejo',
            side: 'right',
            text: 'Exactly. Order matters.',
          },
        ],
        problem: {
          id: 'e12-p3-q1',
          question: 'Kylo buys 3 packs of 6 stickers and is given 5 more. How many stickers does he have altogether?',
          hint: 'First multiply: 3 × 6 = 18. Then add the 5 free stickers.',
          answer: 23,
          unit: '',
          unitPosition: 'suffix',
          skill: 'multiplication-multistep',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: Tiano maps out the pitch — perimeter, sides and distance.',
      character: 'tiano',
    },
  },
];

export function getEpisode(slug) {
  return episodes.find((e) => e.slug === slug) ?? null;
}

export function getLatestEpisode() {
  return episodes[episodes.length - 1];
}
