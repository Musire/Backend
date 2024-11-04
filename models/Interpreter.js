// const groupMiddleware = require('./middleware/GroupMiddleware')
// groupMiddleware(GroupSchema);

const mongoose = require('mongoose');

const InterpreterSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    socketId: { type: String, default: ""}, 
    status: { type: String, enum: ['available', 'busy', 'offline'], default: 'offline' },
});


const Interpreter = mongoose.model('Interpreter', InterpreterSchema);

module.exports = Interpreter;