import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import TutorProfile from './models/TutorProfile.js';

dotenv.config();

// Singapore-focused diverse tutor names (Chinese, Malay, Indian, Eurasian)
// Chinese names
const chineseFirstNames = [
  'Wei', 'Ming', 'Chen', 'Jun', 'Jing', 'Hui', 'Xiao', 'Li', 'Yan', 'Feng',
  'Lei', 'Yang', 'Peng', 'Qiang', 'Zhen', 'Ling', 'Mei', 'Na', 'Xiu', 'Hong',
  'David', 'Sarah', 'Michael', 'Emily', 'Robert', 'Jennifer', 'William', 'Jessica',
  'James', 'Amanda', 'Richard', 'Linda', 'Thomas', 'Barbara', 'Christopher', 'Elizabeth',
  'Alvin', 'Bethany', 'Calvin', 'Diana', 'Desmond', 'Eileen', 'Francis', 'Grace'
];

const chineseLastNames = [
  'Wong', 'Lee', 'Lim', 'Tan', 'Ng', 'Chua', 'Chen', 'Teo', 'Yeo', 'Quah',
  'Seah', 'Goh', 'Ong', 'Kwok', 'Cheng', 'Woo', 'Sng', 'Sin', 'Poh', 'Chow',
  'Khoo', 'Lau', 'Neo', 'Cheong', 'Tay', 'Koh', 'Chor', 'Wan', 'Tong', 'Soh'
];

// Malay names
const malayFirstNames = [
  'Azhar', 'Amir', 'Bashir', 'Daud', 'Farhan', 'Gazali', 'Hassan', 'Ishak',
  'Jamal', 'Karim', 'Latif', 'Malik', 'Nasir', 'Omar', 'Rais', 'Salim',
  'Taufik', 'Yusuf', 'Zainul', 'Adila', 'Asma', 'Bella', 'Citra', 'Dina',
  'Elsa', 'Fatima', 'Gita', 'Hana', 'Imelda', 'Jasmine', 'Kayla', 'Leila'
];

const malayLastNames = [
  'Abdullah', 'Ahmad', 'Ali', 'Ariffin', 'Aziz', 'Baharuddin', 'Buang', 'Daud',
  'Ghazali', 'Hassan', 'Hussain', 'Ibrahim', 'Ismail', 'Khalid', 'Mahmud', 'Mansur',
  'Marzuki', 'Mohamed', 'Mohd', 'Nasir', 'Nordin', 'Osman', 'Othman', 'Rahman',
  'Ramli', 'Razali', 'Salleh', 'Samad', 'Sanusi', 'Shahar', 'Shamsudin', 'Shariah'
];

// Indian names
const indianFirstNames = [
  'Rajesh', 'Arun', 'Vikram', 'Arjun', 'Neeraj', 'Pradeep', 'Sanjay', 'Ashok',
  'Varun', 'Suresh', 'Mahesh', 'Naveen', 'Rohan', 'Karan', 'Deepak', 'Harish',
  'Pooja', 'Anjali', 'Priya', 'Divya', 'Sneha', 'Meera', 'Kavya', 'Shreya',
  'Ananya', 'Sakshi', 'Neha', 'Riya', 'Swathi', 'Aishwarya', 'Nita', 'Geeta'
];

const indianLastNames = [
  'Kumar', 'Singh', 'Reddy', 'Sharma', 'Patel', 'Gupta', 'Iyer', 'Nair',
  'Menon', 'Rao', 'Desai', 'Joshi', 'Verma', 'Mishra', 'Pillai', 'Krishnan',
  'Subramanian', 'Srivastava', 'Chopra', 'Bhatt', 'Trivedi', 'Bhat', 'Kapoor',
  'Malhotra', 'Bansal', 'Arora', 'Bose', 'Mukherjee', 'Chatterjee', 'Sengupta'
];

// Eurasian names
const eurasianFirstNames = [
  'Stephen', 'Michael', 'Edward', 'Peter', 'Paul', 'Andrew', 'Chris', 'David',
  'Jonathan', 'Kevin', 'Mark', 'James', 'Lisa', 'Maria', 'Susan', 'Patricia',
  'Jennifer', 'Margaret', 'Sandra', 'Dorothy', 'Mary', 'Diane', 'Janet', 'Catherine'
];

const eurasianLastNames = [
  'de Souza', 'D\'Almeida', 'Fernandes', 'Gomes', 'Soares', 'De Costa',
  'Lewis', 'Williams', 'Johnson', 'Smith', 'Brown', 'Davis', 'Miller',
  'Rodriguez', 'Martinez', 'Garcia', 'Gomez', 'Santos', 'Pinto', 'Cruz'
];

