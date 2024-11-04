const { mode_available} = require('../controllers/InterpreterController')
const { place_call, test_room } = require('../controllers/CallerController')

const { Router } = require('express');
const router = Router();

let io; // Declare io at the top level

// Function to set the io instance
const setIoInstance = (socketIo) => {
  io = socketIo; // Set the io instance
};

router.post('/mode-available', mode_available)
router.post('/place-call', (req, res) => place_call(req, res, io));
router.get('/test-room-creation', test_room)


module.exports = { router, setIoInstance };
