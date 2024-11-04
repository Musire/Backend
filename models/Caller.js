// const groupMiddleware = require('./middleware/GroupMiddleware')
// groupMiddleware(GroupSchema);

const mongoose = require('mongoose');

const CallerSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }
});

const Caller = mongoose.model('Caller', CallerSchema);

module.exports = Caller;