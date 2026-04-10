const { StatusCodes } = require('http-status-codes');
const User = require('../models/User.model');
const Post = require('../models/Post.model');
const Follow = require('../models/Follow.model');
const { AppError } = require('../middleware/errorHandler');

const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);

  const posts = await Post.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(12);

  const [postsCount, followersCount, followingCount] = await Promise.all([
    Post.countDocuments({ user: userId }),
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId })
  ]);

  return {
    id: user._id, username: user.username, displayName: user.displayName, bio: user.bio,
    avatarUrl: user.avatarUrl, emotionVibe: user.emotionVibe, createdAt: user.createdAt,
    _count: { posts: postsCount, followers: followersCount, following: followingCount },
    posts: posts.map(p => ({
      id: p._id, mediaUrl: p.mediaUrl, mediaType: p.mediaType, caption: p.caption, emotion: p.emotion, createdAt: p.createdAt
    }))
  };
};

const updateUserProfile = async (userId, updateData, file) => {
  const { displayName, bio, emotionVibe } = updateData;
  const avatarUrl = file ? `/uploads/${file.filename}` : undefined;

  const data = { displayName, bio, emotionVibe };
  if (avatarUrl) data.avatarUrl = avatarUrl;

  const user = await User.findByIdAndUpdate(userId, data, { new: true });
  
  return { id: user._id, username: user.username, email: user.email, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl, emotionVibe: user.emotionVibe };
};

const toggleFollow = async (currentUserId, targetUserId) => {
  if (targetUserId === currentUserId) throw new AppError('Cannot follow yourself', StatusCodes.BAD_REQUEST);

  const target = await User.findById(targetUserId);
  if (!target) throw new AppError('User not found', StatusCodes.NOT_FOUND);

  const existing = await Follow.findOne({ follower: currentUserId, following: targetUserId });

  if (existing) {
    await Follow.findByIdAndDelete(existing._id);
    return { following: false, message: 'Unfollowed successfully' };
  }

  await Follow.create({ follower: currentUserId, following: targetUserId });
  return { following: true, message: 'Followed successfully' };
};

const searchUsersService = async (query) => {
  if (!query) return [];

  const queryRegex = new RegExp(query, 'i');
  const users = await User.find({
    $or: [{ username: queryRegex }, { displayName: queryRegex }]
  }).limit(20);

  return Promise.all(users.map(async u => {
    const followers = await Follow.countDocuments({ following: u._id });
    return {
      id: u._id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl, emotionVibe: u.emotionVibe,
      _count: { followers }
    };
  }));
};

const getConnectsList = async (currentUserId) => {
  const followingList = await Follow.find({ follower: currentUserId }).select('following');
  const followingIds = followingList.map(f => f.following);
  
  const users = await User.find({
    _id: { $ne: currentUserId, $nin: followingIds }
  }).limit(5);

  return users.map(u => ({
    id: u._id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl, emotionVibe: u.emotionVibe
  }));
};

module.exports = { getUserProfile, updateUserProfile, toggleFollow, searchUsersService, getConnectsList };
