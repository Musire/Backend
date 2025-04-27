const callRoutingHandlers = require("./callRoutingHandlers");
const connectionHandlers = require("./connectionHandlers");
const recordHandlers = require("./recordHandlers");
const roomHandler = require("./roomHandler");
const statusHandlers = require("./statusHandlers");


module.exports.setupSocket = async (io) => {
  io.on('connection', async (socket) => {
    const { userid, role } = socket.handshake.query;
    socket.data.userid = userid;
    socket.data.role = role
    console.log(`connected line to ${socket.data.userid} ${userid}`)

    connectionHandlers(io, socket)
    statusHandlers(io, socket)
    callRoutingHandlers(io, socket)
    recordHandlers(io, socket)
    roomHandler(io, socket)
  })
}
