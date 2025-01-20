const { protect } = require('../middleware/auth.middleware');
const { register, login, override, changePassword, tokenRefresh } = require('../controllers/Auth.Controller');
const { getDashboard, getProfile, getSettings, getDocuments, getDocumentContent, getQueueState, getAgentState } = require('../controllers/Query.Controller');
const { updateSettings } = require('../controllers/Update.Controller')

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
router.post('/change-password', changePassword);

// Route for queue state (unprotected)
router.get('/queue-state', getQueueState);

// Route to override user logged in
router.post('/override', override)

// Route to override user logged in
router.get('/agent-state', getAgentState)

router.patch('/settings', protect, updateSettings)

module.exports = { router };
