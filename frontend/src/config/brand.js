// Central brand + service catalog for Tian Jun Education Group.
// Add new services here to surface them on the group landing page.
export const GROUP_NAME = 'Tian Jun Education Group';
export const GROUP_SHORT = 'Tian Jun';

// Resource hub categories. `id` must match the backend Resource enum.
export const RESOURCE_CATEGORIES = [
  {
    id: 'understanding-moe',
    name: 'Understanding MOE',
    blurb: 'Plain-English guides to the MOE syllabus and curriculum.'
  },
  {
    id: 'worksheets',
    name: 'Worksheets & Papers',
    blurb: 'Our own practice papers and topic exercises to download.'
  },
  {
    id: 'activities',
    name: 'Family Activities',
    blurb: 'Educational activities families can do together at home.'
  },
  {
    id: 'partners',
    name: 'From Our Partners',
    blurb: 'Content created with local businesses we work with.'
  }
];

export const SERVICES = [
  {
    id: 'tutoring',
    name: 'Tutor Matching',
    tagline: 'Connect with expert tutors and start learning today.',
    path: '/tutoring',
    available: true
  },
  {
    id: 'edu-apps',
    name: 'Edu Apps',
    tagline: 'Interactive learning apps for every student.',
    path: '/edu-apps',
    available: false
  }
];
