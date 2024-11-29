const { placeCallListener, callAcceptedListener, disconnectionListener, callerJoinedListener, agentJoinedListener, registerInterpreterListener, registerCallerListener, sessionEndedListener, agentSurveyListener, callerSurveyListener } = require("./eventListeners")

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
    // Handle "caller-joined" event from agent
    callerJoinedListener(socket)
    // Handle "agent-joined" event from agent
    agentJoinedListener(socket)
    // Handle disconnection
    disconnectionListener(socket)
    // Handle session ending
    sessionEndedListener(socket)
    // Handle session ending
    agentSurveyListener(socket)
    // Handle session ending
    callerSurveyListener(socket)
  });
};
