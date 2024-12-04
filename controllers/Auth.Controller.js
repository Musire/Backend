const Agent = require('../models/Agent');
const Caller = require('../models/Caller');
const CallSession = require('../models/CallSession');
const Session = require('../models/Session');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../helper/jwtUtils');
const { getTimestamp } = require("../helper/moment");
const mongoose = require('mongoose');


// Dashboard route - returns dashboard info (protected)
const getDashboard = async (req, res) => {
  try {
    // Return dashboard data for the authenticated user
    const user = req.user; // From the protect middleware
    let payload;

    if (user.role === 'agent') {
      payload = await CallSession.find({ agent: user.id })
    } else if (user.role === 'caller') {
      payload = await CallSession.find({ caller: user.id })
    }

    res.json({ message: 'Dashboard data', payload });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard', error: err.message });
  }
};

// Profile route - returns the user's profile (protected)
const getProfile = async (req, res) => {
  try {
    const user = req.user; // From the protect middleware
    let payload;
    

    if (user.role === 'agent') {
      payload = await Agent.findById(user.id).select('-__v -password -role -socketId -status'); // Exclude password field
    } else if (user.role === 'caller') {
      payload = await Caller.findById(user.id).select('-password');
    }

    res.json({ message: 'Profile data', payload });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

const getSettings = async (req, res) => {
  try {
    const user = req.user; // From the protect middleware
    let payload;
    let tempUser;

    if (user.role === 'agent') {
      tempUser = await Agent.findById(user.id); // Exclude password field
    } else if (user.role === 'caller') {
      tempUser = await Caller.findById(user.id)
    }

    payload = tempUser.settings

    res.json({ message: 'Settings data', payload });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

// Register route - handles user registration (Agent or Caller)
const register = async (req, res) => {
  const { role } = req.body;

  if (!['agent', 'caller'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    let user;

    // Create Agent or Caller based on the role
    if (role === 'agent') {
      user = new Agent(req.body);
    } else if (role === 'caller') {
      user = new Caller(req.body);
    }

    await user.save();
    res.status(200).json({ message: 'User registered successfully'});
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
};

// Login route - handles user login and returns JWT token
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user;

    // Find user by email (either Agent or Caller)
    user = await Agent.findOne({ email });
    if (!user) {
      user = await Caller.findOne({ email });
    }

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare password (assuming you have a matchPassword method on both models)
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate session ID and JWTs
    const sessionId = new mongoose.Types.ObjectId(); // Create a unique session ID
    const accessToken = generateAccessToken(user._id, user.role, sessionId);
    const refreshToken = generateRefreshToken(user._id, user.role, sessionId);

    // Invalidate any existing active session for the user
    await Session.updateOne({ userId: user._id, isActive: true }, { $set: { isActive: false } });

    // Store new session with both tokens
    const newSession = new Session({
      userId: user._id,
      jwt: accessToken,
      refreshToken: refreshToken,
      sessionId: sessionId.toString(),
      device: req.headers['user-agent'], // Store device info
      isActive: true,
      expiresAt: getTimestamp() +  (24 * 60 * 60 * 1000), // Set expiresAt for 1 days
    });

    await newSession.save();
    res.cookie('refreshToken', refreshToken, {
      maxAge: (1000 * 60 * 60 * 24), // 1 hour
      httpOnly: true, // Accessible only by the server
      sameSite: 'lax' // Restrict cross-site requests
    });
    let payload = { accessToken }

    // Send both access and refresh tokens to the client
    res.json({
      message: 'Login successful', payload
    });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};

const tokenRefresh = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).send('Refresh token is required');
  }

  try {
    const decoded = verifyRefreshToken(refreshToken); // Verify the refresh token
    const session = await Session.findOne({ refreshToken });

    if (!session || session.userId.toString() !== decoded.userId.toString()) {
      return res.status(403).send('Invalid refresh token');
    }

    // Generate a new access token
    const newAccessToken = generateAccessToken(decoded.userId, decoded.sessionId);

    res.json({ payload: newAccessToken });
  } catch (err) {
    res.status(403).send('Invalid or expired refresh token');
  }
}

// Change Password route (protected)
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  try {
    let foundUser;
    
    // Find the user (Agent or Caller)
    if (user.role === 'agent') {
      foundUser = await Agent.findById(user.id);
    } else if (user.role === 'caller') {
      foundUser = await Caller.findById(user.id);
    }

    const isMatch = await foundUser.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    foundUser.password = newPassword;
    await foundUser.save(); // Save new password (hashed)
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

module.exports = { register, login, changePassword, getDashboard, getProfile, tokenRefresh, getSettings };
