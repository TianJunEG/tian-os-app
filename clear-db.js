import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import TutorProfile from './models/TutorProfile.js';
import Booking from './models/Booking.js';
import Review from './models/Review.js';

dotenv.config();

async function clearDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match');
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    console.log('🗑️  Clearing database...');

    await Review.deleteMany({});
    console.log('✓ Cleared reviews');

    await Booking.deleteMany({});
    console.log('✓ Cleared bookings');

    await TutorProfile.deleteMany({});
    console.log('✓ Cleared tutor profiles');

    await User.deleteMany({});
    console.log('✓ Cleared users');

    console.log('\n✅ Database cleared successfully!');
    console.log('Ready for fresh seeding.');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run clearDatabase
clearDatabase();
