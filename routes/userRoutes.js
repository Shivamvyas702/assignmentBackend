const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { getUsers, getProfile, updateProfile, deleteUser } = require('../controllers/userController');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/', authenticate, getUsers);
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, upload.single('profileImage'), updateProfile);
router.delete('/:id', authenticate, authorize(['admin']), deleteUser);

module.exports = router;
