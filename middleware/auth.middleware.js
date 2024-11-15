const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // Check if the token is provided in the Authorization header
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request object
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { protect };
