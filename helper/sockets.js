const Agent = require("../models/Agent");
const Caller = require("../models/Caller");

// find by userid
const findSocketByUserId = (io, target) => {
    return [...io.sockets.sockets.values()].find(socket => socket.data.userid === target);
};

const getRoomCount = async (io, roomId) => {
    const sockets = await io.in(roomId).fetchSockets();
    return sockets.length;
};

const getUserDoc = async (targetId) => {
    return await Caller.findById(targetId) || await Agent.findById(targetId)
}


module.exports = {
    findSocketByUserId,
    getRoomCount,
    getUserDoc
}