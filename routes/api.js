const { protect } = require('../middleware/auth.middleware');
const { register, login, changePassword, getDashboard, getProfile, tokenRefresh, getSettings, getDocuments, getDocumentContent, getQueueState, override, getAgentState } = require('../controllers/Auth.Controller');

const { Router } = require('express');
const router = Router();

// Route for registering a new user (Agent or Caller)
router.post('/register', register);

// Route for logging in (returns auth token)
router.post('/login', login);

// Route for the dashboard (protected)
router.get('/dashboard', protect, getDashboard);

// Route for the dashboard (protected)
router.get('/documents', protect, getDocuments);

// Route for the dashboard (protected)
router.get('/document/:name', protect, getDocumentContent);

// Route for getting the user profile (protected)
router.get('/profile', protect, getProfile);

// Route for getting the user profile (protected)
router.get('/settings', protect, getSettings);

// Route for changing the password (protected)
router.post('/refresh-token', protect, tokenRefresh);

// Route for changing the password (protected)
router.post('/change-password', protect, changePassword);

// Route for queue state (unprotected)
router.get('/queue-state', getQueueState);

// Route to override user logged in
router.post('/override', override)

// Route to override user logged in
router.get('/agent-state', getAgentState)

module.exports = { router };
