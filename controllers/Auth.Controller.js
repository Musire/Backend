const Agent = require('../models/Agent');
const Caller = require('../models/Caller');
const CallSession = require('../models/CallSession');
const Session = require('../models/Session');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../helper/jwtUtils');
const { getTimestamp } = require("../helper/moment");
const mongoose = require('mongoose');
const { Documents } = require("../static/Documents")
const { agentQueue, callQueue } = require("../queues/Queues")
const limbo = require('../queues/Reservation')


const getDocumentContent = async (req, res) => {
  try {
    let userDoc;
    const user = req.user
    const { name } = req.params
    let docName = name.toLowerCase()

    if (user.role === 'agent') {
      userDoc = await Agent.findById(user.id)
    } else if (user.role === 'caller') {
      userDoc = await Caller.findById(user.id)
    }

    let chosenDoc = Documents[docName]
    const { content, index } = chosenDoc
    const status = userDoc?.paperwork[index]?.status
    const dateSigned = userDoc?.paperwork[index]?.signedDate
    let isSigned = (status === 'signed') ? dateSigned : "pending"

    res.status(200).json({ 
      message: "successfully got document contents", 
      payload: {
        content,
        isSigned
      }
    })
    
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard', error: err.message });
  }
}

const getQueueState = async (req, res) => {
  try {
    let agent = await agentQueue.getQueue()
    let call = await callQueue.getQueue()
    let reservation = await limbo.getMap()
    const queueState = {
      call, agent, reservation
    }
    res.status(200).json({ payload: queueState})
  } catch (error) {
    res.status(500).json({ message: 'Error fetching state of queues', error: err.message });
  }
}

// Dashboard route - returns dashboard info (protected)
const getDashboard = async (req, res) => {
  try {
    console.log('route getDashboard triggerred')
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
    let tempUser;
    let payload;
    

    if (user.role === 'agent') {
      tempUser = await Agent.findById(user.id); // Exclude password field
    } else if (user.role === 'caller') {
      tempUser = await Caller.findById(user.id)
    }

    payload = tempUser?.profile
    payload = {...payload, profileCompletion: tempUser?.profileCompletion}

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
      payload = tempUser.settings
    } else if (user.role === 'caller') {
      tempUser = await Caller.findById(user.id)
      payload = tempUser.settings.billingType
    }

    res.json({ message: 'Settings data', payload });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};


const getDocuments = async (req, res) => {
  try {
    const user = req.user; // From the protect middleware
    let payload;
    let tempUser;

    if (user.role === 'agent') {
      tempUser = await Agent.findById(user.id); 
    } else if (user.role === 'caller') {
      tempUser = await Caller.findById(user.id)
    }

    payload = tempUser.paperwork

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
    // Find user by email (either Agent or Caller)
    let user = await Agent.findOne({ email }) || await Caller.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.loggedIn) {
      console.log('found logged in')
      return res.status(403).json({
        payload : {
          message: "already active",
          userId: user._id
        }
      });
    }

    const accessToken = generateAccessToken(user._id, user.profile.role );
    const refreshToken = generateRefreshToken(user._id, user.profile.role );

    res.cookie('refreshToken', refreshToken, {
      maxAge: (1000 * 60 * 60 * 24 * 7), // 1 week
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

const override = async (req, res) => {
  const { userId } = req.body;

  try {
    let user = await Agent.findById(userId) || await Caller.findById(userId)


    if (!user) return res.status(400).json({ payload: { message: 'user not found'} })

    const io = req.app.get('io');

    console.log('socket: ', user.socketId)

    io.to(user.socketId).emit('force-disconnect', {
      message: 'Your session has been terminated due to a new login.',
    });

    const accessToken = generateAccessToken(userId, user.profile.role );
    const refreshToken = generateRefreshToken(userId, user.profile.role );


    // Set the refresh token in the cookies
    res.cookie('refreshToken', refreshToken, {
      maxAge: (1000 * 60 * 60 * 24 * 7), // 1 week
      httpOnly: true, // Accessible only by the server
      sameSite: 'lax' // Restrict cross-site requests
    });

    // Send new access token as response
    const payload = { accessToken };
    res.json({ message: 'Session overridden successfully', payload })
    
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
}

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

module.exports = { register, login, override, changePassword, getDashboard, getProfile, tokenRefresh, getSettings, getDocuments, getDocumentContent, getQueueState };
