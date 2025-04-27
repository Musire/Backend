const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
    roomid: {
        type: String
    },
    mode: { 
        type: String, 
        enum: ['audio', 'video'],
        required: true
    },
    tier: {
        type: Number
    },
    caller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caller',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'ringing', 'completed'],
        default: 'pending' // Default status is 'pending'
    },
    rejectedCount: {
        type: Number,
        default: 0 // Default rejected count is 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    callerJoinedAt: {
        type: Date
    },
    agentJoinedAt: {
        type: Date
    },
    startedAt: {
        type: Date
    },
    endedAt: {
        type: Date
    },
    duration: {
        type: Number,
        default: 0
    },
    waitTime: {
        type: Number, 
        default: 0
    },
    agentSurvey: {
        callQuality: { type: Number, min: 0, max: 5 },
        waitTime: { type: Number, min: 0, max: 5 },
        notes: { type: String }
    },
    callerSurvey: {
        callQuality: { type: Number, min: 0, max: 5 },
        waitTime: { type: Number, min: 0, max: 5 },
        notes: { type: String }
    },
    isTest: {
        type: Boolean,
        default: false
    },
    isFailed: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('CallSession', callSessionSchema);
