// data.js — ONE central education data model. Every dashboard reads/writes this same graph;
// role permissions (store.js) decide what each user sees. This is seed data for the prototype;
// in production these are records served by the Tutor Match API.

export const SUBJECTS = [
  { id: 'emath', name: 'E-Math', color: '#4f46e5', icon: 'chart' },
  { id: 'amath', name: 'A-Math', color: '#7c3aed', icon: 'route' },
  { id: 'eng', name: 'English', color: '#0ea5e9', icon: 'book' },
  { id: 'chem', name: 'Chemistry', color: '#f59e0b', icon: 'beaker' },
  { id: 'bio', name: 'Biology', color: '#10b981', icon: 'leaf' },
  { id: 'phys', name: 'Physics', color: '#ef4444', icon: 'atom' },
  { id: 'hum', name: 'Humanities', color: '#14b8a6', icon: 'globe' },
  { id: 'chi', name: 'Chinese', color: '#ec4899', icon: 'lang' },
];

// Topics per subject (MOE-style syllabus map).
const T = {
  emath: ['Algebra', 'Fractions & Ratio', 'Percentage', 'Geometry', 'Trigonometry', 'Statistics'],
  amath: ['Polynomials', 'Indices & Surds', 'Quadratic Functions', 'Trigonometry', 'Differentiation', 'Integration'],
  eng: ['Comprehension', 'Composition', 'Grammar', 'Oral', 'Summary Writing'],
  chem: ['Atomic Structure', 'Chemical Bonding', 'Acids & Bases', 'The Mole', 'Organic Chemistry', 'Redox'],
  bio: ['Cell Structure', 'Transport', 'Genetics', 'Ecology', 'Enzymes'],
  phys: ['Kinematics', 'Forces', 'Energy', 'Electricity', 'Waves'],
  hum: ['Geography Skills', 'History', 'Source-Based Skills'],
  chi: ['理解 Comprehension', '作文 Composition', '口试 Oral', '词汇 Vocabulary'],
};
export const TOPICS = [];
for (const s of SUBJECTS) (T[s.id] || []).forEach((name, i) => TOPICS.push({ id: `${s.id}-${i}`, subjectId: s.id, name }));
export const topicsOf = (subjectId) => TOPICS.filter((t) => t.subjectId === subjectId);
const tid = (subjectId, i) => `${subjectId}-${i}`;

export const STATUS = {
  'not-started': { label: 'Not Started', color: '#94a3b8', cls: 'b-mute' },
  learning: { label: 'Learning', color: '#3b82f6', cls: 'b-info' },
  'needs-revision': { label: 'Needs Revision', color: '#f59e0b', cls: 'b-warn' },
  mastered: { label: 'Mastered', color: '#10b981', cls: 'b-ok' },
};

// Build a progress map for a student from a compact spec, defaulting enrolled topics to not-started.
function buildProgress(studentId, subjects, spec) {
  const out = {};
  for (const sub of subjects) for (const t of topicsOf(sub)) out[`${studentId}:${t.id}`] = { status: 'not-started', accuracy: 0 };
  for (const [subId, topicMap] of Object.entries(spec)) {
    for (const [i, code] of Object.entries(topicMap)) {
      const [status, acc] = code.split('@');
      out[`${studentId}:${tid(subId, i)}`] = { status, accuracy: Number(acc || 0) };
    }
  }
  return out;
}

