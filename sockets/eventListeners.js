const Interpreter = require('../models/Interpreter'); // Import Interpreter model
const Caller = require("../models/Caller")
const CallSession = require("../models/CallSession")
const availableInterpreters = require('../queues/AvailableInterpreters')
const { generateAuthToken, generateRoom } = require('../helper/generator');

module.exports.registerCallerListener = (socket) => {
    try {
        socket.on('register-caller', async ({ callerId }) => {
            const caller = await Caller.findById(callerId);
            if (caller) {
                caller.socketId = socket.id; // Update socket ID for the caller
                await caller.save();
                
                console.log(`Caller ${callerId} registered`);
            } else {
                console.error(`Caller with ID ${callerId} not found`);
            }
        });
    } catch (error) {
        console.error('Error in registerCallerListener:', error);
    }
};


module.exports.registerInterpreterListener = (socket) => {
    try {
        socket.on('register-interpreter', async ({ interpreterId }) => {
            const interpreter = await Interpreter.findById(interpreterId);
            if (interpreter) {
                interpreter.socketId = socket.id; // Update socket ID for the interpreter
                await interpreter.save();
                
                // Add interpreter to the queue of available interpreters
                availableInterpreters.addInterpreterId(interpreterId);
                
                console.log(`Interpreter ${interpreterId} registered and added to queue`);
            } else {
                console.error(`Interpreter with ID ${interpreterId} not found`);
            }
        });
    } catch (error) {
        console.error('Error in registerInterpreterListener:', error);
    }
};


module.exports.placeCallListener = (socket, io) => {
    try {
        socket.on('place-call', async (callerId) => {

            // Find an available interpreter
            const interpreterId = await availableInterpreters.getNextAvailableInterpreterId();
      
            console.log('queue produced id: ', interpreterId)
      
            const interpreter = await Interpreter.findById(interpreterId)
      
            if (interpreter) {
              // Emit 'ringing' to the interpreter's socket
              io.to(interpreter.socketId).emit('incoming-call', {callerId});
      
              // Notify the caller that the interpreter is being called
              console.log('call status sent to caller: ringing', interpreter.socketId)
              io.to(socket.id).emit('call-status', { status: 'Ringing' });
            } else {
              // No interpreters available, notify the caller
              console.log('call status sent to caller: no available interpreters')
              io.to(socket.id).emit('call-status', { status: 'No available interpreters' });
            }
          });
    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}


module.exports.callAcceptedListener = (socket, io) => {
    try {
        socket.on('call-accepted', async ({ callerId, interpreterId }) => {
            const caller = await Caller.findById(callerId);
            const interpreter = await Interpreter.findById(interpreterId);
    
            if (!caller || !interpreter) return;
    
            const roomId = await generateRoom(generateAuthToken('creator'));
    
            // Create and save a CallSession with ObjectIds
            const callSession = new CallSession({
                roomId,
                caller: caller._id,          // Using ObjectId
                agent: interpreter._id,       // Using ObjectId
                createdAt: Date.now()
            });
    
            await callSession.save();
    
            const callerToken = generateAuthToken('caller', roomId, caller._id);
            const interpreterToken = generateAuthToken('interpreter', roomId, interpreter._id);
    
            io.to(caller.socketId).emit('join-meeting', { token: callerToken, roomId });
            io.to(interpreter.socketId).emit('join-meeting', { token: interpreterToken, roomId });
        });
    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}



module.exports.disconnectionListener = (socket) => {
    try {
        socket.on('disconnect', async () => {
            console.log('Interpreter disconnected:', socket.id);
        
            const interpreter = await Interpreter.findOne({ socketId: socket.id });
            if (interpreter) {
              // Optionally, remove from queue
              availableInterpreters.removeInterpreterId(interpreter._id);
            }
          });
    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}



module.exports.unregisterListener = (socket) => {
    try {

    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}


module.exports.callRejectedListener = (socket) => {
    try {

    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}


module.exports.callerJoinedListener = (socket) => {
    try {
        socket.on('caller-joined', async ({ roomId }) => {
            await CallSession.findOneAndUpdate(
                { roomId },
                { callerJoinedAt: Date.now() }
            );
        });
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

module.exports.agentJoinedListener = (socket) => {
    try {
        socket.on('agent-joined', async ({ roomId }) => {
            await CallSession.findOneAndUpdate(
                { roomId },
                { agentJoinedAt: Date.now() }
            );
        });
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}


module.exports.sessionStartedListener = (socket) => {
    try {
        socket.on('session-started', async ({ roomId }) => {
            await CallSession.findOneAndUpdate(
                { roomId },
                { sessionStartedAt: Date.now() }
            );
        });
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}



module.exports.sessionEndedListener = (socket) => {
    try {
        socket.on('session-ended', async ({ roomId }) => {
            const session = await CallSession.findOne({ roomId });

            if (session) {
                const endTime = Date.now();
                const duration = endTime - session.sessionStartedAt;

                await CallSession.findOneAndUpdate(
                    { roomId },
                    {
                        sessionEndedAt: endTime,
                        duration
                    }
                );
            }
        });
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}


module.exports.callerSurveyListener = (socket) => {
    try {
        socket.on('caller-survey', async ({ roomId, survey }) => {
            await CallSession.findOneAndUpdate(
                { roomId },
                { callerSurvey: survey }
            );
        });
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

module.exports.agentSurveyListener = (socket) => {
    try {
        socket.on('agent-survey', async ({ roomId, survey }) => {
            await CallSession.findOneAndUpdate(
                { roomId },
                { agentSurvey: survey }
            );
        });
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}



