const { verifyAccessToken, verifyRefreshToken, generateAccessToken } = require('../helper/jwtUtils');
const Session = require('../models/Session');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).send('Access token required');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(403).send('Refresh token required');
    }

    try {
      const decoded = verifyRefreshToken(refreshToken); // contains userId

      // 👇 Look up active session for the user
      const session = await Session.findOne({ userId: decoded.userId, isActive: true });

      if (!session) {
        return res.status(403).send('No active session found');
      }

      const newAccessToken = generateAccessToken({ userId: decoded.userId });
      res.setHeader('Authorization', `Bearer ${newAccessToken}`);

      req.user = decoded;
      return next();
    } catch (refreshErr) {
      return res.status(403).send('Invalid or expired refresh token');
    }
  }
};


module.exports = { protect };
