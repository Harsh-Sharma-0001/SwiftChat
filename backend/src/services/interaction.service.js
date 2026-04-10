// backend/src/services/interaction.service.js
const { StatusCodes } = require('http-status-codes');
const Post = require('../models/Post.model');
const Like = require('../models/Like.model');
const Comment = require('../models/Comment.model');
const { AppError } = require('../middleware/errorHandler');

const toggleLike = async (userId, postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', StatusCodes.NOT_FOUND);

  const existing = await Like.findOne({ user: userId, post: postId });

  if (existing) {
    await Like.findByIdAndDelete(existing._id);
    const count = await Like.countDocuments({ post: postId });
    return { liked: false, likeCount: count };
  }

  await Like.create({ user: userId, post: postId });
  const count = await Like.countDocuments({ post: postId });
  return { liked: true, likeCount: count };
};

const addComment = async (userId, postId, content) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', StatusCodes.NOT_FOUND);

  const comment = await Comment.create({ user: userId, post: postId, content });
  const populatedComment = await Comment.findById(comment._id).populate('user', 'username displayName avatarUrl');

  const count = await Comment.countDocuments({ post: postId });
  return { comment: { ...populatedComment.toObject(), id: populatedComment._id }, commentCount: count };
};

const getComments = async (postId) => {
  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('user', 'username displayName avatarUrl');
    
  return { comments: comments.map(c => ({ ...c.toObject(), id: c._id })) };
};

const getTrendingEmotions = async () => {
  const emotions = await Post.aggregate([
    { $match: { emotion: { $ne: null }, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
    { $group: { _id: "$emotion", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const trending = emotions.map((e, i) => ({
    emotion: e._id,
    count: e.count,
    trend: i === 0 ? 'HOT' : i === 1 ? 'RISING' : 'STEADY',
  }));

  if (trending.length === 0) {
     return { trending: [{ emotion: "Electric", count: 1, trend: "HOT" }] };
  }

  return { trending };
};

module.exports = { toggleLike, addComment, getComments, getTrendingEmotions };
