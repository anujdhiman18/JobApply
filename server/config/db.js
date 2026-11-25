const mongoose = require('mongoose');

/**
 * Connects to MongoDB using MONGO_URI from environment variables.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobpilot';
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;

