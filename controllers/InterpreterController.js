const AvailableInterpreters = require('../queues/AvailableInterpreters')


const mode_available = async (req, res) => {
    try {
      const interpreterId = req.body.interpreterId; // Get interpreter ID from the request
  
      // Add the interpreter to the AvailableInterpreters queue
      AvailableInterpreters.addInterpreterId(interpreterId);
  
      // Optionally, update the interpreter's status in the database (if needed)
      // Example: await InterpreterModel.findByIdAndUpdate(interpreterId, { status: 'available' });
  
      res.status(200).json({ message: 'Interpreter is now available and added to the queue' });
    } catch (error) {
      console.log('Error making interpreter available');
      console.error(error);
      res.status(500).json({ error: 'Server error occurred' });
    }
  };

module.exports = {
    mode_available
};