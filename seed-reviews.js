import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Booking from './models/Booking.js';
import Review from './models/Review.js';
import TutorProfile from './models/TutorProfile.js';

dotenv.config();

// Review titles for authentic feedback
const reviewTitles = [
  'Excellent tutor, highly recommended!',
  'Great lessons and very patient',
  'Really improved my understanding',
  'Professional and punctual',
  'Worth every dollar spent',
  'Made learning fun and engaging',
  'Perfect preparation for exams',
  'My child gained so much confidence',
  'Structured lessons with clear goals',
  'Flexible and accommodating'
];

// Review comments for realistic feedback
const reviewComments = [
  'This tutor really helped me understand complex concepts. The lessons are well-organized and tailored to my learning pace. Highly recommend!',
  'Very patient and encouraging. My son was struggling with Math but now he is confident and his grades have improved significantly.',
  'Professional approach to teaching with excellent communication. Always prepared for lessons and provides good follow-up materials.',
  'Knowledgeable and engaging. The tutor adapts the teaching style to match my learning preferences. Great value for money.',
  'Punctual, reliable, and effective. The lessons are challenging but achievable. I have seen real progress in a short time.',
  'My daughter loved the lessons! The tutor makes learning enjoyable while maintaining academic rigor. Highly satisfied.',
  'Excellent preparation for the O-Level exams. Clear explanations and lots of practice problems. Passed with flying colors!',
  'Very responsive to questions and concerns. Provides detailed feedback after each lesson. Definitely worth the investment.',
  'The tutor has a gift for explaining difficult topics clearly. My confidence in this subject has improved tremendously.',
  'Great communication with parents. Regular updates on progress and areas for improvement. Very professional service.'
];

// Parent names for diversity
const parentFirstNames = [
  'Victoria', 'Michael', 'Sarah', 'David', 'Jennifer', 'Robert', 'Lisa', 'James',
  'Amanda', 'William', 'Emily', 'Richard', 'Jessica', 'Thomas', 'Rachel', 'Christopher',
  'Angela', 'Daniel', 'Michelle', 'Matthew', 'Melissa', 'Anthony', 'Karen', 'Mark',
  'Donna', 'Donald', 'Susan', 'Steven', 'Cynthia', 'Paul', 'Katherine', 'Andrew'
];

const parentLastNames = [
  'Chen', 'Lee', 'Wong', 'Tan', 'Lim', 'Ng', 'Chua', 'Teo',
  'Anderson', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Rahman', 'Ahmad', 'Hassan', 'Ibrahim', 'Ali', 'Mohammed', 'Abdullah', 'Singh',
  'Kumar', 'Patel', 'Sharma', 'Verma', 'Gupta', 'Reddy', 'Nair', 'Iyer'
];

// Utility functions
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomRating() {
  // Realistic distribution: mostly 4-5 stars, some 3 stars, rare 1-2 stars
  const rand = Math.random();
  if (rand < 0.50) return 5; // 50% five-star
  if (rand < 0.80) return 4; // 30% four-star
  if (rand < 0.95) return 3; // 15% three-star
  return 2; // 5% two-star
}

function generateParentData(index) {
  const firstName = getRandomElement(parentFirstNames);
  const lastName = getRandomElement(parentLastNames);
  const name = `${firstName} ${lastName}`;
  const email = `parent.${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@tutormatch.com`;

  return { name, email };
}

