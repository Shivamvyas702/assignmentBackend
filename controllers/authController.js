const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

// Register User
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const profileImage = req.file ? req.file.filename : null;

        let user = await User.findOne({ where: { email } });
        if (user) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({ name, email, password: hashedPassword, profileImage });

        // Generate email verification token
        const emailToken = jwt.sign({ id: user.id }, process.env.JWT_EMAIL_SECRET, { expiresIn: '1d' });
        const url = `https://assignmentbackend-production-c9be.up.railway.app/verify-email/${emailToken}`;

        await sendEmail(user.email, 'Verify your email', `<p>Click <a href="${url}">here</a> to verify your email</p>`);

        res.status(201).json({ message: 'User registered, check email to verify' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify Email
// authController.js
exports.verifyEmail = async (req, res) => {
    try {
        const token = req.params.token;
        const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(404).send('User not found');

        user.isVerified = true;
        await user.save();

        // Redirect to frontend login page after verification
        res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
    } catch (error) {
        console.error(error);
        res.status(400).send('Invalid or expired token');
    }
};


// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        if (!user.isVerified) return res.status(403).json({ message: 'Email not verified' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        res.json({ accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const accessToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.json({ accessToken });
    } catch (error) {
        res.status(403).json({ message: 'Invalid refresh token' });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = await bcrypt.hash(resetToken, 10);

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await sendEmail(user.email, 'Password Reset', `<p>Click <a href="${resetUrl}">here</a> to reset your password</p>`);

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const users = await User.findAll();
        const user = users.find(async u => await bcrypt.compare(token, u.resetPasswordToken));
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
