
const { getTimestamp } = require("../helper/moment");
const { getRoomCount } = require("../helper/sockets");
const Session = require('../models/Session')
const Agent = require("../models/Agent");
const Caller = require("../models/Caller");
const CallSession = require("../models/CallSession");
const { dequeAgent, queueAgent } = require("../queues/QueueUtility");


module.exports = (io, socket) => {
    socket.on('register-caller', async () => {
        const callerId = socket.data.userid
        const caller = await Caller.findById(callerId);
        if (!caller) return console.error(`Caller with ID ${callerId} not found`);;

        caller.socketId = socket.id; // Update socket ID for the caller
        caller.loggedIn = true
        await caller.save();
        
        console.log(`Caller ${socket.id} registered`);
    });

    socket.on('register-agent', async () => {
        const agentId = socket.data.userid

        const agent = await Agent.findById(agentId);
        if (!agent) return console.error(`Interpreter with ID ${agentId} not found`);

        agent.socketId = socket.id; // Update socket ID for the interpreter
        agent.status = 'available'
        await agent.save();

        console.log(`Agent ${socket.id} registered`);

        let agentInfo = {
            userid: agentId,
            timestamp: getTimestamp()
        }
        // Add interpreter to the queue of available interpreters
        await queueAgent(io, agentInfo)   

    });

    socket.on('disconnect', async () => {
        console.log('user disconnected:', socket.id);
        let roomid = socket.data.roomid
        console.log('room disconnected', roomid)

        // let count = await getRoomCount(io, roomid)

        io.in(roomid).emit('participant-left')

        let id = socket.data.userid

        let user = await Caller.findById(id) || await Agent.findById(id);

        if (!user) {
            return console.log(`socketId: ${id} not found`)
        }

        user.socketId = null
        user.status = 'offline'
        await user.save()

        if (user.profile.role === 'agent') {
            await dequeAgent(id)
            console.log(`removed ${id}, from queue`)
        }


    });

    socket.on('logout', async () => {
        const models = {
            caller: Caller,
            agent: Agent
        }
        const User = models[socket.data.role]
        const user = await User.findOneAndUpdate(
            { _id: socket.data.userid },
            { $set: { status: 'offline', socketId: null } }
        )

        await Session.findOneAndDelete(
            { userId: socket.data.userid}
        )

        socket.disconnect(true)
    })

    
}

