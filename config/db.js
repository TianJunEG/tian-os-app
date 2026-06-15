import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match',
      {
        // Cap connections per process. With multiple web replicas each holding
        // their own pool, keep this low enough that total connections stay within
        // Atlas tier limits. Override per-service via MONGO_MAX_POOL_SIZE.
        maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10', 10),
        minPoolSize: 2,
        // Fail fast when Atlas is unreachable rather than hanging for 30 s.
        serverSelectionTimeoutMS: 5000,
        // Close idle sockets before OS does to avoid "connection reset" errors.
        socketTimeoutMS: 45000,
        maxIdleTimeMS: 60000,
      }
    );
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
