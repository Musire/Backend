const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Document  = require('./Document')
const { agentDocuments } = require("../helper/objectConfig")
const agentMiddleware = require('./middleware/agentMiddleware')
const { getTimestamp } = require("../helper/moment");

const agentSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    socketId: { 
        type: String, 
        default: null
    },
    status: { 
        type: String, 
        enum: ['available', 'in-call', 'post-call', 'unavailable', 'in-call', 'post-call', 'offline'], 
        default: 'unavailable' 
    },
    loggedIn: {
        type: Boolean,
        default: false
    },
    profile : {
        joinedDate: {
            type: Date,
            default: getTimestamp()
        },
        role: {
            type: String,
            required: true
        },
        team: {
            type: String,
            required: true
        },
        currentState: {
            type: String,
            enum: ['active', 'inactive', 'pending' ],
            default: 'inactive'
        },
        payRate: {
            type: Number
        },
    },
    settings: {
        ringDeviceId: {
            type: String,
            default: ""
        },
        ringtoneAudio: {
            type: Number,
            default: 1
        },
        preferredCommunication: {
            type: String,
            enum: ['email', 'phone call', 'text message'],
            default: 'email'
        }
    },
    paperwork: { type: [Document.schema], default: () => agentDocuments },
    lastUpdated: { 
        type: Date, 
        default: getTimestamp()
    }
});

// Virtual Property for Profile Completion
agentSchema.virtual('profileCompletion').get(function () {
    const totalDocuments = 17; // Total required documents
    const signedDocuments = Object.values(this.paperwork).filter(doc => doc.status === 'signed').length;
    const percentage = Math.round((signedDocuments / totalDocuments) * 100);

    // Return progress percentage or a status
    return `${percentage}%`;
});

// Method to match password with hashed password in DB
agentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

agentMiddleware(agentSchema)

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;
