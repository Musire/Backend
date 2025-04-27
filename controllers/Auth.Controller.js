const Agent = require('../models/Agent');
const Caller = require('../models/Caller');
const Session = require('../models/Session');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../helper/jwtUtils');

// Register route - handles user registration (Agent or Caller)
const register = async (req, res) => {
  const { email, password, name, surname, role, team, ...rest } = req.body;
  const profile = { role, team }
  let user;

  console.log('route: register user')

  try {
    // Create Agent or Caller based on the role
    if (role === 'agent') {
      user = new Agent({ email, password, name, surname, profile });
    } else if (role === 'caller') {
      const { billingType, tier } = rest
      const settings = { billingType }
      user = new Caller({ email, password, name, surname, tier, profile, settings });
    }
    console.log('user: ', user)

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
      return res.status(400).json({ payload: { message: 'Invalid credentials' } });
    }

    // Check if user already has an active session
    const existingSession = await Session.findOne({ userId: user._id, isActive: true });

    if (existingSession) {
      console.log('found active session');
      return res.status(403).json({
        payload: {
          message: 'already active',
          userId: user._id
        }
      });
    }

    // Generate token payload
    const tokenPayload = {
      id: user._id,
      fullName: `${user.name} ${user.surname}`,
      email: user.email,
      role: user.profile.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to cookie
    res.cookie('refreshToken', refreshToken, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: 'lax'
    });

    // Create a session
    await Session.create({ userId: user._id });

    res.json({
      message: 'Login successful',
      payload: { accessToken }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      payload: {
        message: 'Error logging in',
        error: err.message
      }
    });
  }
};


const override = async (req, res) => {
  const { userId } = req.body;

  try {
    let user = await Agent.findById(userId) || await Caller.findById(userId);

    if (!user) {
      return res.status(400).json({ payload: { message: 'user not found' } });
    }

    // Close any existing session for this user
    await Session.updateMany(
      { userId: user._id, isActive: true },
      { $set: { isActive: false } }
    );

    // Emit a force-disconnect to the previous session
    const io = req.app.get('io');
    console.log('socket: ', user.socketId);

    if (user.socketId) {
      io.to(user.socketId).emit('force-disconnect', {
        message: 'Your session has been terminated due to a new login.',
      });
    }

    // Generate new tokens
    const tokenPayload = {
      id: user._id,
      fullName: `${user.name} ${user.surname}`,
      email: user.email,
      role: user.profile.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to cookie
    res.cookie('refreshToken', refreshToken, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: 'lax'
    });

    // Create a new session
    await Session.create({ userId: user._id });

    // Respond with new access token
    const payload = { accessToken };
    res.json({ message: 'Session overridden successfully', payload });

  } catch (err) {
    console.error('Override error:', err);
    res.status(500).json({
      message: 'Error overriding session',
      error: err.message
    });
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
  const { email, password, password2 } = req.body;

  try {
    let user = await Caller.findOne({ email }) || await Agent.findOne({ email })

    if (!user) return res.status(401).json({ payload: { message: 'user not found'}})

    if (!(password === password2)) return res.status(400).json({ message: 'passwords do not match'})
    user.password = password;
    await user.save()
    res.status(200).json({ payload: { message: 'Password updated successfully' } });
  } catch (err) {
    console.log(err.message)
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

module.exports = { register, login, override, changePassword, tokenRefresh };
