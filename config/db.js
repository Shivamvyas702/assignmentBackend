const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,        // Railway host from dashboard
    port: process.env.DB_PORT,        // Railway port
    dialect: 'mysql',
    dialectOptions: {
      connectTimeout: 15000,          // 15 seconds
    },
    logging: false,                   // optional: turn off SQL logs
  }
);

module.exports = sequelize;
