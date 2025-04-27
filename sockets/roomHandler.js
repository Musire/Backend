const { getTimestamp } = require("../helper/moment")
const { getRoomCount } = require("../helper/sockets")
const CallSession = require("../models/CallSession")
const Agent = require('../models/Agent')
const Caller = require('../models/Caller')

module.exports = (io, socket) => {
    socket.on('join-room', async ({ roomid }) => {
        console.log(`${socket.id} joined the room ${ roomid }`)
        const foundSession = await CallSession.findOne({ roomid })
        if (foundSession.status === 'completed') return socket.emit('session-ended');

        socket.join(roomid)
        socket.data.roomid = roomid
        io.in(roomid).emit('participant-joined')
    })

    socket.on('leave-session', async ({ roomid }) => {
        const foundSession = await CallSession.findOne({ roomid, status: { $ne: 'completed'} })

        if (!foundSession ) return;

        let roomCount = await getRoomCount(io, roomid)

        if (roomCount <= 2) {
            let endedAt = getTimestamp()
            foundSession.status = 'completed'
            foundSession.endedAt = endedAt
            foundSession.duration = Math.floor((endedAt - foundSession.startedAt) /1000)
            await foundSession.save()
            io.in(roomid).emit('session-ended')
        } else {
            socket.leave(roomid)
            socket.data.roomid = undefined
            io.in(roomid).emit('participant-left')
        }

        if (socket.data.role === 'caller') {
            await Caller.findByIdAndUpdate(socket.data.userid, {
                $set: { status: 'post-call'}},
                { new: true }
            )
        } else if (socket.data.role === 'agent') {
            await Agent.findByIdAndUpdate(socket.data.userid, {
                $set: { status: 'post-call'}},
                { new: true }
            )
        }

    })
}