async function seedReviews(numParents = 500, bookingsPerParent = 3) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match');
    console.log('✅ Connected to MongoDB');

    // Check if reviews already exist
    const existingReviews = await Review.countDocuments();
    if (existingReviews > 0) {
      console.log(`ℹ️  Database already has ${existingReviews} reviews. Skipping seeding.`);
      await mongoose.connection.close();
      return;
    }

    console.log(`🌱 Starting to seed reviews...`);
    console.log(`   - Creating ${numParents} parent accounts`);
    console.log(`   - Creating ${numParents * bookingsPerParent} bookings`);
    console.log(`   - Creating ${numParents * bookingsPerParent} reviews`);

    const password = 'ParentPassword123!';

    // Get all tutor users
    const tutors = await User.find({ role: 'tutor' });
    console.log(`✓ Found ${tutors.length} tutors in database`);

    if (tutors.length === 0) {
      console.error('❌ No tutors found! Run npm run seed first to create tutors.');
      await mongoose.connection.close();
      return;
    }

    // Create parent accounts
    const parents = [];
    for (let i = 0; i < numParents; i++) {
      try {
        const parentData = generateParentData(i);
        const parent = new User({
          name: parentData.name,
          email: parentData.email,
          password: password,
          role: 'parent',
          isVerified: true
        });
        await parent.save();
        parents.push(parent);
      } catch (error) {
        // Skip if email already exists
        if (error.code === 11000) {
          continue;
        }
        console.error(`Error creating parent:`, error.message);
      }
    }
    console.log(`✓ Created ${parents.length} parent accounts`);

    // Create bookings and reviews
    let totalBookings = 0;
    let totalReviews = 0;

    for (const parent of parents) {
      for (let i = 0; i < bookingsPerParent; i++) {
        try {
          // Pick random tutor
          const tutor = tutors[Math.floor(Math.random() * tutors.length)];
          const tutorProfile = await TutorProfile.findOne({ userId: tutor._id });

          if (!tutorProfile) continue;

          // Create completed booking
          const scheduledDate = new Date();
          scheduledDate.setDate(scheduledDate.getDate() - Math.floor(Math.random() * 90)); // Past 90 days

          const booking = new Booking({
            parentId: parent._id,
            tutorId: tutor._id,
            subject: getRandomElement(tutorProfile.specialties),
            duration: [0.5, 1, 1.5, 2][Math.floor(Math.random() * 4)],
            scheduledDate: scheduledDate,
            startTime: `${Math.floor(Math.random() * 14) + 9}:00`, // 9 AM to 10 PM
            endTime: `${Math.floor(Math.random() * 14) + 10}:00`,
            hourlyRate: tutorProfile.hourlyRate,
            totalCost: tutorProfile.hourlyRate * [0.5, 1, 1.5, 2][Math.floor(Math.random() * 4)],
            status: 'completed',
            paymentStatus: 'paid',
            sessionType: Math.random() > 0.3 ? 'online' : 'in-person'
          });

          await booking.save();
          totalBookings++;

          // Create review from parent to tutor
          const rating = getRandomRating();
          const review = new Review({
            bookingId: booking._id,
            authorId: parent._id,
            subjectId: tutor._id,
            rating: rating,
            title: getRandomElement(reviewTitles),
            comment: getRandomElement(reviewComments),
            authorRole: 'parent',
            createdAt: scheduledDate
          });

          await review.save();
          totalReviews++;

          // Update booking with parent rating
          booking.parentRating = {
            rating: rating,
            review: review.comment,
            createdAt: scheduledDate
          };
          await booking.save();

        } catch (error) {
          // Skip individual errors
        }
      }
    }

    console.log(`✓ Created ${totalBookings} bookings`);
    console.log(`✓ Created ${totalReviews} reviews`);

    // Update tutor ratings based on reviews
    console.log(`\n📊 Updating tutor ratings...`);
    const allReviews = await Review.find();
    const ratingsByTutor = {};

    for (const review of allReviews) {
      const tutorId = review.subjectId.toString();
      if (!ratingsByTutor[tutorId]) {
        ratingsByTutor[tutorId] = [];
      }
      ratingsByTutor[tutorId].push(review.rating);
    }

    for (const [tutorId, ratings] of Object.entries(ratingsByTutor)) {
      const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      await TutorProfile.updateOne(
        { userId: new mongoose.Types.ObjectId(tutorId) },
        {
          'rating.average': Math.round(average * 10) / 10,
          'rating.count': ratings.length
        }
      );
    }

    console.log(`✅ Successfully seeded reviews!`);
    console.log(`\n📊 Database Summary:`);
    const totalParents = await User.countDocuments({ role: 'parent' });
    const totalBookings2 = await Booking.countDocuments({ status: 'completed' });
    const totalReviews2 = await Review.countDocuments();
    console.log(`   - Total Parent Users: ${totalParents}`);
    console.log(`   - Total Completed Bookings: ${totalBookings2}`);
    console.log(`   - Total Reviews: ${totalReviews2}`);

    // Show statistics
    const avgRating = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    if (avgRating.length > 0) {
      console.log(`   - Average Rating: ${avgRating[0].avgRating.toFixed(2)} ⭐`);
    }

  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run seeding
seedReviews(500, 3);
