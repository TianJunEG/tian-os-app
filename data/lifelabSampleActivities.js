export const LIFE_LAB_SAMPLE_ACTIVITIES = [
  {
    libraryKey: 'primary-math-supermarket-best-buy',
    title: 'Supermarket Best Buy',
    subject: 'Math',
    level: 'Primary Math',
    estimatedDuration: '35-45 min',
    activityType: 'parent_home',
    topic: 'Ratio, rate, money',
    realLifeContext: 'Families compare pack sizes and prices when shopping. The cheapest item on the shelf is not always the best value.',
    learningObjectives: [
      'Calculate unit price using division.',
      'Compare quantities and prices to justify a real buying decision.',
      'Explain why value-for-money is not the only shopping consideration.'
    ],
    materials: ['Grocery receipt, supermarket shelf, or online store', 'Calculator', 'Notebook'],
    instructions: 'Compare two or three pack sizes of the same product and decide which is the best value.',
    steps: [
      'Choose one product that comes in at least two sizes.',
      'Record the price and quantity for each pack.',
      'Calculate the price per 100 g, per litre, or per item.',
      'Choose the best buy and explain your reasoning.'
    ],
    dataRecording: 'Product name, pack size, price, unit price, and best-buy decision.',
    reflectionQuestions: [
      'Was the largest pack the best value? Explain using your calculations.',
      'When might a family choose a smaller pack even if it costs more per unit?'
    ],
    evidencePrompt: 'Optional: upload a photo of the shelf label, receipt, or your comparison table.',
    primaryE21cc: ['Critical Thinking', 'Decision Making'],
    secondaryE21cc: ['Communication', 'Financial Literacy'],
    teacherNotes: 'Good for math journals or parent-home learning. Encourage students to show the division used for unit price.'
  },
  {
    libraryKey: 'primary-science-shadow-clock',
    title: 'Shadow Clock',
    subject: 'Science',
    level: 'Primary Science',
    estimatedDuration: '60-90 min across a morning or afternoon',
    activityType: 'home',
    topic: 'Light and shadows',
    realLifeContext: 'Before digital clocks, people used the Sun and changing shadows to estimate time.',
    learningObjectives: [
      'Observe how shadow length and direction change over time.',
      'Relate shadow patterns to the apparent movement of the Sun.',
      'Use observations as evidence for a scientific explanation.'
    ],
    materials: ['Straight stick or pencil', 'Chalk or masking tape', 'Ruler or measuring tape', 'Sunny outdoor spot'],
    instructions: 'Track a stick shadow over time and use the pattern to explain how a sundial works.',
    steps: [
      'Place a stick upright in a sunny spot.',
      'Mark the tip of the shadow and record the time.',
      'Repeat every 20-30 minutes for at least three observations.',
      'Measure each shadow length and note its direction.',
      'Explain the pattern using what you know about light.'
    ],
    dataRecording: 'Time, shadow length, shadow direction, and weather notes.',
    reflectionQuestions: [
      'When was the shadow longest and shortest?',
      'How could your observations be used to make a simple sundial?'
    ],
    evidencePrompt: 'Optional: upload a photo of your shadow marks or observation table.',
    primaryE21cc: ['Observation', 'Critical Thinking'],
    secondaryE21cc: ['Communication', 'Self-Directed Learning'],
    teacherNotes: 'Remind students not to look directly at the Sun. Works best on a clear day.'
  },
  {
    libraryKey: 'lower-secondary-math-commute-data',
    title: 'Commute Data Investigator',
    subject: 'Math',
    level: 'Lower Secondary Math',
    estimatedDuration: '45-60 min',
    activityType: 'math_journal',
    topic: 'Data handling and averages',
    realLifeContext: 'Students and families make daily route choices using travel time, reliability, and cost.',
    learningObjectives: [
      'Collect and organise real travel-time data.',
      'Calculate mean, median, and range.',
      'Use data to make and justify a practical recommendation.'
    ],
    materials: ['Timer or phone clock', 'Notebook or spreadsheet', 'Map or transport app'],
    instructions: 'Record several commute or route timings, then analyse which option is most reliable.',
    steps: [
      'Choose two possible routes for a familiar journey.',
      'Record at least three timings for each route, using actual trips or a transport app at different times.',
      'Calculate the mean, median, and range for each route.',
      'Recommend the better route for a school day and justify it with data.'
    ],
    dataRecording: 'Route, date/time, travel duration, mean, median, range, and final recommendation.',
    reflectionQuestions: [
      'Which average best represents the route and why?',
      'What other factors besides travel time could change your recommendation?'
    ],
    evidencePrompt: 'Optional: upload a photo or screenshot of your table, chart, or route comparison.',
    primaryE21cc: ['Data Literacy', 'Decision Making'],
    secondaryE21cc: ['Critical Thinking', 'Communication'],
    teacherNotes: 'Useful for group work. Students can use simulated timings if actual travel data is not available.'
  },
  {
    libraryKey: 'lower-secondary-science-home-energy-audit',
    title: 'Home Energy Audit',
    subject: 'Science',
    level: 'Lower Secondary Science',
    estimatedDuration: '45-60 min',
    activityType: 'holiday',
    topic: 'Energy transfer and conservation',
    realLifeContext: 'Households make choices about appliances, lighting, and habits to reduce energy waste and cost.',
    learningObjectives: [
      'Identify common energy transfers in household devices.',
      'Distinguish useful energy output from wasted energy.',
      'Propose evidence-based ways to reduce energy waste.'
    ],
    materials: ['Home appliance labels or online specifications', 'Notebook', 'Electricity bill if available'],
    instructions: 'Inspect three household devices and identify where energy is useful or wasted.',
    steps: [
      'Choose three household devices such as a fan, kettle, lamp, or charger.',
      'Record the device power rating if available.',
      'Describe the input energy and useful output energy.',
      'Identify one possible wasted energy transfer for each device.',
      'Recommend one realistic action to reduce waste at home.'
    ],
    dataRecording: 'Device, power rating, input energy, useful output, wasted output, and saving action.',
    reflectionQuestions: [
      'Which device had the clearest wasted energy transfer?',
      'Which saving action would be easiest for your household to adopt?'
    ],
    evidencePrompt: 'Optional: upload a photo of an appliance label, your audit table, or a sketch of energy transfers.',
    primaryE21cc: ['Systems Thinking', 'Responsible Decision Making'],
    secondaryE21cc: ['Sustainability Awareness', 'Communication'],
    teacherNotes: 'Keep the activity observational. Students should not open appliances or touch unsafe electrical parts.'
  }
];

export default LIFE_LAB_SAMPLE_ACTIVITIES;
