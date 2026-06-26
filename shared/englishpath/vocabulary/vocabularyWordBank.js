// EnglishPath · Vocabulary Builder — seed word bank
// ----------------------------------------------------------------------------
// Every entry here was mined from real P6 (PSLE) Prelim/SA papers in the test
// paper archive. The `confusables` are the *actual* multiple-choice distractors
// the papers used, which is what makes the discrimination exercises authentic:
// students are practising exactly the near-synonyms and look-alikes the exam
// pits against each other.
//
// Entries are grouped into "clusters" of mutually-confusable words. A cluster
// gives the generator a ready-made set of high-quality distractors and lets the
// nuance tasks pit the real exam options against one another.
//
// `answer` defaults to `word`; for phrasal verbs the `answer` is the full
// phrase. `example` is an exam-style sentence with the target word present —
// the generator blanks it out.

import { normalizeWordEntry } from './vocabularyModel.js';
import { harvestedEntries } from './harvestedEntries.js';

const RAW_ENTRIES = [
  // — Cluster: encroachment (environment / "moving onto") — Nanyang Prelim 2024 Q11
  {
    id: 'vw_encroachment',
    word: 'encroachment',
    pos: 'noun',
    theme: 'environment',
    cluster: 'taking_space',
    meaning: 'the act of slowly moving onto or taking over land or space that belongs to someone else',
    example:
      'Human activities such as deforestation and ____ on natural habitats have driven wild animals into urban areas.',
    synonyms: ['intrusion', 'trespassing'],
    confusables: ['insight', 'limitation', 'restriction'],
    connotation: 'negative',
    collocations: ['encroachment on', 'gradual encroachment'],
    wordFamily: [
      { word: 'encroach', pos: 'verb' },
      { word: 'encroaching', pos: 'adjective' },
    ],
    examTags: ['vocab_mcq'],
    mnemonic: 'en-CROACH — picture a frog (croak) hopping onto land that is not its own.',
    source: 'Nanyang Prelim 2024',
  },

  // — Cluster: manner of moving quietly — Nanyang Prelim 2024 Q12
  {
    id: 'vw_discreetly',
    word: 'discreetly',
    pos: 'adverb',
    theme: 'manner',
    cluster: 'quietly',
    meaning: 'in a careful, quiet way so as not to be noticed or cause embarrassment',
    example:
      'Not wanting to disrupt the speech by the guest of honour, Sheila left the auditorium ____ by the side door.',
    synonyms: ['quietly', 'unobtrusively', 'tactfully'],
    confusables: ['visibly', 'obviously', 'boisterously'],
    connotation: 'neutral',
    collocations: ['slip away discreetly', 'discreetly ask'],
    wordFamily: [
      { word: 'discreet', pos: 'adjective' },
      { word: 'discretion', pos: 'noun' },
    ],
    examTags: ['vocab_mcq'],
    mnemonic: 'Discreet (careful, quiet) ≠ discrete (separate). One "e" set apart from the other.',
    source: 'Nanyang Prelim 2024',
  },

  // — resist (could not resist) — Nanyang Prelim 2024 Q13
  {
    id: 'vw_resist',
    word: 'resist',
    pos: 'verb',
    theme: 'self-control',
    cluster: 'hold_back',
    meaning: 'to stop yourself from doing something tempting; to fight against something',
    example: 'Although Meng had a heavy lunch, he could not ____ eating another big slice of chocolate cake.',
    synonyms: ['withstand', 'refrain from'],
    confusables: ['deny', 'ignore', 'cancel'],
    connotation: 'neutral',
    collocations: ['resist the temptation', 'resist change', 'hard to resist'],
    wordFamily: [
      { word: 'resistance', pos: 'noun' },
      { word: 'resistant', pos: 'adjective' },
    ],
    examTags: ['vocab_mcq'],
    source: 'Nanyang Prelim 2024',
  },

  // — Cluster: "bring" phrasal verbs — Nanyang Prelim 2024 Q14
  {
    id: 'vw_bring_up',
    word: 'bring up',
    answer: 'bring up',
    isPhrasalVerb: true,
    pos: 'verb',
    theme: 'discussion',
    cluster: 'bring_phrasals',
    meaning: 'to mention or start talking about a subject',
    example: 'I think it is a bad idea to ____ these complicated issues for discussion when everyone is so tired.',
    synonyms: ['raise', 'mention', 'introduce'],
    confusables: ['bring off', 'bring along', 'bring about'],
    connotation: 'neutral',
    collocations: ['bring up a topic', 'bring up an issue'],
    examTags: ['vocab_mcq'],
    mnemonic: 'bring UP a topic = lift it up so everyone can see/discuss it.',
    source: 'Nanyang Prelim 2024',
  },
  {
    id: 'vw_bring_about',
    word: 'bring about',
    answer: 'bring about',
    isPhrasalVerb: true,
    pos: 'verb',
    theme: 'cause',
    cluster: 'bring_phrasals',
    meaning: 'to make something happen; to cause',
    example: 'The new recycling rules helped to ____ a big change in how the school disposed of its waste.',
    synonyms: ['cause', 'produce', 'trigger'],
    confusables: ['bring up', 'bring off', 'bring along'],
    connotation: 'neutral',
    collocations: ['bring about change', 'bring about a result'],
    examTags: ['vocab_mcq'],
    source: 'Nanyang Prelim 2024',
  },

  // — Cluster: obedient vs rebellious character — Nanyang Prelim 2024 Q15
  {
    id: 'vw_compliant',
    word: 'compliant',
    pos: 'adjective',
    theme: 'character',
    cluster: 'obedient_defiant',
    meaning: 'willing to obey rules or do what others want without arguing',
    example: 'Unlike her brother who is defiant and believes that rules are meant to be broken, Yuming is a ____ girl.',
    synonyms: ['obedient', 'cooperative', 'submissive'],
    confusables: ['brash', 'carefree', 'boisterous'],
    connotation: 'neutral',
    collocations: ['a compliant student', 'compliant with the rules'],
    wordFamily: [{ word: 'comply', pos: 'verb' }, { word: 'compliance', pos: 'noun' }],
    examTags: ['vocab_mcq'],
    source: 'Nanyang Prelim 2024',
  },
  {
    id: 'vw_defiant',
    word: 'defiant',
    pos: 'adjective',
    theme: 'character',
    cluster: 'obedient_defiant',
    meaning: 'openly refusing to obey; boldly resisting authority',
    example: 'Even after being punished, the ____ boy folded his arms and refused to apologise.',
    synonyms: ['rebellious', 'disobedient', 'unyielding'],
    confusables: ['compliant', 'timid', 'agreeable'],
    connotation: 'negative',
    collocations: ['a defiant look', 'defiant attitude'],
    wordFamily: [{ word: 'defy', pos: 'verb' }, { word: 'defiance', pos: 'noun' }],
    examTags: ['vocab_mcq'],
    source: 'Nanyang Prelim 2024',
  },

  // — Cluster: re- adjectives (look-alikes) — Nanyang Prelim 2023 Q11
  {
    id: 'vw_reluctant',
    word: 'reluctant',
    pos: 'adjective',
    theme: 'feeling',
    cluster: 're_lookalikes',
    meaning: 'unwilling and hesitant to do something',
    example: 'Serena was not feeling well, so she was ____ to go to the class party.',
    synonyms: ['unwilling', 'hesitant', 'disinclined'],
    confusables: ['reliant', 'resistant', 'receptive'],
    connotation: 'neutral',
    collocations: ['reluctant to', 'a reluctant agreement'],
    wordFamily: [{ word: 'reluctance', pos: 'noun' }, { word: 'reluctantly', pos: 'adverb' }],
    examTags: ['vocab_mcq'],
    mnemonic: 'reLUCTant — you LACK the will to do it.',
    source: 'Nanyang Prelim 2023',
  },
  {
    id: 'vw_receptive',
    word: 'receptive',
    pos: 'adjective',
    theme: 'feeling',
    cluster: 're_lookalikes',
    meaning: 'willing to listen to or accept new ideas',
    example: 'The new manager was ____ to feedback and happily changed the plan after hearing our concerns.',
    synonyms: ['open-minded', 'welcoming', 'responsive'],
    confusables: ['reluctant', 'reliant', 'resistant'],
    connotation: 'positive',
    collocations: ['receptive to ideas', 'a receptive audience'],
    examTags: ['vocab_mcq'],
    source: 'Nanyang Prelim 2023',
  },

  // — Cluster: con- nouns (look-alikes) — Nanyang Prelim 2023 Q12
  {
    id: 'vw_consent',
    word: 'consent',
    pos: 'noun',
    theme: 'permission',
    cluster: 'con_lookalikes',
    meaning: 'permission for something to happen or agreement to do something',
    example: 'Miss Tan scolded Eason for leaving the classroom without her ____.',
    synonyms: ['permission', 'approval', 'agreement'],
    confusables: ['contempt', 'consensus', 'concession'],
    connotation: 'neutral',
    collocations: ['give consent', 'without consent', 'parental consent'],
    wordFamily: [{ word: 'consent', pos: 'verb' }],
    examTags: ['vocab_mcq'],
    source: 'Nanyang Prelim 2023',
  },
  {
    id: 'vw_consensus',
    word: 'consensus',
    pos: 'noun',
    theme: 'agreement',
    cluster: 'con_lookalikes',
    meaning: 'a general agreement reached by a whole group',
    example: 'After a long discussion, the committee finally reached a ____ on the date of the event.',
    synonyms: ['agreement', 'common ground', 'accord'],
    confusables: ['consent', 'contempt', 'concession'],
    connotation: 'positive',
    collocations: ['reach a consensus', 'broad consensus'],
    examTags: ['vocab_mcq'],
    source: 'Nanyang Prelim 2023',
  },

  // — evoke (draw out emotions) — Nanyang Prelim 2023 Q13
  {
    id: 'vw_evoke',
    word: 'evoke',
    pos: 'verb',
    theme: 'emotion',
    cluster: 'evoke_lookalikes',
    meaning: 'to bring a feeling, memory or image into the mind',
    example: 'The motivational speaker was able to ____ powerful emotions from her audience.',
    synonyms: ['arouse', 'stir up', 'draw out'],
    confusables: ['evict', 'incur', 'imply'],
    connotation: 'neutral',
    collocations: ['evoke emotions', 'evoke memories'],
    examTags: ['vocab_mcq'],
    mnemonic: 'e-VOKE sounds like "voice" — it calls a feeling out.',
    source: 'Nanyang Prelim 2023',
  },

  // — Cluster: "keep up with" phrasal verbs — Nanyang Prelim 2023 Q14
  {
    id: 'vw_keep_up_with',
    word: 'keep up with',
    answer: 'keep up with',
    isPhrasalVerb: true,
    pos: 'verb',
    theme: 'progress',
    cluster: 'pace_phrasals',
    meaning: 'to move or progress at the same speed as something; to stay informed about',
    example: 'Technology is advancing so quickly that it is hard to ____ all the latest developments.',
    synonyms: ['stay abreast of', 'match the pace of'],
    confusables: ['put off', 'take up with', 'look forward to'],
    connotation: 'neutral',
    collocations: ['keep up with the news', 'keep up with the times'],
    examTags: ['vocab_mcq'],
    source: 'Nanyang Prelim 2023',
  },

  // — susceptible — Nanyang Prelim 2023 Q15
  {
    id: 'vw_susceptible',
    word: 'susceptible',
    pos: 'adjective',
    theme: 'vulnerability',
    cluster: 'vulnerable',
    meaning: 'easily harmed, influenced or affected by something',
    example: 'We must be careful with this delicate equipment as it is highly ____ to damage.',
    synonyms: ['vulnerable', 'prone', 'liable'],
    confusables: ['hard', 'sensitive', 'opposed'],
    connotation: 'negative',
    collocations: ['susceptible to', 'susceptible to illness'],
    examTags: ['vocab_mcq'],
    source: 'Nanyang Prelim 2023',
  },

  // — Cluster: "able to be reached" — Catholic High Prelim 2022 Q11
  {
    id: 'vw_accessible',
    word: 'accessible',
    pos: 'adjective',
    theme: 'access',
    cluster: 'reachable',
    meaning: 'able to be reached or entered easily',
    example: 'Many offshore islands around Singapore are now easily ____ by boat.',
    synonyms: ['reachable', 'within reach', 'get to easily'],
    confusables: ['available', 'attainable', 'approachable'],
    connotation: 'neutral',
    collocations: ['easily accessible', 'wheelchair accessible'],
    wordFamily: [{ word: 'access', pos: 'noun' }, { word: 'accessibility', pos: 'noun' }],
    examTags: ['vocab_mcq'],
    mnemonic: 'accessible = can ACCESS it. Approachable describes friendly people, not places.',
    source: 'Catholic High Prelim 2022',
  },

  // — facade (hide feelings) — Catholic High Prelim 2022 Q12
  {
    id: 'vw_facade',
    word: 'facade',
    pos: 'noun',
    theme: 'appearance',
    cluster: 'false_front',
    meaning: 'a false outward appearance that hides the true feelings or facts',
    example: 'After being terminated from his job, Ravi hid his distress behind a cheerful ____.',
    synonyms: ['mask', 'front', 'pretence'],
    confusables: ['disguise', 'pretense', 'impression'],
    connotation: 'negative',
    collocations: ['put on a facade', 'a facade of calm'],
    examTags: ['vocab_mcq'],
    mnemonic: 'A facade is the front "face" of a building — what people see, not what is inside.',
    source: 'Catholic High Prelim 2022',
  },

  // — proficient (skilled) — Catholic High Prelim 2022 Q13
  {
    id: 'vw_proficient',
    word: 'proficient',
    pos: 'adjective',
    theme: 'skill',
    cluster: 'skilled',
    meaning: 'highly skilled and competent at doing something',
    example: 'After learning Thai for two years, Andy has become ____ in it and converses fluently with peers.',
    synonyms: ['skilled', 'competent', 'adept'],
    confusables: ['qualified', 'talented', 'efficient'],
    connotation: 'positive',
    collocations: ['proficient in', 'proficient at'],
    wordFamily: [{ word: 'proficiency', pos: 'noun' }],
    examTags: ['vocab_mcq'],
    mnemonic: 'proficient in a language = good through PRACTICE; talented = born with it.',
    source: 'Catholic High Prelim 2022',
  },

  // — Vocabulary Cloze (synonym) words — Raffles Prelim 2023 Q16-20
  {
    id: 'vw_irrefutably',
    word: 'irrefutably',
    pos: 'adverb',
    theme: 'certainty',
    cluster: 'certainty',
    meaning: 'in a way that cannot be argued against or proven wrong',
    example: 'She is ____ one of the world’s top-selling authors, with over a billion copies sold.',
    synonyms: ['undoubtedly', 'unquestionably', 'indisputably'],
    confusables: ['tentatively', 'mysteriously', 'questionably'],
    connotation: 'neutral',
    collocations: ['irrefutably true'],
    wordFamily: [{ word: 'refute', pos: 'verb' }, { word: 'irrefutable', pos: 'adjective' }],
    examTags: ['vocab_cloze'],
    mnemonic: 'ir- (not) + refute (prove wrong) → it cannot be proven wrong.',
    source: 'Raffles Prelim 2023',
  },
  {
    id: 'vw_unconventional',
    word: 'unconventional',
    pos: 'adjective',
    theme: 'difference',
    cluster: 'unusual',
    meaning: 'not following what is usual or traditional; different from the normal way',
    example: 'Agatha’s childhood was ____, partly because she was not taught to read until the age of eight.',
    synonyms: ['unusual', 'different', 'unorthodox'],
    confusables: ['humble', 'ordinary', 'unforgettable'],
    connotation: 'neutral',
    collocations: ['unconventional methods', 'unconventional approach'],
    wordFamily: [{ word: 'convention', pos: 'noun' }, { word: 'conventional', pos: 'adjective' }],
    examTags: ['vocab_cloze'],
    source: 'Raffles Prelim 2023',
  },
  {
    id: 'vw_persistence',
    word: 'persistence',
    pos: 'noun',
    theme: 'determination',
    cluster: 'insist',
    meaning: 'the quality of continuing firmly despite difficulty or opposition',
    example: 'It was her mother’s ____ that she not learn to read until eight that shaped her early years.',
    synonyms: ['insistence', 'determination', 'perseverance'],
    confusables: ['indulgence', 'indifference', 'intolerance'],
    connotation: 'positive',
    collocations: ['sheer persistence', 'persistence pays off'],
    wordFamily: [{ word: 'persist', pos: 'verb' }, { word: 'persistent', pos: 'adjective' }],
    examTags: ['vocab_cloze'],
    source: 'Raffles Prelim 2023',
  },
  {
    id: 'vw_chagrin',
    word: 'chagrin',
    pos: 'noun',
    theme: 'emotion',
    cluster: 'displeasure',
    meaning: 'a feeling of annoyance or disappointment, especially after a failure',
    example: 'Much to the ____ of her publishers, she also wrote romantic novels under a pen name.',
    synonyms: ['annoyance', 'displeasure', 'vexation'],
    confusables: ['delight', 'relief', 'indifference'],
    connotation: 'negative',
    collocations: ['much to the chagrin of'],
    examTags: ['vocab_cloze'],
    source: 'Raffles Prelim 2023',
  },

  // — Comprehension vocabulary (story passages) — MGS Prelim 2024 / Henry Park 2025
  {
    id: 'vw_peculiar',
    word: 'peculiar',
    pos: 'adjective',
    theme: 'description',
    cluster: 'strange',
    meaning: 'strange or unusual in a way that is hard to explain',
    example: 'Ethan noticed something ____ — files seemed to be missing from the club’s shared drive.',
    synonyms: ['strange', 'odd', 'curious'],
    confusables: ['ordinary', 'familiar', 'expected'],
    connotation: 'neutral',
    collocations: ['something peculiar', 'a peculiar smell'],
    examTags: ['comprehension'],
    source: 'MGS Prelim 2024',
  },
  {
    id: 'vw_sabotage',
    word: 'sabotage',
    pos: 'verb',
    theme: 'wrongdoing',
    cluster: 'damage',
    meaning: 'to deliberately destroy or spoil something to stop it from working',
    example: 'Who would want to ____ the Coding Club by deleting all of their files?',
    synonyms: ['undermine', 'wreck', 'spoil'],
    confusables: ['support', 'protect', 'repair'],
    connotation: 'negative',
    collocations: ['sabotage the plan', 'act of sabotage'],
    examTags: ['comprehension'],
    source: 'MGS Prelim 2024',
  },
  {
    id: 'vw_culprit',
    word: 'culprit',
    pos: 'noun',
    theme: 'wrongdoing',
    cluster: 'wrongdoer',
    meaning: 'the person who is responsible for a crime or for causing a problem',
    example: 'The more they searched, the less likely it seemed that they would ever find the ____.',
    synonyms: ['offender', 'wrongdoer', 'perpetrator'],
    confusables: ['victim', 'witness', 'bystander'],
    connotation: 'negative',
    collocations: ['catch the culprit', 'the real culprit'],
    examTags: ['comprehension'],
    source: 'MGS Prelim 2024',
  },
  {
    id: 'vw_disheartened',
    word: 'disheartened',
    pos: 'adjective',
    theme: 'emotion',
    cluster: 'discouraged',
    meaning: 'having lost hope, confidence or enthusiasm',
    example: 'Meng looked around at the ____ faces of his schoolmates and knew he had gone too far.',
    synonyms: ['discouraged', 'demoralised', 'dispirited'],
    confusables: ['delighted', 'encouraged', 'hopeful'],
    connotation: 'negative',
    collocations: ['feel disheartened', 'disheartened by the result'],
    wordFamily: [{ word: 'dishearten', pos: 'verb' }, { word: 'heartening', pos: 'adjective' }],
    examTags: ['comprehension'],
    mnemonic: 'dis- (take away) + heart → the heart goes out of you.',
    source: 'MGS Prelim 2024',
  },
  {
    id: 'vw_retorted',
    word: 'retorted',
    pos: 'verb',
    theme: 'speech',
    cluster: 'said_sharply',
    meaning: 'replied quickly in a sharp, angry or witty way',
    example: '“We dug everywhere, but our files are gone!” ____ Firdaus.',
    synonyms: ['snapped', 'shot back', 'countered'],
    confusables: ['whispered', 'mumbled', 'agreed'],
    connotation: 'negative',
    collocations: ['retorted angrily', 'retorted sharply'],
    examTags: ['comprehension'],
    source: 'MGS Prelim 2024',
  },
  {
    id: 'vw_infuriating',
    word: 'infuriating',
    pos: 'adjective',
    theme: 'emotion',
    cluster: 'annoying',
    meaning: 'making you extremely angry',
    example: 'Finding the cabinet open yet again was ____; she even considered nailing it shut.',
    synonyms: ['maddening', 'exasperating', 'aggravating'],
    confusables: ['soothing', 'pleasing', 'calming'],
    connotation: 'negative',
    collocations: ['utterly infuriating'],
    wordFamily: [{ word: 'infuriate', pos: 'verb' }, { word: 'fury', pos: 'noun' }],
    examTags: ['comprehension'],
    source: 'Henry Park Prelim 2025',
  },
  {
    id: 'vw_flustered',
    word: 'flustered',
    pos: 'adjective',
    theme: 'emotion',
    cluster: 'agitated',
    meaning: 'nervous, confused and agitated, so that you cannot think clearly',
    example: 'In her ____ state, she locked the cabinet again, forgetting some toys were still outside.',
    synonyms: ['agitated', 'rattled', 'frazzled'],
    confusables: ['composed', 'relaxed', 'confident'],
    connotation: 'negative',
    collocations: ['get flustered', 'a flustered reply'],
    examTags: ['comprehension'],
    source: 'Henry Park Prelim 2025',
  },
  {
    id: 'vw_astonishment',
    word: 'astonishment',
    pos: 'noun',
    theme: 'emotion',
    cluster: 'surprise',
    meaning: 'a feeling of very great surprise',
    example: 'To my ____, the little boy stepped on a stool, spun the dials and opened the lock.',
    synonyms: ['amazement', 'shock', 'wonder'],
    confusables: ['boredom', 'indifference', 'disappointment'],
    connotation: 'neutral',
    collocations: ['to my astonishment', 'stare in astonishment'],
    wordFamily: [{ word: 'astonish', pos: 'verb' }, { word: 'astonishing', pos: 'adjective' }],
    examTags: ['comprehension'],
    source: 'Henry Park Prelim 2025',
  },
  {
    id: 'vw_painstaking',
    word: 'painstaking',
    pos: 'adjective',
    theme: 'effort',
    cluster: 'careful',
    meaning: 'done with great care and a lot of effort',
    example: 'Many club members were panicking at the loss of their hours of ____ work.',
    synonyms: ['meticulous', 'thorough', 'careful'],
    confusables: ['careless', 'hasty', 'effortless'],
    connotation: 'positive',
    collocations: ['painstaking detail', 'painstaking work'],
    examTags: ['comprehension'],
    mnemonic: 'You took pains (great care) over it.',
    source: 'MGS Prelim 2024',
  },
  {
    id: 'vw_stumped',
    word: 'stumped',
    pos: 'adjective',
    theme: 'difficulty',
    cluster: 'puzzled',
    meaning: 'completely unable to find an answer or solution',
    example: 'When they turned to their teacher for help, even he was ____.',
    synonyms: ['baffled', 'puzzled', 'stuck'],
    confusables: ['certain', 'confident', 'sure'],
    connotation: 'neutral',
    collocations: ['completely stumped', 'stumped by the question'],
    examTags: ['comprehension'],
    source: 'MGS Prelim 2024',
  },
];

