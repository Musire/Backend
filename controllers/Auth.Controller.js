const Agent = require('../models/Agent');
const Caller = require('../models/Caller');
const CallSession = require('../models/CallSession');

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
    
    // Find user by email
    
    user = await Agent.findOne({ email });
    if (!user) {
      user = await Caller.findOne({ email });
    }
    

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = user.generateAuthToken(); // JWT token generation
    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};

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

module.exports = { register, login, changePassword, getDashboard, getProfile };
