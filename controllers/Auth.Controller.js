const Interpreter = require('../models/Interpreter');
const Caller = require('../models/Caller');
const CallSession = require('../models/CallSession');

// Dashboard route - returns dashboard info (protected)
const getDashboard = async (req, res) => {
  try {
    // Return dashboard data for the authenticated user
    const user = req.user; // From the protect middleware
    let dashboardData;

    console.log(user)
    
    if (user.role === 'agent') {
      let calls = await CallSession.find({ agent: user.id })
      console.log(calls)
      dashboardData = calls; // Your agent-specific dashboard logic here
    } else if (user.role === 'caller') {
      // Fetch caller-specific dashboard data
      dashboardData = {}; // Your caller-specific dashboard logic here
    }

    res.json({ message: 'Dashboard data', data: dashboardData });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard', error: err.message });
  }
};

// Profile route - returns the user's profile (protected)
const getProfile = async (req, res) => {
  try {
    const user = req.user; // From the protect middleware
    let profileData;

    if (user.role === 'agent') {
      profileData = await Interpreter.findById(user.id).select('-__v -password -role -socketId -status'); // Exclude password field
    } else if (user.role === 'caller') {
      profileData = await Caller.findById(user.id).select('-password');
    }

    res.json({ message: 'Profile data', data: profileData });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

// Register route - handles user registration (Agent or Caller)
const register = async (req, res) => {
  const { name, surname, email, password, role } = req.body;

  if (!['agent', 'caller'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    let user;

    // Create Agent or Caller based on the role
    if (role === 'agent') {
      user = new Interpreter({ name, surname, email, password, role });
    } else if (role === 'caller') {
      user = new Caller({ name, surname, email, password, role });
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
    
    user = await Interpreter.findOne({ email });
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
      foundUser = await Interpreter.findById(user.id);
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
