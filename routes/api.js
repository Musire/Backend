const { protect } = require('../middleware/auth.middleware');
const { register, login, changePassword, getDashboard, getProfile } = require('../controllers/Auth.Controller');

const { Router } = require('express');
const router = Router();

// let io; // Declare io at the top level

// // Function to set the io instance
// const setIoInstance = (socketIo) => {
//   io = socketIo; // Set the io instance
// };

// router.post('/mode-available', mode_available)
// router.post('/place-call', (req, res) => place_call(req, res, io));
// router.get('/test-room-creation', test_room)


// Route for registering a new user (Agent or Caller)
router.post('/register', register);

// Route for logging in (returns auth token)
router.post('/login', login);

// Route for the dashboard (protected)
router.get('/dashboard', protect, getDashboard);

// Route for getting the user profile (protected)
router.get('/profile', protect, getProfile);

// Route for changing the password (protected)
router.post('/change-password', protect, changePassword);



module.exports = { router };