// Function to randomly select tutor ethnicity and get corresponding names
function getTutorNames() {
  const races = ['chinese', 'malay', 'indian', 'eurasian'];
  const selectedRace = races[Math.floor(Math.random() * races.length)];

  let firstName, lastName;
  switch(selectedRace) {
    case 'malay':
      firstName = malayFirstNames[Math.floor(Math.random() * malayFirstNames.length)];
      lastName = malayLastNames[Math.floor(Math.random() * malayLastNames.length)];
      break;
    case 'indian':
      firstName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)];
      lastName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)];
      break;
    case 'eurasian':
      firstName = eurasianFirstNames[Math.floor(Math.random() * eurasianFirstNames.length)];
      lastName = eurasianLastNames[Math.floor(Math.random() * eurasianLastNames.length)];
      break;
    case 'chinese':
    default:
      firstName = chineseFirstNames[Math.floor(Math.random() * chineseFirstNames.length)];
      lastName = chineseLastNames[Math.floor(Math.random() * chineseLastNames.length)];
      break;
  }

  return { firstName, lastName, race: selectedRace };
}

// Placeholder for old function - no longer used
const firstNames = [];
const lastNames = [];

const headlines = [
  'Experienced {subject} Tutor - {exp}+ Years in Singapore',
  'Singapore {subject} Specialist - PSLE, O-Levels, A-Levels',
  '{subject} Expert | Helping Students Excel in {grade}',
  'Professional {subject} Educator - NIE Trained',
  'Award-Winning {subject} Tutor - Proven Results',
  '{subject} Specialist for All Levels - Online & In-Person',
  'Singapore {subject} Tutor - Personalized Learning',
  'Dedicated {subject} Teacher with {exp}+ Years Experience',
  '{subject} Mastery Expert - Your Path to Success',
  'Certified {subject} Educator - Exam Prep Specialist'
];

const subjects = [
  'Math', 'English', 'Science', 'History', 'Chinese',
  'Test Prep', 'Programming', 'Business', 'Arts', 'Music'
];

const grades = [
  'Elementary', 'Middle School', 'High School', 'College', 'All Levels'
];

const languages = [
  'English', 'Spanish', 'French', 'German', 'Mandarin',
  'Japanese', 'Portuguese', 'Italian', 'Korean', 'Russian',
  'Arabic', 'Hindi', 'Vietnamese', 'Dutch', 'Swedish'
];

const certifications = [
  { title: 'Bachelor of Science in Education', issuer: 'State University' },
  { title: 'Master of Arts in Teaching', issuer: 'Teaching Institute' },
  { title: 'TEFL Certification', issuer: 'Cambridge' },
  { title: 'SAT/ACT Prep Certified', issuer: 'ACE Test Prep' },
  { title: 'IB Program Certified', issuer: 'International Baccalaureate' },
  { title: 'Secondary Math Certification', issuer: 'Education Board' },
  { title: 'Advanced STEM Certification', issuer: 'STEM Education Council' },
  { title: 'ESL Teaching Certificate', issuer: 'TESOL' }
];

const descriptions = [
  'Passionate about helping Singapore students achieve their academic goals through personalized lessons.',
  'I create a supportive learning environment where students build confidence and master their subjects.',
  'My teaching combines proven Singapore curriculum expertise with engaging, interactive methods.',
  'Specialist in breaking down complex concepts - students love my clear explanations!',
  'Track record of students achieving A grades - results-focused tutoring approach.',
  'Patient, dedicated tutor committed to each student\'s academic success and personal growth.',
  'I adapt my teaching to match your learning style - everyone learns differently.',
  'Personalized tutoring tailored to Singapore\'s education system and exam requirements.',
  'Creating successful learners - my students consistently exceed their target grades.',
  'Experienced in guiding students through PSLE, O-Levels, and A-Levels with confidence.'
];

const singaporeExperience = [
  'Taught {years} years in Singapore schools with {subject} specialty',
  'Private tutoring for {years} years helping students ace their {subject}',
  'Experienced in preparing students for PSLE, O-Levels, and A-Levels',
  'Successfully coached {years}+ years of students in {grade} classes',
  'NIE-trained educator with {years} years of classroom experience',
  '{years} years specializing in {subject} for {grade} students',
  'Helped numerous students improve their {subject} grades in {years} years',
  'Singapore MOE-trained with {years} years of tutoring experience',
  'Expert in {subject} curriculum - {years} years experience',
  'Specialized in helping students master {subject} concepts for {years} years'
];

const experienceSamples = singaporeExperience;

// Utility functions
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function getRandomRate() {
  return Math.floor(Math.random() * 70) + 25; // $25-$95/hour
}

function getRandomRating() {
  const ratings = [0, 0, 0, 3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0];
  return getRandomElement(ratings);
}

function getRandomHours() {
  return Math.floor(Math.random() * 500) * 10; // 0, 10, 20, ..., 4990 hours
}

