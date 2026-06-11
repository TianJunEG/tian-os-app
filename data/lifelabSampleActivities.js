export const LIFE_LAB_SAMPLE_ACTIVITIES = [
  // ═══════════════════════════════════════════════════════════════════
  //  PRIMARY MATH (8 activities)
  // ═══════════════════════════════════════════════════════════════════
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
    evidencePrompt: 'Upload a photo of the shelf label, receipt, or your comparison table.',
    primaryE21cc: ['Critical Thinking', 'Decision Making'],
    secondaryE21cc: ['Communication', 'Financial Literacy'],
    teacherNotes: 'Good for math journals or parent-home learning. Encourage students to show the division used for unit price.'
  },
  {
    libraryKey: 'primary-math-recipe-scaling',
    title: 'Recipe Scaling Challenge',
    subject: 'Math',
    level: 'Primary Math',
    estimatedDuration: '30-40 min',
    activityType: 'parent_home',
    topic: 'Fractions, multiplication, ratio',
    realLifeContext: 'When cooking for more or fewer people, every ingredient amount must be scaled up or down proportionally.',
    learningObjectives: [
      'Multiply or divide fractions and whole numbers to scale a recipe.',
      'Recognise proportional relationships in a real context.',
      'Communicate mathematical reasoning in everyday language.'
    ],
    materials: ['A recipe (from a book, website, or family favourite)', 'Calculator', 'Measuring cups or spoons (optional)'],
    instructions: 'Choose a recipe for 4 people and scale it to serve a different number.',
    steps: [
      'Find a recipe that serves 4 people and list all ingredient amounts.',
      'Choose a new serving size (e.g. 6, 10, or 2).',
      'Calculate each new ingredient amount using multiplication or division.',
      'Check your scaled recipe makes sense (e.g. no tiny fractions of eggs).'
    ],
    dataRecording: 'Original recipe, target servings, scaled ingredient amounts, and any adjustments.',
    reflectionQuestions: [
      'Which ingredient was hardest to scale? Why?',
      'What would you do if a scaled amount is an awkward fraction (like 2/3 of an egg)?'
    ],
    evidencePrompt: 'Upload a photo of your original and scaled recipes side by side.',
    primaryE21cc: ['Critical Thinking', 'Problem Solving'],
    secondaryE21cc: ['Communication', 'Collaboration'],
    teacherNotes: 'Encourage students to try actually cooking the scaled recipe at home with a parent.'
  },
  {
    libraryKey: 'primary-math-pocket-money-tracker',
    title: 'Pocket Money Tracker',
    subject: 'Math',
    level: 'Primary Math',
    estimatedDuration: '30 min setup + 1 week tracking',
    activityType: 'home',
    topic: 'Money, addition, subtraction, data handling',
    realLifeContext: 'Managing pocket money teaches budgeting, saving, and the difference between needs and wants.',
    learningObjectives: [
      'Record income and expenses accurately.',
      'Calculate running totals using addition and subtraction.',
      'Represent spending data in a simple chart.'
    ],
    materials: ['Notebook or spreadsheet', 'Receipts or memory of spending'],
    instructions: 'Track every dollar you receive and spend over one week, then analyse your spending.',
    steps: [
      'Create a table with columns: Date, Description, In, Out, Balance.',
      'Record your starting balance.',
      'Log every transaction for one week.',
      'Calculate your final balance and total spending.',
      'Draw a bar chart showing spending by category.'
    ],
    dataRecording: 'Transaction log with running balance, total income, total spending, and category breakdown.',
    reflectionQuestions: [
      'What did you spend the most on? Was it a need or a want?',
      'If you wanted to save $5 next week, what would you change?'
    ],
    evidencePrompt: 'Upload a photo of your transaction log or spending chart.',
    primaryE21cc: ['Financial Literacy', 'Self-Management'],
    secondaryE21cc: ['Data Literacy', 'Decision Making'],
    teacherNotes: 'Students without pocket money can track a hypothetical budget or a family grocery trip.'
  },
  {
    libraryKey: 'primary-math-room-measurement',
    title: 'My Room in Numbers',
    subject: 'Math',
    level: 'Primary Math',
    estimatedDuration: '40-50 min',
    activityType: 'home',
    topic: 'Measurement, area, perimeter',
    realLifeContext: 'Interior designers, builders, and families all need to measure rooms to plan furniture layout, flooring, or paint.',
    learningObjectives: [
      'Measure lengths accurately using a ruler or tape measure.',
      'Calculate area and perimeter of rectangular spaces.',
      'Draw a scale plan of a real space.'
    ],
    materials: ['Measuring tape or ruler', 'Graph paper', 'Pencil'],
    instructions: 'Measure your bedroom (or another room) and create a scale floor plan.',
    steps: [
      'Measure the length and width of the room in metres.',
      'Calculate the area and perimeter.',
      'Choose a scale (e.g. 1 cm = 0.5 m) and draw the room on graph paper.',
      'Measure and draw major furniture pieces to scale.',
      'Suggest one improvement to the room layout and explain why.'
    ],
    dataRecording: 'Room dimensions, area, perimeter, scale used, and furniture measurements.',
    reflectionQuestions: [
      'How much floor space is taken up by furniture?',
      'If you needed to buy carpet for this room, how many square metres would you need?'
    ],
    evidencePrompt: 'Upload a photo of your scale floor plan.',
    primaryE21cc: ['Problem Solving', 'Critical Thinking'],
    secondaryE21cc: ['Communication', 'Spatial Awareness'],
    teacherNotes: 'Good for consolidating area and perimeter. Students can measure a common room if bedrooms are shared.'
  },
  {
    libraryKey: 'primary-math-symmetry-hunt',
    title: 'Symmetry Hunt',
    subject: 'Math',
    level: 'Primary Math',
    estimatedDuration: '25-35 min',
    activityType: 'home',
    topic: 'Symmetry, geometry',
    realLifeContext: 'Symmetry appears everywhere — in nature, architecture, art, and design.',
    learningObjectives: [
      'Identify lines of symmetry in everyday objects.',
      'Distinguish between objects with one, multiple, or no lines of symmetry.',
      'Communicate geometric observations using correct vocabulary.'
    ],
    materials: ['Camera or phone', 'Notebook', 'Small mirror (optional)'],
    instructions: 'Find and photograph at least 5 objects with lines of symmetry in your home or neighbourhood.',
    steps: [
      'Walk through your home or neighbourhood looking for symmetric objects.',
      'Photograph at least 5 objects (e.g. leaves, tiles, windows, logos).',
      'For each object, sketch the line(s) of symmetry.',
      'Sort your objects by number of symmetry lines.',
      'Find one object that looks symmetric but is not — explain why.'
    ],
    dataRecording: 'Object name, photo, number of symmetry lines, and sketch.',
    reflectionQuestions: [
      'Which object had the most lines of symmetry?',
      'Why do you think designers use symmetry so often?'
    ],
    evidencePrompt: 'Upload your best symmetry photo with the line of symmetry drawn on it.',
    primaryE21cc: ['Observation', 'Critical Thinking'],
    secondaryE21cc: ['Communication', 'Creativity'],
    teacherNotes: 'A mirror helps students verify lines of symmetry. Good for P3-P4 geometry.'
  },
  {
    libraryKey: 'primary-math-time-diary',
    title: 'My Day in Minutes',
    subject: 'Math',
    level: 'Primary Math',
    estimatedDuration: '20 min + 1 day tracking',
    activityType: 'home',
    topic: 'Time, data handling, fractions',
    realLifeContext: 'Understanding how we spend time helps with planning, punctuality, and balance.',
    learningObjectives: [
      'Measure and record durations of daily activities.',
      'Calculate fractions or percentages of a day spent on each category.',
      'Represent time data in a pie chart or bar chart.'
    ],
    materials: ['Clock or phone timer', 'Notebook or spreadsheet'],
    instructions: 'Track how you spend your time for one full day, then create a chart.',
    steps: [
      'Choose a school day or weekend day to track.',
      'Record the start and end time of each activity (sleep, school, play, meals, etc.).',
      'Calculate the duration of each activity in minutes.',
      'Group activities into categories and find the total for each.',
      'Draw a pie chart or bar chart showing your day.'
    ],
    dataRecording: 'Activity log with start time, end time, duration, and category.',
    reflectionQuestions: [
      'What fraction of your day was spent sleeping?',
      'If you wanted more free time, which activity could you shorten?'
    ],
    evidencePrompt: 'Upload a photo of your time chart.',
    primaryE21cc: ['Self-Management', 'Data Literacy'],
    secondaryE21cc: ['Critical Thinking', 'Communication'],
    teacherNotes: 'Pair with fraction/percentage lessons. Students can compare charts with classmates.'
  },
  {
    libraryKey: 'primary-math-shape-structures',
    title: 'Strongest Shape Builder',
    subject: 'Math',
    level: 'Primary Math',
    estimatedDuration: '40-50 min',
    activityType: 'group',
    topic: 'Geometry, properties of shapes',
    realLifeContext: 'Engineers choose triangles and other shapes for bridges and buildings because of their structural strength.',
    learningObjectives: [
      'Identify 2D shapes used in structures.',
      'Test which shapes are most rigid and stable.',
      'Explain why triangles are common in engineering.'
    ],
    materials: ['Straws or craft sticks', 'Tape or clay connectors', 'Small weights (coins, erasers)'],
    instructions: 'Build structures using different shapes and test which holds the most weight.',
    steps: [
      'Build a square frame using straws and connectors.',
      'Build a triangle frame using the same materials.',
      'Test each by placing weights on top — record how much each holds before collapsing.',
      'Try combining shapes (e.g. add a diagonal to make triangles in the square).',
      'Record your findings and explain which shape was strongest.'
    ],
    dataRecording: 'Shape type, number of sides, weight held, and whether it collapsed or stayed rigid.',
    reflectionQuestions: [
      'Why was the triangle stronger than the square?',
      'Where have you seen triangles used in real structures?'
    ],
    evidencePrompt: 'Upload a photo of your shape structures and weight test.',
    primaryE21cc: ['Problem Solving', 'Systems Thinking'],
    secondaryE21cc: ['Collaboration', 'Creativity'],
    teacherNotes: 'Great as a group activity. Link to real bridges and trusses for extension.'
  },
  {
    libraryKey: 'primary-math-fraction-pizza',
    title: 'Fair Share Pizza Party',
    subject: 'Math',
    level: 'Primary Math',
    estimatedDuration: '30-40 min',
    activityType: 'parent_home',
    topic: 'Fractions, equal parts, division',
    realLifeContext: 'Sharing food fairly is one of the most natural fraction problems children encounter.',
    learningObjectives: [
      'Divide a whole into equal parts.',
      'Compare fractions with different denominators.',
      'Solve a real sharing problem using fraction reasoning.'
    ],
    materials: ['Paper plates or circles', 'Scissors', 'Coloured markers'],
    instructions: 'Plan how to share pizzas fairly among different numbers of people.',
    steps: [
      'Draw 3 identical circles (pizzas) on paper.',
      'Cut Pizza 1 into 4 equal slices, Pizza 2 into 6, Pizza 3 into 8.',
      'If 3 friends share Pizza 1, how much does each get? Show with fractions.',
      'Can you share Pizza 2 equally among 4 people? Explain.',
      'Design your own sharing problem and solve it.'
    ],
    dataRecording: 'Number of slices, fraction per person, and whether sharing was equal.',
    reflectionQuestions: [
      'Which pizza was easiest to share fairly? Why?',
      'Is 1/4 of a large pizza more or less food than 1/3 of a small pizza?'
    ],
    evidencePrompt: 'Upload a photo of your pizza fraction models.',
    primaryE21cc: ['Problem Solving', 'Critical Thinking'],
    secondaryE21cc: ['Communication', 'Collaboration'],
    teacherNotes: 'Connects fractions to a concrete context. Good for P3-P4.'
  },

  // ═══════════════════════════════════════════════════════════════════
  //  PRIMARY SCIENCE (6 activities)
  // ═══════════════════════════════════════════════════════════════════
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
    evidencePrompt: 'Upload a photo of your shadow marks or observation table.',
    primaryE21cc: ['Observation', 'Critical Thinking'],
    secondaryE21cc: ['Communication', 'Self-Directed Learning'],
    teacherNotes: 'Remind students not to look directly at the Sun. Works best on a clear day.'
  },
  {
    libraryKey: 'primary-science-plant-growth',
    title: 'Seed Growth Experiment',
    subject: 'Science',
    level: 'Primary Science',
    estimatedDuration: '20 min setup + 2 weeks observation',
    activityType: 'home',
    topic: 'Plants, life cycles, fair testing',
    realLifeContext: 'Farmers and gardeners must understand what plants need to grow well.',
    learningObjectives: [
      'Set up a simple fair test with one changed variable.',
      'Record observations systematically over time.',
      'Draw conclusions from collected data.'
    ],
    materials: ['Bean or mung bean seeds (4-6)', 'Small cups or containers', 'Cotton wool or soil', 'Water', 'Ruler'],
    instructions: 'Grow seeds under two different conditions and compare their growth over two weeks.',
    steps: [
      'Set up two groups of seeds: one in sunlight and one in a dark cupboard (keep water the same).',
      'Label each group clearly.',
      'Water both groups the same amount every 2 days.',
      'Measure and record the height of each seedling every 2-3 days.',
      'After 2 weeks, compare the two groups and explain the difference.'
    ],
    dataRecording: 'Date, seedling heights (both groups), and observations about colour and health.',
    reflectionQuestions: [
      'What was the one variable you changed? What did you keep the same?',
      'What would happen if you also changed the amount of water?'
    ],
    evidencePrompt: 'Upload a photo of your seedlings at the start and end of the experiment.',
    primaryE21cc: ['Observation', 'Systems Thinking'],
    secondaryE21cc: ['Self-Directed Learning', 'Data Literacy'],
    teacherNotes: 'Mung beans sprout in 3-5 days and are easy to grow. Good for teaching fair tests.'
  },
  {
    libraryKey: 'primary-science-sink-float',
    title: 'Sink or Float Investigation',
    subject: 'Science',
    level: 'Primary Science',
    estimatedDuration: '30-40 min',
    activityType: 'home',
    topic: 'Materials, properties, density',
    realLifeContext: 'Ships are made of steel which is heavy, yet they float. Understanding density explains why.',
    learningObjectives: [
      'Predict whether objects will sink or float and test the prediction.',
      'Identify that sinking and floating depend on density, not just weight.',
      'Record results in a table and look for patterns.'
    ],
    materials: ['Large bowl or basin of water', '10 household objects of different materials', 'Towel'],
    instructions: 'Predict and test whether 10 household objects sink or float, then find the pattern.',
    steps: [
      'Collect 10 small objects (coin, cork, spoon, apple, key, sponge, etc.).',
      'For each object, predict whether it will sink or float.',
      'Test each object and record the result.',
      'Group the objects: sinkers vs floaters.',
      'Look for a pattern — is it about weight, size, or material?'
    ],
    dataRecording: 'Object name, material, prediction, result (sink/float), and pattern observed.',
    reflectionQuestions: [
      'Was a heavy object that floated surprising? Why did it float?',
      'How does a steel ship float if steel sinks?'
    ],
    evidencePrompt: 'Upload a photo of your objects sorted into sinkers and floaters.',
    primaryE21cc: ['Observation', 'Critical Thinking'],
    secondaryE21cc: ['Problem Solving', 'Communication'],
    teacherNotes: 'Good for introducing density without the formula. Pair with a plasticine boat challenge.'
  },
  {
    libraryKey: 'primary-science-magnet-survey',
    title: 'Magnet Survey at Home',
    subject: 'Science',
    level: 'Primary Science',
    estimatedDuration: '25-35 min',
    activityType: 'home',
    topic: 'Magnets, materials',
    realLifeContext: 'Magnets are used in doorbells, speakers, fridge doors, and MRT train systems.',
    learningObjectives: [
      'Test which materials are magnetic and which are not.',
      'Identify that only some metals are magnetic.',
      'Record and classify results systematically.'
    ],
    materials: ['A magnet (fridge magnet is fine)', 'At least 10 household objects', 'Notebook'],
    instructions: 'Use a magnet to test objects around your home and classify them as magnetic or non-magnetic.',
    steps: [
      'Collect at least 10 objects made of different materials.',
      'Predict whether each object will be attracted to the magnet.',
      'Test each object with the magnet and record the result.',
      'Sort your results into magnetic and non-magnetic groups.',
      'Write one sentence explaining what magnetic objects have in common.'
    ],
    dataRecording: 'Object name, material, prediction, result (magnetic/not), and conclusion.',
    reflectionQuestions: [
      'Were all metals magnetic? Which metals were not?',
      'Name one everyday device that uses a magnet.'
    ],
    evidencePrompt: 'Upload a photo of your sorted objects or results table.',
    primaryE21cc: ['Observation', 'Classification'],
    secondaryE21cc: ['Critical Thinking', 'Communication'],
    teacherNotes: 'Aluminium cans and copper coins are great counter-examples (metals that are not magnetic).'
  },
  {
    libraryKey: 'primary-science-water-cycle-model',
    title: 'Water Cycle in a Bag',
    subject: 'Science',
    level: 'Primary Science',
    estimatedDuration: '15 min setup + 2-3 days observation',
    activityType: 'home',
    topic: 'Water cycle, evaporation, condensation',
    realLifeContext: 'The water cycle drives rain, rivers, and weather — understanding it explains why it rains.',
    learningObjectives: [
      'Model evaporation and condensation using simple materials.',
      'Observe and describe the stages of the water cycle.',
      'Connect the model to real-world weather phenomena.'
    ],
    materials: ['Ziplock bag', 'Water', 'Blue food colouring (optional)', 'Tape', 'Sunny window'],
    instructions: 'Create a mini water cycle model and observe what happens over 2-3 days.',
    steps: [
      'Pour a small amount of water into a ziplock bag (add blue colouring if available).',
      'Seal the bag tightly and tape it to a sunny window.',
      'Observe the bag every few hours and record what you see.',
      'After 2-3 days, describe what happened to the water.',
      'Label a diagram of the water cycle using your observations.'
    ],
    dataRecording: 'Time, observations (droplets, mist, water level), and labelled diagram.',
    reflectionQuestions: [
      'Where did the water droplets on the bag come from?',
      'How is this model similar to real rain?'
    ],
    evidencePrompt: 'Upload a photo of your water cycle bag showing condensation.',
    primaryE21cc: ['Observation', 'Systems Thinking'],
    secondaryE21cc: ['Communication', 'Self-Directed Learning'],
    teacherNotes: 'Place on a south-facing window for best results. Draw attention to the evaporation-condensation-collection cycle.'
  },
  {
    libraryKey: 'primary-science-sound-investigation',
    title: 'Sound Vibration Detective',
    subject: 'Science',
    level: 'Primary Science',
    estimatedDuration: '30-40 min',
    activityType: 'home',
    topic: 'Sound, vibrations',
    realLifeContext: 'Musical instruments, speakers, and even our vocal cords all produce sound through vibrations.',
    learningObjectives: [
      'Demonstrate that sound is caused by vibrations.',
      'Observe vibrations using simple materials.',
      'Explain how pitch and volume relate to vibration properties.'
    ],
    materials: ['Rubber bands of different sizes', 'Empty tissue box or container', 'Ruler', 'Rice grains'],
    instructions: 'Investigate how vibrations create sound using rubber bands and rice.',
    steps: [
      'Stretch rubber bands of different thicknesses over an open container.',
      'Pluck each rubber band and observe the vibrations.',
      'Place rice grains on a drum or stretched cling wrap and tap nearby — watch the rice jump.',
      'Try making high and low sounds — describe the difference in vibrations.',
      'Record your observations about pitch, volume, and vibration speed.'
    ],
    dataRecording: 'Rubber band thickness, sound pitch (high/low), vibration speed (fast/slow), and rice movement.',
    reflectionQuestions: [
      'What happened to the pitch when you used a thicker rubber band?',
      'How did the rice prove that sound involves vibrations?'
    ],
    evidencePrompt: 'Upload a video or photo of your vibration experiment.',
    primaryE21cc: ['Observation', 'Critical Thinking'],
    secondaryE21cc: ['Creativity', 'Communication'],
    teacherNotes: 'Good for P3-P4. The rice-on-drum demonstration is very visual and engaging.'
  },

  // ═══════════════════════════════════════════════════════════════════
  //  LOWER SECONDARY MATH (4 activities)
  // ═══════════════════════════════════════════════════════════════════
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
    evidencePrompt: 'Upload a photo or screenshot of your table, chart, or route comparison.',
    primaryE21cc: ['Data Literacy', 'Decision Making'],
    secondaryE21cc: ['Critical Thinking', 'Communication'],
    teacherNotes: 'Useful for group work. Students can use simulated timings if actual travel data is not available.'
  },
  {
    libraryKey: 'lower-secondary-math-percentage-discount',
    title: 'Sale Season Spotter',
    subject: 'Math',
    level: 'Lower Secondary Math',
    estimatedDuration: '30-40 min',
    activityType: 'parent_home',
    topic: 'Percentage, discount, GST',
    realLifeContext: 'Sales use percentages to advertise discounts, but the real savings depend on the original price and terms.',
    learningObjectives: [
      'Calculate percentage discounts and final prices.',
      'Compare deals that use different discount structures.',
      'Evaluate whether a sale is genuinely good value.'
    ],
    materials: ['Sale advertisements (physical or online)', 'Calculator', 'Notebook'],
    instructions: 'Find 3 sale items, calculate the true savings, and decide which is the best deal.',
    steps: [
      'Find 3 items on sale from different shops or websites.',
      'Record the original price and discount percentage for each.',
      'Calculate the discount amount and final price (include GST if shown).',
      'Compare: which item has the biggest percentage saving? The biggest dollar saving?',
      'Decide which deal you would recommend and explain why.'
    ],
    dataRecording: 'Item, original price, discount %, discount amount, final price, and recommendation.',
    reflectionQuestions: [
      'Is a 50% discount always better than a 30% discount? Explain.',
      'How do shops use percentage discounts to make deals seem better than they are?'
    ],
    evidencePrompt: 'Upload screenshots of the sale prices you compared.',
    primaryE21cc: ['Financial Literacy', 'Critical Thinking'],
    secondaryE21cc: ['Decision Making', 'Communication'],
    teacherNotes: 'Good for linking to GST calculations. Pairs well with percentage lessons.'
  },
  {
    libraryKey: 'lower-secondary-math-probability-game',
    title: 'Is This Game Fair?',
    subject: 'Math',
    level: 'Lower Secondary Math',
    estimatedDuration: '40-50 min',
    activityType: 'group',
    topic: 'Probability, experimental vs theoretical',
    realLifeContext: 'Carnival games, lotteries, and board games all rely on probability — some are fair, some are not.',
    learningObjectives: [
      'Distinguish between experimental and theoretical probability.',
      'Conduct a probability experiment with repeated trials.',
      'Evaluate fairness using data.'
    ],
    materials: ['Two dice', 'Notebook', 'Calculator'],
    instructions: 'Play a dice game 50 times and use data to decide if the game is fair.',
    steps: [
      'Game rule: Player A wins if the sum of two dice is even; Player B wins if odd.',
      'Play 50 rounds and record the sum each time.',
      'Count wins for Player A and Player B.',
      'Calculate the experimental probability of each player winning.',
      'Compare with the theoretical probability — is the game fair?'
    ],
    dataRecording: 'Round number, dice values, sum, winner, running tally, and final probabilities.',
    reflectionQuestions: [
      'Was the experimental probability close to the theoretical probability?',
      'How could you change the rules to make an unfair game?'
    ],
    evidencePrompt: 'Upload a photo of your results table or probability chart.',
    primaryE21cc: ['Data Literacy', 'Critical Thinking'],
    secondaryE21cc: ['Problem Solving', 'Collaboration'],
    teacherNotes: 'The game IS fair (18 even sums vs 18 odd sums out of 36). Students often expect it not to be.'
  },
  {
    libraryKey: 'lower-secondary-math-speed-distance',
    title: 'Speed Trap Challenge',
    subject: 'Math',
    level: 'Lower Secondary Math',
    estimatedDuration: '40-50 min',
    activityType: 'group',
    topic: 'Speed, distance, time',
    realLifeContext: 'Speed limits exist because stopping distance depends on speed — faster means longer to stop.',
    learningObjectives: [
      'Measure distance and time to calculate speed.',
      'Apply the speed-distance-time formula to real motion.',
      'Present data in a distance-time graph.'
    ],
    materials: ['Measuring tape or marked track (20-50 m)', 'Stopwatch', 'Notebook'],
    instructions: 'Measure how fast you and your friends walk, jog, and run, then create distance-time graphs.',
    steps: [
      'Mark a straight track of known length (e.g. 30 metres).',
      'Time yourself walking, jogging, and running the distance. Repeat each 3 times.',
      'Calculate your average speed for each pace (speed = distance / time).',
      'Plot a distance-time graph for each pace on the same axes.',
      'Compare the slopes — what does a steeper line mean?'
    ],
    dataRecording: 'Distance, time (3 trials each), average time, average speed, and graph.',
    reflectionQuestions: [
      'How does the slope of the distance-time graph relate to speed?',
      'Why is it important to take multiple measurements and average them?'
    ],
    evidencePrompt: 'Upload a photo of your distance-time graph.',
    primaryE21cc: ['Data Literacy', 'Problem Solving'],
    secondaryE21cc: ['Collaboration', 'Communication'],
    teacherNotes: 'Works well as a PE cross-curricular activity. Use a school corridor or field.'
  },

  // ═══════════════════════════════════════════════════════════════════
  //  LOWER SECONDARY SCIENCE (4 activities)
  // ═══════════════════════════════════════════════════════════════════
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
    evidencePrompt: 'Upload a photo of an appliance label, your audit table, or a sketch of energy transfers.',
    primaryE21cc: ['Systems Thinking', 'Responsible Decision Making'],
    secondaryE21cc: ['Sustainability Awareness', 'Communication'],
    teacherNotes: 'Keep the activity observational. Students should not open appliances or touch unsafe electrical parts.'
  },
  {
    libraryKey: 'lower-secondary-science-food-label-analysis',
    title: 'Nutrition Label Detective',
    subject: 'Science',
    level: 'Lower Secondary Science',
    estimatedDuration: '35-45 min',
    activityType: 'parent_home',
    topic: 'Nutrition, food science, health',
    realLifeContext: 'Food labels help consumers make healthier choices, but the information can be confusing.',
    learningObjectives: [
      'Read and interpret nutrition labels on food packaging.',
      'Compare nutritional content across similar products.',
      'Make evidence-based recommendations about food choices.'
    ],
    materials: ['3-5 food packages with nutrition labels', 'Notebook', 'Calculator'],
    instructions: 'Compare the nutrition labels of similar food products and decide which is healthier.',
    steps: [
      'Choose 3 similar products (e.g. 3 brands of cereal, 3 types of drink).',
      'Record the energy (kJ/kcal), sugar, sodium, and fat per 100g for each.',
      'Create a comparison table.',
      'Rank the products from healthiest to least healthy based on your criteria.',
      'Explain what makes a product "healthy" — is it just low sugar?'
    ],
    dataRecording: 'Product name, serving size, energy, sugar, sodium, fat, and health ranking.',
    reflectionQuestions: [
      'Which nutrient surprised you the most across the products?',
      'Why might a product labelled "low fat" still not be the healthiest choice?'
    ],
    evidencePrompt: 'Upload a photo of the nutrition labels you compared.',
    primaryE21cc: ['Critical Thinking', 'Data Literacy'],
    secondaryE21cc: ['Decision Making', 'Health Literacy'],
    teacherNotes: 'Good cross-curricular link to health education. Remind students that "per serving" vs "per 100g" matters.'
  },
  {
    libraryKey: 'lower-secondary-science-acid-base-indicator',
    title: 'Kitchen Acid-Base Test',
    subject: 'Science',
    level: 'Lower Secondary Science',
    estimatedDuration: '40-50 min',
    activityType: 'home',
    topic: 'Acids, bases, indicators',
    realLifeContext: 'Many household products are acidic or basic — vinegar, baking soda, soap, lemon juice.',
    learningObjectives: [
      'Make a natural indicator from red cabbage.',
      'Test household liquids and classify them as acidic, neutral, or basic.',
      'Relate pH to everyday products.'
    ],
    materials: ['Red cabbage (a few leaves)', 'Hot water', 'Small cups', '5-6 household liquids (vinegar, soap water, lemon juice, baking soda solution, milk, water)'],
    instructions: 'Make a red cabbage indicator and test household liquids to classify their pH.',
    steps: [
      'Chop red cabbage leaves and soak in hot water for 10 minutes to make indicator liquid.',
      'Pour a small amount of indicator into 6 cups.',
      'Add a different household liquid to each cup and observe the colour change.',
      'Record the colour and classify each liquid as acidic (pink/red), neutral (purple), or basic (green/yellow).',
      'Arrange your liquids from most acidic to most basic.'
    ],
    dataRecording: 'Liquid name, indicator colour, classification (acid/neutral/base), and ranking.',
    reflectionQuestions: [
      'Which household liquid was the strongest acid? The strongest base?',
      'Why is it useful to know whether a cleaning product is acidic or basic?'
    ],
    evidencePrompt: 'Upload a photo of your coloured indicator cups.',
    primaryE21cc: ['Observation', 'Classification'],
    secondaryE21cc: ['Critical Thinking', 'Self-Directed Learning'],
    teacherNotes: 'Supervise hot water step. Red cabbage juice is an excellent natural indicator — purple at pH 7, red in acid, green in base.'
  },
  {
    libraryKey: 'lower-secondary-science-biodiversity-survey',
    title: 'Neighbourhood Biodiversity Survey',
    subject: 'Science',
    level: 'Lower Secondary Science',
    estimatedDuration: '45-60 min',
    activityType: 'home',
    topic: 'Biodiversity, ecosystems, classification',
    realLifeContext: 'Even urban areas have surprising biodiversity. Monitoring it helps track ecosystem health.',
    learningObjectives: [
      'Identify and count different species in a local area.',
      'Use a simple classification system to group organisms.',
      'Assess biodiversity using species count and distribution.'
    ],
    materials: ['Notebook', 'Camera or phone', 'Field guide or identification app (optional)'],
    instructions: 'Survey a small area near your home and record every different living thing you find.',
    steps: [
      'Choose a survey area: a park, garden, or school field (about 10m x 10m).',
      'Spend 20-30 minutes carefully observing all living things (plants, insects, birds, etc.).',
      'Record each species with a description, sketch or photo, and count.',
      'Classify your species into groups (plants, insects, birds, etc.).',
      'Calculate a simple biodiversity index: number of different species found.'
    ],
    dataRecording: 'Species name/description, group, count, and location within survey area.',
    reflectionQuestions: [
      'Which group of organisms had the most species?',
      'How might the biodiversity of your area change in a different season?'
    ],
    evidencePrompt: 'Upload photos of the species you found or your survey table.',
    primaryE21cc: ['Observation', 'Systems Thinking'],
    secondaryE21cc: ['Sustainability Awareness', 'Data Literacy'],
    teacherNotes: 'iNaturalist app can help with species identification. Encourage respectful observation — do not disturb habitats.'
  }
];

export default LIFE_LAB_SAMPLE_ACTIVITIES;
