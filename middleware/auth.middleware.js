const { verifyAccessToken, verifyRefreshToken, generateAccessToken } = require('../helper/jwtUtils');
const Session = require('../models/Session');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    return res.status(403).send('Access token required');
  }

  try {
    // Verify the access token
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach user info to request object
    return next(); // Proceed to the next middleware/route handler
  } catch (err) {
    // If the access token is expired, attempt to refresh it using the refresh token
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(403).send('Refresh token required');
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const session = await Session.findOne({ refreshToken });

      if (!session || session.userId.toString() !== decoded.userId.toString()) {
        return res.status(403).send('Invalid refresh token');
      }

      // Generate a new access token
      const newAccessToken = generateAccessToken(decoded.userId, decoded.sessionId);
      res.setHeader('Authorization', `Bearer ${newAccessToken}`); // Set new access token in the header

      req.user = decoded; // Attach user info to request object
      next(); // Proceed to the next middleware/route handler
    } catch (refreshErr) {
      return res.status(403).send('Invalid or expired refresh token');
    }
  }
};

module.exports = { protect };
