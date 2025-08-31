const express = require('express');
const app = express();
const cors = require('cors');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Optional: sync models if needed
    // await sequelize.sync({ alter: true });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Unable to connect to database:', err);
    process.exit(1); // Stop process if DB cannot connect
  }
};

startServer();
