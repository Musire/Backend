const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    caller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caller',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true
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
