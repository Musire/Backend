const Agent = require('../models/Agent'); // Import Interpreter model
const Caller = require("../models/Caller")
const CallSession = require("../models/CallSession")
const { pairAgentToCall, pairCallToAgent } = require('../queues/CheckQueues')
const { addAgent, addCall, removeAgent } = require('../queues/QueueUtility')
const { generateAuthToken, generateRoom } = require('../helper/generator');
const { getTimestamp } = require("../helper/moment")

module.exports.registerCallerListener = (socket) => {
    try {
        socket.on('register-caller', async ({ callerId }) => {
            const caller = await Caller.findById(callerId);
            if (caller) {
                caller.socketId = socket.id; // Update socket ID for the caller
                await caller.save();
                
                console.log(`Caller ${socket.id} registered`);
            } else {
                console.error(`Caller with ID ${callerId} not found`);
            }
        });
    } catch (error) {
        console.error('Error in registerCallerListener:', error);
    }
};


module.exports.registerInterpreterListener = (socket, io) => {
    try {
        socket.on('register-interpreter', async ({ interpreterId }) => {
            const agent = await Agent.findById(interpreterId);
            if (agent) {
                agent.socketId = socket.id; // Update socket ID for the interpreter
                await agent.save();

                console.log(`Agent ${socket.id} registered`);
                
                // Add interpreter to the queue of available interpreters
                let timestamp = getTimestamp()
                await addAgent({ agentId: interpreterId, agentSocketId: agent.socketId, timestamp })
                
                // await pairAgentToCall(io)
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
        socket.on('place-call', async (callerId, mode) => {

            const caller = await Caller.findById(callerId);
            if (caller) {
                const call = {
                    callerId,
                    tier: 1,
                    mode,
                    callPlacedAt: getTimestamp(),
                    callerSocketId: caller.socketId
                }
                await addCall(call)
    
                await pairCallToAgent(io)
            }
          });
    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}


module.exports.callAcceptedListener = (socket, io) => {
    try {
        socket.on('call-accepted', async ({ callerId, interpreterId, callPlacedAt, mode }) => {
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
                mode,
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

            if (agent.role === 'agent') {
                await removeAgent(socket.id)
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


