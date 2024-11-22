const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    role: {
        type: String,
        required: true
    },
    billingType: {
        type: String,
        enum: ['on demand', 'bundle'],
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
    joinedDate: {
        type: Date,
        default: Date.now
    },
    paperwork: {
        hipaa: {
            type: Boolean,
            default: false
        },
        contracts: {
            type: Boolean,
            default: false
        },
        userAgreement: {
            type: Boolean,
            default: false
        }
    }
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
        role: this.role
    };
    return jwt.sign(payload, process.env.JWT_SECRET);
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