export function seed() {
  const db = {
    parents: [
      { id: 'pri', name: 'Priya Sharma', email: 'priya@example.com', childrenIds: ['ethan', 'maya'], plan: 'Family Premium', joined: '2024-08' },
      { id: 'goh', name: 'Mr Goh', email: 'goh@example.com', childrenIds: ['daniel'], plan: 'Standard', joined: '2025-01' },
    ],
    students: [
      { id: 'ethan', parentId: 'pri', name: 'Ethan Lim', level: 'Secondary 3', subjects: ['emath', 'amath', 'chem', 'phys'], tutors: { emath: 'chua' }, streak: 6, weeklyGoal: 5, weeklyDone: 4, joined: '2024-08' },
      { id: 'maya', parentId: 'pri', name: 'Maya Lim', level: 'Secondary 1', subjects: ['emath', 'eng', 'chi'], tutors: {}, streak: 2, weeklyGoal: 4, weeklyDone: 1, joined: '2025-02' },
      { id: 'daniel', parentId: 'goh', name: 'Daniel Goh', level: 'Secondary 4', subjects: ['chem', 'phys', 'amath'], tutors: { chem: 'rajan', amath: 'chua' }, streak: 11, weeklyGoal: 6, weeklyDone: 6, joined: '2025-01' },
    ],
    tutors: [
      { id: 'chua', name: 'Ms Chua', subjects: ['emath', 'amath'], rating: 4.9, reviews: 128, rate: 60, status: 'active', studentIds: ['ethan', 'daniel'], earningsMonth: 2640, yearsExp: 8, blurb: 'NIE-trained, 8 yrs. Specialises in O-Level E-/A-Math.' },
      { id: 'rajan', name: 'Mr Rajan', subjects: ['chem', 'phys'], rating: 4.7, reviews: 86, rate: 65, status: 'active', studentIds: ['daniel'], earningsMonth: 1820, yearsExp: 6, blurb: 'Ex-MOE Chemistry HOD. Concept-first teaching.' },
      { id: 'wong', name: 'Ms Wong', subjects: ['eng', 'hum'], rating: 4.8, reviews: 64, rate: 55, status: 'active', studentIds: [], earningsMonth: 0, yearsExp: 5, blurb: 'English & Humanities. Strong on essay technique.' },
      { id: 'lee', name: 'Mr Lee', subjects: ['emath', 'phys'], rating: 4.6, reviews: 41, rate: 50, status: 'active', studentIds: [], earningsMonth: 0, yearsExp: 4, blurb: 'Patient, great with exam-anxious students.' },
    ],
    progress: {
      ...buildProgress('ethan', ['emath', 'amath', 'chem', 'phys'], {
        emath: { 0: 'mastered@92', 1: 'mastered@88', 2: 'learning@76', 3: 'needs-revision@54', 4: 'not-started@0', 5: 'learning@70' },
        amath: { 0: 'needs-revision@48', 1: 'learning@66', 2: 'needs-revision@52' },
        chem: { 0: 'mastered@90', 1: 'learning@72', 2: 'needs-revision@58', 3: 'learning@68' },
        phys: { 0: 'learning@74', 1: 'learning@70', 2: 'mastered@86' },
      }),
      ...buildProgress('maya', ['emath', 'eng', 'chi'], {
        emath: { 0: 'learning@64', 1: 'needs-revision@50' },
        eng: { 0: 'learning@72', 1: 'needs-revision@55', 2: 'learning@68' },
        chi: { 0: 'learning@60', 3: 'needs-revision@48' },
      }),
      ...buildProgress('daniel', ['chem', 'phys', 'amath'], {
        chem: { 0: 'mastered@94', 1: 'mastered@90', 2: 'learning@78', 3: 'mastered@88', 4: 'learning@72', 5: 'needs-revision@56' },
        phys: { 0: 'mastered@88', 1: 'mastered@84', 2: 'learning@76', 4: 'learning@70' },
        amath: { 2: 'learning@74', 4: 'needs-revision@52' },
      }),
    },
    lessons: [
      { id: 'l1', tutorId: 'chua', studentId: 'ethan', subjectId: 'emath', date: '2025-05-19', status: 'completed', summary: 'Worked through trigonometry word problems; Ethan grasped bearings well. Geometry proofs still shaky.', homework: 'Worksheet 3.4 (Geometry) — Q1–8', attendance: 'present' },
      { id: 'l2', tutorId: 'chua', studentId: 'ethan', subjectId: 'emath', date: '2025-05-26', status: 'scheduled' },
      { id: 'l3', tutorId: 'chua', studentId: 'daniel', subjectId: 'amath', date: '2025-05-27', status: 'pending-confirm' },
      { id: 'l4', tutorId: 'rajan', studentId: 'daniel', subjectId: 'chem', date: '2025-05-20', status: 'completed', summary: 'Redox half-equations. Daniel needs more practice balancing in acidic medium.', homework: 'Past-year redox set B', attendance: 'present' },
      { id: 'l5', tutorId: 'rajan', studentId: 'daniel', subjectId: 'chem', date: '2025-05-28', status: 'scheduled' },
    ],
    worksheets: [
      { id: 'w1', studentId: 'ethan', topicId: 'emath-0', date: '2025-05-22', status: 'done', score: 90, type: 'Practice' },
      { id: 'w2', studentId: 'ethan', topicId: 'emath-3', date: '2025-05-23', status: 'done', score: 55, type: 'Remediation' },
      { id: 'w3', studentId: 'ethan', topicId: 'amath-0', date: '2025-05-24', status: 'done', score: 48, type: 'Practice' },
      { id: 'w4', studentId: 'ethan', topicId: 'chem-2', date: null, status: 'assigned', score: null, type: 'Remediation' },
      { id: 'w5', studentId: 'maya', topicId: 'emath-1', date: '2025-05-21', status: 'done', score: 50, type: 'Practice' },
      { id: 'w6', studentId: 'maya', topicId: 'eng-1', date: null, status: 'assigned', score: null, type: 'Practice' },
      { id: 'w7', studentId: 'daniel', topicId: 'chem-5', date: '2025-05-24', status: 'done', score: 56, type: 'Remediation' },
    ],
    reports: [
      { id: 'r1', tutorId: 'chua', studentId: 'ethan', date: '2025-05-19', text: 'Strong improvement in algebra and trig. Geometry proofs need attention before mid-years.', focus: ['emath-3'] },
      { id: 'r2', tutorId: 'rajan', studentId: 'daniel', date: '2025-05-20', text: 'On track for chemistry. Redox is the last weak area; assigned targeted practice.', focus: ['chem-5'] },
    ],
    invoices: [
      { id: 'inv1', parentId: 'pri', label: 'May tuition — Ms Chua (4 lessons)', amount: 240, due: '2025-06-01', status: 'paid' },
      { id: 'inv2', parentId: 'pri', label: 'Family Premium app — June', amount: 29, due: '2025-06-05', status: 'due' },
      { id: 'inv3', parentId: 'goh', label: 'May tuition — Mr Rajan (4 lessons)', amount: 260, due: '2025-06-01', status: 'due' },
    ],
    // Admin / operations
    leads: [
      { id: 'ld1', parent: 'Janet Koh', need: 'Sec 2 Science tutor', source: 'Website', status: 'new', age: '2h' },
      { id: 'ld2', parent: 'Faizal R.', need: 'Sec 4 A-Math, exam in 8 wks', source: 'Referral', status: 'contacted', age: '1d' },
      { id: 'ld3', parent: 'Wei Ling', need: 'Pri 6 English + Math', source: 'Ad', status: 'new', age: '5h' },
    ],
    matchQueue: [
      { id: 'mq1', studentName: 'Faizal Jr.', level: 'Secondary 4', subjectId: 'amath', urgency: 'high',
        candidates: [{ tutorId: 'chua', score: 94 }, { tutorId: 'lee', score: 81 }], status: 'open' },
    ],
    tickets: [
      { id: 'tk1', from: 'Priya Sharma', role: 'Parent', subject: 'Reschedule Friday lesson', priority: 'normal', status: 'open', age: '3h' },
      { id: 'tk2', from: 'Mr Rajan', role: 'Tutor', subject: 'Payout question — May', priority: 'low', status: 'open', age: '1d' },
    ],
    notifications: [
      { id: 'n1', for: 'pri', type: 'warn', icon: 'alert', text: 'Weakness detected in A-Math (Polynomials) for Ethan', time: '2h ago' },
      { id: 'n2', for: 'pri', type: 'info', icon: 'clipboard', text: 'Ms Chua uploaded a lesson summary for Ethan', time: '1d ago' },
      { id: 'n3', for: 'pri', type: 'warn', icon: 'clock', text: "Maya's English revision is overdue", time: '1d ago' },
      { id: 'n4', for: 'ethan', type: 'info', icon: 'sparkles', text: 'New revision plan ready for your mid-years', time: '3h ago' },
      { id: 'n5', for: 'ethan', type: 'warn', icon: 'target', text: 'Geometry needs revision — worksheet assigned', time: '1d ago' },
      { id: 'n6', for: 'chua', type: 'info', icon: 'calendar', text: 'Daniel’s A-Math lesson awaits your confirmation', time: '4h ago' },
      { id: 'n7', for: 'admin', type: 'bad', icon: 'heart', text: 'Churn risk: Goh family — revision down 40% this month', time: '2h ago' },
      { id: 'n8', for: 'admin', type: 'info', icon: 'inbox', text: '3 new parent enquiries awaiting assignment', time: '5h ago' },
    ],
    // revision activity: last 7 days per student (minutes), index 0 = 6 days ago … 6 = today
    revision: {
      ethan: [20, 0, 35, 25, 0, 40, 30],
      maya: [0, 15, 0, 0, 20, 0, 0],
      daniel: [45, 40, 50, 35, 40, 45, 30],
    },
  };
  return db;
}
