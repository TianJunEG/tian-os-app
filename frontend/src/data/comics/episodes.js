// The Tian 7 Chronicles — episode data
// Images live in /public/comics/characters/<key>-<pose>.png
//                 /public/comics/backgrounds/<scene>.jpg
// Until real assets land, the reader shows colored placeholders.
//
// A problem may define `generate(rng, tier, ctx)` to scale its numbers to the
// reader's level while keeping the same story (see comicDifficulty.js). It
// returns the dynamic fields (question/hint/answer, and menuNote when prices
// change); static fields (id/unit/skill) stay on the object. `ctx` is shared
// across an episode's panels so story-linked values stay consistent.
import { rint, pick, tierInt, POLYGONS } from './comicDifficulty';

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
          unit: '$',
          unitPosition: 'prefix',
          skill: 'addition-within-100',
          generate: (rng, tier) => {
            const band = [[3, 9], [12, 49], [25, 150], [120, 850]];
            const a = tierInt(rng, tier, band);
            const b = tierInt(rng, tier, band);
            return {
              question: `Lejo has $${a} and Kylo has $${b}. How much money do they have altogether?`,
              hint: `Add Lejo's money and Kylo's money together: $${a} + $${b}.`,
              answer: a + b,
            };
          },
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
            text: 'Char kway teow! Chicken rice! Ice kachang! Load me up!',
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
          unit: '$',
          unitPosition: 'prefix',
          skill: 'money-addition',
          generate: (rng, tier, ctx) => {
            // Hawker prices stay realistic ($2–9). Difficulty comes from the
            // QUANTITY Kylo orders (repeated addition → multiplication), not from
            // inflating prices to silly amounts.
            const price = () => rint(rng, 2, 9);
            const ckt = price(), cr = price(), ik = price(), kt = price();
            const qtyBand = [[1, 1], [1, 3], [2, 5], [3, 8]]; // ordered-quantity range per tier
            const qCkt = tierInt(rng, tier, qtyBand);
            const qIk = tierInt(rng, tier, qtyBand);
            const qCr = tierInt(rng, tier, qtyBand);
            const total = qCkt * ckt + qIk * ik + qCr * cr;
            ctx.foodTotal = total; // panel 3 reuses this
            return {
              menuNote: `Char kway teow $${ckt} · Chicken rice $${cr} · Ice kachang $${ik} · Kaya toast $${kt}`,
              question: `Kylo orders ${qCkt} char kway teow (at $${ckt} each), ${qIk} ice kachang (at $${ik} each) and ${qCr} chicken rice (at $${cr} each). What is the total cost?`,
              hint: `Multiply each price by how many, then add: ${qCkt}×$${ckt} + ${qIk}×$${ik} + ${qCr}×$${cr}.`,
              answer: total,
            };
          },
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
          unit: '$',
          unitPosition: 'prefix',
          skill: 'money-subtraction',
          generate: (rng, tier, ctx) => {
            // Reuse the meal total from panel 2 so the story stays consistent.
            const food = ctx.foodTotal ?? tierInt(rng, tier, [[5, 9], [15, 40], [40, 150], [150, 700]]);
            const step = food < 20 ? 5 : food < 100 ? 10 : 50;       // pay with a round note
            const paid = (Math.floor(food / step) + 1 + rint(rng, 0, 1)) * step;
            return {
              question: `They paid with $${paid}. The food cost $${food}. How much change did they receive?`,
              hint: `Subtract the amount spent from the amount paid: $${paid} − $${food}.`,
              answer: paid - food,
            };
          },
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
            text: (ctx) => `Game over! I have ${ctx.ep2p1total} reward stickers to share equally among ${ctx.ep2p1friends} friends.`,
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
          generate: (rng, tier, ctx) => {
            const friends = tierInt(rng, tier, [[2, 3], [2, 4], [3, 6], [4, 8]]);
            const each = tierInt(rng, tier, [[3, 6], [4, 9], [6, 12], [8, 15]]);
            const total = friends * each;
            ctx.ep2p1friends = friends;
            ctx.ep2p1total = total;
            return {
              question: `Kaesy shares ${total} stickers equally among ${friends} friends. How many stickers does each friend get?`,
              hint: `Split ${total} into ${friends} equal groups: ${total} ÷ ${friends}.`,
              answer: each,
            };
          },
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
            text: (ctx) => `Next round! ${ctx.ep2p2total} stickers, but now there are ${ctx.ep2p2friends} of us sharing.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'More stickers AND more friends. Let me work it out.',
          },
        ],
        problem: {
          id: 'e2-p2-q1',
          generate: (rng, tier, ctx) => {
            const friends = tierInt(rng, tier, [[3, 4], [3, 5], [4, 7], [5, 9]]);
            const each = tierInt(rng, tier, [[3, 7], [5, 9], [7, 12], [9, 15]]);
            const total = friends * each;
            ctx.ep2p2friends = friends;
            ctx.ep2p2total = total;
            return {
              question: `Kaesy shares ${total} stickers equally among ${friends} friends. How many stickers does each friend get?`,
              hint: `Split ${total} into ${friends} equal groups: ${total} ÷ ${friends}.`,
              answer: each,
            };
          },
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
            text: (ctx) => `Last batch — ${ctx.ep2p3total} stickers among ${ctx.ep2p3friends} of us. Uh oh.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `${ctx.ep2p3total} does not split evenly into ${ctx.ep2p3friends}... some will be left over!`,
          },
          {
            character: 'kaesy',
            side: 'left',
            text: 'And the leftovers? Rewards mascot keeps those.',
          },
        ],
        problem: {
          id: 'e2-p3-q1',
          generate: (rng, tier, ctx) => {
            const friends = tierInt(rng, tier, [[3, 4], [3, 5], [4, 6], [5, 8]]);
            const each = tierInt(rng, tier, [[4, 7], [5, 9], [7, 12], [9, 15]]);
            const rem = rint(rng, 1, friends - 1);
            const total = friends * each + rem;
            ctx.ep2p3friends = friends;
            ctx.ep2p3total = total;
            return {
              question: `Kaesy shares ${total} stickers equally among ${friends} friends. How many stickers are left over?`,
              hint: `Each friend gets ${each} (because ${friends} × ${each} = ${friends * each}). Then ${total} − ${friends * each} tells you how many are left over.`,
              answer: rem,
            };
          },
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
            text: "I've got a budget to plan our class party. Let's start with the decorations.",
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Balloons! A party needs balloons.',
          },
        ],
        problem: {
          id: 'e3-p1-q1',
          generate: (rng, tier) => {
            const band = [[3, 9], [5, 15], [8, 30], [15, 60]];
            const balloons = tierInt(rng, tier, band);
            const banner = tierInt(rng, tier, band);
            return {
              question: `Talia buys balloons for $${balloons} and a banner for $${banner}. How much does she spend on decorations altogether?`,
              hint: `Add the two prices together: $${balloons} + $${banner}.`,
              answer: balloons + banner,
            };
          },
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
            text: (ctx) => `Now the food. Let me get pizzas — ${ctx.ep3pizzaQty} of them.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `${ctx.ep3pizzaQty} pizzas? Now we're talking.`,
          },
        ],
        problem: {
          id: 'e3-p2-q1',
          generate: (rng, tier, ctx) => {
            const qty = tierInt(rng, tier, [[2, 4], [3, 6], [5, 9], [6, 12]]);
            ctx.ep3pizzaQty = qty;
            const price = tierInt(rng, tier, [[3, 6], [4, 9], [5, 12], [6, 15]]);
            return {
              question: `Talia buys ${qty} pizzas that cost $${price} each. How much do the pizzas cost in total?`,
              hint: `${qty} groups of $${price}. Multiply: ${qty} × ${price}, or add $${price} ${qty} times.`,
              answer: qty * price,
            };
          },
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
            text: 'Decorations and food are sorted. How much of the budget is left?',
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
          generate: (rng, tier) => {
            const band = [[8, 18], [12, 30], [20, 60], [40, 120]];
            const decor = tierInt(rng, tier, band);
            const food = tierInt(rng, tier, band);
            const spent = decor + food;
            const start = spent + tierInt(rng, tier, [[10, 30], [20, 40], [40, 80], [80, 160]]);
            return {
              question: `Talia started with $${start} and spent $${decor} on decorations and $${food} on food. How much money does she have left?`,
              hint: `First add what she spent: $${decor} + $${food} = $${spent}. Then subtract that from $${start}.`,
              answer: start - spent,
            };
          },
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
          generate: (rng, tier) => {
            const step = tierInt(rng, tier, [[2, 5], [3, 9], [6, 15], [10, 25]]);
            const start = tierInt(rng, tier, [[1, 6], [2, 12], [5, 30], [10, 50]]);
            const t = [start, start + step, start + 2 * step, start + 3 * step];
            return {
              question: `Look at this pattern: ${t.join(', ')}, … What number comes next?`,
              hint: `Each number goes up by the same amount. ${t.join(', ')} — what is being added each time?`,
              answer: start + 4 * step,
            };
          },
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
          generate: (rng, tier) => {
            const start = tierInt(rng, tier, [[2, 3], [2, 5], [3, 7], [4, 10]]);
            const t = [start, start * 2, start * 4, start * 8];
            return {
              question: `Look at this pattern: ${t.join(', ')}, … What number comes next?`,
              hint: 'Each number is the one before it multiplied by 2.',
              answer: start * 16,
            };
          },
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
            text: 'Look — the jumps get bigger each time!',
          },
          {
            character: 'lejo',
            side: 'left',
            text: "Spot the rule and you've cracked it.",
          },
        ],
        problem: {
          id: 'e4-p3-q1',
          generate: (rng, tier) => {
            const n = tierInt(rng, tier, [[1, 2], [1, 3], [2, 5], [4, 8]]);
            const sq = (k) => k * k;
            const t = [sq(n), sq(n + 1), sq(n + 2), sq(n + 3)];
            const g = [t[1] - t[0], t[2] - t[1], t[3] - t[2]];
            return {
              question: `Look at this pattern: ${t.join(', ')}, … What number comes next?`,
              hint: `Look at the gaps: +${g[0]}, then +${g[1]}, then +${g[2]}. The gap grows by 2 each time, so the next gap is +${g[2] + 2}.`,
              answer: sq(n + 4),
            };
          },
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
          generate: (rng, tier) => {
            const band = [[10, 50], [20, 90], [40, 150], [80, 400]];
            const a = tierInt(rng, tier, band);
            const b = tierInt(rng, tier, band);
            return {
              question: `Chelya joins a ${a} cm ribbon and a ${b} cm ribbon end to end. How long is the ribbon now?`,
              hint: `Add the two lengths together: ${a} cm + ${b} cm.`,
              answer: a + b,
            };
          },
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
            text: (ctx) => `This long ribbon is ${ctx.ep5p2total} cm, but I only need part of it.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'So you cut some off. How much is left?',
          },
        ],
        problem: {
          id: 'e5-p2-q1',
          generate: (rng, tier, ctx) => {
            const cut = tierInt(rng, tier, [[10, 40], [20, 70], [40, 120], [80, 300]]);
            const left = tierInt(rng, tier, [[10, 50], [20, 80], [40, 150], [80, 400]]);
            const total = cut + left;
            ctx.ep5p2total = total;
            return {
              question: `Chelya cuts ${cut} cm off a ${total} cm ribbon. How many centimetres are left?`,
              hint: `Take away the piece she cut: ${total} cm − ${cut} cm.`,
              answer: left,
            };
          },
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
            text: (ctx) => `Last step — ${ctx.ep5p3count} equal ribbons, each ${ctx.ep5p3each} cm, laid in a row.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `That's ${ctx.ep5p3total} cm altogether. How many metres is that?`,
          },
          {
            character: 'chelya',
            side: 'left',
            text: 'You tell me.',
          },
        ],
        problem: {
          id: 'e5-p3-q1',
          generate: (rng, tier, ctx) => {
            const metres = tierInt(rng, tier, [[1, 2], [1, 4], [3, 8], [5, 15]]);
            const each = pick(rng, [20, 25, 50]); // realistic length that divides 100
            const total = metres * 100;
            const count = total / each;
            ctx.ep5p3count = count;
            ctx.ep5p3each = each;
            ctx.ep5p3total = total;
            return {
              question: `${count} ribbons, each ${each} cm, laid end to end, measure ${total} cm in total. How many metres is that?`,
              hint: 'Remember: 100 cm makes 1 metre.',
              answer: metres,
            };
          },
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
            text: (ctx) => `Listen up, team. Kick-off is at ${ctx.ep6kickoff} sharp. We don't waste a second.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'What time is it now, captain?',
          },
          {
            character: 'tiano',
            side: 'left',
            text: (ctx) => `It's ${ctx.ep6now} now. You do the maths.`,
          },
        ],
        problem: {
          id: 'e6-p1-q1',
          generate: (rng, tier, ctx) => {
            const gapHours = tierInt(rng, tier, [[1, 1], [1, 2], [2, 3], [3, 4]]);
            const startHour = rint(rng, 1, 12 - gapHours);
            const startMin = rint(rng, 1, 11) * 5; // :05–:55
            const mm = String(startMin).padStart(2, '0');
            const endHour = startHour + gapHours;
            ctx.ep6kickoff = `${endHour} o'clock`;
            ctx.ep6now = `${startHour}:${mm}`;
            return {
              question: `It is ${startHour}:${mm} now and the match kicks off at ${endHour}:00. How many minutes until kick-off?`,
              hint: `Count on from ${startHour}:${mm} to ${endHour}:00.`,
              answer: gapHours * 60 - startMin,
            };
          },
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
            text: (ctx) => `The match is ${ctx.ep6periods} ${ctx.ep6word}, ${ctx.ep6mins} minutes each.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'So how long do we actually play?',
          },
        ],
        problem: {
          id: 'e6-p2-q1',
          generate: (rng, tier, ctx) => {
            const periods = tierInt(rng, tier, [[2, 2], [2, 3], [3, 4], [4, 6]]);
            const mins = tierInt(rng, tier, [[20, 45], [30, 50], [35, 60], [40, 90]]);
            const word = periods === 2 ? 'halves' : periods === 4 ? 'quarters' : 'periods';
            ctx.ep6periods = periods;
            ctx.ep6word = word;
            ctx.ep6mins = mins;
            return {
              question: `A match has ${periods} ${word} of ${mins} minutes each. How many minutes of play is that in total?`,
              hint: `${periods} periods of ${mins} minutes: ${mins} × ${periods}.`,
              answer: periods * mins,
            };
          },
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
            text: (ctx) => `Add the half-time break and the whole thing runs ${ctx.ep6p3total} minutes.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `${ctx.ep6p3total} minutes… that's more than an hour!`,
          },
          {
            character: 'tiano',
            side: 'left',
            text: (ctx) => `That's ${ctx.ep6p3hourWord} and how many minutes? Last one, rookie.`,
          },
        ],
        problem: {
          id: 'e6-p3-q1',
          generate: (rng, tier, ctx) => {
            const hours = tierInt(rng, tier, [[1, 1], [1, 2], [2, 3], [2, 4]]);
            const extra = rint(rng, 1, 11) * 5; // 5–55
            const total = hours * 60 + extra;
            const hourWord = hours === 1 ? '1 hour' : `${hours} hours`;
            ctx.ep6p3total = total;
            ctx.ep6p3hourWord = hourWord;
            return {
              question: `The whole match, including half-time, lasts ${total} minutes. That is ${hourWord} and how many minutes?`,
              hint: `${hourWord} is ${hours * 60} minutes. Take ${hours * 60} away from ${total} to find the extra minutes.`,
              answer: extra,
            };
          },
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
          generate: (rng, tier, ctx) => {
            const band = [[4, 15], [8, 25], [15, 45], [30, 90]];
            const eagles = tierInt(rng, tier, band);
            const bears = eagles + tierInt(rng, tier, [[2, 10], [3, 15], [5, 25], [10, 40]]);
            const lions = tierInt(rng, tier, band);
            const tigers = tierInt(rng, tier, band);
            ctx.teams = { lions, tigers, bears, eagles };
            ctx.menu = `League points — Lions ${lions} · Tigers ${tigers} · Bears ${bears} · Eagles ${eagles}`;
            return {
              menuNote: ctx.menu,
              question: `On the chart, the Bears have ${bears} points and the Eagles have ${eagles} points. How many more points do the Bears have than the Eagles?`,
              hint: `Find the difference: ${bears} − ${eagles}.`,
              answer: bears - eagles,
            };
          },
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
            text: (ctx) => `${ctx.teams.lions} and ${ctx.teams.tigers}…`,
          },
        ],
        menuNote: 'League points — Lions 12 · Tigers 9 · Bears 15 · Eagles 6',
        problem: {
          id: 'e7-p2-q1',
          generate: (rng, tier, ctx) => {
            const { lions, tigers } = ctx.teams;
            return {
              menuNote: ctx.menu,
              question: `The Lions have ${lions} points and the Tigers have ${tigers} points. How many points do the Lions and Tigers have altogether?`,
              hint: `Add the two values: ${lions} + ${tigers}.`,
              answer: lions + tigers,
            };
          },
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
          generate: (rng, tier, ctx) => {
            const { lions, tigers, bears, eagles } = ctx.teams;
            return {
              menuNote: ctx.menu,
              question: `Add up all four teams: ${lions} + ${tigers} + ${bears} + ${eagles}. What is the total number of points scored in the league?`,
              hint: `Add them step by step: ${lions} + ${tigers} = ${lions + tigers}, then + ${bears} = ${lions + tigers + bears}, then + ${eagles}.`,
              answer: lions + tigers + bears + eagles,
            };
          },
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
            text: (ctx) => `Pizza time! It's cut into ${ctx.ep8p1whole} equal slices. We share fairly, agreed?`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `One ${ctx.ep8p1word} of the pizza — how many slices is that?`,
          },
        ],
        problem: {
          id: 'e8-p1-q1',
          generate: (rng, tier, ctx) => {
            const den = pick(rng, [2, 3, 4]);
            const k = tierInt(rng, tier, [[2, 4], [3, 8], [6, 14], [10, 25]]);
            const whole = den * k;
            const word = den === 2 ? 'half' : den === 3 ? 'third' : 'quarter';
            ctx.ep8p1whole = whole;
            ctx.ep8p1word = word;
            return {
              question: `A pizza is cut into ${whole} equal slices. How many slices make up 1/${den} of the pizza?`,
              hint: `One ${word} means splitting the ${whole} slices into ${den} equal groups: ${whole} ÷ ${den}.`,
              answer: whole / den,
            };
          },
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
            text: (ctx) => `This kaya cake has ${ctx.ep8p2whole} equal pieces. You may take one ${ctx.ep8p2word}.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `One ${ctx.ep8p2word} of ${ctx.ep8p2whole}… let me work it out.`,
          },
        ],
        problem: {
          id: 'e8-p2-q1',
          generate: (rng, tier, ctx) => {
            const den = pick(rng, [3, 4, 6]);
            const k = tierInt(rng, tier, [[1, 3], [2, 6], [4, 10], [6, 18]]);
            const whole = den * k;
            const word = den === 3 ? 'third' : den === 4 ? 'quarter' : 'sixth';
            ctx.ep8p2whole = whole;
            ctx.ep8p2word = word;
            return {
              question: `A cake is cut into ${whole} equal pieces. How many pieces make up 1/${den} of the cake?`,
              hint: `One ${word} means splitting the ${whole} pieces into ${den} equal groups: ${whole} ÷ ${den}.`,
              answer: whole / den,
            };
          },
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
            text: (ctx) => `Last one. I have ${ctx.ep8p3whole} sweets, and I'll give away ${ctx.ep8p3frac} of them.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `${ctx.ep8p3frac} of ${ctx.ep8p3whole} — that is a lot of sweets!`,
          },
          {
            character: 'talia',
            side: 'left',
            text: 'Work it out and they are all yours.',
          },
        ],
        problem: {
          id: 'e8-p3-q1',
          generate: (rng, tier, ctx) => {
            const den = pick(rng, [3, 4, 5]);
            const num = rint(rng, 2, den - 1);
            const k = tierInt(rng, tier, [[2, 4], [3, 8], [5, 12], [8, 20]]);
            const whole = den * k;
            ctx.ep8p3whole = whole;
            ctx.ep8p3frac = `${num}/${den}`;
            return {
              question: `Talia has ${whole} sweets and gives away ${num}/${den} of them. How many sweets does she give away?`,
              hint: `First find 1/${den} of ${whole} (that is ${whole} ÷ ${den} = ${k}). ${num} lots of that is ${num} × ${k}.`,
              answer: num * k,
            };
          },
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
            text: (ctx) => `Welcome to Shape Squad! First up — this ${ctx.ep9p1shape}. Count its sides.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `Sides of a ${ctx.ep9p1shape}… I've got this.`,
          },
        ],
        problem: {
          id: 'e9-p1-q1',
          generate: (rng, _tier, ctx) => {
            const words = { 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight' };
            const s = pick(rng, POLYGONS);
            ctx.ep9p1shape = s.name;
            return {
              question: `How many sides does a ${s.name} have?`,
              hint: `A ${s.name} is the ${words[s.sides]}-sided shape.`,
              answer: s.sides,
            };
          },
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
            text: (ctx) => `Now this ${ctx.ep9p2shape}. How many corners does it have?`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Corners means the pointy bits, right?',
          },
        ],
        problem: {
          id: 'e9-p2-q1',
          generate: (rng, _tier, ctx) => {
            const s = pick(rng, POLYGONS);
            ctx.ep9p2shape = s.name;
            return {
              question: `How many corners (vertices) does a ${s.name} have?`,
              hint: `A ${s.name} has the same number of corners as sides — and a ${s.name} has ${s.sides} sides.`,
              answer: s.sides,
            };
          },
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
            text: (ctx) => `Final challenge — add up ALL the sides: a ${ctx.ep9p3a}, a ${ctx.ep9p3b} and a ${ctx.ep9p3c}.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `${ctx.ep9p3sa}, ${ctx.ep9p3sb} and ${ctx.ep9p3sc} sides…`,
          },
          {
            character: 'kaesy',
            side: 'left',
            text: 'Total them up, Squad!',
          },
        ],
        problem: {
          id: 'e9-p3-q1',
          generate: (rng, _tier, ctx) => {
            const pool = [...POLYGONS];
            const [a, b, c] = [0, 0, 0].map(() => pool.splice(rint(rng, 0, pool.length - 1), 1)[0]);
            ctx.ep9p3a = a.name; ctx.ep9p3b = b.name; ctx.ep9p3c = c.name;
            ctx.ep9p3sa = a.sides; ctx.ep9p3sb = b.sides; ctx.ep9p3sc = c.sides;
            return {
              question: `A ${a.name} has ${a.sides} sides, a ${b.name} has ${b.sides} sides and a ${c.name} has ${c.sides} sides. How many sides do they have altogether?`,
              hint: `Add the three amounts: ${a.sides} + ${b.sides} + ${c.sides}.`,
              answer: a.sides + b.sides + c.sides,
            };
          },
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
            text: (ctx) => `Post duty! Two parcels to weigh — ${ctx.ep10p1a} g and ${ctx.ep10p1b} g.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Add them for the total weight?',
          },
        ],
        problem: {
          id: 'e10-p1-q1',
          generate: (rng, tier, ctx) => {
            const band = [[5, 20], [10, 40], [20, 90], [40, 180]];
            const a = tierInt(rng, tier, band) * 10; // grams, in tens
            const b = tierInt(rng, tier, band) * 10;
            ctx.ep10p1a = a;
            ctx.ep10p1b = b;
            return {
              question: `One parcel weighs ${a} g and another weighs ${b} g. What is their total mass?`,
              hint: `Add the two masses: ${a} g + ${b} g.`,
              answer: a + b,
            };
          },
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
            text: (ctx) => `This bag of flour says ${ctx.ep10p2kg}. How many grams is that?`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Kilograms to grams… I remember this one.',
          },
        ],
        problem: {
          id: 'e10-p2-q1',
          generate: (rng, tier, ctx) => {
            const kg = tierInt(rng, tier, [[1, 1], [1, 4], [3, 9], [5, 20]]);
            ctx.ep10p2kg = kg === 1 ? '1 kilogram' : `${kg} kilograms`;
            if (kg === 1) {
              return { question: 'How many grams are there in 1 kilogram?', hint: 'Remember the rule: 1 kilogram = 1000 grams.', answer: 1000 };
            }
            return {
              question: `How many grams are there in ${kg} kilograms?`,
              hint: `1 kilogram = 1000 grams, so multiply ${kg} × 1000.`,
              answer: kg * 1000,
            };
          },
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
            text: (ctx) => `A box and a book together weigh ${ctx.ep10p3total} g. The book alone is ${ctx.ep10p3book} g.`,
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
          generate: (rng, tier, ctx) => {
            const book = tierInt(rng, tier, [[20, 60], [30, 90], [50, 150], [80, 300]]) * 10;
            const box = tierInt(rng, tier, [[20, 80], [40, 120], [60, 180], [100, 400]]) * 10;
            const total = book + box;
            ctx.ep10p3total = total;
            ctx.ep10p3book = book;
            return {
              question: `A box and a book together weigh ${total} g. The book weighs ${book} g. What is the mass of the box?`,
              hint: `Take the book away from the total: ${total} g − ${book} g.`,
              answer: box,
            };
          },
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
            text: (ctx) => `Smoothie station! This jug holds ${ctx.ep11p1a} ml, and I'll pour in ${ctx.ep11p1add} ml more.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Add them for the total?',
          },
        ],
        problem: {
          id: 'e11-p1-q1',
          generate: (rng, tier, ctx) => {
            const band = [[5, 20], [10, 40], [20, 90], [40, 180]];
            const a = tierInt(rng, tier, band) * 10;
            const add = tierInt(rng, tier, band) * 10;
            ctx.ep11p1a = a;
            ctx.ep11p1add = add;
            return {
              question: `A jug holds ${a} ml of juice. Chelya adds ${add} ml more. How much juice is in the jug now?`,
              hint: `Add the two amounts: ${a} ml + ${add} ml.`,
              answer: a + add,
            };
          },
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
            text: (ctx) => `This bottle says ${ctx.ep11p2l}. How many millilitres is that?`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Litres to millilitres… I know this!',
          },
        ],
        problem: {
          id: 'e11-p2-q1',
          generate: (rng, tier, ctx) => {
            const litres = tierInt(rng, tier, [[1, 1], [1, 4], [3, 9], [5, 20]]);
            ctx.ep11p2l = litres === 1 ? '1 litre' : `${litres} litres`;
            if (litres === 1) {
              return { question: 'How many millilitres are there in 1 litre?', hint: 'Remember the rule: 1 litre = 1000 millilitres.', answer: 1000 };
            }
            return {
              question: `How many millilitres are there in ${litres} litres?`,
              hint: `1 litre = 1000 millilitres, so multiply ${litres} × 1000.`,
              answer: litres * 1000,
            };
          },
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
            text: (ctx) => `Our ${ctx.ep11p3cap} ml flask is filled to ${ctx.ep11p3filled} ml. How much more will fit?`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `Take ${ctx.ep11p3filled} away from ${ctx.ep11p3cap}…`,
          },
          {
            character: 'chelya',
            side: 'left',
            text: 'Top it up!',
          },
        ],
        problem: {
          id: 'e11-p3-q1',
          generate: (rng, tier, ctx) => {
            const filled = tierInt(rng, tier, [[20, 70], [40, 90], [60, 180], [100, 400]]) * 10;
            const more = tierInt(rng, tier, [[10, 40], [20, 60], [40, 120], [80, 300]]) * 10;
            const capacity = filled + more;
            ctx.ep11p3cap = capacity;
            ctx.ep11p3filled = filled;
            return {
              question: `A flask holds ${capacity} ml. It is filled to ${filled} ml. How many more millilitres are needed to fill it?`,
              hint: `Find the difference: ${capacity} ml − ${filled} ml.`,
              answer: more,
            };
          },
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
            text: (ctx) => `Times-table drill, rookie. Quick — what's ${ctx.ep12p1a} times ${ctx.ep12p1b}?`,
          },
          {
            character: 'kylo',
            side: 'left',
            text: (ctx) => `${ctx.ep12p1a} times ${ctx.ep12p1b}… give me a second!`,
          },
        ],
        problem: {
          id: 'e12-p1-q1',
          generate: (rng, tier, ctx) => {
            const band = [[2, 6], [3, 9], [6, 12], [8, 20]];
            const a = tierInt(rng, tier, band);
            const b = tierInt(rng, tier, band);
            ctx.ep12p1a = a;
            ctx.ep12p1b = b;
            return {
              question: `What is ${a} × ${b}?`,
              hint: `${a} groups of ${b}. If you know ${a} × ${b - 1} = ${a * (b - 1)}, add one more ${a}.`,
              answer: a * b,
            };
          },
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
            text: (ctx) => `Word problem. A box holds ${ctx.ep12p2per} cupcakes. There are ${ctx.ep12p2boxes} boxes.`,
          },
          {
            character: 'kylo',
            side: 'left',
            text: (ctx) => `${ctx.ep12p2boxes} lots of ${ctx.ep12p2per}!`,
          },
        ],
        problem: {
          id: 'e12-p2-q1',
          generate: (rng, tier, ctx) => {
            const per = tierInt(rng, tier, [[4, 8], [5, 10], [6, 12], [8, 20]]);
            const boxes = tierInt(rng, tier, [[2, 4], [3, 6], [5, 9], [6, 12]]);
            ctx.ep12p2per = per;
            ctx.ep12p2boxes = boxes;
            return {
              question: `A box holds ${per} cupcakes. How many cupcakes are there in ${boxes} boxes?`,
              hint: `${boxes} groups of ${per}: multiply ${boxes} × ${per}.`,
              answer: boxes * per,
            };
          },
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
            text: (ctx) => `Two steps now. Kylo buys ${ctx.ep12p3packs} packs of ${ctx.ep12p3per} stickers, then gets ${ctx.ep12p3extra} more free.`,
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
          generate: (rng, tier, ctx) => {
            const packs = tierInt(rng, tier, [[2, 4], [3, 6], [4, 8], [6, 12]]);
            const per = tierInt(rng, tier, [[4, 8], [5, 10], [6, 12], [8, 15]]);
            const extra = tierInt(rng, tier, [[2, 6], [3, 10], [5, 15], [8, 25]]);
            ctx.ep12p3packs = packs;
            ctx.ep12p3per = per;
            ctx.ep12p3extra = extra;
            return {
              question: `Kylo buys ${packs} packs of ${per} stickers and is given ${extra} more. How many stickers does he have altogether?`,
              hint: `First multiply: ${packs} × ${per} = ${packs * per}. Then add the ${extra} free stickers.`,
              answer: packs * per + extra,
            };
          },
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
  {
    id: 'ep-013',
    slug: 'perimeter-patrol',
    title: 'Perimeter Patrol',
    episode: 13,
    grade: 'P3–P4',
    publishedAt: '2026-09-08',
    tagline: 'Captain Tiano is marking out the pitch — every distance around has to be exact.',
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
            text: (ctx) => `Marking the pitch, team. This square goal box has ${ctx.ep13p1side} m sides.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Perimeter means all the way around?',
          },
        ],
        problem: {
          id: 'e13-p1-q1',
          generate: (rng, tier, ctx) => {
            const side = tierInt(rng, tier, [[3, 9], [5, 15], [10, 30], [20, 80]]);
            ctx.ep13p1side = side;
            return {
              question: `A square goal box has sides of ${side} m each. What is its perimeter?`,
              hint: `A square has 4 equal sides. Add them, or multiply: 4 × ${side}.`,
              answer: 4 * side,
            };
          },
          unit: ' m',
          unitPosition: 'suffix',
          skill: 'perimeter-square',
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
            text: (ctx) => `The full pitch is ${ctx.ep13p2l} m long and ${ctx.ep13p2w} m wide.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Add up all four sides…',
          },
        ],
        problem: {
          id: 'e13-p2-q1',
          generate: (rng, tier, ctx) => {
            const l = tierInt(rng, tier, [[5, 12], [10, 30], [20, 60], [40, 120]]);
            const w = tierInt(rng, tier, [[3, 10], [8, 25], [15, 50], [30, 100]]);
            ctx.ep13p2l = l;
            ctx.ep13p2w = w;
            return {
              question: `A rectangular pitch is ${l} m long and ${w} m wide. What is its perimeter?`,
              hint: `A rectangle has two long sides and two short sides: ${l} + ${w} + ${l} + ${w}.`,
              answer: 2 * (l + w),
            };
          },
          unit: ' m',
          unitPosition: 'suffix',
          skill: 'perimeter-rectangle',
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
            text: (ctx) => `Trickier. A training rectangle has a perimeter of ${ctx.ep13p3perim} m and a length of ${ctx.ep13p3len} m.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `So length plus width is half of ${ctx.ep13p3perim}…`,
          },
          {
            character: 'tiano',
            side: 'left',
            text: 'Find the width.',
          },
        ],
        problem: {
          id: 'e13-p3-q1',
          generate: (rng, tier, ctx) => {
            const length = tierInt(rng, tier, [[5, 10], [8, 20], [15, 40], [30, 80]]);
            const width = tierInt(rng, tier, [[3, 9], [5, 18], [10, 35], [20, 70]]);
            const perimeter = 2 * (length + width);
            ctx.ep13p3perim = perimeter;
            ctx.ep13p3len = length;
            return {
              question: `A rectangle has a perimeter of ${perimeter} m. Its length is ${length} m. What is its width?`,
              hint: `Half the perimeter is one length + one width: ${perimeter} ÷ 2 = ${perimeter / 2}. Then take away the length: ${perimeter / 2} − ${length}.`,
              answer: width,
            };
          },
          unit: ' m',
          unitPosition: 'suffix',
          skill: 'perimeter-missing-side',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: Lysa cracks the code — place value and rounding to the nearest 10.',
      character: 'lysa',
    },
  },
  {
    id: 'ep-014',
    slug: 'round-it-out',
    title: 'Round It Out',
    episode: 14,
    grade: 'P3–P4',
    publishedAt: '2026-09-15',
    tagline: 'Lysa runs a number-sense drill — read the place value, then round with confidence.',
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
            text: (ctx) => `Place value puzzle! In the number ${ctx.ep14p1num}, look closely at the digit ${ctx.ep14p1digit}.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `It's in the ${ctx.ep14p1place} place…`,
          },
        ],
        problem: {
          id: 'e14-p1-q1',
          generate: (rng, tier, ctx) => {
            const digits = tierInt(rng, tier, [[2, 3], [3, 3], [3, 4], [4, 5]]);
            const pos = rint(rng, 0, digits - 1);
            const v = rint(rng, 1, 9); // the asked digit — kept unique so it's unambiguous
            const arr = Array.from({ length: digits }, (_, i) => {
              if (i === pos) return v;
              let d; do { d = i === 0 ? rint(rng, 1, 9) : rint(rng, 0, 9); } while (d === v);
              return d;
            });
            const place = Math.pow(10, digits - 1 - pos);
            const names = { 1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands', 10000: 'ten-thousands' };
            ctx.ep14p1num = Number(arr.join(''));
            ctx.ep14p1digit = v;
            ctx.ep14p1place = names[place];
            return {
              question: `In the number ${Number(arr.join(''))}, what is the value of the digit ${v}?`,
              hint: `The ${v} sits in the ${names[place]} column, so its value is ${v} ${names[place]}.`,
              answer: v * place,
            };
          },
          unit: '',
          unitPosition: 'suffix',
          skill: 'place-value',
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
            text: (ctx) => `Now round ${ctx.ep14p2n} to the nearest 10.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `${ctx.ep14p2n} — which ten is it closest to?`,
          },
        ],
        problem: {
          id: 'e14-p2-q1',
          generate: (rng, tier, ctx) => {
            const tens = tierInt(rng, tier, [[1, 8], [2, 19], [10, 89], [30, 299]]);
            const ones = rint(rng, 1, 9);
            const n = tens * 10 + ones;
            ctx.ep14p2n = n;
            return {
              question: `Round ${n} to the nearest 10.`,
              hint: `The ones digit is ${ones}, which is ${ones >= 5 ? '5 or more, so round up' : 'less than 5, so round down'}.`,
              answer: ones >= 5 ? (tens + 1) * 10 : tens * 10,
            };
          },
          unit: '',
          unitPosition: 'suffix',
          skill: 'rounding-nearest-10',
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
            text: (ctx) => `Last one — round ${ctx.ep14p3n} to the nearest 100.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `The tens digit is ${ctx.ep14p3tens}, so round ${ctx.ep14p3dir}…`,
          },
          {
            character: 'lysa',
            side: 'left',
            text: "You've cracked the code!",
          },
        ],
        problem: {
          id: 'e14-p3-q1',
          generate: (rng, tier, ctx) => {
            const hund = tierInt(rng, tier, [[1, 8], [1, 19], [3, 89], [10, 299]]);
            const rem = rint(rng, 1, 99);
            const n = hund * 100 + rem;
            ctx.ep14p3n = n;
            ctx.ep14p3tens = Math.floor(rem / 10);
            ctx.ep14p3dir = rem >= 50 ? 'up' : 'down';
            return {
              question: `Round ${n} to the nearest 100.`,
              hint: `Look at the tens digit (${Math.floor(rem / 10)}). It is ${rem >= 50 ? '5 or more, so round up' : 'less than 5, so round down'}.`,
              answer: rem >= 50 ? (hund + 1) * 100 : hund * 100,
            };
          },
          unit: '',
          unitPosition: 'suffix',
          skill: 'rounding-nearest-100',
        },
      },
    ],
    nextEpisode: {
      teaser: 'Next week: the Grand Quiz — the whole Tian 7 team up for one mixed challenge!',
      character: 'tiano',
    },
  },
  {
    id: 'ep-015',
    slug: 'grand-quiz',
    title: 'The Grand Quiz',
    episode: 15,
    grade: 'P3–P4',
    publishedAt: '2026-09-22',
    tagline: 'Season finale! Four rounds, four hosts — Kylo faces a mixed challenge from the whole crew.',
    coverCharacters: ['kylo', 'tiano'],
    coverBg: 'common-room',
    panels: [
      {
        id: 'p1',
        scene: 'common-room',
        characters: [
          { key: 'lejo', pose: 'pointing', side: 'left' },
          { key: 'kylo', pose: 'excited', side: 'right' },
        ],
        speech: [
          {
            character: 'lejo',
            side: 'left',
            text: (ctx) => `Welcome to the Grand Quiz! Round 1 — patterns. What comes next: ${ctx.ep15p1seq}?`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: "They're doubling each time!",
          },
        ],
        problem: {
          id: 'e15-p1-q1',
          generate: (rng, tier, ctx) => {
            const start = tierInt(rng, tier, [[2, 5], [3, 7], [4, 10], [5, 15]]);
            const t = [start, start * 2, start * 4, start * 8];
            ctx.ep15p1seq = t.join(', ');
            return {
              question: `What number comes next in the pattern ${t.join(', ')}, …?`,
              hint: 'Each number is the one before it multiplied by 2.',
              answer: start * 16,
            };
          },
          unit: '',
          unitPosition: 'suffix',
          skill: 'number-patterns',
        },
      },
      {
        id: 'p2',
        scene: 'common-room',
        characters: [
          { key: 'kaesy', pose: 'presenting', side: 'left' },
          { key: 'kylo', pose: 'pointing', side: 'right' },
        ],
        speech: [
          {
            character: 'kaesy',
            side: 'left',
            text: (ctx) => `Round 2 — sharing! ${ctx.ep15p2total} stickers, ${ctx.ep15p2friends} friends, split them equally.`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `${ctx.ep15p2total} divided by ${ctx.ep15p2friends}…`,
          },
        ],
        problem: {
          id: 'e15-p2-q1',
          generate: (rng, tier, ctx) => {
            const friends = tierInt(rng, tier, [[2, 4], [3, 5], [4, 7], [5, 9]]);
            const each = tierInt(rng, tier, [[4, 8], [5, 10], [7, 12], [9, 15]]);
            const total = friends * each;
            ctx.ep15p2total = total;
            ctx.ep15p2friends = friends;
            return {
              question: `${total} stickers are shared equally among ${friends} friends. How many stickers does each friend get?`,
              hint: `Split ${total} into ${friends} equal groups: ${total} ÷ ${friends}.`,
              answer: each,
            };
          },
          unit: '',
          unitPosition: 'suffix',
          skill: 'division-equal-sharing',
        },
      },
      {
        id: 'p3',
        scene: 'common-room',
        characters: [
          { key: 'talia', pose: 'standing', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'talia',
            side: 'left',
            text: (ctx) => `Round 3 — fractions. What is ${ctx.ep15p3frac} of ${ctx.ep15p3whole}?`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: (ctx) => `${ctx.ep15p3frac} of ${ctx.ep15p3whole}… let me work it out!`,
          },
        ],
        problem: {
          id: 'e15-p3-q1',
          generate: (rng, tier, ctx) => {
            const den = pick(rng, [3, 4, 5]);
            const num = rint(rng, 2, den - 1);
            const k = tierInt(rng, tier, [[2, 5], [3, 8], [5, 12], [8, 20]]);
            const whole = den * k;
            ctx.ep15p3frac = `${num}/${den}`;
            ctx.ep15p3whole = whole;
            return {
              question: `What is ${num}/${den} of ${whole}?`,
              hint: `First find 1/${den} of ${whole} (${whole} ÷ ${den} = ${k}). ${num} lots of that is ${num} × ${k}.`,
              answer: num * k,
            };
          },
          unit: '',
          unitPosition: 'suffix',
          skill: 'fraction-of-quantity',
        },
      },
      {
        id: 'p4',
        scene: 'common-room',
        characters: [
          { key: 'chelya', pose: 'measuring', side: 'left' },
          { key: 'kylo', pose: 'standing', side: 'right' },
        ],
        speech: [
          {
            character: 'chelya',
            side: 'left',
            text: (ctx) => `Final round — measurement! A ribbon is ${ctx.ep15p4m} m long. How many centimetres is that?`,
          },
          {
            character: 'kylo',
            side: 'right',
            text: 'Metres to centimetres — times one hundred!',
          },
          {
            character: 'chelya',
            side: 'left',
            text: 'Grand Quiz Champion!',
          },
        ],
        problem: {
          id: 'e15-p4-q1',
          generate: (rng, tier, ctx) => {
            const m = tierInt(rng, tier, [[2, 5], [2, 9], [4, 15], [8, 30]]);
            ctx.ep15p4m = m;
            return {
              question: `A ribbon is ${m} m long. How many centimetres is that?`,
              hint: `Remember: 1 metre = 100 centimetres, so multiply ${m} × 100.`,
              answer: m * 100,
            };
          },
          unit: ' cm',
          unitPosition: 'suffix',
          skill: 'measurement-conversion-m-cm',
        },
      },
    ],
    nextEpisode: {
      teaser: 'That wraps Season 1 of The Tian 7 Chronicles — thanks for playing along. Season 2 is coming soon!',
      character: 'tiano',
    },
  },
];

export function getEpisode(slug) {
  return episodes.find((e) => e.slug === slug) ?? null;
}

export function getEpisodeById(id) {
  return episodes.find((e) => e.id === id) ?? null;
}

export function getLatestEpisode() {
  return episodes[episodes.length - 1];
}

export function getFirstEpisode() {
  return episodes[0];
}

// Where a student should land when they "start" the series: the first episode
// they haven't finished yet (chronological), so a new student begins at Ep 1
// rather than being dropped into the latest/finale. If every episode is done,
// fall back to the latest so returning readers can re-read it.
export function getResumeEpisode(completedIds = []) {
  const done = completedIds instanceof Set ? completedIds : new Set(completedIds);
  return episodes.find((e) => !done.has(e.id)) ?? getLatestEpisode();
}
