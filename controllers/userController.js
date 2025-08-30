const User = require('../models/User');

// Get All Users (Admin or for Search/Pagination)
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const users = await User.findAndCountAll({
            where: {
                name: { [require('sequelize').Op.like]: `%${search}%` }
            },
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: { exclude: ['password'] }
        });

        res.json({ total: users.count, users: users.rows });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get My Profile
exports.getProfile = async (req, res) => {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(user);
};

// Update My Profile
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const { name } = req.body;
        if (name) user.name = name;
        if (req.file) user.profileImage = req.file.filename;
        await user.save();
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete User (Admin Only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
