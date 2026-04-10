// src/controllers/interaction.controller.js
const { sendSuccess } = require('../utils/response');
const interactionService = require('../services/interaction.service');
const { StatusCodes } = require('http-status-codes');

const toggleLike = async (req, res) => {
  const { postId } = req.body;
  const result = await interactionService.toggleLike(req.user.id, postId);
  sendSuccess(res, result, result.liked ? 'Post liked' : 'Post unliked');
};

const addComment = async (req, res) => {
  const { postId, content } = req.body;
  const result = await interactionService.addComment(req.user.id, postId, content);
  sendSuccess(res, result, 'Comment added', StatusCodes.CREATED);
};

const getComments = async (req, res) => {
  const result = await interactionService.getComments(req.params.postId);
  sendSuccess(res, result);
};

const getTrendingEmotions = async (req, res) => {
  const result = await interactionService.getTrendingEmotions();
  sendSuccess(res, result);
};

module.exports = { toggleLike, addComment, getComments, getTrendingEmotions };
