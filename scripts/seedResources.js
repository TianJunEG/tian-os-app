// AEO content seed: 8 articles targeting high-intent Singapore parent searches.
// 6 free (open to AI indexing / search), 2 gated (email capture).
//
//   node scripts/seedResources.js     (or: npm run seed:resources)
//
// Idempotent: upserts by slug — safe to re-run.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Resource from '../models/Resource.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

const ARTICLES = [
  // ─────────────────────────────────────────────────────────────────────────
  //  FREE ARTICLES
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'What is the MOE Primary Mathematics Syllabus?',
    slug: 'moe-primary-maths-syllabus-explained',
    category: 'understanding-moe',
    level: 'Primary 1–6',
    subject: 'Mathematics',
    summary: 'A plain-English guide to what Singapore students learn in Maths from Primary 1 to Primary 6 — and what the MOE is actually testing.',
    published: true,
    gated: false,
    body: `
# What is the MOE Primary Mathematics Syllabus?

If your child is in primary school in Singapore, you've probably heard teachers and tutors refer to "the MOE syllabus." But what does it actually cover? Here's a plain-English breakdown.

## The big idea behind Singapore Math

The MOE Primary Mathematics syllabus is built around **mastery**, not memorisation. Students are expected to truly understand a concept before moving on — which is why the same topic (like fractions) appears across multiple years with increasing depth.

The curriculum follows a **Concrete → Pictorial → Abstract** progression. Children first handle physical objects, then diagrams, then symbols. This is why the **model method** (drawing bars to represent quantities) is central to Singapore Math problem solving.

## What is covered at each level?

| Level | Key topics |
|---|---|
| Primary 1–2 | Whole numbers, addition, subtraction, basic shapes, telling time |
| Primary 3 | Multiplication, division, fractions (introduction), area & perimeter |
| Primary 4 | Decimals, factors & multiples, angles, fractions (equivalence, mixed numbers) |
| Primary 5 | Percentages, ratio, speed, geometry (triangles, parallelograms) |
| Primary 6 | Algebra (simple), circles, pie charts, PSLE revision and application |

## The five content strands

MOE organises the syllabus into five strands:

1. **Numbers & Algebra** — the foundation; covers whole numbers, fractions, decimals, percentages, ratio, and simple algebra at P6.
2. **Measurement & Geometry** — length, mass, volume, time, area, perimeter, angles, and 2D/3D shapes.
3. **Statistics** — reading and interpreting tables, bar graphs, line graphs, and pie charts.
4. **Data Analysis** — introduced at upper primary; connecting graphs to real-world decisions.
5. **Problem Solving** — woven through every strand; the model method is the main tool.

## What MOE is actually testing

Beyond content knowledge, the syllabus assesses three skills:

- **Conceptual understanding** — can your child explain *why* an answer works?
- **Procedural fluency** — can they execute the steps accurately under time pressure?
- **Mathematical reasoning** — can they apply concepts to unfamiliar problems?

This is why a child can lose marks in SA1/SA2 even when they "know" the topic — the problem looks slightly different and they haven't built the reasoning layer yet.

## What this means for parents

The syllabus isn't just a content list — it's a progression. A gap at P3 (like shaky understanding of multiplication) creates real difficulty at P5 (speed and ratio both require fluent multiplication). If you notice your child struggling, it's worth checking whether the issue is actually one level back.

At Tian Jun, every student's learning plan is mapped to this syllabus — so we know exactly which skills need attention, and in which order to rebuild them.
`.trim(),
  },

  {
    title: 'PSLE Mathematics: What Skills Are Actually Tested?',
    slug: 'psle-maths-skills-tested',
    category: 'understanding-moe',
    level: 'Primary 6',
    subject: 'Mathematics',
    summary: 'A breakdown of what PSLE Maths Paper 1 and Paper 2 actually test — beyond the topic list.',
    published: true,
    gated: false,
    body: `
# PSLE Mathematics: What Skills Are Actually Tested?

Most parents know the PSLE Maths exam has two papers. But the difference between a student who scores AL1 and one who scores AL4 often isn't about knowing more topics — it's about how they apply what they know.

## The two papers

**Paper 1 (50 marks, 1 hour)**
- Multiple choice (15 questions) and short-answer (15 questions).
- No calculators.
- Tests procedural fluency and conceptual recall under time pressure.

**Paper 2 (60 marks, 1 hour 30 minutes)**
- Short-answer and long-answer questions (show working required).
- Calculators allowed.
- Tests reasoning, multi-step problem solving, and the model method.

## What SEAB is really measuring

SEAB (the Singapore Examinations and Assessment Board) frames PSLE Maths around three domains:

### 1. Knowing (recall)
Can your child state facts, use standard procedures, and recognise mathematical objects? E.g. "What is the formula for the area of a triangle?"

### 2. Applying (routine problems)
Can they select the right procedure for a standard problem? E.g. "Find the value of 3/4 of 240."

### 3. Reasoning (non-routine problems)
Can they break down an unfamiliar problem, connect concepts, and justify their steps? These are the high-mark questions in Paper 2 that separate the AL1–2 students from the rest.

## The most commonly tested topics

Based on recent PSLE papers (2020–2024):

- **Fractions** — appears in almost every paper; often combined with ratio or percentage
- **Ratio** — high weighting, frequently multi-step
- **Speed** — a perennial Paper 2 favourite; often paired with distance-time graphs
- **Geometry** — angles in figures, often requiring multiple steps
- **Percentages** — especially percentage increase/decrease in real-world contexts
- **Algebra** — introduced in P6; simpler but penalised heavily if the method is wrong

## Where students typically drop marks

1. **Reading carelessness** — misreading "how many more" vs "how many altogether"
2. **Unit errors** — mixing km and m, hours and minutes
3. **Partial marks in working** — not showing logical steps in Paper 2
4. **Overloaded heuristics** — applying model method to an algebra question, or vice versa

## How to prepare strategically

The most effective P6 revision focuses on **reasoning**, not re-teaching content. By P6, your child likely knows the topics — the gap is in problem-solving strategy.

Practice should include:
- Timed Paper 1 drills to build procedural speed
- Model-method reconstruction for Paper 2 long answers
- Deliberate exposure to unfamiliar question formats (not just past papers from one school)

At Tian Jun, we map every student's weak spots before SA2 and PSLE to focus revision where it actually moves the score.
`.trim(),
  },

  {
    title: 'How to Choose a Primary Maths Tutor in Singapore',
    slug: 'how-to-choose-primary-maths-tutor-singapore',
    category: 'understanding-moe',
    level: 'Primary 1–6',
    subject: 'Mathematics',
    summary: 'What to look for — and what to avoid — when choosing a Primary Maths tutor in Singapore.',
    published: true,
    gated: false,
    body: `
# How to Choose a Primary Maths Tutor in Singapore

With hundreds of tutors and tuition centres available in Singapore, choosing the right one for your child can feel overwhelming. Here's a practical framework based on what actually helps primary students improve.

## Start with the problem, not the solution

Before searching for a tutor, get specific about what your child needs:

- Is it **foundational** (they're shaky on a concept from last year)?
- Is it **procedural** (they understand but make careless mistakes)?
- Is it **motivational** (they know the content but shut down under pressure)?

A tutor who's great at rebuilding foundations may not be the same person who's great at exam-pacing drills. Knowing the gap helps you find the right fit.

## What to look for

**1. Knowledge of the MOE syllabus, not just Maths generally**
Singapore primary Maths has specific methods (model method, branch method for fractions, unitary method for ratio) that a general Maths graduate may not know well. Ask how they teach the model method.

**2. Diagnostic-first approach**
A good tutor doesn't just start from Chapter 1. They should assess where your child actually is and target the weakest links. If a tutor can't tell you within two sessions which specific skills your child is missing, that's a red flag.

**3. Evidence of progress, not just attendance**
Ask how they measure whether a student is improving. Marks going up at the next test is one signal, but better tutors track understanding at the skill level (can they do this type of problem independently now?).

**4. Compatibility with your child's learning style**
Some children respond to structured, step-by-step teaching. Others need to talk through their thinking. Sit in on a trial session and watch — is your child engaged or just compliant?

## What to be cautious about

- **Tutors who only do past papers** — past papers are useful for exam pacing, but if that's all they do, your child learns test-taking, not Maths.
- **Large group classes where your child can hide** — a child who nods along without understanding will fall behind without anyone noticing.
- **Promises tied to grades alone** — "guaranteed AL1" claims are marketing. Real improvement comes from fixing the underlying skill gaps.

## Questions to ask before hiring

1. How do you assess what my child knows before starting?
2. What's your approach if my child gets stuck on a concept?
3. How do you communicate progress to parents?
4. What's your experience with the current MOE syllabus?

## At Tian Jun

Every tutor in our network is vetted on MOE-syllabus knowledge and uses a shared diagnostic system so we can track skill-level progress — not just quiz scores. You can book a first session to see whether it's the right fit before committing.
`.trim(),
  },

  {
    title: '10 Mental Maths Games for Primary 1–3 Students',
    slug: '10-mental-maths-games-primary-1-3',
    category: 'activities',
    level: 'Primary 1–3',
    subject: 'Mathematics',
    summary: 'Fun, screen-free maths activities families can do at home — no worksheets needed.',
    published: true,
    gated: false,
    body: `
# 10 Mental Maths Games for Primary 1–3 Students

Strong mental arithmetic is one of the most reliable predictors of success in Singapore primary Maths. The good news: you don't need worksheets to build it. These games work anywhere — in the car, at the dinner table, at the supermarket.

## Why mental maths matters

Paper 1 of the PSLE (and SA1/SA2 at lower levels) is done without calculators. Students who've built strong mental fluency spend less time computing and more time reasoning — which is where the marks are.

## The games

### 1. The Number Bond Race
Call out a number (e.g. 8) and take turns naming pairs that add up to it (1+7, 2+6, 3+5…). First player to get stuck loses. Works for P1–P2 with numbers up to 20.

### 2. Count the Change
Every time you pay for something, ask your child how much change you should get. Start with simple amounts ($1 and $2) and work up to multi-dollar amounts.

### 3. Double It
Start with 1. Take turns doubling the number (1 → 2 → 4 → 8 → 16…). See how far you can get before someone makes a mistake. Builds powers of 2 and multiplication fluency.

### 4. The Missing Number
Write or say a simple equation with one number missing: "14 + __ = 23." Take turns being the quizmaster. Good for P2 addition and subtraction bridging.

### 5. Times Table Tennis
One player calls a times table number (e.g. 7). The other player has to say any multiple of 7 before counting to 5. Keep going until someone repeats a number or misses. Great for P3 multiplication.

### 6. Nearest to 100
Each player picks two random digits and arranges them to make a 2-digit number. Both players add their numbers together. Closest to 100 without going over wins the round.

### 7. Fizz Buzz
Count up from 1. Say "Fizz" for multiples of 3 and "Buzz" for multiples of 5. Say "FizzBuzz" for multiples of both. Classic but genuinely effective for building times-table awareness.

### 8. Supermarket Estimate
Before reaching the checkout, ask your child to estimate the total of 3–4 items you're buying. Round prices to the nearest dollar for P1–P2, or keep the exact prices for P3.

### 9. Fraction of the Day
Pick a whole number (e.g. 24). Ask "What is ½ of 24?" Then try ¼, ⅓, ¾. Good for building fraction intuition ahead of the P3/P4 curriculum.

### 10. The Bigger Difference
Give your child two subtraction problems at the same time (e.g. "94 − 37 vs 81 − 29"). Ask which difference is bigger WITHOUT calculating — just by estimating. Builds number sense over raw computation.

## A note on consistency

Ten minutes of games three times a week beats a one-hour worksheet session once a week. Keep it short and fun — the goal at this age is to build a positive relationship with numbers, not drill anxiety.
`.trim(),
  },

  {
    title: 'The Model Method Explained for Parents',
    slug: 'model-method-explained-for-parents',
    category: 'understanding-moe',
    level: 'Primary 3–6',
    subject: 'Mathematics',
    summary: 'What is the model method, why Singapore uses it, and how to help your child use it correctly.',
    published: true,
    gated: false,
    body: `
# The Model Method Explained for Parents

If you've tried helping your child with Primary Maths homework and felt confused by the diagram they're drawing, you've encountered the **model method** — Singapore's signature approach to solving word problems.

## What is it?

The model method (also called the **bar model** method) uses rectangular bars to represent unknown quantities. Instead of jumping straight to algebra or trial-and-error, children draw a picture of the problem — then solve from the picture.

It was introduced by MOE in the 1980s and is now used in primary schools across the world, adapted from Singapore's approach.

## A simple example

**Problem:** Ali has 3 times as many stickers as Ben. Together they have 48 stickers. How many does Ali have?

**With the model method:**

Draw Ben's share as 1 bar. Ali has 3 bars (3 times as many). Together: 4 bars = 48.

So 1 bar = 48 ÷ 4 = 12. Ali has 3 × 12 = **36 stickers**.

Notice: no algebra. A P3 student can solve this by drawing and dividing.

## Why Singapore uses it

The model method sits between concrete (using physical blocks) and abstract (using algebra). It:

- Makes the structure of the problem visible
- Allows students to reason about relationships without knowing algebra
- Builds a foundation that transitions naturally to algebraic thinking at secondary school

## The four main model types

**1. Part-whole model**
Used when you know the total and need to find a part, or know the parts and need the total.

**2. Comparison model**
Used when comparing two quantities — "how many more / fewer?"

**3. Before-after model**
Used when quantities change — something is given away, bought, or transferred.

**4. Equal parts model**
Used for fractions, ratio, and proportion problems.

## Common mistakes to watch for

- **Drawing unequal bars when bars should be equal** — the size of each bar must be proportional to what it represents.
- **Labelling incorrectly** — children should label what each bar represents (not just write numbers).
- **Skipping the model** — some children try to compute directly and lose the structure. For multi-step problems, the model is where the thinking happens.

## How to help at home

You don't need to teach the method — your child's teacher has covered it. What you *can* do:

1. Ask your child to **explain their model to you** before they compute. If they can't explain it, the model is wrong.
2. When they get a wrong answer, go back to the **model first**, not the arithmetic. Usually the error is in how the problem was represented.
3. Resist the urge to suggest algebra. The model method *is* the expected approach; using algebra at primary level can confuse teachers marking the work.

## At Tian Jun

We use the model method as the primary problem-solving tool at Primary 3–6. Every tutor in our network is trained to teach it correctly — including the transition from concrete to pictorial to abstract.
`.trim(),
  },

  {
    title: 'How Tian Jun Prepares Students for SA2',
    slug: 'how-tian-jun-prepares-students-sa2',
    category: 'understanding-moe',
    level: 'Primary 3–6',
    subject: 'Mathematics',
    summary: 'The specific approach Tian Jun uses in the 8 weeks before SA2 — and why it works.',
    published: true,
    gated: false,
    body: `
# How Tian Jun Prepares Students for SA2

The 8 weeks before SA2 (or PSLE, for P6) are when preparation strategy matters most. Here's exactly what we do at Tian Jun during that window — and why.

## Week 1–2: Diagnostic snapshot

Before we revise anything, we need to know what your child actually knows. We run a structured diagnostic across the full syllabus for their level — not a mock paper, but a targeted skills assessment that tells us:

- Which topics are solid and don't need time
- Which topics have gaps that can be closed with focused practice
- Which foundational skills (from earlier years) are causing current confusion

This is the step most tuition centres skip. Without it, revision time is spent on topics the student already knows instead of the ones that will actually move their score.

## Week 3–5: Targeted skill work

Based on the diagnostic, we build a 3-week plan focused on the 3–4 highest-impact gaps. We're not re-teaching the whole year — we're surgical.

Each session follows a structured format:
1. **Explain** the concept cleanly, linked to what they already know
2. **Model** the problem type (the tutor works through one example, narrating the thinking aloud)
3. **Guided practice** — student attempts with tutor present, mistakes corrected in real time
4. **Independent practice** — student attempts similar problems alone; tutor reviews
5. **Transfer** — student tries a harder or slightly different version to test real understanding

We call this the 5-step loop. Students who work through it on each gap show measurable improvement in the targeted skill within 2–3 sessions.

## Week 6–7: Exam technique

Content knowledge and exam performance are different skills. In weeks 6–7 we shift to:

- **Timed Paper 1 drills** — 30 minutes, strict time limit, review errors by category
- **Paper 2 long-answer practice** — focus on showing working clearly, even when the answer is obvious
- **Careless mistake audit** — we track every error type to find patterns (unit errors? misreading questions? rushing the last 5 questions?)

## Week 8: Consolidation and confidence

The week before the exam is not for learning new material. We:

- Review only the strongest remaining weak spots
- Run one full timed mock paper under exam conditions
- Debrief the mock — focusing on what went right, not just what went wrong
- Keep sessions lighter to avoid burnout

## What parents can do

- Keep the exam week as low-pressure as possible. Last-minute anxiety is the biggest performance killer.
- Make sure your child sleeps well the two nights before the exam — not just the night before.
- Trust the preparation. If you've done the work in the 8 weeks, the exam is just a chance to show it.

## Want to start?

[Book a diagnostic session](/tutoring) with one of our tutors to see exactly where your child is before SA2 season begins.
`.trim(),
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  GATED ARTICLES (email capture)
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Is Your Child Ready for P4 Fractions? A Parent\'s Diagnostic Guide',
    slug: 'is-your-child-ready-for-p4-fractions',
    category: 'understanding-moe',
    level: 'Primary 3–4',
    subject: 'Mathematics',
    summary: 'Fractions are where many Singapore students first fall behind. Use this checklist to find out if your child is ready — before it becomes a problem.',
    published: true,
    gated: true,
    body: `
# Is Your Child Ready for P4 Fractions? A Parent's Diagnostic Guide

Primary 4 Fractions is the topic where we see the most students fall behind — and where the most long-term damage to Maths confidence happens. The reason: it's the first truly abstract concept in the primary syllabus, and it arrives just as the curriculum starts accelerating.

The good news: most fraction struggles are predictable and preventable. This guide gives you a clear picture of where your child stands *before* they hit the wall.

## Why P4 Fractions is a critical milestone

At P4, fractions shift from "what does ½ mean?" (P3) to:

- Equivalent fractions and simplification
- Mixed numbers and improper fractions
- Adding and subtracting fractions with different denominators
- Fractions of a set (e.g. ⅗ of 45)

Each of these builds on the previous one. A student who doesn't fully grasp equivalent fractions will struggle with addition — and a shaky foundation here follows them all the way to P6 ratio and percentage.

## The diagnostic checklist

Work through these with your child. Don't help — watch how they approach each one.

### Section 1: P3 Fractions (prerequisite knowledge)

✅ **Can they shade a fraction of a shape correctly?**
Draw a rectangle divided into 6 equal parts. Ask them to shade ⅔. If they shade 2 parts, they're counting numerators, not understanding the meaning.

✅ **Can they place fractions on a number line?**
Draw a number line from 0 to 1 with 4 equal divisions. Ask them to mark ¾. If they can't, equivalent fractions will be very hard.

✅ **Can they compare two fractions with the same denominator?**
"Which is bigger: ⅖ or ⅗?" This should be instant. If they need to think, the fraction concept isn't yet solid.

### Section 2: Early P4 Fractions

✅ **Can they find equivalent fractions?**
"Write two fractions equivalent to ½." They should be able to produce ²⁄₄ and ³⁄₆ without prompting. If they need to draw pictures for this, they're at the borderline.

✅ **Can they simplify a fraction?**
"Simplify ⁶⁄₈." They should recognise that 6 and 8 share a common factor of 2. If they don't know what "simplify" means, this is a gap.

✅ **Can they convert between mixed numbers and improper fractions?**
"Write 2¾ as an improper fraction." This step-by-step conversion (2 × 4 + 3 = 11, so ¹¹⁄₄) is one of the most frequently tested skills in P4 and P5.

### Section 3: Problem solving (the critical layer)

✅ **Can they find a fraction of a quantity?**
"⅗ of 45 = ?" They need to know: divide by the denominator first (45 ÷ 5 = 9), then multiply by the numerator (9 × 3 = 27). If they try to multiply 45 by 3 first, they don't understand the operation.

✅ **Can they add fractions with different denominators?**
"½ + ⅓ = ?" They should find a common denominator (6), convert both fractions, then add. Watch for whether they add numerators AND denominators (½ + ⅓ = ²⁄₅ is a very common error).

## Reading the results

**7–8 checks:** Your child is well-prepared for P4 Fractions. Continue with regular practice to maintain fluency.

**5–6 checks:** Some gaps exist but are manageable. Focus on the unchecked items before Fractions begins in class.

**3–4 checks:** There are meaningful prerequisite gaps. It's worth addressing these proactively — don't wait for a poor test result.

**0–2 checks:** Your child will likely find P4 Fractions very difficult without targeted support. Start with P3 fraction fundamentals and rebuild the foundation.

## What to do with the results

If you found gaps, the most effective approach is **targeted** — not general revision. Identify the specific missing skill (e.g. "doesn't understand equivalent fractions") and work on just that before moving to the next layer.

At Tian Jun, we run structured fraction diagnostics as part of our onboarding for every P3 and P4 student. If you'd like a professional assessment, [book a session here](/tutoring).
`.trim(),
  },

  {
    title: 'Jasmine\'s 6-Step Method for Word Problems (Parent Edition)',
    slug: 'jasmine-6-step-word-problems-parent-guide',
    category: 'understanding-moe',
    level: 'Primary 3–6',
    subject: 'Mathematics',
    summary: 'The exact 6-step framework Tian Jun tutors use to teach word problems — adapted for parents to use at home.',
    published: true,
    gated: true,
    body: `
# Jasmine's 6-Step Method for Word Problems (Parent Edition)

Word problems are where Singapore primary Maths gets hard. Most students who struggle aren't struggling with the Maths — they're struggling with the **process**: knowing where to start, how to represent the problem, and how to check whether their answer makes sense.

This guide shares the exact 6-step framework our founder Jasmine developed through years of tutoring. It's designed to be teachable to parents, so you can support your child at home using the same language their Tian Jun tutor uses.

## Why process matters more than content

A student who knows fractions, ratio, and percentages perfectly can still score poorly on word problems if they don't have a reliable process for attacking an unfamiliar question.

Conversely, a student with a solid process can often solve problems slightly above their level — because the process helps them extract the structure from the words.

## The 6-step framework

### Step 1: Read the whole problem once without a pencil

This sounds obvious but most students skip it. The first read is purely for understanding — no highlighting, no writing. Ask your child: "What is this problem about? What's happening in the story?"

If they can't tell you in one or two sentences, they need to re-read. Don't let them start working until they can state the situation clearly.

### Step 2: Identify what you need to find

Underline or circle the question being asked. Write it at the top of their working in their own words: *"I need to find: how many apples Ali has left."*

This step prevents the most common error in word problems: solving for the wrong thing.

### Step 3: Identify what you know

List the given information as clear statements:
- Ali started with 36 apples.
- He gave ¼ to Ben.
- He ate 5.

Separating what's known from what's unknown is the foundation of the model method — and it's where many students' thinking breaks down.

### Step 4: Draw the model

This is the core step. Use a bar model to represent the relationships between the quantities you identified in Step 3.

**Reminders for parents:**
- Each bar segment must represent the same unit.
- Label every bar — don't leave blanks with just question marks.
- The model doesn't have to be perfect. It has to be clear enough to work from.

If your child can't draw a model, go back to Step 3 — they haven't fully understood the relationships yet.

### Step 5: Solve from the model, showing every step

Work from the model, not from memory of a "type" of problem. Write every calculation and label the units.

Encourage your child to narrate as they solve: *"I know 4 units = 36, so 1 unit = 9. I need 3 units, so…"*

This narration is important for two reasons:
1. It catches errors before they happen.
2. In Paper 2, markers give partial credit for correct reasoning even if the final answer is wrong.

### Step 6: Check — does the answer make sense?

Before writing the final answer, ask:
- Is the number reasonable? (If Ali started with 36 apples and the answer is 200, something went wrong.)
- Does it answer the right question? (Re-read Step 2.)
- Are the units right? (Is it in cm, or cm²? Is it the number of students, or the difference?)

This step catches roughly 30% of careless errors in our experience.

## How to use this at home

**Don't do the Maths for your child.** Your role is to guide the process:

- "Have you read the whole problem yet?"
- "What do you need to find? Can you write it down?"
- "Can you show me your model before you calculate?"
- "Does that answer make sense?"

These four questions alone will improve your child's word problem accuracy — even if you don't know the topic yourself.

## A note on pacing

The 6-step method feels slow at first. Students used to jumping straight to calculation will resist it. That's normal. Within 2–4 weeks of consistent use, it becomes habit — and the accuracy gains are significant.

At Tian Jun, every tutor uses this exact framework. When your child works with us, they hear the same language and the same 6 steps every session, which reinforces the habit faster.

If you'd like to see the method in action, [book a trial session](/tutoring) and we'll walk through a word problem together.
`.trim(),
  },
];

async function main() {
  await mongoose.connect(URI);
  console.log('Connected to MongoDB');

  let created = 0;
  let updated = 0;

  for (const article of ARTICLES) {
    const result = await Resource.findOneAndUpdate(
      { slug: article.slug },
      { $set: article },
      { upsert: true, new: true, runValidators: true }
    );
    const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
    if (isNew) {
      console.log(`  ✓ created  "${article.title}"`);
      created++;
    } else {
      console.log(`  ↺ updated  "${article.title}"`);
      updated++;
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
