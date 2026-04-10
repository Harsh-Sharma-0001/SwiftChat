const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  displayName: {
    type: String
  },
  bio: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  provider: {
    type: String,
    default: 'local'
  },
  providerId: {
    type: String
  },
  emotionVibe: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
