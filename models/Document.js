const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, default: 'Not Signed' },
    signedDate: { type: Date, default: null }
});


module.exports = mongoose.model('Document', documentSchema);
