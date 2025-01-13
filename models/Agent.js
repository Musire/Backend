const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Document  = require('./Document')
const { agentDocuments } = require("../helper/objectConfig")

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
        default: ""
    },
    status: { 
        type: String, 
        enum: ['available', 'in-call', 'post-call', 'unavailable'], 
        default: 'unavailable' 
    },
    loggedIn: {
        type: Boolean,
        default: false
    },
    profile : {
        joinedDate: {
            type: Date,
            default: Date.now
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
            enum: ['active', 'unactive', 'pending']
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
            enum: ['email', 'phone call', 'messaging']
        }
    },
    paperwork: { type: [Document.schema], default: () => agentDocuments }
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


// Pre-save hook to hash the password before saving to DB
agentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;
