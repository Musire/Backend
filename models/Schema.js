const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    jwt: { 
        type: String, 
        required: true 
    },        // Access token
    refreshToken: { 
        type: String, 
        required: true 
    }, // Refresh token
    sessionId: { 
        type: String, 
        required: true 
    },
    device: { 
        type: String, 
        required: true 
    },      // Device or IP address info
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    expiresAt: { 
        type: Date, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
});

// TTL Index for automatic session expiration (e.g., 30 days)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds:  24 * 60 * 60 }); // 1 day deletion

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;