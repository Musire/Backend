const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Document  = require('./Document')
const { callerDocuments } = require("../helper/objectConfig")


const callerSchema = new mongoose.Schema({
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
    },
    settings: {
        billingType: {
            type: String,
            enum: ['on demand', 'bundle'],
            required: true
        },
        preferredCommunication: {
            type: String,
            enum: ['email', 'phone call', 'messaging']
        }
    },
    tier: {
        type: Number,
        default: 3
    },
    paperwork: { type: [Document.schema], default: () => callerDocuments },
});

// Virtual Property for Profile Completion
callerSchema.virtual('profileCompletion').get(function () {
    const totalDocuments = 13; // Total required documents
    const signedDocuments = Object.values(this.paperwork).filter(doc => doc.status === 'signed').length;
    const percentage = Math.round((signedDocuments / totalDocuments) * 100);

    // Return progress percentage or a status
    return `${percentage}%`;
});


// Method to match password with hashed password in DB
callerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
callerSchema.methods.generateAuthToken = function () {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.profile.role
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Pre-save hook to hash the password before saving to DB
callerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model('Caller', callerSchema);
