const { placeCallListener, callAcceptedListener, disconnectionListener, registerInterpreterListener, registerCallerListener } = require("./eventListeners")

// Setup socket events
module.exports.setupSocket = (io) => {
  io.on('connection', (socket) => {
    // Register caller
    registerCallerListener(socket)
    // Register interpreter
    registerInterpreterListener(socket)
    // Handle "place-call" event from caller
    placeCallListener(socket, io)
    // Handle "call-accepted" event from agent
    callAcceptedListener(socket, io)
    // Handle disconnection
    disconnectionListener(socket)
  });
};
