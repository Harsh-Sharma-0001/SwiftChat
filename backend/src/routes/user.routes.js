// src/routes/user.routes.js
const router = require('express').Router();
const { getUserById, updateUser, toggleFollow, searchUsers, getConnects, getUserPosts, updateSettings } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

router.use(protect); // All user routes require auth

router.get('/search', searchUsers);
router.get('/connects', getConnects);
router.post('/follow/:id', toggleFollow);
router.patch('/settings', updateSettings);
router.put('/update', upload.single('avatar'), updateUser);
router.get('/:id', getUserById);
router.get('/:id/posts', getUserPosts);


module.exports = router;
