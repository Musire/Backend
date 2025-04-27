const mongoose = require('mongoose');

const queueBackupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  heap: {
    type: [mongoose.Schema.Types.Mixed], // Accepts any serializable data
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('QueueBackup', queueBackupSchema);
