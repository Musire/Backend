const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
});

// TTL Index using `updatedAt`
sessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

// Enable timestamps for automatic `createdAt` and `updatedAt`
sessionSchema.set('timestamps', true);

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
