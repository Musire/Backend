const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET; // Replace with a secure secret key
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET; // Replace with a secure secret key

// Generate an Access Token
const generateAccessToken = (userId, sessionId) => {
  return jwt.sign({ userId, sessionId }, JWT_SECRET, { expiresIn: '15m' });  // Access token valid for 15 minutes
};

// Generate a Refresh Token
const generateRefreshToken = (userId, sessionId) => {
  return jwt.sign({ userId, sessionId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });  // Refresh token valid for 7 days
};

// Verify the Access Token
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Verify the Refresh Token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};