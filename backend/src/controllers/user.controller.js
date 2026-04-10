// src/controllers/user.controller.js
const { getUserProfile, updateUserProfile, toggleFollow, searchUsersService, getConnectsList } = require('../services/user.service');
const { sendSuccess } = require('../utils/response');

// GET /api/users/:id
const getUserById = async (req, res) => {
  const safeUser = await getUserProfile(req.params.id);
  sendSuccess(res, { user: safeUser });
};

// PUT /api/users/update
const updateUser = async (req, res) => {
  const safeUser = await updateUserProfile(req.user.id, req.body, req.file);
  sendSuccess(res, { user: safeUser }, 'Profile updated');
};

// POST /api/users/follow
const followUser = async (req, res) => {
  const result = await toggleFollow(req.user.id, req.body.userId);
  sendSuccess(res, { following: result.following }, result.message);
};

// GET /api/users/search
const searchUsers = async (req, res) => {
  const users = await searchUsersService(req.query.q);
  sendSuccess(res, { users });
};

// GET /api/users/:id/connects — AI-matched users
const getConnects = async (req, res) => {
  const users = await getConnectsList(req.user.id);
  sendSuccess(res, { users });
};

module.exports = { getUserById, updateUser, followUser, searchUsers, getConnects };
