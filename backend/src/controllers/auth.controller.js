// src/controllers/auth.controller.js
const { registerUser, loginUser, getMeProfile, refreshTokenService, logoutUser } = require('../services/auth.service');
const { StatusCodes } = require('http-status-codes');
const { sendSuccess } = require('../utils/response');

// POST /api/auth/register
const register = async (req, res) => {
  const result = await registerUser(req.body);
  sendSuccess(res, result, 'Registration successful', StatusCodes.CREATED);
};

// POST /api/auth/login
const login = async (req, res) => {
  const result = await loginUser(req.body);
  sendSuccess(res, result, 'Login successful');
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const user = await getMeProfile(req.user.id);
  sendSuccess(res, { user }, 'User profile fetched');
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  const result = await refreshTokenService(req.body.refreshToken);
  sendSuccess(res, result, 'Token refreshed');
};

// POST /api/auth/logout
const logout = async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  const result = await logoutUser({ refreshToken: req.body.refreshToken, accessToken });
  sendSuccess(res, result, 'Logged out successfully');
};

module.exports = { register, login, getMe, refreshToken, logout };
