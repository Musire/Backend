const AvailableInterpreters = require('../queues/AvailableInterpreters')
const Interpreter = require("../models/Interpreter");
const { generateRoom, generateAuthToken } = require('../helper/generator');


const place_call = async (req, res, io) => {
    try {
        // Get the next available interpreter ID from the queue
        const nextInterpreterId = AvailableInterpreters.getNextAvailableInterpreterId();

        if (!nextInterpreterId) {
            return res.status(404).json({ message: 'No interpreters available' });
        }

        // Fetch interpreter details from the database
        const interpreter = await Interpreter.findById(nextInterpreterId);
        if (!interpreter) {
            return res.status(404).json({ message: 'Interpreter not found' });
        }

        // Emit a "call" event to the interpreter's socket to notify them of the incoming call
        io.to(interpreter.socketId).emit('call', {
            message: 'You have an incoming call!',
            roomId: req.body.roomId // Optionally include the room ID
        });

        console.log('id: ', nextInterpreterId)

        res.json({ message: 'Call routed to interpreter', interpreter: interpreter.name });
    } catch (error) {
        console.error('Error placing call:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const test_room = async (req, res) => {
    try {
        const authToken = generateAuthToken()
        const meeting = await generateRoom(authToken)
        console.log(meeting)
        res.json(meeting)

    } catch (error) {
        console.error('error testing room creation: ', error)
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Export the method as an object
module.exports = {
    place_call, 
    test_room
};