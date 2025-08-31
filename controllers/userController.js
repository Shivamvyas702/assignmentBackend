const User = require('../models/User');
const redis = require('../config/redis'); 
const { Op } = require('sequelize');

// Get All Users (Admin or for Search/Pagination)
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const cacheKey = `users:page=${page}:limit=${limit}:search=${search}`;

        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log(" Cache hit");
            return res.json(JSON.parse(cachedData));
        }

        const users = await User.findAndCountAll({
            where: {
                name: { [Op.like]: `%${search}%` }
            },
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: { exclude: ['password'] }
        });

        const response = { total: users.count, users: users.rows };

        await redis.set(cacheKey, JSON.stringify(response), "EX", 60);

        console.log("Cache miss → DB hit");
        res.json(response);
    } catch (error) {
        console.error(error);
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

// Update User by Admin
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();
    await redis.flushall();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error(error);
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