// Curated seed entries take precedence; harvested entries (auto-generated from
// the wider paper archive) fill out the bank, skipping any id/headword the seed
// already covers.
function mergeEntries(seed, harvested) {
  const ids = new Set(seed.map((w) => w.id));
  // Dedupe by level+word so the same word can be taught at both P5 and P6.
  const keyOf = (w) => `${(w.level || 'P6')}:${String(w.word || '').toLowerCase()}`;
  const keys = new Set(seed.map(keyOf));
  const extra = [];
  for (const raw of harvested) {
    if (ids.has(raw.id) || keys.has(keyOf(raw))) continue;
    ids.add(raw.id);
    keys.add(keyOf(raw));
    extra.push(raw);
  }
  return [...seed, ...extra];
}

// The curated seed only (the harvest pipeline dedupes against this).
export const seedEntries = RAW_ENTRIES.map(normalizeWordEntry);

export const vocabularyWordBank = mergeEntries(RAW_ENTRIES, harvestedEntries).map(normalizeWordEntry);

export const wordBankById = Object.fromEntries(vocabularyWordBank.map((w) => [w.id, w]));

/** Words grouped by their confusable cluster, used to build discrimination sets. */
export const wordBankByCluster = vocabularyWordBank.reduce((acc, w) => {
  if (!w.cluster) return acc;
  (acc[w.cluster] ||= []).push(w);
  return acc;
}, {});

export function getWord(id) {
  return wordBankById[id] || null;
}