function generateTutorData() {
  const { firstName, lastName, race } = getTutorNames();
  const name = `${firstName} ${lastName}`;
  const emailBase = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}`;
  const email = `${emailBase}${Math.floor(Math.random() * 10000)}@tutormatch.com`;

  const specialty = getRandomElement(subjects);
  const grade = getRandomElement(grades);
  const yearsExp = Math.floor(Math.random() * 20) + 1;

  const headline = getRandomElement(headlines)
    .replace('{subject}', specialty)
    .replace('{exp}', yearsExp)
    .replace('{grade}', grade);

  const description = getRandomElement(descriptions);
  const experienceDesc = getRandomElement(experienceSamples)
    .replace('{years}', yearsExp)
    .replace('{subject}', specialty)
    .replace('{grade}', grade);

  const qualifications = getRandomElements(certifications, Math.floor(Math.random() * 3) + 1)
    .map(c => c.title)
    .join(', ');

  const specialties = getRandomElements(subjects, Math.floor(Math.random() * 3) + 1);
  const studentGrades = getRandomElements(grades, Math.floor(Math.random() * 4) + 1);
  const tutorLanguages = getRandomElements(languages, Math.floor(Math.random() * 3) + 1);

  const rating = getRandomRating();
  const ratingCount = rating > 0 ? Math.floor(Math.random() * 50) + 5 : 0;

  const educationLevels = ['high_school', 'associates', 'bachelors', 'masters', 'phd'];

  const makeSlot = (isWeekday) => {
    const avail = isWeekday ? Math.random() > 0.3 : Math.random() > 0.5;
    return {
      available: avail,
      start: isWeekday ? '09:00' : '10:00',
      end: isWeekday ? '17:00' : '16:00'
    };
  };

  return {
    name,
    email,
    headline,
    description,
    bio: experienceDesc,
    experience: yearsExp,
    education: getRandomElement(educationLevels),
    qualifications,
    specialties,
    grades: studentGrades,
    hourlyRate: getRandomRate(),
    languages: tutorLanguages,
    rating: {
      average: rating,
      count: ratingCount
    },
    totalHoursTaught: getRandomHours(),
    completedBookings: Math.floor(Math.random() * 50),
    cancelledBookings: Math.floor(Math.random() * 5),
    availability: {
      monday: makeSlot(true),
      tuesday: makeSlot(true),
      wednesday: makeSlot(true),
      thursday: makeSlot(true),
      friday: makeSlot(true),
      saturday: makeSlot(false),
      sunday: makeSlot(false)
    }
  };
}

async function seedTutors(count = 1000) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match');
    console.log('✅ Connected to MongoDB');

    // Check if tutors already exist
    const existingCount = await User.countDocuments({ role: 'tutor' });
    if (existingCount >= count) {
      console.log(`ℹ️  Database already has ${existingCount} tutors. Skipping seeding.`);
      await mongoose.connection.close();
      return;
    }

    console.log(`🌱 Starting to seed ${count} tutors...`);

    const batchSize = 50;
    const password = 'TutorPassword123!';

    for (let i = 0; i < count; i += batchSize) {
      const tutorDataBatch = [];

      for (let j = 0; j < batchSize && (i + j) < count; j++) {
        tutorDataBatch.push(generateTutorData());
      }

      // Create users and tutor profiles
      const createdUsers = [];

      for (const tutorData of tutorDataBatch) {
        try {
          // Create user
          const user = new User({
            name: tutorData.name,
            email: tutorData.email,
            password: password,
            role: 'tutor',
            isVerified: true
          });

          await user.save();
          createdUsers.push(user);

          // Create tutor profile
          const tutorProfile = new TutorProfile({
            userId: user._id,
            headline: tutorData.headline,
            description: tutorData.description,
            bio: tutorData.bio,
            qualifications: tutorData.qualifications,
            specialties: tutorData.specialties,
            grades: tutorData.grades,
            education: tutorData.education,
            hourlyRate: tutorData.hourlyRate,
            languages: tutorData.languages,
            rating: tutorData.rating,
            totalHoursTaught: tutorData.totalHoursTaught,
            completedBookings: tutorData.completedBookings,
            cancelledBookings: tutorData.cancelledBookings,
            experience: tutorData.experience,
            availability: tutorData.availability,
            status: 'verified',
            isActive: true
          });

          await tutorProfile.save();
        } catch (error) {
          console.error(`Error creating tutor ${tutorData.email}:`, error.message);
        }
      }

      const progress = Math.min(i + batchSize, count);
      console.log(`✓ Created ${progress}/${count} tutors (${Math.round(progress/count*100)}%)`);
    }

    console.log(`\n✅ Successfully seeded ${count} tutor profiles!`);
    console.log(`\n📊 Database Summary:`);
    const totalTutors = await User.countDocuments({ role: 'tutor' });
    const totalProfiles = await TutorProfile.countDocuments();
    console.log(`   - Total Tutor Users: ${totalTutors}`);
    console.log(`   - Total Tutor Profiles: ${totalProfiles}`);

    // Show sample data
    const sample = await User.findOne({ role: 'tutor' });
    if (sample) {
      const profile = await TutorProfile.findOne({ userId: sample._id });
      console.log(`\n📝 Sample Tutor:`);
      console.log(`   - Name: ${sample.name}`);
      console.log(`   - Email: ${sample.email}`);
      console.log(`   - Rate: $${profile.hourlyRate}/hr`);
      console.log(`   - Specialties: ${profile.specialties.join(', ')}`);
      console.log(`   - Rating: ${profile.rating.average} ⭐ (${profile.rating.count} reviews)`);
    }

  } catch (error) {
    console.error('❌ Error seeding tutors:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run seeding
seedTutors(5000);
