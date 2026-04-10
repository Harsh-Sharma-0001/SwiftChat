// src/config/mongodb.js — Mongoose MongoDB connection
const mongoose = require('mongoose');
const logger = require('./logger');

async function connectMongoDB(retries = 5) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swiftchat';
  const maskedUri = uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.*)/, '$1****$3');
  
  while (retries > 0) {
    try {
      logger.info(`🔄 Attempting MongoDB connection: ${maskedUri}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
      });
      logger.info(`✅ MongoDB connected via Mongoose: ${maskedUri}`);
      return;
    } catch (error) {
      retries -= 1;
      logger.warn(`⚠️ MongoDB connection failed: ${error.message}. Retries left: ${retries}`);
      if (retries === 0) {
        logger.error('❌ Could not connect to MongoDB after multiple attempts. Exiting...');
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

module.exports = { connectMongoDB };
