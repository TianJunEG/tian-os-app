// MathPath domain: Time (Primary 1 → 5). Telling time, 24-hour clock,
// unit conversions (hours/minutes/seconds), and duration/time-interval problems.
// Split from measurement.js to give time its own diagnostic adapter.
//
// Cross-domain: ns.count.to-100 (counting minutes), op.sub.regroup
//   (borrowing in base-60), mea.unit-convert (unit-conversion pattern)
//
// visualModels: clock, number-line

export default {
  domain: 'Time',
  topic: 'Time',
  topicOrder: 11,
  level: 'Primary 1',
  skills: [
    // ── Telling time ──
    { slug: 'tim.tell-hour', name: 'Telling time to the hour and half-hour', level: 'Primary 1',
      prerequisites: ['ns.count.to-20'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 4, targetAccuracy: 95 }, figureDependent: true, visualModels: ['clock'],
      misconceptions: [{ tag: 'tim/hour-half', label: 'Reads the minute hand position incorrectly for half-past' }],
      practiceModes: ['visual_model', 'mcq', 'fluency_drill'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ns.count.to-20'], strategy: 'half-past = 30 minutes; minute hand points to 6' },
      questionStructures: [{ mode: 'visual_model', type: 'mcq', difficulty: 'easy', stem: 'The clock shows {h}:00. What time is it?', answerRule: 'match clock face', misconceptionTag: 'tim/hour-half' }] },

    { slug: 'tim.tell-minutes', name: 'Telling time to the minute', level: 'Primary 2',
      prerequisites: ['tim.tell-hour', 'ns.count.skip'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 5, targetAccuracy: 90 }, figureDependent: true, visualModels: ['clock'],
      misconceptions: [{ tag: 'tim/minute-skip', label: 'Skips a 5-minute interval when counting around the clock' }],
      practiceModes: ['visual_model', 'fluency_drill', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ns.count.skip'], strategy: 'count by 5s around the clock face' },
      questionStructures: [{ mode: 'visual_model', type: 'short_answer', difficulty: 'medium', stem: 'The clock shows {h}:{t}5. Write the time.', answerRule: 'read clock', misconceptionTag: 'tim/minute-skip' }] },

    // ── Unit conversions ──
    { slug: 'tim.convert', name: 'Converting time units (hours, minutes, seconds)', level: 'Primary 3',
      prerequisites: ['tim.tell-minutes', 'op.mult.by-10-100'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 5, targetAccuracy: 90 },
      misconceptions: [{ tag: 'tim/base-10-error', label: 'Uses base-10 thinking (1 hour = 100 minutes)' }],
      practiceModes: ['fluency_drill', 'mcq', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.mult.facts'], strategy: '1 hour = 60 min; 1 min = 60 sec; multiply to go down, divide to go up' },
      questionStructures: [
        { mode: 'fluency_drill', type: 'short_answer', difficulty: 'easy', stem: 'Convert {k} minutes to seconds.', answerRule: 'k*60', misconceptionTag: 'tim/base-10-error' },
        { mode: 'fluency_drill', type: 'short_answer', difficulty: 'easy', stem: 'How many minutes are in {k} hours?', answerRule: 'k*60', misconceptionTag: 'tim/base-10-error' },
      ] },

    // ── 24-hour clock ──
    { slug: 'tim.24hr', name: 'The 24-hour clock', level: 'Primary 4',
      prerequisites: ['tim.tell-minutes'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 5, targetAccuracy: 90 },
      misconceptions: [{ tag: 'mea/24hr-convert', label: 'Adds 12 to morning times or forgets to add for pm' }],
      practiceModes: ['fluency_drill', 'mcq', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['tim.tell-minutes'], strategy: 'pm hours: add 12; midnight = 0000; noon = 1200' },
      questionStructures: [
        { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Write {h} pm in 24-hour clock (give the hours only, e.g. 14).', answerRule: 'h+12', misconceptionTag: 'mea/24hr-convert' },
        { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Write 1{h}00 in 12-hour clock (pm hours only).', answerRule: 'h', misconceptionTag: 'mea/24hr-convert' },
      ] },

    // ── Duration ──
    { slug: 'tim.duration', name: 'Duration and time intervals', level: 'Primary 5',
      prerequisites: ['tim.24hr', 'op.sub.regroup'], masteryType: 'application', fluencyType: 'accuracy',
      visualModels: ['clock', 'number-line'],
      misconceptions: [{ tag: 'mea/time-base-60', label: 'Treats time as base-10 when subtracting (borrows 100, not 60)' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['tim.24hr'], strategy: 'count on through whole hours; 1 hour = 60 minutes when regrouping' },
      questionStructures: [
        { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A journey starts at {h}:00 am and lasts {k} hours. When does it end? (Give the hour in 24-hour time.)', answerRule: 'h+k', misconceptionTag: 'mea/time-base-60' },
      ] },
  ],
};
