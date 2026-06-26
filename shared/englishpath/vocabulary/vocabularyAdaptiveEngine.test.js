import { describe, it, expect } from 'vitest';
import {
  initState,
  recordResult,
  selectNextDescriptor,
  selectNextTask,
  buildSession,
  summarize,
  examReadiness,
} from './vocabularyAdaptiveEngine.js';
import { getWord, vocabularyWordBank } from './vocabularyWordBank.js';
import { generatableTaskTypes } from './vocabularyTaskGenerator.js';

const T0 = 1_700_000_000_000; // fixed clock
const DAY = 86_400_000;

// A small, fixed bank so readiness/coverage assertions don't depend on how many
// words ship in the production bank.
const SMALL_BANK = vocabularyWordBank.filter((w) =>
  ['vw_encroachment', 'vw_irrefutably', 'vw_facade', 'vw_resist', 'vw_compliant', 'vw_consent'].includes(w.id)
);

// Drive one word all the way up its ladder with correct answers.
function completeLadder(state, wordId, now = T0, bank = vocabularyWordBank) {
  let s = recordResult(state, { wordId, taskType: 'meet_word', correct: true }, { now, bank });
  const entry = getWord(wordId);
  for (let guard = 0; guard < 60; guard++) {
    const wp = s.words[wordId];
    const pending = generatableTaskTypes(entry, { bank }).filter((tt) => !(wp.taskStats[tt]?.correct > 0));
    if (!pending.length) return s;
    s = recordResult(s, { wordId, taskType: pending[0], correct: true }, { now, bank });
  }
  throw new Error('ladder did not complete');
}

describe('vocabulary adaptive engine', () => {
  it('starts a new learner on a "meet the word" card', () => {
    const s = initState();
    const desc = selectNextDescriptor(s, { now: T0 });
    expect(desc.mode).toBe('new');
    expect(desc.taskType).toBe('meet_word');
  });

  it('meet_word introduces the word without grading it', () => {
    const s = recordResult(initState(), { wordId: 'vw_resist', taskType: 'meet_word', correct: true }, { now: T0 });
    expect(s.words.vw_resist.introduced).toBe(true);
    expect(Object.keys(s.words.vw_resist.taskStats)).toHaveLength(0);
    expect(s.words.vw_resist.box).toBe(0);
  });

  it('climbs the ladder rung by rung and only graduates to spaced review at the top', () => {
    let s = recordResult(initState(), { wordId: 'vw_resist', taskType: 'meet_word', correct: true }, { now: T0 });
    expect(s.words.vw_resist.box).toBe(0); // still learning
    s = completeLadder(initState(), 'vw_resist');
    const wp = s.words.vw_resist;
    expect(wp.box).toBe(1); // ladder done -> entered Leitner box 1
    expect(wp.dueAt).toBe(T0 + 1 * DAY);
    expect(wp.mastered).toBe(false); // not until it survives spaced review
  });

  it('a wrong answer keeps the learner on the same rung', () => {
    let s = recordResult(initState(), { wordId: 'vw_resist', taskType: 'meet_word', correct: true }, { now: T0 });
    s = recordResult(s, { wordId: 'vw_resist', taskType: 'meaning_match', correct: false, chosenText: 'cancel' }, { now: T0 });
    const desc = selectNextDescriptor(s, { now: T0 });
    expect(desc.wordId).toBe('vw_resist');
    expect(desc.taskType).toBe('meaning_match'); // unchanged — must get it right to advance
    expect(s.words.vw_resist.confusions.cancel).toBe(1);
  });

  it('spaced review pushes mastery out on success and masters after box 5', () => {
    let s = completeLadder(initState(), 'vw_facade');
    let now = T0;
    for (let i = 0; i < 4; i++) {
      now = s.words.vw_facade.dueAt; // jump to when it is due
      const desc = selectNextDescriptor(s, { now });
      expect(desc.mode).toBe('review');
      s = recordResult(s, { wordId: 'vw_facade', taskType: desc.taskType, correct: true }, { now });
    }
    expect(s.words.vw_facade.box).toBe(5);
    expect(s.words.vw_facade.mastered).toBe(true);
  });

  it('a slip in review demotes the box and records a lapse', () => {
    let s = completeLadder(initState(), 'vw_facade');
    const now = s.words.vw_facade.dueAt;
    const desc = selectNextDescriptor(s, { now });
    s = recordResult(s, { wordId: 'vw_facade', taskType: desc.taskType, correct: false }, { now });
    expect(s.words.vw_facade.box).toBe(1); // max(1, 1-1) === 1
    expect(s.words.vw_facade.lapses).toBe(1);
  });

  it('due reviews take priority over introducing new words', () => {
    let s = completeLadder(initState(), 'vw_facade');
    const now = s.words.vw_facade.dueAt + DAY; // overdue
    const desc = selectNextDescriptor(s, { now });
    expect(desc.mode).toBe('review');
    expect(desc.wordId).toBe('vw_facade');
  });

  it('builds a mixed session of distinct, renderable tasks', () => {
    const session = buildSession(initState(), { size: 8, now: T0 });
    expect(session.length).toBeGreaterThan(0);
    expect(session.length).toBeLessThanOrEqual(8);
    for (const task of session) {
      expect(task.id).toBeTruthy();
      if (task.kind === 'mcq') expect(task.options.length).toBeGreaterThanOrEqual(3);
    }
    expect(session.some((t) => t.mode === 'new')).toBe(true);
  });

  it('respects the active-learning cap so a learner is not flooded with new words', () => {
    const s = initState({ maxActiveLearning: 3 });
    // introduce 3 words (mid-ladder), then the engine should stop introducing
    let st = s;
    for (const id of ['vw_resist', 'vw_facade', 'vw_compliant']) {
      st = recordResult(st, { wordId: id, taskType: 'meet_word', correct: true }, { now: T0 });
    }
    const desc = selectNextDescriptor(st, { now: T0 });
    expect(desc.mode).not.toBe('new'); // cap reached -> keep working existing words
  });

  it('selectNextTask returns a fully rendered task', () => {
    const task = selectNextTask(initState(), { now: T0 });
    expect(task).toBeTruthy();
    expect(task.kind).toBe('teach'); // first thing is meeting a word
    expect(task.card.word).toBeTruthy();
  });

  it('summary and exam readiness reflect progress', () => {
    const empty = summarize(initState(), { now: T0, bank: SMALL_BANK });
    expect(empty.counts.introduced).toBe(0);
    expect(empty.examReadiness.vocab_mcq).toBe(0);

    const s = completeLadder(initState(), 'vw_encroachment', T0, SMALL_BANK); // a vocab_mcq word
    const sum = summarize(s, { now: T0, bank: SMALL_BANK });
    expect(sum.counts.introduced).toBe(1);
    expect(sum.examReadiness.vocab_mcq).toBeGreaterThan(0);
    expect(sum.perWord[0].ladderProgress).toBe(1);
  });

  it('exam readiness rises as more words are learned', () => {
    const before = examReadiness(initState(), SMALL_BANK);
    let s = completeLadder(initState(), 'vw_irrefutably', T0, SMALL_BANK); // vocab_cloze word
    const after = examReadiness(s, SMALL_BANK);
    expect(after.vocab_cloze).toBeGreaterThan(before.vocab_cloze);
  });
});
