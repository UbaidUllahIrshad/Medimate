const { Router } = require('express');
const { register, login, logout, getMe, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
