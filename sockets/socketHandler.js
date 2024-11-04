const { generateAuthToken, generateRoom } = require('../helper/generator');
const Interpreter = require('../models/Interpreter'); // Import Interpreter model
const availableInterpreters = require('../queues/AvailableInterpreters')

// Setup socket events
module.exports.setupSocket = (io) => {
  io.on('connection', (socket) => {
    // Register interpreter
    socket.on('register', async ({ interpreterId }) => {
      const interpreter = await Interpreter.findById(interpreterId);
      if (interpreter) {
        interpreter.socketId = socket.id; // Update socket ID
        await interpreter.save();
        availableInterpreters.addInterpreterId(interpreterId)
      }
    });

    // Handle "place-call" event from the caller
    socket.on('place-call', async () => {

      // Find an available interpreter
      const interpreterId = await availableInterpreters.getNextAvailableInterpreterId();

      console.log('queue produced id: ', interpreterId)

      const interpreter = await Interpreter.findById(interpreterId)

      if (interpreter) {
        // Emit 'ringing' to the interpreter's socket
        io.to(interpreter.socketId).emit('incoming-call', {callerId: socket.id});

        // Notify the caller that the interpreter is being called
        console.log('call status sent to caller: ringing', interpreter.socketId)
        io.to(socket.id).emit('call-status', { status: 'Ringing' });
      } else {
        // No interpreters available, notify the caller
        console.log('call status sent to caller: no available interpreters')
        io.to(socket.id).emit('call-status', { status: 'No available interpreters' });
      }
    });

    socket.on('call-accepted', async ({ callerSocketId, interpreterSocketId }) => {
      try {
        console.log('ids: ', callerSocketId, interpreterSocketId)

        let creationToken = generateAuthToken('creator')
        let roomId = await generateRoom(creationToken)

        // Generate the auth token synchronously
        let callerToken = generateAuthToken('caller', roomId, callerSocketId);
        let terpToken = generateAuthToken('interpreter', roomId, interpreterSocketId)
        
        // Emit the join-meeting event to both the caller and interpreter
        io.to(callerSocketId).emit('join-meeting', { token: callerToken, roomId });
        io.to(interpreterSocketId).emit('join-meeting', { token: terpToken, roomId });
      } catch (error) {
        console.error("Error handling call-accepted:", error);
        throw new Error('Failed to emit join-meeting event')
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Interpreter disconnected:', socket.id);

      const interpreter = await Interpreter.findOne({ socketId: socket.id });
      if (interpreter) {
        // Optionally, remove from queue
        availableInterpreters.removeInterpreterId(interpreter._id);
      }
    });
  });
};
