const bcrypt = require('bcryptjs');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Post = require('../models/Post.model');
const Follow = require('../models/Follow.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');
const { redisClient } = require('../config/redis');

const registerUser = async ({ username, email, password, displayName }) => {
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new AppError('Email or username already in use', StatusCodes.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, passwordHash, displayName: displayName || username });

  const safeUser = { id: user._id, username: user.username, email: user.email, displayName: user.displayName, role: user.role, createdAt: user.createdAt };

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  return { user: safeUser, accessToken, refreshToken };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  const safeUser = { id: user._id, username: user.username, email: user.email, displayName: user.displayName, role: user.role, createdAt: user.createdAt, avatarUrl: user.avatarUrl, bio: user.bio, emotionVibe: user.emotionVibe };
  
  return { user: safeUser, accessToken, refreshToken };
};

const getMeProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);

  const [postsCount, followersCount, followingCount] = await Promise.all([
    Post.countDocuments({ user: userId }),
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId })
  ]);

  return {
    id: user._id, username: user.username, email: user.email, displayName: user.displayName,
    bio: user.bio, avatarUrl: user.avatarUrl, role: user.role, emotionVibe: user.emotionVibe, createdAt: user.createdAt,
    _count: { posts: postsCount, followers: followersCount, following: followingCount }
  };
};

const refreshTokenService = async (token) => {
  if (!token) throw new AppError('Refresh token required', StatusCodes.BAD_REQUEST);

  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('User not found', StatusCodes.UNAUTHORIZED);

  const accessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);
  
  return { accessToken, refreshToken: newRefreshToken };
};

const logoutUser = async ({ refreshToken, accessToken }) => {
  const addToBlacklist = async (token) => {
    if (!token) return;
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await redisClient.set(`bl_token:${token}`, 'blacklisted', 'EX', expiresIn);
        }
      }
    } catch (err) {
      console.warn('Failed to parse token for blacklisting:', err.message);
    }
  };

  await Promise.all([addToBlacklist(accessToken), addToBlacklist(refreshToken)]);
  return {};
};

module.exports = { registerUser, loginUser, getMeProfile, refreshTokenService, logoutUser };
