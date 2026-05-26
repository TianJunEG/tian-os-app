// Commonly misspelt English words grouped by difficulty. Each entry carries the
// correct spelling and a short hint (often the typical wrong spelling) that can
// be shown after an attempt. Served read-only by the spelling routes.

const misspeltWords = {
  easy: [
    { word: 'because', hint: 'Not "becuase".' },
    { word: 'friend', hint: 'Ends with "-iend".' },
    { word: 'beautiful', hint: 'Begins with "beau-".' },
    { word: 'tomorrow', hint: 'One "m", two "r"s.' },
    { word: 'finally', hint: 'Two "l"s.' },
    { word: 'February', hint: "Don't forget the first 'r'." },
    { word: 'people', hint: 'Not "peeple".' },
    { word: 'where', hint: 'Mind "where" vs "wear".' },
    { word: 'which', hint: 'Has an "h" after "w".' },
    { word: 'enough', hint: 'Ends with "-ough".' },
    { word: 'really', hint: 'Two "l"s.' },
    { word: 'thought', hint: 'Silent "-ough-".' },
    { word: 'school', hint: 'Silent "h" after "c".' },
    { word: 'before', hint: 'One word, single "f".' },
    { word: 'address', hint: 'Two "d"s, two "s"s.' },
    { word: 'across', hint: 'One "c", two "s"s.' },
    { word: 'always', hint: 'Ends with "-ays".' },
    { word: 'caught', hint: 'Silent "-augh-".' }
  ],
  medium: [
    { word: 'separate', hint: 'There is "a rat" in sepArate.' },
    { word: 'definitely', hint: 'No "a" — "defiNITEly".' },
    { word: 'necessary', hint: 'One "c", two "s"s.' },
    { word: 'embarrass', hint: 'Two "r"s, two "s"s.' },
    { word: 'occasion', hint: 'Two "c"s, one "s".' },
    { word: 'beginning', hint: 'Double the "n".' },
    { word: 'believe', hint: '"i" before "e".' },
    { word: 'receive', hint: '"e" before "i" after "c".' },
    { word: 'weird', hint: 'An exception: "e" before "i".' },
    { word: 'tongue', hint: 'Ends with "-gue".' },
    { word: 'surprise', hint: 'Two "r"s — "suRPRise".' },
    { word: 'business', hint: 'Begins with "busi-".' },
    { word: 'calendar', hint: 'Ends with "-ar", not "-er".' },
    { word: 'grammar', hint: 'Ends with "-ar".' },
    { word: 'rhythm', hint: 'No vowels except "y" — "rhythm".' },
    { word: 'island', hint: 'Silent "s".' },
    { word: 'knowledge', hint: 'Silent "k", ends "-edge".' },
    { word: 'restaurant', hint: 'Contains "-aura-".' },
    { word: 'vegetable', hint: 'Hidden "e": "veg-e-table".' },
    { word: 'familiar', hint: 'Ends with "-iar".' }
  ],
  hard: [
    { word: 'conscience', hint: 'Contains "science".' },
    { word: 'mischievous', hint: 'No extra "i": "mis-chie-vous".' },
    { word: 'pronunciation', hint: 'It is "-nun-", not "-noun-".' },
    { word: 'accommodate', hint: 'Two "c"s and two "m"s.' },
    { word: 'occurrence', hint: 'Two "c"s, two "r"s.' },
    { word: 'privilege', hint: 'No "d": "privi-lege".' },
    { word: 'maintenance', hint: 'It is "-ten-", not "-tain-".' },
    { word: 'liaison', hint: 'Two "i"s: "li-ai-son".' },
    { word: 'bureaucracy', hint: 'Begins "bureau-".' },
    { word: 'questionnaire', hint: 'Two "n"s.' },
    { word: 'entrepreneur', hint: 'Ends with "-neur".' },
    { word: 'parliament', hint: 'Hidden "ia": "parl-ia-ment".' },
    { word: 'millennium', hint: 'Two "l"s, two "n"s.' },
    { word: 'guarantee', hint: 'Begins "gua-".' },
    { word: 'fluorescent', hint: 'Contains "-uo-" and "-sc-".' },
    { word: 'hierarchy', hint: 'Begins "hier-".' },
    { word: 'inoculate', hint: 'One "n", one "c".' },
    { word: 'connoisseur', hint: 'Two "n"s, two "s"s.' },
    { word: 'onomatopoeia', hint: 'Ends "-poeia".' },
    { word: 'silhouette', hint: 'Silent "h": "sil-hou-ette".' }
  ]
};

export default misspeltWords;
