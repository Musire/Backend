// find by userid
const findSocketByUserId = (io, target) => {
    return [...io.sockets.sockets.values()].find(socket => socket.data.userid === target);
};

const getRoomCount = async (io, roomId) => {
    const sockets = await io.in(roomId).fetchSockets();
    return sockets.length;
};


module.exports = {
    findSocketByUserId,
    getRoomCount
}