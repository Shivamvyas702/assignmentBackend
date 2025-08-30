const express = require('express');
const router = express.Router();
const multer = require('multer');
const { register, verifyEmail, login, refreshToken, forgotPassword, resetPassword } = require('../controllers/authController');

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/register', upload.single('profileImage'), register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
