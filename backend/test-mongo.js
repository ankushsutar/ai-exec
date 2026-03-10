const mongoose = require('mongoose');
const env = require('./src/config/env.js');

async function testConnection() {
  try {
    console.log(`Attempting to connect to: ${env.mongoUri}`);
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connection successful! ✅");
    process.exit(0);
  } catch (error) {
    console.error("MongoDB connection failed! ❌");
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
