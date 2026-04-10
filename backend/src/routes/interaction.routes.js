// src/routes/interaction.routes.js
const router = require('express').Router();
const { toggleLike, addComment, getComments, getTrendingEmotions } = require('../controllers/interaction.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

router.use(protect);

router.post('/like', [body('postId').notEmpty()], validate, toggleLike);
router.post('/comment', [body('postId').notEmpty(), body('content').trim().isLength({ min: 1, max: 500 })], validate, addComment);
router.get('/comments/:postId', getComments);
router.get('/trending-emotions', getTrendingEmotions);

module.exports = router;
