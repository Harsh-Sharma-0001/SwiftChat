// src/routes/user.routes.js
const router = require('express').Router();
const { getUserById, updateUser, followUser, searchUsers, getConnects } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

router.use(protect); // All user routes require auth

router.get('/search', searchUsers);
router.get('/connects', getConnects);
router.get('/:id', getUserById);
router.put('/update', upload.single('avatar'), updateUser);
router.post('/follow', followUser);

module.exports = router;
