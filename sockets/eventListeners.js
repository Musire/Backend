const Agent = require('../models/Agent'); // Import Interpreter model
const Caller = require("../models/Caller")
const CallSession = require("../models/CallSession")
const availableInterpreters = require('../queues/AvailableInterpreters')
const { generateAuthToken, generateRoom } = require('../helper/generator');
const { getTimestamp } = require("../helper/moment")

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
            const agent = await Agent.findById(interpreterId);
            if (agent) {
                agent.socketId = socket.id; // Update socket ID for the interpreter
                await agent.save();
                
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
            const callPlacedAt = getTimestamp()

            // Find an available interpreter
            const interpreterId = await availableInterpreters.getNextAvailableInterpreterId();
      
            console.log('queue produced id: ', interpreterId)
      
            const agent = await Agent.findById(interpreterId)
      
            if (agent) {
              // Emit 'ringing' to the interpreter's socket
              io.to(agent.socketId).emit('incoming-call', {callerId, callPlacedAt});
      
              // Notify the caller that the interpreter is being called
              console.log('call status sent to caller: ringing', agent.socketId)
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
        socket.on('call-accepted', async ({ callerId, interpreterId, callPlacedAt }) => {
            console.log('call accepted')

            console.log(callerId, interpreterId, callPlacedAt)
            const caller = await Caller.findById(callerId);
            const agent = await Agent.findById(interpreterId);


    
            if (!caller || !agent) return;

            const callAcceptedAt = getTimestamp()

            const waitTime = Math.floor((callAcceptedAt - callPlacedAt) / 1000)
    
            const roomId = await generateRoom(generateAuthToken('creator'));
    
            // Create and save a CallSession with ObjectIds
            const callSession = new CallSession({
                roomId,
                caller: caller._id,          // Using ObjectId
                agent: agent._id,       // Using ObjectId
                createdAt: getTimestamp(),
                waitTime
            });
    
            await callSession.save();
    
            const callerToken = generateAuthToken('caller', roomId, caller._id);
            const interpreterToken = generateAuthToken('interpreter', roomId, agent._id);
    
            io.to(caller.socketId).emit('join-meeting', { token: callerToken, roomId });
            io.to(agent.socketId).emit('join-meeting', { token: interpreterToken, roomId });
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
        
            const agent = await Agent.findOne({ socketId: socket.id });
            if (agent) {
              // Optionally, remove from queue
              availableInterpreters.removeInterpreterId(agent._id);
            }
          });
    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}




module.exports.agentJoinedListener = (socket) => {
    try {
        socket.on('agent-joined', async ({ roomId }) => {
            await CallSession.findOneAndUpdate(
                { roomId, agentJoinedAt: { $exists: false } },
                { agentJoinedAt: getTimestamp() }
            );
        });
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

module.exports.callerJoinedListener = (socket) => {
    try {
        socket.on('caller-joined', async ({ roomId }) => {
            await CallSession.findOneAndUpdate(
                { roomId, callerJoinedAt: { $exists: false } },
                { callerJoinedAt: getTimestamp() }
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

                const startedAt = Math.max(
                    session.callerJoinedAt,
                    session.agentJoinedAt
                );
                
                const endedAt = getTimestamp();
                const duration = Math.floor((endedAt - startedAt) / 1000); // Convert ms to seconds

                await CallSession.findOneAndUpdate(
                    { roomId },
                    {
                        startedAt,
                        endedAt,
                        duration
                    }
                );
            }
        });
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
};


module.exports.callerSurveyListener = (socket) => {
    try {
        socket.on('caller-survey', async ({ roomId, survey }) => {
            await CallSession.findOneAndUpdate(
                { roomId, callerSurvey: { $exists: false } }, // Check if callerSurvey doesn't exist
                { callerSurvey: survey }
            );
        });
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
};

module.exports.agentSurveyListener = (socket) => {
    try {
        socket.on('agent-survey', async ({ roomId, survey }) => {
            await CallSession.findOneAndUpdate(
                { roomId, agentSurvey: { $exists: false } },
                { agentSurvey: survey }
            );
        });
    } catch (error) {
        console.error(error);
        throw new Error(error);
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


