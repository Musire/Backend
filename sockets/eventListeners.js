const Agent = require('../models/Agent'); // Import Interpreter model
const Caller = require("../models/Caller")
const CallSession = require("../models/CallSession")
const { queueAgent, queueCall, dequeAgent } = require('../queues/QueueUtility')
const { generateAuthToken, generateRoom } = require('../helper/generator');
const { getTimestamp } = require("../helper/moment")
const { v4: uuidv4 } = require('uuid');
const limbo = require('../queues/Reservation')

module.exports.registerCallerListener = (socket) => {
    try {
        socket.on('register-caller', async ({ callerId }) => {
            const caller = await Caller.findById(callerId);
            if (!caller) return console.error(`Caller with ID ${callerId} not found`);;

            caller.socketId = socket.id; // Update socket ID for the caller
            await caller.save();
            
            console.log(`Caller ${socket.id} registered`);
        });
    } catch (error) {
        console.error('Error in registerCallerListener:', error);
    }
};


module.exports.registerInterpreterListener = (socket, io) => {
    try {
        socket.on('register-interpreter', async ({ interpreterId }) => {
            const agent = await Agent.findById(interpreterId);
            if (!agent) return console.error(`Interpreter with ID ${interpreterId} not found`);

            agent.socketId = socket.id; // Update socket ID for the interpreter
            await agent.save();

            console.log(`Agent ${socket.id} registered`);

            let agentInfo = {
                agentId: interpreterId,
                agentSocketId: agent.socketId,
                timestamp: getTimestamp()
            }
            // Add interpreter to the queue of available interpreters
            await queueAgent(agentInfo, io)   

        });
    } catch (error) {
        console.error('Error in registerInterpreterListener:', error);
    }
};

module.exports.disconnectionListener = (socket) => {
    try {
        socket.on('disconnect', async () => {
            console.log('user disconnected:', socket.id);
            let agent; 

            agent = await Caller.findOne({ socketId: socket.id })
            if (!agent) {
                agent = await Agent.findOne({ socketId: socket.id })
            }

            if (!agent) {
                return console.log(`socketId: ${socket.id} not found`)
            }

            agent.socketId = null
            await agent.save()

            if (agent.profile.role === 'agent') {
                await dequeAgent(socket.id)
                console.log(`removed ${agent._id}, from queue`)
            }
          });
    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}

module.exports.placeCallListener = (socket, io) => {
    try {
        socket.on('place-call', async (callerId, mode) => {

            const caller = await Caller.findById(callerId);
            if (caller) {
                const call = {
                    id: uuidv4(),
                    callerId,
                    tier: caller.tier,
                    mode,
                    callPlacedAt: getTimestamp(),
                    callerSocketId: caller.socketId
                }
                await queueCall(call, io)
            }
          });
    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}


module.exports.callAcceptedListener = (socket, io) => {
    try {
        socket.on('call-accepted', async ({ callId, interpreterId }) => {
            console.log('call accepted')

            // Fetch call from limbo reservation and deconstruct if found
            const pair = await limbo.access(callId)
            if (!pair) return;
            const { agent, call } = pair
            const { callerId, callPlacedAt, mode } = call

            // Fetch the Caller and Agent for the session and handle error
            const caller = await Caller.findById(callerId);
            const agentAssigned = await Agent.findById(interpreterId);

            if (!caller || !agentAssigned) return;

            // Generate timestamp and calculate wait time for the call
            const callAcceptedAt = getTimestamp()
            const waitTime = Math.floor((callAcceptedAt - callPlacedAt) / 1000)
            
            // generate a room as the creator
            const roomId = await generateRoom(generateAuthToken('creator'));
    
            // Create and save a CallSession 
            const callSession = new CallSession({
                roomId,
                mode,
                caller: caller._id,
                agent: agentAssigned._id, 
                createdAt: getTimestamp(),
                waitTime
            });
    
            await callSession.save();


            // Generate the authentication tokens for Caller and Agent
            const callerToken = generateAuthToken('caller', roomId, caller._id);
            const agentToken = generateAuthToken('interpreter', roomId, agentAssigned._id);


            // Emit events to the Caller and Agent with their respective tokens
            io.to(caller.socketId).emit('join-meeting', { token: callerToken, roomId });
            io.to(agentAssigned.socketId).emit('join-meeting', { token: agentToken, roomId });
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
            const { testCall, failedCall, ...rest } = survey;

            await CallSession.findOneAndUpdate(
                { roomId, agentSurvey: { $exists: false } },
                {
                    $set: {
                        agentSurvey: rest,
                        isFailed: failedCall,
                        isTest: testCall
                    }
                }
            );
        });
    } catch (error) {
        console.error(error);
        throw new Error(error.message); 
    }
};




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


