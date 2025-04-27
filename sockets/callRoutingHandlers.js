const { getTimestamp } = require("../helper/moment");
const Caller = require("../models/Caller");
const CallSession = require("../models/CallSession");
const { queueCall, dequeCall, queueAgent } = require("../queues/QueueUtility");
const Agent = require("../models/Agent");
const { generateRoom, generateAuthToken } = require("../helper/generator");
const { findSocketByUserId } = require("../helper/sockets");


module.exports = (io, socket) => {
    socket.on('place-call', async ({ mode }) => {
        let callerId = socket.data.userid
        const caller = await Caller.findById(callerId);

        if (caller) {
            let newCall = new CallSession({
                caller: callerId,
                tier: caller.tier,
                mode
            })

            await newCall.save()

            let call = {
                callPlacedAt: getTimestamp(),
                id: newCall._id.toString(),
                tier: caller.tier,
                mode
            }

            await queueCall(io, call)
            socket.emit('call-placed', { callid: newCall._id })
        }
    });

    socket.on('call-accepted', async ({ callid }) => {
        const foundCall = await CallSession.findById(callid)

        if (!foundCall) return console.log('no call found')

        const callAcceptedAt = getTimestamp()
        const waitTime = Math.floor((callAcceptedAt - foundCall.createdAt) / 1000 )
        const roomid = await generateRoom(generateAuthToken('creator'));

        foundCall.roomid = roomid
        foundCall.waitTime = waitTime
        await foundCall.save()

        const caller = await Caller.findOneAndUpdate(
            { _id: foundCall.caller },
            { $set: { status: 'in-call' } },
            { new: true }
        )
        const agent = await Agent.findOneAndUpdate(
            { _id: foundCall.agent },
            { $set: { status: 'in-call' } },
            { new: true }
        )

        if (!caller || !agent) return console.log('one of the parties not found');

        // Generate the authentication tokens for Caller and Agent
        const callerToken = generateAuthToken('caller', roomid, foundCall.caller);
        const agentToken = generateAuthToken('agent', roomid, foundCall.agent);

        const callerSocket = findSocketByUserId(io, foundCall.caller.toString())

        // Emit events to the Caller and Agent with their respective tokens

        socket.emit('join-meeting', { token: agentToken, mode: foundCall.mode, roomid });
        if (!callerSocket) return console.log('caller socket not found') ;
        callerSocket.emit('join-meeting', { token: callerToken, mode: foundCall.mode, roomid });
    });

    socket.on('call-rejected', async ({ callid }) => {

        const foundCall = await CallSession.findById(callid)
        foundCall.rejectedCount += 1
        foundCall.agent = undefined;
        await foundCall.save()

        let call = {
            callPlacedAt: foundCall.createdAt,
            id: foundCall._id.toString(),
            tier: foundCall.tier,
            mode: foundCall.mode
        }

        console.log('call requeue', call)

        await queueCall(io, call)

    })

    socket.on('call-canceled', async ({ callid }) => {
        const foundCall = await CallSession.findOneAndUpdate(
            { _id: callid },
            { $set: { status: 'canceled' } },
            { new: true }
        );
    
        if (!foundCall) return console.log('call not found');
    
        await dequeCall(callid);

        if (!foundCall.agent) return console.log('no agent assigned to call');
    
        const agentSocket = findSocketByUserId(io, foundCall.agent.toString());
    
        if (!agentSocket) return console.log('agent socket not found');

        await Agent.findOneAndUpdate(
            { _id: foundCall.agent },
            { $set: { status: 'available' } },
            { new: true }
        )
    
        agentSocket.emit('call-canceled', ({timestamp}) => {
            let agent = {
                userid: agentSocket.data.userid,
                timestamp,
                agentSocketId: agentSocket.id
            }
            queueAgent(io, agent)
        });
    });

}
