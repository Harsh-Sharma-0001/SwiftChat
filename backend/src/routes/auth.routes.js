// src/routes/auth.routes.js
const router = require('express').Router();
const passport = require('passport');
const { body } = require('express-validator');
const { register, login, getMe, refreshToken, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate.middleware');

const registerRules = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username: 3-30 chars'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password: min 8 chars'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', authRateLimiter, registerRules, validate, register);
router.post('/login', authRateLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
    const accessToken = generateAccessToken(req.user.id, req.user.role);
    const refreshToken = generateRefreshToken(req.user.id);
    res.redirect(`${process.env.CLIENT_ORIGIN}?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }
);

module.exports = router;
